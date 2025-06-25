/**
 * EVM Network Configuration
 */

import { getEnvVar, getEnvVarInt } from './environment';
import type { EvmNetworkConfig, EvmGasConfig } from '../types';

export const evmPrivateKey: string = getEnvVar('EVM_PRIVATE_KEY', '');

function parseGasConfig(prefix: string): EvmGasConfig {
  return {
    gasLimit: getEnvVarInt(`${prefix}_GAS_LIMIT`, 500000),
    gasPrice: process.env[`${prefix}_GAS_PRICE`],
    maxFeePerGas: process.env[`${prefix}_MAX_FEE_PER_GAS`],
    maxPriorityFeePerGas: process.env[`${prefix}_MAX_PRIORITY_FEE_PER_GAS`],
    useEIP1559: !!(process.env[`${prefix}_MAX_FEE_PER_GAS`] || process.env[`${prefix}_MAX_PRIORITY_FEE_PER_GAS`])
  };
}

export const evmNetworks: EvmNetworkConfig[] = (() => {
  const networks: EvmNetworkConfig[] = [];
  
  const knownNetworks = {
    BASE: 'Base',
    SUPERSEED_SEPOLIA: 'Superseed Sepolia'
  };
  
  for (const [prefix, displayName] of Object.entries(knownNetworks)) {
    const rpcUrl = process.env[`${prefix}_RPC_URL`];
    const contractAddress = process.env[`${prefix}_CONTRACT_ADDRESS`];
    const chainId = process.env[`${prefix}_CHAIN_ID`];
    const explorerUrl = process.env[`${prefix}_EXPLORER_URL`];
    
    if (rpcUrl && contractAddress && chainId) {
      networks.push({
        name: prefix.toLowerCase(),
        displayName,
        rpcUrl,
        chainId: parseInt(chainId),
        contractAddress,
        gas: parseGasConfig(prefix),
        enabled: process.env[`${prefix}_ENABLED`] !== 'false',
        explorerUrl
      });
    }
  }
  
  return networks;
})();

export function getEnabledEvmNetworks(): EvmNetworkConfig[] {
  return evmNetworks.filter(network => network.enabled);
}

export function getEvmNetwork(name: string): EvmNetworkConfig | undefined {
  return evmNetworks.find(network => network.name === name);
} 