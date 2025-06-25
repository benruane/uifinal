/**
 * SEDA DataRequest Scheduler
 * 
 * Provides scheduling functionality to continuously post DataRequests to the SEDA network
 * at regular intervals. Now uses a modular core for better maintainability.
 */

import { SEDADataRequestBuilder } from './core/data-request';
import { formatSchedulerConfig, buildSchedulerConfig } from './config';
import { SchedulerCore } from './core/scheduler/scheduler-core';
import type { SchedulerConfig, SchedulerStats } from './types';
import type { TimerServiceInterface, ProcessServiceInterface } from './infrastructure';
import type { LoggingService } from './services';
import { loadSEDAConfig } from './config';

/**
 * SEDA DataRequest Scheduler
 * 
 * Main scheduler interface that manages the automated posting of DataRequests to the SEDA network.
 * Now uses a modular core for better separation of concerns.
 */
export class SEDADataRequestScheduler {
  private core: SchedulerCore;
  private builder: SEDADataRequestBuilder;
  private config: SchedulerConfig;

  /**
   * Create a new scheduler instance
   * @param schedulerConfig Partial configuration to override defaults
   * @param logger Logging service for structured output
   * @param timerService Timer service for scheduling (defaults to production timer)
   * @param processService Process service for shutdown handling (defaults to production process)
   */
  constructor(
    schedulerConfig: Partial<SchedulerConfig> = {},
    private logger: LoggingService,
      private timerService?: TimerServiceInterface,
  private processService?: ProcessServiceInterface
  ) {
    // Build the complete configuration
    this.config = buildSchedulerConfig(schedulerConfig);
    
    // Initialize SEDA builder
    const sedaConfig = loadSEDAConfig();
    this.builder = new SEDADataRequestBuilder(sedaConfig, this.logger);
    
    // Initialize scheduler core
    this.core = new SchedulerCore(
      this.builder,
      schedulerConfig,
      this.logger,
      this.timerService
    );
    
    this.logInitialization(sedaConfig);
  }

  /**
   * Log initialization information
   */
  private logInitialization(sedaConfig: any): void {
    this.logger.info('\n┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                    🔧 Scheduler Initialized                         │');
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    this.logger.info(`│ Network: ${sedaConfig.network.toUpperCase()}`);
    this.logger.info(`│ RPC Endpoint: ${sedaConfig.rpcEndpoint}`);
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
    formatSchedulerConfig(this.config, this.logger);
  }

  /**
   * Initialize the scheduler (set up signer and core components)
   */
  async initialize(): Promise<void> {
    this.logger.info('\n🔐 Initializing SEDA signer...');
    await this.builder.initialize();
    
    await this.core.initialize();
    this.logger.info('✅ Scheduler initialization complete\n');
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    this.logger.info('┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                    🚀 SEDA DataRequest Scheduler                    │');
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    this.logger.info(`│ Status: Starting scheduler...`);
    this.logger.info(`│ Start Time: ${new Date().toISOString()}`);
    this.logger.info(`│ Interval: ${(this.config.intervalMs / 1000)}s`);
    this.logger.info(`│ Mode: ${this.config.continuous ? 'Continuous' : 'Single'}`);
    this.logger.info(`│ Max Retries: ${this.config.maxRetries}`);
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
    
    await this.core.start();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.logger.info('\n┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                      🛑 Stopping Scheduler                         │');
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
    
    this.core.stop();
  }

  /**
   * Get current statistics
   */
  getStats(): SchedulerStats {
    return this.core.getStats();
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.core.isSchedulerRunning();
  }

  /**
   * Get count of active async tasks
   */
  getActiveTaskCount(): number {
    return this.core.getActiveTaskCount();
  }

  /**
   * Wait for all active tasks to complete (useful for testing or shutdown)
   */
  async waitForAllTasks() {
    return this.core.waitForAllTasks();
  }

  /**
   * Get all DataRequest details (active and completed)
   */
  getAllDataRequests() {
    return this.core.getAllDataRequests();
  }

  /**
   * Get only active DataRequest details
   */
  getActiveDataRequests() {
    return this.core.getActiveDataRequests();
  }

  /**
   * Get DataRequest details by task ID
   */
  getDataRequest(taskId: string) {
    return this.core.getDataRequest(taskId);
  }

  /**
   * Get DataRequest details by status
   */
  getDataRequestsByStatus(status: 'posting' | 'posted' | 'completed' | 'failed') {
    return this.core.getDataRequestsByStatus(status);
  }
}

/**
 * Create and start a scheduler with environment-based configuration
 */
export async function startScheduler(
  overrides: Partial<SchedulerConfig> = {},
  timerService?: TimerServiceInterface,
  processService?: ProcessServiceInterface
): Promise<SEDADataRequestScheduler> {
  // Use injected services or create defaults
  const { ServiceContainer } = await import('./services');
  const services = ServiceContainer.createProduction();
  const logger = services.loggingService;

  // Create scheduler with configuration loaded from environment and overrides
  const scheduler = new SEDADataRequestScheduler(overrides, logger, timerService, processService);

  // Initialize and start
  await scheduler.initialize();
  await scheduler.start();

  // Graceful shutdown handling
  if (processService) {
    // Use process service for shutdown handling
    processService.onShutdown(async () => {
      logger.info('\n🔔 Shutting down scheduler gracefully...');
      scheduler.stop();
    });
    processService.startSignalHandling();
  } else {
    // Fallback to direct process handling
    process.on('SIGINT', () => {
      logger.info('\n🔔 Received SIGINT, shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('\n🔔 Received SIGTERM, shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });
  }

  return scheduler;
} 