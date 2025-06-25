/**
 * SEDA DataRequest Scheduler Core
 * Core scheduling logic separated from the main scheduler interface
 */

import { 
  buildSchedulerConfig
} from '../../config';
import {
  SchedulerStatistics,
  TaskManager,
  SchedulerTaskCompletionHandler
} from './index';
import type { SchedulerConfig } from '../../types';
import type { TimerServiceInterface, TimerId } from '../../infrastructure';
import type { LoggingService } from '../../services';
import type { SEDADataRequestBuilder } from '../data-request';
import { postCondition } from './post-condition';

/**
 * Core scheduler implementation focused on the scheduling logic
 */
export class SchedulerCore {
  private config: SchedulerConfig;
  private isRunning: boolean = false;
  private intervalId: TimerId | null = null;
  private tickerIntervalId: TimerId | null = null;
  private statistics: SchedulerStatistics;
  private taskManager: TaskManager;
  private completionHandler: SchedulerTaskCompletionHandler;
  private nextPostTime: number = 0;
  private postCount: number = 0;

  constructor(
    private builder: SEDADataRequestBuilder,
    schedulerConfig: Partial<SchedulerConfig>,
    private logger: LoggingService,
    private timerService?: TimerServiceInterface
  ) {
    this.config = buildSchedulerConfig(schedulerConfig);
    this.statistics = new SchedulerStatistics();
    
    // Initialize task management
    this.taskManager = new TaskManager(
      this.logger,
      this.config.cosmosSequence,
      this.timerService?.now.bind(this.timerService) || Date.now
    );
    
    // Initialize task completion handler
    this.completionHandler = new SchedulerTaskCompletionHandler(
      this.logger,
      this.statistics,
      this.config,
      () => this.isRunning,
      () => this.taskManager.getActiveTaskCount(),
      this.timerService
    );
  }

  /**
   * Initialize the scheduler core
   */
  async initialize(): Promise<void> {
    this.logger.info('🔢 Initializing sequence coordinator with account sequence...');
    await this.taskManager.initialize(this.builder);
    this.logger.info('✅ Scheduler core initialization complete');
  }

  /**
   * Start the core scheduling logic
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('⚠️  Scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.statistics.reset();

    // Launch first async task immediately (non-blocking)
    await this.checkConditionAndPost();
    this.postCount = 1;
    this.nextPostTime = (this.timerService?.now() || Date.now()) + this.config.intervalMs;

    if (this.config.continuous) {
      this.startContinuousMode();
    } else {
      await this.runSingleMode();
    }
  }

  /**
   * Start continuous scheduling mode
   */
  private startContinuousMode(): void {
    // Schedule subsequent requests using timer service
    if (this.timerService) {
      this.intervalId = this.timerService.setInterval(async () => {
        if (this.isRunning) {
          await this.checkConditionAndPost();
          this.postCount++;
          this.nextPostTime = (this.timerService?.now() || Date.now()) + this.config.intervalMs;
        }
      }, this.config.intervalMs);
    } else {
      // Fallback to built-in setInterval
      this.intervalId = setInterval(async () => {
        if (this.isRunning) {
          await this.checkConditionAndPost();
          this.postCount++;
          this.nextPostTime = Date.now() + this.config.intervalMs;
        }
      }, this.config.intervalMs) as unknown as TimerId;
    }

    // Start countdown ticker
    this.startCountdownTicker();

    this.logger.info(`\n🔄 Scheduler running continuously (${this.config.intervalMs / 1000}s intervals)`);
    this.logger.info('   Press Ctrl+C to stop gracefully');
    this.logger.info('   🚀 Each interval tick launches a new async DataRequest task');
  }

  /**
   * Run single scheduling mode
   */
  private async runSingleMode(): Promise<void> {
    this.logger.info('\n✅ Single DataRequest mode - stopping after completion');
    // Wait for the single task to complete, then stop
    await this.taskManager.waitForAllTasks();
    this.stop();
  }

  /**
   * Stop the scheduler core
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('⚠️  Scheduler is not running');
      return;
    }

    this.isRunning = false;
    
    // Clear main interval
    if (this.intervalId) {
      if (this.timerService) {
        this.timerService.clearInterval(this.intervalId);
      } else {
        clearInterval(this.intervalId);
      }
      this.intervalId = null;
    }

    // Clear ticker interval
    if (this.tickerIntervalId) {
      if (this.timerService) {
        this.timerService.clearInterval(this.tickerIntervalId);
      } else {
        clearInterval(this.tickerIntervalId);
      }
      this.tickerIntervalId = null;
    }

    // Log active tasks that are still running
    const activeTasks = this.taskManager.getActiveTaskCount();
    if (activeTasks > 0) {
      this.logger.info(`⏳ ${activeTasks} async tasks still running, they will complete in the background`);
    }

    this.statistics.printReport(this.logger);
    
    // Log performance summary
    this.taskManager.logPerformanceSummary();
    
    this.logger.info('✅ Scheduler stopped gracefully');
  }

  /**
   * Check post condition and launch DataRequest if condition passes
   */
  private async checkConditionAndPost(): Promise<void> {
    if (!this.isRunning) return;

    // Skip condition check if disabled
    if (!this.config.enablePostCondition) {
      this.launchAsyncDataRequest();
      return;
    }

    // Check condition
    const shouldPost = await postCondition();

    if (shouldPost) {
      this.launchAsyncDataRequest();
    } else {
      this.logger.info(`⏭️  Condition check failed, skipping this tick...`);
    }
  }

  /**
   * Launch a new async DataRequest task (non-blocking)
   */
  private launchAsyncDataRequest(): void {
    if (!this.isRunning) return;

    this.taskManager.queueTask(
      this.builder,
      this.config,
      () => this.isRunning,
      this.completionHandler,
      this.statistics
    );
  }

  /**
   * Start countdown ticker
   */
  private startCountdownTicker(): void {
    if (this.timerService) {
      this.tickerIntervalId = this.timerService.setInterval(() => {
        if (this.isRunning) {
          this.logCountdown();
        }
      }, 1000); // Log every second
    } else {
      // Fallback to built-in setInterval
      this.tickerIntervalId = setInterval(() => {
        if (this.isRunning) {
          this.logCountdown();
        }
      }, 1000) as unknown as TimerId;
    }
  }

  /**
   * Log countdown to next DataRequest post with detailed status
   */
  private logCountdown(): void {
    const now = this.timerService?.now() || Date.now();
    const secondsLeft = Math.max(0, Math.ceil((this.nextPostTime - now) / 1000));
    
    if (secondsLeft > 0) {
      const stats = this.getStats();
      const successRate = stats.totalRequests > 0 ? 
        `${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(0)}%` : '0%';
      
      const failedRequests = this.taskManager.getDataRequestsByStatus('failed');
      
      // Show detailed status with DataRequest information
      this.logger.info(
        `⏰ Next DataRequest post in: ${secondsLeft}s | ` +
        `🔄 Active: ${stats.activeTasks || 0} | ` +
        `📤 Posted: ${stats.postedRequests} | ` +
        `✅ Success: ${stats.successfulRequests} (${successRate}) | ` +
        `❌ Failed: ${failedRequests.length} | ` +
        `🔢 Queue: ${stats.sequenceCoordinator?.queueSize || 0}`
      );
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    const baseStats = this.statistics.getStats();
    const memoStats = this.taskManager.getMemoGeneratorStats();
    const sequenceStats = this.taskManager.getSequenceCoordinatorStats();
    
    return {
      ...baseStats,
      activeTasks: this.taskManager.getActiveTaskCount(),
      memoGenerator: {
        uptimeMs: memoStats.uptimeMs
      },
      sequenceCoordinator: {
        queueSize: sequenceStats.queueSize,
        isProcessing: sequenceStats.isProcessing,
        nextSequenceNumber: sequenceStats.nextSequenceNumber
      }
    };
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get count of active async tasks
   */
  getActiveTaskCount(): number {
    return this.taskManager.getActiveTaskCount();
  }

  /**
   * Wait for all active tasks to complete
   */
  async waitForAllTasks() {
    return this.taskManager.waitForAllTasks();
  }

  /**
   * Get all DataRequest details (active and completed)
   */
  getAllDataRequests() {
    return this.taskManager.getAllDataRequests();
  }

  /**
   * Get only active DataRequest details
   */
  getActiveDataRequests() {
    return this.taskManager.getActiveDataRequests();
  }

  /**
   * Get DataRequest details by task ID
   */
  getDataRequest(taskId: string) {
    return this.taskManager.getDataRequest(taskId);
  }

  /**
   * Get DataRequest details by status
   */
  getDataRequestsByStatus(status: 'posting' | 'posted' | 'completed' | 'failed') {
    return this.taskManager.getDataRequestsByStatus(status);
  }
} 