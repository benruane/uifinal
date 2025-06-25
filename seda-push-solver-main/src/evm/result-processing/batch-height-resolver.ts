/**
 * Batch Height Resolver
 * Resolves the current batch height on EVM networks for result posting
 */

import type { EvmNetworkConfig, SignedBatch } from '../../types';
import type { LoggingServiceInterface } from '../../services';
import { readEvmContract } from '../../utils/transaction/evm-transaction-builder';
import { ABI_SEDA_CORE_V1, I_PROVER } from '../abi';
import { getErrorMessage } from '../../helpers/error-utils';

/**
 * Get the current batch height on the network
 */
export async function getCurrentBatchHeight(
  network: EvmNetworkConfig,
  sedaCoreAddress: string,
  fallbackBatch: SignedBatch,
  logger?: LoggingServiceInterface
): Promise<bigint> {
  try {
    // Get the prover address first
    const proverAddress = await readEvmContract<string>(
      network,
      sedaCoreAddress,
      ABI_SEDA_CORE_V1 as unknown as any[],
      'getSedaProver',
      []
    );

    // Then get the latest batch height from the prover
    const latestBatchHeight = await readEvmContract<bigint>(
      network,
      proverAddress,
      I_PROVER as unknown as any[],
      'getLastBatchHeight',
      []
    );

    logger?.debug(`📊 Current batch height on ${network.displayName}: ${latestBatchHeight}`);
    return latestBatchHeight;
  } catch (error) {
    logger?.warn(`Failed to get current batch height, using batch assignment: ${getErrorMessage(error)}`);
    // Fallback to the batch assignment from the result - this might not be optimal but it's a fallback
    return BigInt(fallbackBatch.batchNumber);
  }
} 