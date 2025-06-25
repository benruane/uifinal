/**
 * Process Management Service
 * Abstracts process lifecycle, signal handling, and graceful shutdown
 */

import type { LoggingService } from '../services';

/**
 * Process information interface
 */
export interface ProcessInfo {
  pid: number;
  uptime: number;
  platform: string;
  nodeVersion: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

/**
 * Interface for process management operations
 */
export interface ProcessServiceInterface {
  /**
   * Register a shutdown handler that will be called on graceful shutdown
   */
  onShutdown(handler: () => Promise<void> | void): void;

  /**
   * Initiate graceful shutdown
   */
  gracefulShutdown(exitCode?: number): Promise<void>;

  /**
   * Check if the process is currently shutting down
   */
  isShuttingDown(): boolean;

  /**
   * Get current process information
   */
  getProcessInfo(): ProcessInfo;

  /**
   * Start listening for shutdown signals
   */
  startSignalHandling(): void;

  /**
   * Stop listening for shutdown signals
   */
  stopSignalHandling(): void;
}

/**
 * Production process service implementation
 */
export class ProcessService implements ProcessServiceInterface {
  private shutdownHandlers: Array<() => Promise<void> | void> = [];
  private isShuttingDownFlag = false;
  private signalHandlersActive = false;
  private startTime = Date.now();

  constructor(private loggingService: LoggingService) {}

  onShutdown(handler: () => Promise<void> | void): void {
    this.shutdownHandlers.push(handler);
  }

  async gracefulShutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDownFlag) {
      this.loggingService.warn('⚠️  Graceful shutdown already in progress');
      return;
    }

    this.isShuttingDownFlag = true;
    this.loggingService.info('🛑 Starting graceful shutdown...');

    try {
      // Run all shutdown handlers
      for (const handler of this.shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          this.loggingService.error(`❌ Shutdown handler failed: ${error}`);
        }
      }

      this.loggingService.info('✅ Graceful shutdown completed');
      
      // Small delay to ensure logs are flushed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      process.exit(exitCode);
    } catch (error) {
      this.loggingService.error(`💥 Graceful shutdown failed: ${error}`);
      process.exit(1);
    }
  }

  isShuttingDown(): boolean {
    return this.isShuttingDownFlag;
  }

  getProcessInfo(): ProcessInfo {
    const memUsage = process.memoryUsage();
    
    return {
      pid: process.pid,
      uptime: Date.now() - this.startTime,
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      }
    };
  }

  startSignalHandling(): void {
    if (this.signalHandlersActive) {
      return;
    }

    this.signalHandlersActive = true;

    // Handle graceful shutdown signals
    process.on('SIGINT', this.handleShutdownSignal.bind(this, 'SIGINT'));
    process.on('SIGTERM', this.handleShutdownSignal.bind(this, 'SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

    this.loggingService.debug('🔧 Process signal handling activated');
  }

  stopSignalHandling(): void {
    if (!this.signalHandlersActive) {
      return;
    }

    this.signalHandlersActive = false;
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    this.loggingService.debug('🔧 Process signal handling deactivated');
  }

  private async handleShutdownSignal(signal: string): Promise<void> {
    this.loggingService.info(`🔔 Received ${signal}, initiating graceful shutdown...`);
    await this.gracefulShutdown(0);
  }

  private handleUncaughtException(error: Error): void {
    this.loggingService.error(`💥 Uncaught Exception: ${error.message}`, error.stack || 'No stack trace');
    // Don't exit immediately, let graceful shutdown handle it
    this.gracefulShutdown(1);
  }

  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    this.loggingService.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
    // For unhandled rejections, we might want to log but not necessarily exit
    // depending on the application's requirements
  }
}

 