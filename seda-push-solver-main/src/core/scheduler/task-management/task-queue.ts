/**
 * Task Queue
 * Manages the task queue with statistics and monitoring
 */

import type { LoggingServiceInterface } from '../../../services';

/**
 * Task queue item
 */
export interface QueuedTask {
  taskId: string;
  requestNumber: number;
  timestamp: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  queueSize: number;
  oldestTaskAge: number;
  averageTaskAge: number;
}

/**
 * Task Queue
 * Manages queued tasks with monitoring capabilities
 */
export class TaskQueue {
  private taskQueue: QueuedTask[] = [];

  constructor(
    private logger: LoggingServiceInterface,
    private getTimestamp: () => number = Date.now
  ) {}

  /**
   * Add task to queue
   */
  enqueue(taskId: string, requestNumber: number): void {
    const queuedTask: QueuedTask = {
      taskId,
      requestNumber,
      timestamp: this.getTimestamp()
    };

    this.taskQueue.push(queuedTask);
    this.logger.debug(`📋 Enqueued task ${taskId} (#${requestNumber}), queue size: ${this.taskQueue.length}`);
  }

  /**
   * Remove task from queue
   */
  dequeue(taskId: string): QueuedTask | undefined {
    const index = this.taskQueue.findIndex(task => task.taskId === taskId);
    if (index !== -1) {
      const task = this.taskQueue.splice(index, 1)[0];
      this.logger.debug(`✅ Dequeued task ${taskId}, queue size: ${this.taskQueue.length}`);
      return task;
    }
    return undefined;
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.taskQueue.length;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const now = this.getTimestamp();
    const queueAges = this.taskQueue.map(task => now - task.timestamp);
    
    return {
      queueSize: this.taskQueue.length,
      oldestTaskAge: queueAges.length > 0 ? Math.max(...queueAges) : 0,
      averageTaskAge: queueAges.length > 0 ? queueAges.reduce((a, b) => a + b, 0) / queueAges.length : 0
    };
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.taskQueue.length === 0;
  }

  /**
   * Clear all tasks from queue
   */
  clear(): void {
    const clearedCount = this.taskQueue.length;
    this.taskQueue = [];
    if (clearedCount > 0) {
      this.logger.info(`🧹 Cleared ${clearedCount} tasks from queue`);
    }
  }

  /**
   * Get all queued tasks (for debugging)
   */
  getAllTasks(): QueuedTask[] {
    return [...this.taskQueue];
  }
} 