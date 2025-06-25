/**
 * SEDA Network Configuration
 * Consolidated configuration for all SEDA networks and data requests
 */

import { validateEnvironment, getEnvVar, getEnvVarInt, getEnvVarBool } from './environment';
import type { SedaConfig, NetworkConfig } from '../types';

validateEnvironment();

function getDefaultRpcEndpoint(network: string): string {
  const endpoints = {
    testnet: 'https://rpc.testnet.seda.xyz',
    mainnet: 'https://rpc.mainnet.seda.xyz',
    local: 'http://localhost:26657'
  };
  
  return endpoints[network as keyof typeof endpoints] || endpoints.testnet;
}

/**
 * Get Oracle Program ID from environment (required)
 */
function getRequiredOracleProgramId(): string {
  const programId = process.env.SEDA_ORACLE_PROGRAM_ID;
  if (!programId) {
    throw new Error('SEDA_ORACLE_PROGRAM_ID environment variable is required');
  }
  return programId;
}

// Network configurations for different SEDA environments
export const SEDA_NETWORKS: Record<'testnet' | 'mainnet' | 'local', NetworkConfig> = {
  testnet: {
    name: 'testnet',
    rpcEndpoint: 'https://rpc.testnet.seda.xyz',
    explorerEndpoint: 'https://testnet.explorer.seda.xyz',
    transaction: {
      gasPrice: BigInt(11_000_000_000),           // Transaction gas price for posting DataRequest
      gasLimit: 300000                    // Transaction gas limit for posting DataRequest
    },
    dataRequest: {
      oracleProgramId: getRequiredOracleProgramId(),
      replicationFactor: parseInt(process.env.SEDA_REPLICATION_FACTOR || '1', 10),
      execGasLimit: BigInt(150_000_000_000_000),  // Oracle execution gas limit
      gasPrice: BigInt(10_000),                   // Oracle execution gas price
      consensusOptions: { method: 'none' as const },
      timeoutSeconds: parseInt(process.env.SEDA_DR_TIMEOUT_SECONDS || '120', 10),
      pollingIntervalSeconds: parseInt(process.env.SEDA_DR_POLLING_INTERVAL_SECONDS || '1', 10),
      memo: 'DX Feed Oracle DataRequest',
      maxBatchRetries: parseInt(process.env.SEDA_MAX_BATCH_RETRIES || '10', 10),
      batchPollingIntervalMs: parseInt(process.env.SEDA_BATCH_POLLING_INTERVAL_MS || '3000', 10)
    }
  },
  
  mainnet: {
    name: 'mainnet',
    rpcEndpoint: 'https://rpc.seda.xyz',
    explorerEndpoint: 'https://explorer.seda.xyz',
    transaction: {
      gasPrice: BigInt(10_000_000_000),   // Transaction gas price for posting DataRequest
      gasLimit: 300000                    // Transaction gas limit for posting DataRequest
    },
    dataRequest: {
      oracleProgramId: getRequiredOracleProgramId(),
      replicationFactor: parseInt(process.env.SEDA_REPLICATION_FACTOR || '2', 10),
      execGasLimit: BigInt(10_000_000_000_000),   // Oracle execution gas limit
      gasPrice: BigInt(10_000_000_000),           // Oracle execution gas price
      consensusOptions: { method: 'none' as const },
      timeoutSeconds: parseInt(process.env.SEDA_DR_TIMEOUT_SECONDS || '120', 10),
      pollingIntervalSeconds: parseInt(process.env.SEDA_DR_POLLING_INTERVAL_SECONDS || '5', 10),
      memo: 'DX Feed Oracle DataRequest',
      maxBatchRetries: parseInt(process.env.SEDA_MAX_BATCH_RETRIES || '15', 10),
      batchPollingIntervalMs: parseInt(process.env.SEDA_BATCH_POLLING_INTERVAL_MS || '5000', 10)
    }
  },
  
  local: {
    name: 'local',
    rpcEndpoint: 'http://localhost:26657',
    explorerEndpoint: 'http://localhost:3000',
    transaction: {
      gasPrice: BigInt(10_000_000_000),   // Transaction gas price for posting DataRequest
      gasLimit: 300000                    // Transaction gas limit for posting DataRequest
    },
    dataRequest: {
      oracleProgramId: getRequiredOracleProgramId(),
      replicationFactor: parseInt(process.env.SEDA_REPLICATION_FACTOR || '1', 10),
      execGasLimit: BigInt(10_000_000_000_000),   // Oracle execution gas limit
      gasPrice: BigInt(10_000_000_000),           // Oracle execution gas price
      consensusOptions: { method: 'none' as const },
      timeoutSeconds: parseInt(process.env.SEDA_DR_TIMEOUT_SECONDS || '60', 10),
      pollingIntervalSeconds: parseInt(process.env.SEDA_DR_POLLING_INTERVAL_SECONDS || '3', 10),
      memo: process.env.SEDA_DR_MEMO || 'DX Feed Oracle DataRequest (Local)',
      maxBatchRetries: parseInt(process.env.SEDA_MAX_BATCH_RETRIES || '10', 10),
      batchPollingIntervalMs: parseInt(process.env.SEDA_BATCH_POLLING_INTERVAL_MS || '3000', 10)
    }
  }
};

/**
 * Get complete network configuration for a specific network
 */
export function getSedaNetworkConfig(network: keyof typeof SEDA_NETWORKS): NetworkConfig {
  const config = SEDA_NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  if (!config.dataRequest.oracleProgramId) {
    throw new Error(`Oracle Program ID not configured for network: ${network}`);
  }
  
  return config;
}

/**
 * Get RPC endpoint for a specific network
 */
export function getSedaRpcEndpoint(network: keyof typeof SEDA_NETWORKS): string {
  return getSedaNetworkConfig(network).rpcEndpoint;
}

/**
 * Get DataRequest configuration for a specific network
 */
export function getSedaDataRequestConfig(network: keyof typeof SEDA_NETWORKS) {
  return getSedaNetworkConfig(network).dataRequest;
}

/**
 * Log gas configuration for debugging
 */
export function logSedaGasConfiguration(network: 'testnet' | 'mainnet' | 'local', logger?: { info: (msg: string) => void }): void {
  const networkConfig = SEDA_NETWORKS[network];
  const txGasPrice = networkConfig.transaction.gasPrice;
  const txGasLimit = networkConfig.transaction.gasLimit;
  const execGasPrice = networkConfig.dataRequest.gasPrice;
  const execGasLimit = networkConfig.dataRequest.execGasLimit;
  
  const logFn = logger?.info || console.log;
  
  logFn(`⛽ Gas Configuration for ${network.toUpperCase()}:`);
  logFn(`   🔷 TRANSACTION GAS (for posting DataRequest):`);
  logFn(`      💰 Gas Price: ${txGasPrice.toString()} (${(Number(txGasPrice) / 1_000_000).toFixed(2)} uSEDA)`);
  logFn(`      🔥 Gas Limit: ${txGasLimit.toLocaleString()}`);
  logFn(`   🔶 EXECUTION GAS (for oracle execution):`);
  logFn(`      💰 Gas Price: ${execGasPrice.toString()} (${(Number(execGasPrice) / 1_000_000_000).toFixed(4)} SEDA)`);
  logFn(`      🔥 Gas Limit: ${execGasLimit.toString()} (${(Number(execGasLimit) / 1_000_000_000_000).toFixed(0)}T)`);
}

// Legacy environment-based config for backward compatibility
export const sedaConfig: SedaConfig = {
  network: getEnvVar('SEDA_NETWORK', 'testnet') as SedaConfig['network'],
  rpcEndpoint: getEnvVar('SEDA_RPC_ENDPOINT') || getDefaultRpcEndpoint(getEnvVar('SEDA_NETWORK', 'testnet')),
  mnemonic: getEnvVar('SEDA_MNEMONIC', ''),
  oracleProgramId: getEnvVar('SEDA_ORACLE_PROGRAM_ID', ''),
  drTimeoutSeconds: getEnvVarInt('SEDA_DR_TIMEOUT_SECONDS', 120),
  drPollingIntervalSeconds: getEnvVarInt('SEDA_DR_POLLING_INTERVAL_SECONDS', 5),
  scheduler: {
    intervalMs: getEnvVarInt('SCHEDULER_INTERVAL_MS', 15000),
    continuous: getEnvVarBool('SCHEDULER_CONTINUOUS', true),
    maxRetries: getEnvVarInt('SCHEDULER_MAX_RETRIES', 3),
    memo: getEnvVar('SCHEDULER_MEMO', 'SEDA DataRequest')
  },
  cosmos: {
    postingTimeoutMs: getEnvVarInt('COSMOS_POSTING_TIMEOUT_MS', 20000),
    maxQueueSize: getEnvVarInt('COSMOS_MAX_QUEUE_SIZE', 100)
  },
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info') as SedaConfig['logging']['level']
  }
};

/**
 * Load SEDA configuration from environment variables
 * Centralized function that replaces the old config-loader.ts
 */
export function loadSEDAConfig(): SedaConfig {
  return sedaConfig;
} 