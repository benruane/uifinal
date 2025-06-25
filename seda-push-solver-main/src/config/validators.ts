/**
 * Configuration Validators
 * Consolidated validation functions for all configuration types
 */

import type { NetworkConfig, EvmNetworkConfig } from '../types';

/**
 * Validate SEDA network configuration
 */
export function validateSedaNetworkConfig(config: NetworkConfig, networkName: string): void {
  if (!config.name) {
    throw new Error(`Network name is required for ${networkName}`);
  }

  if (!config.rpcEndpoint) {
    throw new Error(`RPC endpoint is required for ${networkName}`);
  }

  if (!config.dataRequest.oracleProgramId) {
    throw new Error(`Oracle Program ID is required for ${networkName}`);
  }

  if (config.dataRequest.replicationFactor < 1) {
    throw new Error(`Replication factor must be at least 1 for ${networkName}`);
  }

  if (config.dataRequest.timeoutSeconds < 1) {
    throw new Error(`Timeout must be at least 1 second for ${networkName}`);
  }

  if (config.dataRequest.pollingIntervalSeconds < 1) {
    throw new Error(`Polling interval must be at least 1 second for ${networkName}`);
  }
}

/**
 * Validate EVM network configuration
 */
export function validateEvmNetworkConfig(config: EvmNetworkConfig): void {
  if (!config.name) {
    throw new Error('EVM network name is required');
  }

  if (!config.rpcUrl) {
    throw new Error(`RPC URL is required for ${config.name}`);
  }

  if (!config.contractAddress) {
    throw new Error(`Contract address is required for ${config.name}`);
  }

  if (!config.chainId || config.chainId < 1) {
    throw new Error(`Valid chain ID is required for ${config.name}`);
  }

  if (config.gas.gasLimit < 21000) {
    throw new Error(`Gas limit must be at least 21000 for ${config.name}`);
  }
} 