/**
 * Mock Config Loader for Testing
 * Provides test configuration without requiring environment variables
 */

import type { SedaConfig, NetworkType } from '../../src/types';

/**
 * Mock SEDA configuration for testing
 */
export function createMockSEDAConfig(overrides: Partial<SedaConfig> = {}): SedaConfig {
  // Use a mock version of the centralized config
  const mockConfig: SedaConfig = {
    network: 'testnet' as NetworkType,
    rpcEndpoint: 'https://rpc.testnet.seda.xyz',
    mnemonic: 'test mnemonic for testing purposes only',
    oracleProgramId: getMockOracleProgramId(),
    drTimeoutSeconds: 60,
    drPollingIntervalSeconds: 1,
    scheduler: {
      intervalMs: 15000,
      continuous: true,
      maxRetries: 3,
      memo: 'Test DataRequest'
    },
    cosmos: {
      postingTimeoutMs: 20000,
      maxQueueSize: 100
    },
    logging: {
      level: 'info' as const
    }
  };
  
  return {
    ...mockConfig,
    ...overrides
  };
}

/**
 * Mock Oracle Program ID for testing
 */
export function getMockOracleProgramId(): string {
  return 'test-oracle-program-id-for-testing-only';
}

/**
 * Set up mock environment variables for testing
 */
export function setupMockEnvironment(): void {
  process.env.SEDA_ORACLE_PROGRAM_ID = getMockOracleProgramId();
  process.env.SEDA_MNEMONIC = 'test mnemonic for testing purposes only';
  process.env.SEDA_NETWORK = 'testnet';
}

/**
 * Clean up mock environment variables after testing
 */
export function cleanupMockEnvironment(): void {
  delete process.env.SEDA_ORACLE_PROGRAM_ID;
  delete process.env.SEDA_MNEMONIC;
  delete process.env.SEDA_NETWORK;
} 