/**
 * Task Completion Handler
 * Handles task completion events and statistics
 */

import type { LoggingServiceInterface } from '../../../services';
import type { AsyncTaskResult, TaskCompletionHandler } from '../types';
import type { SchedulerStatistics } from '../statistics';
import type { DataRequestPerformanceTracker } from '../performance-tracker';

/**
 * Task Completion Handler
 * Manages completion events and integrates with statistics and performance tracking
 */
export class TaskCompletionManager {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Create a completion handler for a task
   */
  createCompletionHandler(
    taskId: string,
    statistics: SchedulerStatistics,
    performanceTracker: DataRequestPerformanceTracker,
    originalHandler: TaskCompletionHandler
  ): TaskCompletionHandler {
    return {
      onSuccess: (result: AsyncTaskResult) => {
        this.handleSuccess(result, statistics, performanceTracker);
        originalHandler.onSuccess(result);
      },
      onFailure: (result: AsyncTaskResult) => {
        this.handleFailure(result, statistics, performanceTracker);
        originalHandler.onFailure(result);
      }
    };
  }

  /**
   * Handle successful task completion
   */
  private handleSuccess(
    result: AsyncTaskResult,
    statistics: SchedulerStatistics,
    performanceTracker: DataRequestPerformanceTracker
  ): void {
    if (result.result && result.result.type === 'posted') {
      // This is a posting success - increment posted counter
      statistics.recordPosted();
      this.logger.info(`📤 POSTED SUCCESSFULLY: ${result.taskId} (DR: ${result.drId})`);
    } else if (result.result && result.result.type === 'oracle_completed') {
      // This is an oracle completion - complete performance tracking
      if (result.drId) {
        performanceTracker.completeRequest(result.taskId, result.drId);
        performanceTracker.logRequestPerformance(result.taskId, this.logger);
      }
      this.logger.info(`✅ ORACLE COMPLETED: ${result.taskId} (DR: ${result.drId})`);
    }
  }

  /**
   * Handle failed task completion
   */
  private handleFailure(
    result: AsyncTaskResult,
    statistics: SchedulerStatistics,
    performanceTracker: DataRequestPerformanceTracker
  ): void {
    // Mark performance tracking as failed
    const errorMsg = typeof result.error === 'string' ? result.error : 'Unknown error';
    performanceTracker.failRequest(result.taskId, errorMsg);
    
    if (result.drId) {
      // Only log oracle failures, failure counter handled by completion handler
      this.logger.info(`❌ ORACLE FAILED: ${result.taskId} (DR: ${result.drId})`);
    } else {
      this.logger.info(`❌ POSTING FAILED: ${result.taskId}`);
    }
  }
} 