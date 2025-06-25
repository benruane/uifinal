/**
 * Mock Config Service for Testing
 * Extracted from production source to tests/mocks
 */

import type { ConfigServiceInterface } from '../../src/services/config-service';
import type { SedaConfig, SchedulerConfig, NetworkType } from '../../src/types';

/**
 * Mock implementation for testing
 */
export class MockConfigService implements ConfigServiceInterface {
  private mockEnvVars: Map<string, string> = new Map();

  /**
   * Set mock environment variable for testing
   */
  setMockEnvVar(key: string, value: string): void {
    this.mockEnvVars.set(key, value);
  }

  /**
   * Clear all mock environment variables
   */
  clearMockEnvVars(): void {
    this.mockEnvVars.clear();
  }

  getEnvVar(key: string): string | undefined {
    return this.mockEnvVars.get(key);
  }

  getEnvVarWithDefault(key: string, defaultValue: string): string {
    return this.mockEnvVars.get(key) || defaultValue;
  }

  getEnvVarAsNumber(key: string): number | undefined {
    const value = this.mockEnvVars.get(key);
    if (!value) return undefined;
    
    const num = parseInt(value);
    return isNaN(num) ? undefined : num;
  }

  getEnvVarAsBoolean(key: string): boolean | undefined {
    const value = this.mockEnvVars.get(key);
    if (!value) return undefined;
    
    return value.toLowerCase() === 'true';
  }

  loadSEDAConfig(): SedaConfig {
    const network = this.getEnvVarWithDefault('SEDA_NETWORK', 'testnet') as NetworkType;
    const mnemonic = this.getEnvVar('SEDA_MNEMONIC') || 'mock-mnemonic';

    return {
      network,
      rpcEndpoint: this.getEnvVarWithDefault('SEDA_RPC_ENDPOINT', 'https://rpc.testnet.seda.xyz'),
      mnemonic,
      oracleProgramId: 'mock-oracle-program-id',
      drTimeoutSeconds: 60,
      drPollingIntervalSeconds: 1,
      scheduler: {
        intervalMs: 15000,
        continuous: true,
        maxRetries: 3,
        memo: 'Mock DataRequest'
      },
      cosmos: {
        postingTimeoutMs: 20000,
        maxQueueSize: 100
      },
      logging: {
        level: 'info' as const
      }
    };
  }

  loadSchedulerConfig(): Partial<SchedulerConfig> {
    const config: Partial<SchedulerConfig> = {};
    
    const intervalSeconds = this.getEnvVarAsNumber('SCHEDULER_INTERVAL_SECONDS');
    if (intervalSeconds && intervalSeconds > 0) {
      config.intervalMs = intervalSeconds * 1000;
    }
    
    const memo = this.getEnvVar('SCHEDULER_MEMO');
    if (memo) {
      config.memo = memo;
    }
    
    const maxRetries = this.getEnvVarAsNumber('SCHEDULER_MAX_RETRIES');
    if (maxRetries !== undefined && maxRetries >= 0) {
      config.maxRetries = maxRetries;
    }
    
    const continuous = this.getEnvVarAsBoolean('SCHEDULER_CONTINUOUS');
    if (continuous !== undefined) {
      config.continuous = continuous;
    }
    
    return config;
  }
} 