/**
 * Configuration Validation Utilities
 * Validation functions for configuration objects
 */

import type { SedaConfig, EvmNetworkConfig } from '../../types';
import { validateRequired, validateUrl, validatePositiveNumber, type ValidationResult } from './common-validators';

/**
 * Validate SEDA configuration
 */
export function validateSedaConfig(config: SedaConfig): ValidationResult<SedaConfig> {
  // Validate mnemonic
  const mnemonicValidation = validateRequired(config.mnemonic, 'mnemonic');
  if (!mnemonicValidation.valid) {
    return { valid: false, error: mnemonicValidation.error };
  }

  // Validate RPC endpoint
  const rpcValidation = validateUrl(config.rpcEndpoint, 'rpcEndpoint');
  if (!rpcValidation.valid) {
    return { valid: false, error: rpcValidation.error };
  }

  // Validate oracle program ID
  const oracleProgramValidation = validateRequired(config.oracleProgramId, 'oracleProgramId');
  if (!oracleProgramValidation.valid) {
    return { valid: false, error: oracleProgramValidation.error };
  }

  // Validate timeout settings
  const timeoutValidation = validatePositiveNumber(config.drTimeoutSeconds, 'drTimeoutSeconds');
  if (!timeoutValidation.valid) {
    return { valid: false, error: timeoutValidation.error };
  }

  const pollingValidation = validatePositiveNumber(config.drPollingIntervalSeconds, 'drPollingIntervalSeconds');
  if (!pollingValidation.valid) {
    return { valid: false, error: pollingValidation.error };
  }

  return { valid: true, data: config };
}

/**
 * Validate EVM network configuration
 */
export function validateEvmNetworkConfig(config: EvmNetworkConfig): ValidationResult<EvmNetworkConfig> {
  // Validate network name
  const nameValidation = validateRequired(config.name, 'name');
  if (!nameValidation.valid) {
    return { valid: false, error: nameValidation.error };
  }

  // Validate RPC URL
  const rpcValidation = validateUrl(config.rpcUrl, 'rpcUrl');
  if (!rpcValidation.valid) {
    return { valid: false, error: rpcValidation.error };
  }

  // Validate contract address (should be valid hex)
  const contractValidation = validateRequired(config.contractAddress, 'contractAddress');
  if (!contractValidation.valid) {
    return { valid: false, error: contractValidation.error };
  }

  // Validate chain ID
  const chainIdValidation = validatePositiveNumber(config.chainId, 'chainId');
  if (!chainIdValidation.valid) {
    return { valid: false, error: chainIdValidation.error };
  }

  // Validate gas settings if present
  if (config.gas) {
    if (config.gas.gasLimit && config.gas.gasLimit < 21000) {
      return { valid: false, error: 'Gas limit must be at least 21000' };
    }
    
    if (config.gas.gasPrice) {
      const gasPrice = Number(config.gas.gasPrice);
      if (isNaN(gasPrice) || gasPrice <= 0) {
        return { valid: false, error: 'Gas price must be a positive number' };
      }
    }
  }

  return { valid: true, data: config };
} 