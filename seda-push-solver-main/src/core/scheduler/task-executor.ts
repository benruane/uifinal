/**
 * Task Executor for DataRequest Operations
 * Efficiently separates posting from oracle awaiting for optimal performance
 */

import type { LoggingServiceInterface } from '../../services';
import type { SEDADataRequestBuilder } from '../data-request';
import type { SchedulerConfig } from '../../types';
import { executeWithRetry } from './retry-handler';
import { UniqueMemoGenerator } from './unique-memo-generator';
import { DataRequestPerformanceTracker, STEP_NAMES } from './performance-tracker';
import { 
  CosmosSequenceCoordinator, 
  type SequencedPosting, 
  type PostingResult
} from './cosmos-sequence-coordinator';
import { postDataRequestTransaction, awaitDataRequestResult, buildDataRequestInput, buildGasOptions } from '../data-request';
import { getSedaNetworkConfig } from '../../config';
import type { AsyncTaskResult, TaskCompletionHandler } from './types';
import type { TaskRegistry } from './task-registry';

/**
 * Task Executor - separates posting from oracle awaiting
 */
export class TaskExecutor {
  private memoGenerator: UniqueMemoGenerator;

  constructor(
    private logger: LoggingServiceInterface,
    private sequenceCoordinator: CosmosSequenceCoordinator,
    private registry: TaskRegistry,
    private getTimestamp: () => number = Date.now
  ) {
    this.memoGenerator = new UniqueMemoGenerator(this.logger);
  }

  /**
   * Execute a DataRequest task with TRUE parallel posting and awaiting
   */
  async executeTask(
    taskId: string,
    requestNumber: number,
    builder: SEDADataRequestBuilder,
    config: SchedulerConfig,
    isRunning: () => boolean,
    completionHandler: TaskCompletionHandler,
    performanceTracker?: DataRequestPerformanceTracker
  ): Promise<AsyncTaskResult> {
    const startTime = this.getTimestamp();
    
    try {
      this.logger.info(`\n${'='.repeat(73)}`);
      this.logger.info(`🚀 DataRequest #${requestNumber} (${taskId}) | ${new Date().toLocaleTimeString()}`);
      this.logger.info('='.repeat(73));
      this.logger.info(`⏱️  TASK START: Beginning execution at ${new Date(startTime).toLocaleTimeString()}`);

      // Get network configuration
      performanceTracker?.startStep(taskId, STEP_NAMES.PROCESS);
      
      const builderConfig = builder.getConfig();
      const networkConfig = getSedaNetworkConfig(builderConfig.network);

      performanceTracker?.endStep(taskId, STEP_NAMES.PROCESS);

      // Phase 1: POST ONLY (coordinated by sequence)
      performanceTracker?.startStep(taskId, STEP_NAMES.POSTING);
      
      const postingStartTime = this.getTimestamp();
      this.logger.info(`📋 PHASE 1: Starting posting phase at ${new Date(postingStartTime).toLocaleTimeString()}`);
      
      const postingResult = await this.executePostingOnly(
        taskId,
        builder,
        config,
        networkConfig,
        isRunning
      );

      const postingEndTime = this.getTimestamp();
      const postingDuration = postingEndTime - postingStartTime;
      
      if (!postingResult.success || !postingResult.result) {
        performanceTracker?.failStep(taskId, STEP_NAMES.POSTING, 'Posting failed');
        this.logger.error(`❌ PHASE 1 FAILED: Posting failed after ${postingDuration}ms (${(postingDuration/1000).toFixed(2)}s)`);
        return this.handlePostingFailure(taskId, postingResult, startTime, completionHandler);
      }

      performanceTracker?.endStep(taskId, STEP_NAMES.POSTING);
      this.logger.info(`✅ PHASE 1 COMPLETE: Posting succeeded in ${postingDuration}ms (${(postingDuration/1000).toFixed(2)}s)`);

      // Phase 2: IMMEDIATE return after successful posting
      const postedData = postingResult.result;
      this.logPostingSuccess(taskId, postedData, startTime);
      
      // Update registry with posted info
      this.registry.markAsPosted(
        taskId,
        postedData.drId,
        postedData.blockHeight,
        postedData.txHash,
        postingResult.sequence
      );

      // Create and call completion handler for POSTING SUCCESS immediately
      const postingCompletionTime = this.getTimestamp();
      const postingCompletionDuration = postingCompletionTime - startTime;
      const postingSuccessResult: AsyncTaskResult = {
        taskId,
        success: true,
        result: { type: 'posted', drId: postedData.drId },
        drId: postedData.drId,
        blockHeight: Number(postedData.blockHeight),
        completedAt: postingCompletionTime,
        duration: postingCompletionDuration,
        sequenceNumber: postingResult.sequence
      };

      this.logger.info(`🎯 POSTING SUCCESS: Task ${taskId} posted in ${postingCompletionDuration}ms (${(postingCompletionDuration/1000).toFixed(2)}s) - Oracle awaiting will continue in background`);

      // CALL COMPLETION HANDLER FOR POSTING SUCCESS (this should increment posted counter)
      completionHandler.onSuccess(postingSuccessResult);

      // Phase 3: Start oracle awaiting IN PARALLEL (fire and forget)
      const oracleStartTime = this.getTimestamp();
      this.logger.info(`📋 PHASE 2: Starting oracle awaiting in background at ${new Date(oracleStartTime).toLocaleTimeString()}`);
      
      this.startOracleAwaitingInParallel(
        taskId,
        postedData,
        networkConfig,
        builderConfig,
        startTime,
        postingResult.sequence,
        completionHandler,
        performanceTracker
      );

      // Return the posting success result
      return postingSuccessResult;
        
    } catch (error) {
      const errorTime = this.getTimestamp();
      const errorDuration = errorTime - startTime;
      this.logger.error(`💥 TASK ERROR: Task ${taskId} failed after ${errorDuration}ms (${(errorDuration/1000).toFixed(2)}s):`, error instanceof Error ? error : String(error));
      return this.handleGeneralFailure(taskId, error, startTime, completionHandler);
    }
  }

  /**
   * Execute posting ONLY - no awaiting
   */
  private async executePostingOnly(
    taskId: string,
    builder: SEDADataRequestBuilder,
    config: SchedulerConfig,
    networkConfig: any,
    isRunning: () => boolean
  ): Promise<PostingResult<{ drId: string; blockHeight: bigint; txHash: string }>> {
    
    const sequencedPosting: SequencedPosting<{ drId: string; blockHeight: bigint; txHash: string }> = {
      taskId,
      timeout: process.env.COSMOS_POSTING_TIMEOUT_MS ? parseInt(process.env.COSMOS_POSTING_TIMEOUT_MS) : 20000,
      postTransaction: async (sequenceNumber: number) => {
        const postStartTime = this.getTimestamp();
        this.logger.info(`📤 POST START: DataRequest ${taskId} with sequence ${sequenceNumber} at ${new Date(postStartTime).toLocaleTimeString()}`);
        
        // Generate unique memo
        const uniqueMemoData = this.memoGenerator.generateUniqueMemo(
          config.memo || 'DataRequest',
          sequenceNumber
        );
        
        // Post transaction ONLY - no oracle awaiting
        const retryResult = await executeWithRetry(
          async () => {
            if (!builder.isBuilderInitialized()) {
              await builder.initialize();
            }

            const postInput = buildDataRequestInput(networkConfig.dataRequest, { memo: uniqueMemoData.memo });
            const gasOptions = buildGasOptions(networkConfig);
            const signer = (builder as any).signer;
            
            if (!signer) {
              throw new Error('Builder signer not available');
            }
            
            const txStartTime = this.getTimestamp();
            this.logger.info(`🔄 TX START: Posting transaction for ${taskId} at ${new Date(txStartTime).toLocaleTimeString()}`);
            
            // ONLY post the transaction - return immediately
            const result = await postDataRequestTransaction(
              signer,
              postInput,
              gasOptions,
              networkConfig,
              this.logger
            );
            
            const txEndTime = this.getTimestamp();
            const txDuration = txEndTime - txStartTime;
            this.logger.info(`✅ TX COMPLETE: Transaction posted for ${taskId} in ${txDuration}ms (${(txDuration/1000).toFixed(2)}s)`);
            
            return result;
          },
          config.maxRetries,
          0,
          isRunning,
          this.logger
        );
        
        const postEndTime = this.getTimestamp();
        const postDuration = postEndTime - postStartTime;
        
        if (retryResult.success && retryResult.result) {
          this.logger.info(`🎯 POST COMPLETE: DataRequest ${taskId} posted successfully in ${postDuration}ms (${(postDuration/1000).toFixed(2)}s)`);
          return retryResult.result;
        } else {
          this.logger.error(`❌ POST FAILED: DataRequest ${taskId} failed after ${postDuration}ms (${(postDuration/1000).toFixed(2)}s)`);
          throw retryResult.lastError || new Error('Failed to post DataRequest transaction');
        }
      }
    };

    const coordinationStartTime = this.getTimestamp();
    this.logger.info(`⚡ COORDINATION START: Coordinating DataRequest ${taskId} at ${new Date(coordinationStartTime).toLocaleTimeString()}`);
    
    const result = await this.sequenceCoordinator.executeSequenced(sequencedPosting);
    
    const coordinationEndTime = this.getTimestamp();
    const coordinationDuration = coordinationEndTime - coordinationStartTime;
    this.logger.info(`🚀 COORDINATION COMPLETE: DataRequest ${taskId} coordination finished in ${coordinationDuration}ms (${(coordinationDuration/1000).toFixed(2)}s)`);
    
    return result;
  }

  /**
   * Start oracle awaiting in parallel (fire and forget)
   */
  private startOracleAwaitingInParallel(
    taskId: string,
    postedData: { drId: string; blockHeight: bigint; txHash: string },
    networkConfig: any,
    builderConfig: any,
    taskStartTime: number,
    sequenceNumber: number,
    completionHandler: TaskCompletionHandler,
    performanceTracker?: DataRequestPerformanceTracker
  ): void {
    // Start oracle awaiting in background - don't await this!
    this.executeOracleAwaitingAsync(
      taskId,
      postedData,
      networkConfig,
      builderConfig,
      taskStartTime,
      sequenceNumber,
      completionHandler,
      performanceTracker
    ).catch(error => {
      this.logger.error(`❌ Background oracle awaiting failed for ${taskId}:`, error);
    });

    this.logger.info(`🔥 PARALLEL: Started oracle awaiting for ${taskId} in background`);
  }

  /**
   * Execute oracle awaiting asynchronously (background process)
   */
  private async executeOracleAwaitingAsync(
    taskId: string,
    postedData: { drId: string; blockHeight: bigint; txHash: string },
    networkConfig: any,
    builderConfig: any,
    taskStartTime: number,
    sequenceNumber: number,
    completionHandler: TaskCompletionHandler,
    performanceTracker?: DataRequestPerformanceTracker
  ): Promise<void> {
    try {
      const awaitOptions = {
        timeoutSeconds: networkConfig.dataRequest.timeoutSeconds,
        pollingIntervalSeconds: networkConfig.dataRequest.pollingIntervalSeconds,
        maxBatchRetries: networkConfig.dataRequest.maxBatchRetries || 5,
        batchPollingIntervalMs: networkConfig.dataRequest.batchPollingIntervalMs || 5000
      };

      const queryConfig = { rpc: builderConfig.rpcEndpoint };

      this.logger.info(`⏳ BACKGROUND: Awaiting oracle execution for ${postedData.drId}...`);

      // Wait for oracle execution with detailed timing
      const executionResult = await awaitDataRequestResult(
        queryConfig,
        postedData.drId,
        postedData.blockHeight,
        awaitOptions,
        networkConfig,
        this.logger,
        performanceTracker,
        taskId
      );
      
      const completedAt = this.getTimestamp();
      const totalDuration = completedAt - taskStartTime;

      // Update registry
      this.registry.markAsCompleted(taskId);

      // Create oracle success result
      const oracleSuccessResult: AsyncTaskResult = {
        taskId,
        success: true,
        result: { type: 'oracle_completed', ...executionResult },
        drId: executionResult.drId,
        blockHeight: Number(executionResult.drBlockHeight),
        completedAt,
        duration: totalDuration,
        sequenceNumber
      };

      // Call completion handler for ORACLE SUCCESS
      completionHandler.onSuccess(oracleSuccessResult);
      
    } catch (error) {
      this.handleOracleFailureAsync(taskId, postedData, error, taskStartTime, sequenceNumber, networkConfig, completionHandler);
    }
  }

  /**
   * Handle oracle failure in background
   */
  private handleOracleFailureAsync(
    taskId: string,
    postedData: { drId: string; blockHeight: bigint; txHash: string },
    error: any,
    taskStartTime: number,
    sequenceNumber: number,
    networkConfig: any,
    completionHandler: TaskCompletionHandler
  ): void {
    const completedAt = this.getTimestamp();
    const totalDuration = completedAt - taskStartTime;
    
    this.logger.error(`❌ BACKGROUND: Oracle execution failed for ${taskId}:`, error);
    
    // Update registry
    this.registry.markAsFailed(taskId, error instanceof Error ? error : new Error(String(error)));

    // Create failure result
    const failureResult: AsyncTaskResult = {
      taskId,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      drId: postedData.drId,
      blockHeight: Number(postedData.blockHeight),
      completedAt,
      duration: totalDuration,
      sequenceNumber
    };
    
    // Call completion handler
    completionHandler.onFailure(failureResult);
  }

  /**
   * Handle posting failure
   */
  private handlePostingFailure(
    taskId: string,
    postingResult: PostingResult<any>,
    startTime: number,
    completionHandler: TaskCompletionHandler
  ): AsyncTaskResult {
    const completedAt = this.getTimestamp();
    const duration = completedAt - startTime;
    
    this.registry.markAsFailed(
      taskId,
      postingResult.error || new Error('Failed to post DataRequest transaction'),
      postingResult.sequence
    );
    
    const failureResult: AsyncTaskResult = {
      taskId,
      success: false,
      error: postingResult.error || new Error('Failed to post DataRequest transaction'),
      completedAt,
      duration,
      sequenceNumber: postingResult.sequence
    };
    
    completionHandler.onFailure(failureResult);
    return failureResult;
  }

  /**
   * Log successful posting
   */
  private logPostingSuccess(
    taskId: string,
    postedData: { drId: string; blockHeight: bigint; txHash: string },
    startTime: number
  ): void {
    const postingDuration = this.getTimestamp() - startTime;

    this.logger.info(`⚡ POST SUCCESS: ${taskId}`);
    this.logger.info(`   📋 Request ID: ${postedData.drId}`);
    this.logger.info(`   📦 Block Height: ${postedData.blockHeight}`);
    this.logger.info(`   ⏱️ Posting Duration: ${postingDuration}ms`);
    this.logger.info(`   🔥 Oracle execution started in parallel`);
  }

  /**
   * Handle general task failure
   */
  private handleGeneralFailure(
    taskId: string,
    error: any,
    startTime: number,
    completionHandler: TaskCompletionHandler
  ): AsyncTaskResult {
    const completedAt = this.getTimestamp();
    const duration = completedAt - startTime;
    
    this.logger.error(`❌ Task ${taskId} failed:`, error);
    this.registry.markAsFailed(taskId, error instanceof Error ? error : new Error(String(error)));
    
    const failureResult: AsyncTaskResult = {
      taskId,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      completedAt,
      duration
    };
    
    completionHandler.onFailure(failureResult);
    return failureResult;
  }

  /**
   * Get memo generator statistics
   */
  getMemoGeneratorStats() {
    return this.memoGenerator.getStats();
  }

  /**
   * Reset memo generator
   */
  reset(): void {
    this.memoGenerator.reset();
  }
} 