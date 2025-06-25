/**
 * SEDA Network Types
 */

export type NetworkType = 'testnet' | 'mainnet' | 'local';

// Consensus options type to replace any
export interface ConsensusOptions {
  method: 'none' | 'simple' | 'weighted';
  threshold?: number;
  weights?: Record<string, number>;
}

// Legacy interface removed - use SedaConfig instead

export interface SEDADataRequestConfig {
  oracleProgramId: string;
  replicationFactor: number;
  execGasLimit: bigint;
  gasPrice: bigint;
  consensusOptions: ConsensusOptions;
  timeoutSeconds: number;
  pollingIntervalSeconds: number;
  memo: string;
  maxBatchRetries: number;
  batchPollingIntervalMs: number;
}

export interface DataRequestOptions {
  memo?: string;
  customTimeout?: number;
}

export interface SedaConfig {
  network: 'testnet' | 'mainnet' | 'local';
  rpcEndpoint: string;
  mnemonic: string;
  oracleProgramId: string;
  drTimeoutSeconds: number;
  drPollingIntervalSeconds: number;
  scheduler: {
    intervalMs: number;
    continuous: boolean;
    maxRetries: number;
    memo: string;
  };
  cosmos: {
    postingTimeoutMs: number;
    maxQueueSize: number;
  };
  logging: {
    level: 'info' | 'warn' | 'error' | 'debug';
  };
}



export interface NetworkConfig {
  name: string;
  rpcEndpoint: string;
  explorerEndpoint?: string;
  transaction: {
    gasPrice: bigint;
    gasLimit: number;
  };
  dataRequest: {
    oracleProgramId: string;
    replicationFactor: number;
    execGasLimit: bigint;
    gasPrice: bigint;
    consensusOptions: ConsensusOptions;
    timeoutSeconds: number;
    pollingIntervalSeconds: number;
    memo: string;
    maxBatchRetries: number;
    batchPollingIntervalMs: number;
  };
} 