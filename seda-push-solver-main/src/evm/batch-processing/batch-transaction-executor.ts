/**
 * Batch Transaction Executor
 * Executes batch posting transactions on EVM networks
 */

import type { EvmNetworkConfig, ValidatorProofData } from '../../types';
import type { LoggingServiceInterface } from '../../services';
import type { HexString } from '../../utils/hex';
import { executeEvmTransaction } from '../../utils/transaction/evm-transaction-builder';
import { ABI_SECP256K1_PROVER_V1 } from '../abi/abi-secp256k1-prover-v1.abi';
import type { EvmBatch } from './batch-converter';

/**
 * Execute batch posting transaction
 */
export async function executeBatchTransaction(
  network: EvmNetworkConfig,
  privateKey: string,
  proverAddress: string,
  evmBatch: EvmBatch,
  signatures: HexString[],
  proofs: ValidatorProofData[],
  logger?: LoggingServiceInterface
): Promise<string> {
  logger?.debug(`📡 Posting batch ${evmBatch.batchHeight} to ${network.displayName}`);

  try {
    const result = await executeEvmTransaction(
      network,
      privateKey,
      {
        to: proverAddress,
        abi: ABI_SECP256K1_PROVER_V1 as unknown as any[],
        functionName: 'postBatch',
        args: [evmBatch, signatures, proofs]
      }
    );

    logger?.debug(`📦 Block: ${result.blockNumber}, Gas: ${result.gasUsed}`);
    return result.txHash;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Batch transaction execution failed: ${errorMessage}`);
  }
}