/**
 * Cosmos Transaction Builder
 * Utilities for building and executing Cosmos/SEDA transactions
 */

import type { Signer } from '@seda-protocol/dev-tools';
import type { LoggingServiceInterface } from '../../services';

/**
 * Cosmos transaction configuration
 */
export interface CosmosTransactionConfig {
  memo?: string;
  gasLimit?: number;
  gasPrice?: string;
  timeoutHeight?: number;
}

/**
 * Cosmos transaction result
 */
export interface CosmosTransactionResult {
  txHash: string;
  blockHeight: bigint;
  gasUsed: bigint;
  data?: any;
}

/**
 * Gas options for Cosmos transactions
 */
export interface CosmosGasOptions {
  gasLimit: number;
  gasPrice: string;
}

/**
 * Build gas options for Cosmos transactions
 */
export function buildCosmosGas(
  gasLimit: number = 1_000_000,
  gasPrice: string = '100000000000aseda'
): CosmosGasOptions {
  return {
    gasLimit,
    gasPrice
  };
}

/**
 * Execute Cosmos transaction with timeout
 */
export async function executeCosmosTransaction(
  signer: Signer,
  transactionFn: () => Promise<any>,
  config: CosmosTransactionConfig = {},
  logger?: LoggingServiceInterface
): Promise<CosmosTransactionResult> {
  const startTime = Date.now();
  
  try {
    logger?.debug('Executing Cosmos transaction...');
    
    const result = await transactionFn();
    
    const duration = Date.now() - startTime;
    logger?.debug(`Cosmos transaction completed in ${duration}ms`);
    
    return {
      txHash: result.txHash || result.transactionHash,
      blockHeight: BigInt(result.blockHeight || result.height || 0),
      gasUsed: BigInt(result.gasUsed || 0),
      data: result
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger?.error(`Cosmos transaction failed after ${duration}ms:`, error instanceof Error ? error : String(error));
    throw error;
  }
}

/**
 * Validate Cosmos transaction prerequisites
 */
export function validateCosmosPrerequisites(
  signer: Signer | null,
  config?: CosmosTransactionConfig
): { valid: boolean; error?: string } {
  if (!signer) {
    return { valid: false, error: 'Signer is required for Cosmos transactions' };
  }

  if (config?.gasLimit && config.gasLimit < 100000) {
    return { valid: false, error: 'Gas limit too low for Cosmos transaction' };
  }

  return { valid: true };
}

/**
 * Format Cosmos memo with limits
 */
export function formatCosmosMemo(memo: string, maxLength: number = 256): string {
  if (!memo) return '';
  
  // Truncate if too long
  if (memo.length > maxLength) {
    return memo.substring(0, maxLength - 3) + '...';
  }
  
  return memo;
}

/**
 * Check if error is related to Cosmos sequence numbers
 */
export function isCosmosSequenceError(error: Error | string): boolean {
  const errorMessage = error instanceof Error ? error.message : error;
  const sequenceErrorPatterns = [
    'account sequence mismatch',
    'incorrect account sequence',
    'sequence number',
    'nonce too low',
    'sequence too low'
  ];

  return sequenceErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
} 