/**
 * Prover Discovery
 * Handles discovery of prover contract addresses on EVM networks
 */

import { http, createPublicClient } from 'viem';
import type { EvmNetworkConfig } from '../../config';
import type { LoggingServiceInterface } from '../services';
import { I_SEDA_CORE } from './abi/i-seda-core.abi';
import { I_PROVER } from './abi/i-prover.abi';

// Cache for discovered prover contract addresses
const proverAddressCache = new Map<string, string>();

/**
 * Discovery service for prover contract addresses
 */
export class ProverDiscovery {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Discover the prover contract address for a specific EVM network
   */
  async discoverProverAddress(network: EvmNetworkConfig): Promise<string | null> {
    const cacheKey = `${network.name}-${network.contractAddress}`;
    
    // Check cache first
    const cached = proverAddressCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      this.logger.info(`🔍 Discovering prover contract address for ${network.displayName}...`);
      
      // Create public client for this network
      const transport = http(network.rpcUrl);
      const publicClient = createPublicClient({ transport });
      
      // Call getSedaProver on the SEDA Core contract
      const proverAddress = await publicClient.readContract({
        address: network.contractAddress as `0x${string}`,
        abi: I_SEDA_CORE,
        functionName: 'getSedaProver',
        args: []
      }) as string;
      
      // Cache the discovered address
      proverAddressCache.set(cacheKey, proverAddress);
      
      this.logger.info(`✅ ${network.displayName}: Discovered prover contract at ${proverAddress}`);
      
      return proverAddress;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`⚠️ Failed to discover prover address for ${network.displayName}: ${errorMsg}`);
      return null;
    }
  }

  /**
   * Get the last batch height from a prover contract
   */
  async getLastBatchHeight(network: EvmNetworkConfig, proverAddress: string): Promise<bigint | null> {
    try {
      // Create public client for this network
      const transport = http(network.rpcUrl);
      const publicClient = createPublicClient({ transport });
      
      // Get the last batch height from the prover contract
      const lastBatchHeight = await publicClient.readContract({
        address: proverAddress as `0x${string}`,
        abi: I_PROVER,
        functionName: 'getLastBatchHeight',
        args: []
      }) as bigint;
      
      return lastBatchHeight;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`⚠️ Failed to get last batch height from ${network.displayName}: ${errorMsg}`);
      return null;
    }
  }

  /**
   * Clear the prover address cache
   */
  clearCache(): void {
    proverAddressCache.clear();
    this.logger.info('🧹 Prover address cache cleared');
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return proverAddressCache.size;
  }

  /**
   * Get cached prover address if available
   */
  getCachedProverAddress(network: EvmNetworkConfig): string | null {
    const cacheKey = `${network.name}-${network.contractAddress}`;
    return proverAddressCache.get(cacheKey) || null;
  }
} 