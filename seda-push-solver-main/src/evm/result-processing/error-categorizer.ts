/**
 * Error Categorizer
 * Categorizes error messages for better handling in result posting
 */

import type { EvmNetworkConfig } from '../../types';

/**
 * Categorize error messages for better handling
 */
export function categorizeResultPostingError(errorMessage: string): string {
  if (errorMessage.includes('ResultAlreadyExists')) {
    return 'Result already exists on chain';
  }
  if (errorMessage.includes('InvalidResultProof')) {
    return 'Invalid result proof provided';
  }
  if (errorMessage.includes('RequestNotFound')) {
    return 'DataRequest not found on chain';
  }
  if (errorMessage.includes('EnforcedPause')) {
    return 'Contract is paused';
  }
  
  return errorMessage;
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(network: EvmNetworkConfig, txHash: string): string {
  if (network.explorerUrl) {
    return `${network.explorerUrl}/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`; // Default fallback
} 