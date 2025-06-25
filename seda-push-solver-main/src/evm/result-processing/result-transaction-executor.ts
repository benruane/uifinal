/**
 * Result Transaction Executor
 * Executes the result posting transaction on EVM networks
 */

import type { EvmNetworkConfig } from '../../types';
import type { LoggingServiceInterface } from '../../services';
import { executeEvmTransaction } from '../../utils/transaction/evm-transaction-builder';
import { ABI_SEDA_CORE_V1 } from '../abi';
import { getErrorMessage } from '../../helpers/error-utils';
import type { DataResultEvm } from './data-result-converter';
import { add0x } from './data-result-converter';

/**
 * Execute the result posting transaction
 * Based on simple-solver's network.call() pattern
 */
export async function executeResultTransaction(
  network: EvmNetworkConfig,
  privateKey: string,
  sedaCoreAddress: string,
  evmResult: DataResultEvm,
  targetBatch: bigint,
  proof: string[],
  logger?: LoggingServiceInterface
): Promise<string> {
  logger?.debug(`📡 Posting result to ${network.displayName}...`);

  try {
    const result = await executeEvmTransaction(
      network,
      privateKey,
      {
        to: sedaCoreAddress,
        abi: ABI_SEDA_CORE_V1 as unknown as any[],
        functionName: 'postResult',
        args: [evmResult, targetBatch, proof.map(p => add0x(p))]
      }
    );

    logger?.debug(`📦 Block: ${result.blockNumber}, Gas: ${result.gasUsed}`);
    return result.txHash;
  } catch (error) {
    throw new Error(`Transaction execution failed: ${getErrorMessage(error)}`);
  }
} 