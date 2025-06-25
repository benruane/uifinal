/**
 * EVM Transaction Builder
 * Utilities for building and executing EVM transactions
 */

import {
  http,
  createPublicClient,
  createWalletClient,
  type Hex,
  type Chain
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { EvmNetworkConfig } from '../../types';
import type { HexString } from '../hex';

/**
 * EVM transaction configuration
 */
export interface EvmTransactionConfig {
  to: string;
  abi: any[];
  functionName: string;
  args: any[];
  value?: bigint;
}

/**
 * EVM transaction result
 */
export interface EvmTransactionResult {
  txHash: string;
  blockNumber?: bigint;
  gasUsed?: bigint;
}

/**
 * Create EVM chain configuration from network config
 */
export function createEvmChain(network: EvmNetworkConfig): Chain {
  return {
    id: network.chainId,
    name: network.displayName,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [network.rpcUrl] } }
  };
}

/**
 * Create EVM clients for transaction execution
 */
export function createEvmClients(network: EvmNetworkConfig, privateKey: string) {
  const formattedPrivateKey = formatPrivateKey(privateKey);
  const account = privateKeyToAccount(formattedPrivateKey);
  const chain = createEvmChain(network);

  const publicClient = createPublicClient({
    chain,
    transport: http(network.rpcUrl)
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(network.rpcUrl)
  });

  return { publicClient, walletClient, account };
}

/**
 * Execute EVM contract transaction with simulation
 */
export async function executeEvmTransaction(
  network: EvmNetworkConfig,
  privateKey: string,
  config: EvmTransactionConfig
): Promise<EvmTransactionResult> {
  const { publicClient, walletClient, account } = createEvmClients(network, privateKey);

  // Simulate the transaction first
  await publicClient.simulateContract({
    account,
    address: config.to as `0x${string}`,
    abi: config.abi,
    functionName: config.functionName,
    args: config.args,
    value: config.value
  });

  // Execute the transaction
  const txHash = await walletClient.writeContract({
    address: config.to as `0x${string}`,
    abi: config.abi,
    functionName: config.functionName,
    args: config.args,
    value: config.value
  });

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed
  };
}

/**
 * Read from EVM contract
 */
export async function readEvmContract<T>(
  network: EvmNetworkConfig,
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[] = []
): Promise<T> {
  const publicClient = createPublicClient({
    chain: createEvmChain(network),
    transport: http(network.rpcUrl)
  });

  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args
  });

  return result as T;
}

/**
 * Format private key with 0x prefix and validation
 */
export function formatPrivateKey(privateKey: string): `0x${string}` {
  // Remove any existing 0x prefix and whitespace
  const keyWithoutPrefix = privateKey.replace(/^0x/, '').trim();
  
  // Validate hex format (64 characters for 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(keyWithoutPrefix)) {
    throw new Error('Invalid private key format. Expected 64 hex characters.');
  }
  
  return `0x${keyWithoutPrefix}`;
}

/**
 * Add 0x prefix to hex string
 */
export function add0x(input: string): Hex {
  if (input.startsWith('0x')) return input as Hex;
  return `0x${input}` as Hex;
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