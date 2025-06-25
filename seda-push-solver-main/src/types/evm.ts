/**
 * EVM Network Types
 */

import type { HexString } from '../utils/hex';

export interface EvmGasConfig {
  gasLimit: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  useEIP1559: boolean;
}

export interface EvmNetworkConfig {
  name: string;
  displayName: string;
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  gas: EvmGasConfig;
  enabled: boolean;
  explorerUrl?: string;
}

export interface EvmBatch {
  batchHeight: bigint;
  blockHeight: bigint;
  validatorsRoot: HexString;
  resultsRoot: HexString;
  provingMetadata: HexString;
}

export interface ValidatorProof {
  signer: HexString;
  votingPower: number;
  merkleProof: HexString[];
}

export interface BatchPostingResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface NetworkBatchStatus {
  networkName: string;
  batchExists: boolean;
  lastBatchHeight: bigint | null;
  posted?: boolean;
  txHash?: string;
  error?: string;
  resultPosted?: boolean;
  resultTxHash?: string;
  resultError?: string;
  resultId?: string;
} 