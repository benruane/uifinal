/**
 * DataRequest Input Builder
 * Handles building PostDataRequestInput objects from configuration
 */

import type { PostDataRequestInput, GasOptions } from '@seda-protocol/dev-tools';
import type { SEDADataRequestConfig, DataRequestOptions } from '../../types';

/**
 * Build PostDataRequestInput from DataRequest configuration and options
 * @param drConfig The SEDA DataRequest configuration containing oracle program settings
 * @param options Optional DataRequest parameters to override defaults
 * @returns PostDataRequestInput object ready for SEDA network submission
 */
export function buildDataRequestInput(
  drConfig: SEDADataRequestConfig, 
  options: DataRequestOptions = {}
): PostDataRequestInput {
  // Convert memo to Uint8Array if provided
  const memoBytes = options.memo ? new TextEncoder().encode(options.memo) : new Uint8Array(0);

  return {
    // Oracle program configuration
    execProgramId: drConfig.oracleProgramId,
    
    // Empty inputs since the oracle program doesn't expect any input
    execInputs: new Uint8Array(0),
    tallyInputs: new Uint8Array(0),
    
    // Execution configuration
    replicationFactor: drConfig.replicationFactor,
    execGasLimit: Number(drConfig.execGasLimit),
    gasPrice: drConfig.gasPrice,
    
    // Consensus configuration
    consensusOptions: { method: 'none' },
    
    // Optional memo
    memo: memoBytes
  };
}

/**
 * Build gas options from network transaction configuration
 * @param networkConfig The network configuration containing transaction gas settings
 * @returns GasOptions object for transaction gas configuration
 */
export function buildGasOptions(networkConfig: any): GasOptions {
  return {
    gasPrice: networkConfig.transaction.gasPrice.toString()
  };
}

/**
 * Build await options from DataRequest configuration and custom options
 * @param drConfig The SEDA DataRequest configuration containing timeout settings
 * @param options Optional parameters to override default timeout values
 * @returns Await options for DataRequest execution monitoring
 */
export function buildAwaitOptions(
  drConfig: SEDADataRequestConfig, 
  options: DataRequestOptions = {}
) {
  return {
    timeoutSeconds: options.customTimeout || drConfig.timeoutSeconds,
    pollingIntervalSeconds: drConfig.pollingIntervalSeconds,
    maxBatchRetries: drConfig.maxBatchRetries || 10,
    batchPollingIntervalMs: drConfig.batchPollingIntervalMs || 3000
  };
} 