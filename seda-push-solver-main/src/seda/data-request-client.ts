/**
 * SEDA DataRequest Client
 * Handles posting DataRequests and awaiting their completion
 */

import { postDataRequest, awaitDataResult, type Signer } from '@seda-protocol/dev-tools';
import type { PostDataRequestInput, GasOptions, QueryConfig } from '@seda-protocol/dev-tools';
import type { DataRequestResult, NetworkConfig } from '../types';
import type { LoggingServiceInterface } from '../services';
import { HexUtils } from '../utils/hex';

/**
 * Result of posting a DataRequest transaction
 */
export interface DataRequestPosted {
  /** DataRequest ID */
  drId: string;
  /** Block height where DataRequest was included */
  blockHeight: bigint;
  /** Transaction hash */
  txHash: string;
}

/**
 * Options for awaiting DataRequest results
 */
export interface AwaitOptions {
  /** Timeout in seconds */
  timeoutSeconds: number;
  /** Polling interval in seconds */
  pollingIntervalSeconds: number;
  /** Maximum batch retries */
  maxBatchRetries: number;
  /** Batch polling interval in milliseconds */
  batchPollingIntervalMs: number;
}

/**
 * Client for SEDA DataRequest operations
 */
export class DataRequestClient {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Post a DataRequest transaction to the SEDA network
   * This phase should be coordinated by sequence to prevent conflicts
   */
  async postRequest(
    signer: Signer, 
    postInput: PostDataRequestInput, 
    gasOptions: GasOptions, 
    networkConfig: NetworkConfig
  ): Promise<DataRequestPosted> {
    
    // Clean, structured configuration display
    this.logger.info('\n┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                        📤 Posting DataRequest                       │');
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    this.logger.info(`│ Oracle Program ID: ${postInput.execProgramId}`);
    this.logger.info(`│ Replication Factor: ${postInput.replicationFactor || 0}`);
    this.logger.info(`│ Gas Limit: ${postInput.execGasLimit?.toLocaleString() || 'N/A'}`);
    this.logger.info(`│ Gas Price: ${(postInput.gasPrice || 0).toString()}`);
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
    
    this.logger.info('\n🚀 Posting DataRequest transaction to SEDA network...');
    
    // Post the DataRequest transaction (this waits for inclusion in block)
    const postResult = await postDataRequest(signer, postInput, gasOptions);
    
    // Log successful posting
    this.logger.info(`✅ DataRequest posted successfully!`);
    this.logger.info(`   📋 Request ID: ${postResult.dr.id}`);
    this.logger.info(`   📦 Block Height: ${postResult.dr.height}`);
    this.logger.info(`   🔗 Transaction: ${postResult.tx}`);
    
    return {
      drId: postResult.dr.id,
      blockHeight: postResult.dr.height,
      txHash: postResult.tx
    };
  }

  /**
   * Wait for a DataRequest to be executed and return results
   * This phase happens in parallel and doesn't need sequence coordination
   */
  async awaitResult(
    queryConfig: QueryConfig,
    drId: string,
    blockHeight: bigint,
    awaitOptions: AwaitOptions,
    networkConfig: NetworkConfig
  ): Promise<DataRequestResult> {
    
    this.logger.info(`\n⏳ Waiting for DataRequest ${drId} to complete...`);
    this.logger.info(`   📦 Block Height: ${blockHeight}`);
    this.logger.info(`   ⏱️ Timeout: ${awaitOptions.timeoutSeconds}s`);
    this.logger.info(`   🔄 Polling: every ${awaitOptions.pollingIntervalSeconds}s`);

    // Create DataRequest object for awaiting
    const dataRequest = { id: drId, height: blockHeight };
    
    // Wait for DataRequest execution to complete
    const result = await awaitDataResult(queryConfig, dataRequest, {
      timeoutSeconds: awaitOptions.timeoutSeconds,
      pollingIntervalSeconds: awaitOptions.pollingIntervalSeconds
    });
    
    // Clean, structured results display
    this.logger.info('\n┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                         ✅ DataRequest Results                      │');
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    this.logger.info(`│ Request ID: ${result.drId}`);
    this.logger.info(`│ Exit Code: ${result.exitCode}`);
    this.logger.info(`│ Block Height: ${result.drBlockHeight}`);
    this.logger.info(`│ Gas Used: ${result.gasUsed}`);
    this.logger.info(`│ Consensus: ${result.consensus || 'N/A'}`);
    
    // Handle result data display
    if (result.result) {
      this.logger.info(`│ Result (hex): ${result.result}`);
      
      // Show numeric conversion if it looks like hex
      if (typeof result.result === 'string' && HexUtils.validate(result.result)) {
        try {
          const numericResult = HexUtils.toBigEndianNumber(result.result);
          this.logger.info(`│ Result (number): ${numericResult}`);
        } catch (error) {
          // Silent fail for conversion errors
        }
      }
    } else {
      this.logger.info(`│ Result: No result data`);
    }
    
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    if (networkConfig.explorerEndpoint) {
      this.logger.info(`│ Explorer: ${networkConfig.explorerEndpoint}/data-requests/${result.drId}/${result.drBlockHeight}`);
    } else {
      this.logger.info(`│ Explorer: N/A`);
    }
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
    
      return {
        drId: result.drId,
        drBlockHeight: BigInt(result.blockHeight || 0),
        exitCode: result.exitCode,
        gasUsed: BigInt(result.gasUsed || '0'),
        result: result.result || '',
        paybackAddress: result.paybackAddress || '',
        sedaPayload: result.sedaPayload || '',
        version: result.version || '',
        blockTimestamp: BigInt(result.blockTimestamp ? result.blockTimestamp.getTime() / 1000 : 0)
      };
  }

  // Legacy executeDataRequest method removed
  // Use postRequest and awaitResult separately for better control
} 