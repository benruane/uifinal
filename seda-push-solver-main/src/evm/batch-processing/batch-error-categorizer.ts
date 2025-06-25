/**
 * Batch Error Categorizer
 * Categorizes batch posting errors for better handling
 */

import type { EvmNetworkConfig } from '../../types';

/**
 * Categorize batch posting error messages
 */
export function categorizeBatchPostingError(errorMessage: string): string {
  if (errorMessage.includes('BatchAlreadyExists')) {
    return 'Batch already exists on chain';
  }
  if (errorMessage.includes('ConsensusNotReached')) {
    return 'Consensus not reached on chain';
  }
  if (errorMessage.includes('EnforcedPause')) {
    return 'Contract is paused';
  }
  
  return errorMessage;
}

/**
 * Get block explorer URL for batch transaction
 */
export function getBatchExplorerUrl(network: EvmNetworkConfig, txHash: string): string {
  // First, check if explorerUrl is configured in the network config
  if (network.explorerUrl) {
    return `${network.explorerUrl}${txHash}`;
  }
  
  // Fallback to hardcoded explorer URLs for backward compatibility
  const defaultExplorers = {
    // Mainnet
    1: 'https://etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    
    // Testnets
    11155111: 'https://sepolia.etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    84532: 'https://sepolia.basescan.org/tx/',
    80001: 'https://mumbai.polygonscan.com/tx/',
    421613: 'https://goerli.arbiscan.io/tx/',
    420: 'https://goerli-optimism.etherscan.io/tx/'
  };
  
  const baseUrl = defaultExplorers[network.chainId as keyof typeof defaultExplorers];
  return baseUrl ? `${baseUrl}${txHash}` : `Chain ${network.chainId}: ${txHash}`;
} 