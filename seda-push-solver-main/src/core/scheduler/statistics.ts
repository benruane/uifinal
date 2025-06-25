/**
 * Scheduler Statistics Management
 * Handles tracking and reporting of scheduler performance metrics
 */

import type { SchedulerStats } from '../../types';
import type { LoggingServiceInterface } from '../../services';

/**
 * Statistics Manager for the SEDA DataRequest Scheduler
 */
export class SchedulerStatistics {
  private stats: SchedulerStats;

  constructor() {
    this.stats = {
      totalRequests: 0,
      postedRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 0,
      startTime: Date.now(),
      errors: []
    };
  }

  /**
   * Reset all statistics (typically called when scheduler starts)
   */
  reset(): void {
    this.stats = {
      totalRequests: 0,
      postedRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 0,
      startTime: Date.now(),
      errors: []
    };
  }

  /**
   * Record a successfully posted DataRequest (posting phase completed)
   */
  recordPosted(): void {
    this.stats.postedRequests++;
  }

  /**
   * Record a successful oracle execution (oracle completed successfully)
   */
  recordSuccess(): void {
    this.stats.successfulRequests++;
    this.stats.totalRequests++;
  }

  /**
   * Record a failed oracle execution (oracle failed or timed out)
   */
  recordFailure(): void {
    this.stats.failedRequests++;
    this.stats.totalRequests++;
  }

  /**
   * Get current statistics snapshot
   */
  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Get runtime in minutes
   */
  getRuntimeMinutes(): string {
    const runtimeMs = Date.now() - this.stats.startTime;
    const minutes = Math.round((runtimeMs / (1000 * 60)) * 10) / 10; // One decimal place
    return minutes.toFixed(1);
  }

  /**
   * Calculate success rate as percentage (based on completed oracle executions)
   */
  getSuccessRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    return (this.stats.successfulRequests / this.stats.totalRequests) * 100;
  }

  /**
   * Calculate posting success rate as percentage (based on posted vs attempted)
   */
  getPostingSuccessRate(): number {
    // This would need to track attempted posts vs successful posts
    // For now, assuming all posts that reach recordPosted() were successful
    return this.stats.postedRequests > 0 ? 100 : 0;
  }

  /**
   * Print comprehensive statistics report
   */
  printReport(logger?: LoggingServiceInterface): void {
    const runtime = this.getRuntimeMinutes();
    
    if (logger) {
      logger.info('\n📈 SCHEDULER STATISTICS');
      logger.info('='.repeat(50));
      logger.info(`⏱️  Total Runtime: ${runtime} minutes`);
      logger.info(`📤 Posted to Blockchain: ${this.stats.postedRequests}`);
      logger.info(`📊 Oracle Executions Completed: ${this.stats.totalRequests}`);
      logger.info(`✅ Successful Executions: ${this.stats.successfulRequests}`);
      logger.info(`❌ Failed Executions: ${this.stats.failedRequests}`);
      
      if (this.stats.totalRequests > 0) {
        const successRate = this.getSuccessRate();
        logger.info(`📈 Oracle Success Rate: ${successRate.toFixed(1)}%`);
      }
      
      if (this.stats.postedRequests > this.stats.totalRequests) {
        const pending = this.stats.postedRequests - this.stats.totalRequests;
        logger.info(`⏳ Pending Oracle Executions: ${pending}`);
      }
      
      logger.info('='.repeat(50));
    } else {
      console.log('\n📈 SCHEDULER STATISTICS');
      console.log('='.repeat(50));
      console.log(`⏱️  Total Runtime: ${runtime} minutes`);
      console.log(`📤 Posted to Blockchain: ${this.stats.postedRequests}`);
      console.log(`📊 Oracle Executions Completed: ${this.stats.totalRequests}`);
      console.log(`✅ Successful Executions: ${this.stats.successfulRequests}`);
      console.log(`❌ Failed Executions: ${this.stats.failedRequests}`);
      
      if (this.stats.totalRequests > 0) {
        const successRate = this.getSuccessRate();
        console.log(`📈 Oracle Success Rate: ${successRate.toFixed(1)}%`);
      }
      
      if (this.stats.postedRequests > this.stats.totalRequests) {
        const pending = this.stats.postedRequests - this.stats.totalRequests;
        console.log(`⏳ Pending Oracle Executions: ${pending}`);
      }
      
      console.log('='.repeat(50));
    }
  }
} 