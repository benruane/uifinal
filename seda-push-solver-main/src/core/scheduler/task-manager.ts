/**
 * Task Manager for SEDA DataRequest Scheduler
 * Achieves optimal posting performance by separating timer intervals from posting execution
 * Refactored to use extracted task management modules
 */

import type { LoggingService } from '../../services';
import type { SEDADataRequestBuilder } from '../data-request';
import type { SchedulerConfig } from '../../types';
import { 
  CosmosSequenceCoordinator,
  type CosmosSequenceConfig 
} from './cosmos-sequence-coordinator';
import type { SchedulerStatistics } from './statistics';
import type { DataRequestTracker, AsyncTaskResult, TaskCompletionHandler } from './types';
import { TaskRegistry } from './task-registry';
import { TaskExecutor } from './task-executor';
import { DataRequestPerformanceTracker } from './performance-tracker';

// Task management modules
import { TaskQueue, type QueueStats } from './task-management';
import { TaskCompletionManager } from './task-management';

/**
 * Task Manager
 * Key design: Timer intervals are not blocked by posting execution
 */
export class TaskManager {
  private taskCounter = 0;
  private sequenceCoordinator: CosmosSequenceCoordinator;
  private registry: TaskRegistry;
  private executor: TaskExecutor;
  private performanceTracker: DataRequestPerformanceTracker;
  
  // Task management modules
  private taskQueue: TaskQueue;
  private completionManager: TaskCompletionManager;

  constructor(
    private logger: LoggingService,
    private cosmosSequenceConfig: CosmosSequenceConfig,
    private getTimestamp: () => number = Date.now
  ) {
    this.sequenceCoordinator = new CosmosSequenceCoordinator(this.logger, this.cosmosSequenceConfig);
    this.registry = new TaskRegistry(this.logger, this.getTimestamp);
    this.executor = new TaskExecutor(this.logger, this.sequenceCoordinator, this.registry, this.getTimestamp);
    this.performanceTracker = new DataRequestPerformanceTracker();
    
    // Initialize task management modules
    this.taskQueue = new TaskQueue(this.logger, this.getTimestamp);
    this.completionManager = new TaskCompletionManager(this.logger);
  }

  /**
   * Initialize the task manager
   */
  async initialize(builder: SEDADataRequestBuilder): Promise<void> {
    if (!builder.isBuilderInitialized()) {
      await builder.initialize();
    }

    const signer = (builder as any).signer;
    if (!signer) {
      throw new Error('Builder signer not available for sequence coordinator initialization');
    }

    await this.sequenceCoordinator.initialize(signer);
    this.logger.info('⚡ Task manager initialized');
  }

  /**
   * Queue a task and return IMMEDIATELY
   * This NEVER blocks the timer interval
   */
  queueTask(
    builder: SEDADataRequestBuilder,
    config: SchedulerConfig,
    isRunning: () => boolean,
    completionHandler: TaskCompletionHandler,
    statistics: SchedulerStatistics
  ): string {
    this.taskCounter++;
    const taskId = `task-${this.taskCounter}-${Date.now()}`;
    const requestNumber = this.taskCounter;
    
    this.logger.info(`⚡ Queued task #${requestNumber} (${taskId}) - NO BLOCKING!`);
    
    // Start performance tracking
    this.performanceTracker.startTracking(taskId, requestNumber);
    
    // Add to queue using the queue module
    this.taskQueue.enqueue(taskId, requestNumber);

    // Register the task
    this.registry.registerTask(taskId, config.memo);

    // Create completion handler using the completion manager
    const enhancedCompletionHandler = this.completionManager.createCompletionHandler(
      taskId,
      statistics,
      this.performanceTracker,
      completionHandler
    );

    // Start processing the task in the background (fire and forget)
    this.processTaskInBackground(
      taskId,
      requestNumber,
      builder,
      config,
      isRunning,
      enhancedCompletionHandler
    );

    return taskId;
  }

  /**
   * Process task in background without blocking
   */
  private async processTaskInBackground(
    taskId: string,
    requestNumber: number,
    builder: SEDADataRequestBuilder,
    config: SchedulerConfig,
    isRunning: () => boolean,
    completionHandler: TaskCompletionHandler
  ): Promise<void> {
    try {
      // Execute the task using the executor
      await this.executor.executeTask(
        taskId,
        requestNumber,
        builder,
        config,
        isRunning,
        completionHandler,
        this.performanceTracker
      );
    } catch (error) {
      this.logger.error(`❌ Background task processing failed for ${taskId}:`, error instanceof Error ? error : String(error));
    } finally {
      // Remove from queue when done using the queue module
      this.taskQueue.dequeue(taskId);
    }
  }

  /**
   * Get count of active tasks (both queued and executing)
   */
  getActiveTaskCount(): number {
    return this.taskQueue.getSize();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.taskQueue.getSize();
  }

  /**
   * Get all DataRequest trackers
   */
  getAllDataRequests(): DataRequestTracker[] {
    return this.registry.getAllTasks();
  }

  /**
   * Get active DataRequest trackers only
   */
  getActiveDataRequests(): DataRequestTracker[] {
    return this.registry.getActiveTasks();
  }

  /**
   * Get DataRequest tracker by task ID
   */
  getDataRequest(taskId: string): DataRequestTracker | undefined {
    return this.registry.getTask(taskId);
  }

  /**
   * Get DataRequest trackers by status
   */
  getDataRequestsByStatus(status: DataRequestTracker['status']): DataRequestTracker[] {
    return this.registry.getTasksByStatus(status);
  }

  /**
   * Get memo generator statistics
   */
  getMemoGeneratorStats() {
    return this.executor.getMemoGeneratorStats();
  }

  /**
   * Get sequence coordinator statistics
   */
  getSequenceCoordinatorStats() {
    return this.sequenceCoordinator.getStats();
  }

  /**
   * Get queue statistics using the queue module
   */
  getQueueStats(): QueueStats {
    return this.taskQueue.getStats();
  }

  /**
   * Wait for all active tasks to complete
   */
  async waitForAllTasks(): Promise<void> {
    while (!this.taskQueue.isEmpty()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Also wait for the sequence coordinator queue
    await this.sequenceCoordinator.waitForQueue();
  }

  /**
   * Get performance tracker for access from executor
   */
  getPerformanceTracker(): DataRequestPerformanceTracker {
    return this.performanceTracker;
  }

  /**
   * Log performance summary
   */
  logPerformanceSummary(): void {
    this.performanceTracker.logSummaryStatistics(this.logger);
  }

  /**
   * Clear all active tasks
   */
  clear(): void {
    this.taskQueue.clear();
    this.registry.clear();
    this.executor.reset();
    this.sequenceCoordinator.clear();
    this.performanceTracker.reset();
  }
} 