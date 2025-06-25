/**
 * Gas Estimator
 * Utilities for estimating and managing gas for transactions
 */

import type { EvmNetworkConfig } from '../../types';
import { createEvmClients } from './evm-transaction-builder';

/**
 * Gas estimation result
 */
export interface GasEstimation {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: bigint;
}

/**
 * Gas estimation options
 */
export interface GasEstimationOptions {
  buffer?: number; // Percentage buffer (e.g., 1.2 for 20% buffer)
  maxGasPrice?: bigint;
  priorityFee?: bigint;
}

/**
 * Estimate gas for EVM contract call
 */
export async function estimateEvmGas(
  network: EvmNetworkConfig,
  privateKey: string,
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[] = [],
  options: GasEstimationOptions = {}
): Promise<GasEstimation> {
  const { publicClient, account } = createEvmClients(network, privateKey);
  const buffer = options.buffer || 1.2;

  try {
    // Estimate gas limit
    const estimatedGas = await publicClient.estimateContractGas({
      account,
      address: contractAddress as `0x${string}`,
      abi,
      functionName,
      args
    });

    // Apply buffer to gas limit
    const gasLimit = BigInt(Math.ceil(Number(estimatedGas) * buffer));

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();
    
    // Apply max gas price if specified
    const finalGasPrice = options.maxGasPrice 
      ? gasPrice > options.maxGasPrice ? options.maxGasPrice : gasPrice
      : gasPrice;

    // Calculate total cost
    const totalCost = gasLimit * finalGasPrice;

    // Check if network supports EIP-1559
    const feeData = await getFeeData(publicClient);
    
    return {
      gasLimit,
      gasPrice: finalGasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      totalCost
    };

  } catch (error) {
    // Fallback to default gas values
    const fallbackGasLimit = BigInt(300000);
    const fallbackGasPrice = await publicClient.getGasPrice();
    
    return {
      gasLimit: fallbackGasLimit,
      gasPrice: fallbackGasPrice,
      totalCost: fallbackGasLimit * fallbackGasPrice
    };
  }
}

/**
 * Get fee data for EIP-1559 transactions
 */
async function getFeeData(publicClient: any): Promise<{
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}> {
  try {
    const feeHistory = await publicClient.getFeeHistory({
      blockCount: 4,
      rewardPercentiles: [25, 50, 75]
    });

    if (feeHistory.baseFeePerGas && feeHistory.baseFeePerGas.length > 0) {
      const latestBaseFee = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
      const avgPriorityFee = calculateAveragePriorityFee(feeHistory.reward);
      
      return {
        maxFeePerGas: latestBaseFee * 2n + avgPriorityFee,
        maxPriorityFeePerGas: avgPriorityFee
      };
    }
  } catch {
    // Fallback if EIP-1559 not supported
  }

  return {};
}

/**
 * Calculate average priority fee from fee history
 */
function calculateAveragePriorityFee(rewards: bigint[][]): bigint {
  if (!rewards || rewards.length === 0) {
    return BigInt(2_000_000_000); // 2 gwei default
  }

  let total = 0n;
  let count = 0;

  for (const blockRewards of rewards) {
    if (blockRewards && blockRewards.length > 0) {
      // Use 50th percentile (median)
      const median = blockRewards[1] || blockRewards[0];
      if (median !== undefined) {
        total += median;
      }
      count++;
    }
  }

  return count > 0 ? total / BigInt(count) : BigInt(2_000_000_000);
}

/**
 * Estimate Cosmos gas (simplified)
 */
export function estimateCosmosGas(
  operationType: 'postDataRequest' | 'transfer' | 'delegate' | 'custom',
  complexity: 'low' | 'medium' | 'high' = 'medium'
): { gasLimit: number; gasPrice: string } {
  const baseGas = {
    postDataRequest: { low: 800_000, medium: 1_000_000, high: 1_500_000 },
    transfer: { low: 100_000, medium: 150_000, high: 200_000 },
    delegate: { low: 200_000, medium: 300_000, high: 400_000 },
    custom: { low: 500_000, medium: 1_000_000, high: 2_000_000 }
  };

  const gasLimit = baseGas[operationType][complexity];
  const gasPrice = '100000000000aseda'; // 0.1 SEDA

  return { gasLimit, gasPrice };
}

/**
 * Calculate transaction cost in native currency
 */
export function calculateTransactionCost(
  gasLimit: bigint,
  gasPrice: bigint,
  decimals: number = 18
): { wei: bigint; formatted: string } {
  const totalWei = gasLimit * gasPrice;
  const formatted = formatUnits(totalWei, decimals);
  
  return {
    wei: totalWei,
    formatted
  };
}

/**
 * Format units for display (simplified version)
 */
function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  
  return trimmed ? `${quotient}.${trimmed}` : quotient.toString();
} 