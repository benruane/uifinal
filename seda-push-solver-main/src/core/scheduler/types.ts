/**
 * Types for Async Task Management
 * Centralized type definitions for async task operations and tracking
 */

/**
 * Interface for tracking individual DataRequest details
 */
export interface DataRequestTracker {
  taskId: string;
  drId?: string;
  blockHeight?: bigint;
  txHash?: string;
  sequenceNumber?: number;
  status: 'posting' | 'posted' | 'completed' | 'failed';
  postedAt?: number;
  completedAt?: number;
  startTime: number;
  memo?: string;
  error?: Error;
}

/**
 * Interface for tracking async task results
 */
export interface AsyncTaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: Error;
  drId?: string;
  blockHeight?: number;
  completedAt: number;
  duration: number;
  sequenceNumber?: number; // Track the sequence number used
}

/**
 * Interface for task completion callbacks
 */
export interface TaskCompletionHandler {
  onSuccess(result: AsyncTaskResult): void;
  onFailure(result: AsyncTaskResult): void;
} 