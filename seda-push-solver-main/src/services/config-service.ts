/**
 * Configuration Service Interface
 * Abstracts environment variable access and configuration loading for better testability
 */

import type { SedaConfig, SchedulerConfig, NetworkType } from '../types';

/**
 * Interface for configuration operations
 * Allows mocking environment variables and configuration loading
 */
export interface ConfigServiceInterface {
  /**
   * Get environment variable value
   */
  getEnvVar(key: string): string | undefined;

  /**
   * Get environment variable with default value
   */
  getEnvVarWithDefault(key: string, defaultValue: string): string;

  /**
   * Get environment variable as number
   */
  getEnvVarAsNumber(key: string): number | undefined;

  /**
   * Get environment variable as boolean
   */
  getEnvVarAsBoolean(key: string): boolean | undefined;

  /**
   * Load SEDA configuration from environment
   */
  loadSEDAConfig(): SedaConfig;

  /**
   * Load scheduler configuration from environment
   */
  loadSchedulerConfig(): Partial<SchedulerConfig>;
}

/**
 * Production implementation using centralized configuration utilities
 */
export class ConfigService implements ConfigServiceInterface {
  getEnvVar(key: string): string | undefined {
    return process.env[key];
  }

  getEnvVarWithDefault(key: string, defaultValue: string): string {
    const { getEnvVar } = require('../config/environment');
    return getEnvVar(key, defaultValue);
  }

  getEnvVarAsNumber(key: string): number | undefined {
    const { getEnvVarInt } = require('../config/environment');
    try {
      return getEnvVarInt(key);
    } catch {
      return undefined;
    }
  }

  getEnvVarAsBoolean(key: string): boolean | undefined {
    const { getEnvVarBool } = require('../config/environment');
    try {
      return getEnvVarBool(key);
    } catch {
      return undefined;
    }
  }

  loadSEDAConfig(): SedaConfig {
    // Use the centralized config function
    const { loadSEDAConfig } = require('../config');
    return loadSEDAConfig();
  }

  loadSchedulerConfig(): Partial<SchedulerConfig> {
    // Use the centralized scheduler config function
    const { loadSchedulerConfigFromEnv } = require('../config');
    return loadSchedulerConfigFromEnv();
  }
}

 