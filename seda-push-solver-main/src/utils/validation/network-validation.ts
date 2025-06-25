/**
 * Network Validation Utilities
 * Validation functions for network configurations and connectivity
 */

import type { EvmNetworkConfig, DataRequestResult } from '../../types';
import { validateRequired, validateUrl, validatePositiveNumber, validateEthereumAddress, type ValidationResult } from './common-validators';

/**
 * Validate data request result structure
 */
export function validateDataRequestResult(result: DataRequestResult): ValidationResult<DataRequestResult> {
  // Validate DR ID
  const drIdValidation = validateRequired(result.drId, 'drId');
  if (!drIdValidation.valid) {
    return { valid: false, error: drIdValidation.error };
  }

  // Validate result data
  const resultValidation = validateRequired(result.result, 'result');
  if (!resultValidation.valid) {
    return { valid: false, error: resultValidation.error };
  }

  // Validate block height
  if (result.drBlockHeight != null && result.drBlockHeight < 0n) {
    return { valid: false, error: 'Block height must be non-negative' };
  }

  return { valid: true, data: result };
}

/**
 * Validate network connectivity prerequisites
 */
export function validateNetworkPrerequisites(
  privateKey?: string,
  requiredEnvVars?: string[]
): ValidationResult<void> {
  // Check private key if required
  if (privateKey !== undefined) {
    if (!privateKey) {
      return { valid: false, error: 'Private key is required but not configured' };
    }

    // Basic private key format validation (64 hex characters)
    const keyWithoutPrefix = privateKey.replace(/^0x/, '').trim();
    if (!/^[0-9a-fA-F]{64}$/.test(keyWithoutPrefix)) {
      return { valid: false, error: 'Invalid private key format. Expected 64 hex characters.' };
    }
  }

  // Check required environment variables
  if (requiredEnvVars && requiredEnvVars.length > 0) {
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
      return { 
        valid: false, 
        error: `Missing required environment variables: ${missing.join(', ')}` 
      };
    }
  }

  return { valid: true };
}

/**
 * Validate contract address format
 */
export function validateContractAddress(
  address: string,
  fieldName: string = 'contractAddress'
): ValidationResult<string> {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: `${fieldName} must be a valid contract address` };
  }

  // Use the Ethereum address validator
  return validateEthereumAddress(address, fieldName);
}

/**
 * Validate chain ID is supported
 */
export function validateSupportedChainId(
  chainId: number,
  supportedChains?: number[]
): ValidationResult<number> {
  const chainIdValidation = validatePositiveNumber(chainId, 'chainId');
  if (!chainIdValidation.valid) {
    return chainIdValidation;
  }

  if (supportedChains && supportedChains.length > 0) {
    if (!supportedChains.includes(chainId)) {
      return { 
        valid: false, 
        error: `Chain ID ${chainId} is not supported. Supported chains: ${supportedChains.join(', ')}` 
      };
    }
  }

  return { valid: true, data: chainId };
} 