/**
 * Scheduler Configuration Management
 * Handles loading and validation of scheduler configuration from environment and overrides
 */

import type { SchedulerConfig } from '../types';
import type { LoggingServiceInterface } from '../services';

// Default scheduler configuration - all timeouts should be overridden by environment variables
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enablePostCondition: process.env.SCHEDULER_ENABLE_POST_CONDITION ? process.env.SCHEDULER_ENABLE_POST_CONDITION.toLowerCase() === 'true' : true,
  intervalMs: process.env.SCHEDULER_INTERVAL_MS ? parseInt(process.env.SCHEDULER_INTERVAL_MS, 10) : 15000, // 15 seconds - optimized for efficient posting
  continuous: true, // Run continuously by default
  maxRetries: 3,
  memo: 'SEDA DataRequest',
  cosmosSequence: {
    postingTimeoutMs: parseInt(process.env.COSMOS_POSTING_TIMEOUT_MS!), // 20 seconds for posting transaction (fallback if env not set)
    drResultTimeout: parseInt(process.env.SEDA_DR_TIMEOUT_SECONDS!) * 1000, // 120 seconds for DataRequest results (fallback if env not set)
    maxQueueSize: 100 // Maximum 100 items in sequence queue (fallback if env not set)
  }
};

/**
 * Load scheduler configuration from environment variables
 */
export function loadSchedulerConfigFromEnv(): Partial<SchedulerConfig> {
  const config: Partial<SchedulerConfig> = {};

  // Basic scheduler settings
  if (process.env.SCHEDULER_INTERVAL_MS) {
    config.intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS, 10);
  }

  if (process.env.SCHEDULER_CONTINUOUS) {
    config.continuous = process.env.SCHEDULER_CONTINUOUS.toLowerCase() === 'true';
  }

  if (process.env.SCHEDULER_MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.SCHEDULER_MAX_RETRIES, 10);
  }

  if (process.env.SCHEDULER_MEMO) {
    config.memo = process.env.SCHEDULER_MEMO;
  }

  // Cosmos sequence configuration
  const cosmosSequence: Partial<SchedulerConfig['cosmosSequence']> = {};
  
  if (process.env.COSMOS_POSTING_TIMEOUT_MS) {
    cosmosSequence.postingTimeoutMs = parseInt(process.env.COSMOS_POSTING_TIMEOUT_MS, 10);
  }
  
  if (process.env.COSMOS_MAX_QUEUE_SIZE) {
    cosmosSequence.maxQueueSize = parseInt(process.env.COSMOS_MAX_QUEUE_SIZE, 10);
  }
  
  // Use SEDA_DR_TIMEOUT_SECONDS for DataRequest result timeout (same thing as cosmos result timeout)
  if (process.env.SEDA_DR_TIMEOUT_SECONDS) {
    cosmosSequence.drResultTimeout = parseInt(process.env.SEDA_DR_TIMEOUT_SECONDS, 10) * 1000; // Convert to ms
  }

  // Only add cosmosSequence if we have at least one value
  if (Object.keys(cosmosSequence).length > 0) {
    config.cosmosSequence = {
      ...DEFAULT_SCHEDULER_CONFIG.cosmosSequence,
      ...cosmosSequence
    };
  }

  return config;
}

/**
 * Build complete scheduler configuration by merging defaults, environment, and overrides
 */
export function buildSchedulerConfig(
  overrides: Partial<SchedulerConfig> = {}
): SchedulerConfig {
  const envConfig = loadSchedulerConfigFromEnv();
  
  return {
    ...DEFAULT_SCHEDULER_CONFIG,
    ...envConfig,
    ...overrides
  };
}

/**
 * Format scheduler configuration for display
 */
export function formatSchedulerConfig(config: SchedulerConfig, logger: LoggingServiceInterface): void {
  logger.info('🔧 SEDA DataRequest Scheduler Configuration:');
  logger.info(`   ⏱️  Interval: ${config.intervalMs / 1000}s`);
  logger.info(`   🔄 Continuous: ${config.continuous}`);
  logger.info(`   🔁 Max Retries: ${config.maxRetries}`);
  logger.info(`   📝 Memo: ${config.memo}`);
} 