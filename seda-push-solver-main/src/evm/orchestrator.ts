/**
 * EVM Orchestrator
 * Consolidated EVM operations - replaces both EvmNetworkManager and EvmBatchManager
 * Handles all EVM network interactions including batch checking and posting
 */

import type { LoggingServiceInterface } from '../services';
import type { SignedBatch, NetworkBatchStatus, EvmNetworkConfig, DataRequestResult } from '../types';
import { getErrorMessage } from '../helpers/error-utils';
import { ProverDiscovery } from './prover-discovery';
import { BatchPoster } from './batch-poster';
import { ResultPoster } from './result-poster';

/**
 * Unified orchestrator for all EVM network operations
 */
export class EvmOrchestrator {
  private proverDiscovery: ProverDiscovery;
  private batchPoster: BatchPoster;
  private resultPoster: ResultPoster;

  constructor(private logger: LoggingServiceInterface, private networks: EvmNetworkConfig[]) {
    this.proverDiscovery = new ProverDiscovery(logger);
    this.batchPoster = new BatchPoster(logger);
    this.resultPoster = new ResultPoster(logger);
  }

  /**
   * Initialize prover contracts for all enabled networks
   */
  async initialize(): Promise<void> {
    if (this.networks.length === 0) {
      return;
    }
    
    this.logger.info(`Initializing ${this.networks.length} EVM networks`);
    
    const discoveries = await Promise.all(
      this.networks.map(network => 
        this.proverDiscovery.discoverProverAddress(network)
      )
    );
     
    const successCount = discoveries.filter((addr: string | null) => addr !== null).length;
    this.logger.info(`Discovered ${successCount}/${this.networks.length} prover contracts`);
  }

  /**
   * Process batch and optionally post results across all networks - main entry point
   */
  async processBatch(batch: SignedBatch, dataRequestResult?: DataRequestResult): Promise<NetworkBatchStatus[]> {
    if (this.networks.length === 0) {
      this.logger.info('No EVM networks configured');
      return [];
    }
    
    this.logger.info(`Processing batch ${batch.batchNumber} on ${this.networks.length} EVM networks`);

    const results = await Promise.all(
      this.networks.map(network => 
        this.processNetworkBatch(network, batch, dataRequestResult)
      )
    );

    this.logBatchSummary(Number(batch.batchNumber), results);
    return results;
  }

  /**
   * Process batch on a specific network
   */
  private async processNetworkBatch(
    network: EvmNetworkConfig,
    batch: SignedBatch,
    dataRequestResult?: DataRequestResult
  ): Promise<NetworkBatchStatus> {
    try {
      const proverAddress = await this.proverDiscovery.discoverProverAddress(network);
      
      if (!proverAddress) {
        return this.createErrorResult(network, 'Failed to discover prover contract address');
      }

      const lastBatchHeight = await this.proverDiscovery.getLastBatchHeight(network, proverAddress);
      
      if (lastBatchHeight === null) {
        return this.createErrorResult(network, 'Failed to query last batch height');
      }
      
      const batchExists = lastBatchHeight >= BigInt(batch.batchNumber);
      
      // Initialize result for this network
      const networkResult: NetworkBatchStatus = {
        networkName: network.displayName,
        batchExists,
        lastBatchHeight,
      };

      if (batchExists) {
        this.logger.info(`${network.displayName}: Batch ${batch.batchNumber} exists (height: ${lastBatchHeight})`);
        
        // If batch exists and we have a DataRequest result, try to post the result
        if (dataRequestResult) {
          await this.postResultToNetwork(network, dataRequestResult, batch, networkResult);
        }
        
        return networkResult;
      }

      // Batch missing - attempt to post
      this.logger.info(`${network.displayName}: Posting missing batch ${batch.batchNumber}`);
      const postResult = await this.batchPoster.postBatch(network, batch, proverAddress);
      
      if (postResult.success) {
        this.logger.info(`${network.displayName}: Posted batch ${batch.batchNumber} - ${postResult.txHash}`);
      } else {
        this.logger.error(`${network.displayName}: Failed to post batch - ${postResult.error}`);
      }
      
      // Update network result with batch posting info
      networkResult.batchExists = false;
      networkResult.posted = postResult.success;
      networkResult.txHash = postResult.txHash;
      networkResult.error = postResult.error;

      // If batch was successfully posted and we have a DataRequest result, try to post the result
      if (postResult.success && dataRequestResult) {
        await this.postResultToNetwork(network, dataRequestResult, batch, networkResult);
      }
      
      return networkResult;

    } catch (error) {
      const errorMsg = getErrorMessage(error);
      this.logger.warn(`${network.displayName}: Batch processing failed - ${errorMsg}`);
      return this.createErrorResult(network, errorMsg);
    }
  }

  /**
   * Get status of all networks
   */
  async getNetworkStatuses(): Promise<{ network: string; status: string; lastBatch?: bigint }[]> {
    return Promise.all(
      this.networks.map(async network => {
        try {
          const proverAddress = await this.proverDiscovery.discoverProverAddress(network);
          if (!proverAddress) {
            return { network: network.displayName, status: 'no prover address' };
          }
          
          const lastBatch = await this.proverDiscovery.getLastBatchHeight(network, proverAddress);
          if (lastBatch === null) {
            return { network: network.displayName, status: 'query failed' };
          }
          
          return { 
            network: network.displayName, 
            status: 'connected', 
            lastBatch 
          };
          
        } catch (error) {
          return { 
            network: network.displayName, 
            status: `error: ${getErrorMessage(error)}` 
          };
        }
      })
    );
  }

  /**
   * Post DataRequest result to a specific network
   */
  private async postResultToNetwork(
    network: EvmNetworkConfig,
    dataRequestResult: DataRequestResult,
    batch: SignedBatch,
    networkResult: NetworkBatchStatus
  ): Promise<void> {
    try {
      this.logger.info(`🔍 Attempting to post result for DR ${dataRequestResult.drId} to ${network.displayName}`);
      
      const resultPostResult = await this.resultPoster.postResult(
        network,
        dataRequestResult,
        batch,
        network.contractAddress // SEDA Core contract address
      );

      // Update network result with result posting info
      networkResult.resultPosted = resultPostResult.success;
      networkResult.resultTxHash = resultPostResult.txHash;
      networkResult.resultError = resultPostResult.error;
      networkResult.resultId = resultPostResult.resultId;

      if (resultPostResult.success) {
        this.logger.info(`✅ ${network.displayName}: Posted result for DR ${dataRequestResult.drId} - ${resultPostResult.txHash}`);
      } else {
        this.logger.warn(`⚠️ ${network.displayName}: Failed to post result - ${resultPostResult.error}`);
      }
      
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      this.logger.warn(`⚠️ ${network.displayName}: Result posting failed - ${errorMsg}`);
      networkResult.resultPosted = false;
      networkResult.resultError = errorMsg;
    }
  }

  private createErrorResult(network: EvmNetworkConfig, error: string): NetworkBatchStatus {
    return {
      networkName: network.displayName,
      batchExists: false,
      lastBatchHeight: null,
      error
    };
  }

  private logBatchSummary(batchNumber: number, results: NetworkBatchStatus[]): void {
    const existsCount = results.filter(r => r.batchExists).length;
    const postedCount = results.filter(r => r.posted === true).length;
    const errorCount = results.filter(r => r.error).length;
    const successfulPosts = results.filter(r => r.posted === true && r.txHash);
    
    // Result posting summary
    const resultAttemptedCount = results.filter(r => r.resultPosted !== undefined).length;
    const resultPostedCount = results.filter(r => r.resultPosted === true).length;
    const successfulResultPosts = results.filter(r => r.resultPosted === true && r.resultTxHash);

    this.logger.info(`📊 Batch ${batchNumber} Summary:`);
    this.logger.info(`   📦 Batches: ${existsCount}/${this.networks.length} exist, ${postedCount} posted`);
    
    if (resultAttemptedCount > 0) {
      this.logger.info(`   📋 Results: ${resultPostedCount}/${resultAttemptedCount} posted successfully`);
    }
    
    if (postedCount > 0) {
      this.logger.info(`   🚀 Batch Posts:`);
      successfulPosts.forEach(result => {
        this.logger.info(`     ${result.networkName}: ${result.txHash}`);
      });
    }
    
    if (resultPostedCount > 0) {
      this.logger.info(`   📤 Result Posts:`);
      successfulResultPosts.forEach(result => {
        this.logger.info(`     ${result.networkName}: ${result.resultTxHash} (ID: ${result.resultId})`);
      });
    }
    
    if (errorCount > 0) {
      this.logger.info(`   ⚠️ ${errorCount} networks had errors`);
    }
  }
} 