/**
 * Core Application Types
 */

import type { HexString } from '../utils/hex';
export type { HexString };

// Logging types to replace any[] usage
export type LoggingArgs = Array<string | number | boolean | object | Error>;

// Network status types for hardcoded returns
export interface NetworkStatus {
  network: string;
  status: 'connected' | 'disconnected' | 'no prover address' | 'query failed' | string;
  lastBatch?: bigint;
}

export interface PostDataRequestResult {
  drId: string;
  blockHeight: bigint;
  txHash: string;
}

export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// EVM signature and proof types
export interface ProcessedSignature {
  signer: HexString;
  signature: HexString;
  votingPower: number;
  ethAddress: Buffer;
  ethereumSignature: HexString;
  proof: ValidatorProofData;
}

export interface ValidatorProofData {
  signer: HexString;
  votingPower: number;
  merkleProof: HexString[];
}

export interface DataRequestResult {
  drId: string;
  drBlockHeight: bigint;
  exitCode: number;
  gasUsed: bigint;
  result: string;
  paybackAddress: string;
  sedaPayload: string;
  version: string;
  blockTimestamp: bigint;
}

export interface SchedulerConfig {
  intervalMs: number;
  continuous: boolean;
  maxRetries: number;
  memo?: string;
  enablePostCondition: boolean; // Simple flag to enable/disable
  cosmosSequence: {
    postingTimeoutMs: number;
    drResultTimeout: number;
    maxQueueSize: number;
  };
}

export interface SchedulerStats {
  totalRequests: number;
  postedRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  startTime: number;
  lastRequestTime?: Date;
  activeTasks?: number;
  memoGenerator?: {
    uptimeMs: number;
  };
  sequenceCoordinator?: {
    queueSize: number;
    isProcessing: boolean;
    nextSequenceNumber: number;
  };
  errors: Array<{ message: string; timestamp: Date }>;
} 