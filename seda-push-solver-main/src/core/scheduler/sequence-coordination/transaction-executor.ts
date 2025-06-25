/**
 * Transaction Executor
 * Executes transactions with sequence coordination and error handling
 */

import type { LoggingServiceInterface } from '../../../services';
import { withTimeout, delay, isSequenceError, isDataRequestExistsError } from '../../../helpers';

/**
 * Interface for transaction posting with sequence coordination
 */
export interface SequencedPosting<T> {
  postTransaction: (sequenceNumber: number) => Promise<T>;
  taskId: string;
  timeout?: number;
}

/**
 * Interface for posting results
 */
export interface PostingResult<T> {
  taskId: string;
  success: boolean;
  result?: T;
  error?: Error;
  sequence: number;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Transaction Executor
 * Handles transaction execution with sequence coordination and retry logic
 */
export class TransactionExecutor {
  private readonly SEQUENCE_RECOVERY_ATTEMPTS = 5; // Recovery attempts on conflicts

  constructor(
    private logger: LoggingServiceInterface,
    private postingTimeoutMs: number
  ) {}

  /**
   * Execute single transaction with reliable sequence handling
   */
  async executeWithReliableSequence<T>(
    execution: SequencedPosting<T>,
    sequence: number,
    onSequenceError: () => Promise<void>,
    onSuccess: (sequence: number) => void,
    onFailure: (sequence: number) => void
  ): Promise<PostingResult<T>> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.SEQUENCE_RECOVERY_ATTEMPTS) {
      const startTime = Date.now();

      this.logger.info(`🔢 Executing transaction #${sequence} for task ${execution.taskId} (attempt ${attempts + 1}/${this.SEQUENCE_RECOVERY_ATTEMPTS})`);

      try {
        const timeout = execution.timeout || this.postingTimeoutMs;
        
        const result = await withTimeout(
          execution.postTransaction(sequence),
          timeout,
          `Transaction timeout after ${timeout}ms`
        );

        // Success - notify success handler
        onSuccess(sequence);
        
        const endTime = Date.now();
        const executionResult: PostingResult<T> = {
          taskId: execution.taskId,
          success: true,
          result,
          sequence,
          startTime,
          endTime,
          duration: endTime - startTime
        };

        this.logger.info(`✅ Sequence #${sequence} completed for task ${execution.taskId}`);
        return executionResult;

      } catch (error) {
        onFailure(sequence);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Handle special cases
        if (isDataRequestExistsError(lastError)) {
          this.logger.warn(`⚠️ DataRequestAlreadyExists for task ${execution.taskId} - treating as success`);
          onSuccess(sequence);
          
          return {
            taskId: execution.taskId,
            success: true,
            result: { success: true, drId: 'unknown-but-posted' } as T,
            sequence,
            startTime,
            endTime,
            duration
          };
        }

        if (isSequenceError(lastError)) {
          this.logger.warn(`🔄 Sequence error detected (attempt ${attempts + 1}), performing recovery...`);
          await onSequenceError();
          attempts++;
          
          // Efficient backoff delay for recovery
          const backoffDelay = Math.min(250 * Math.pow(1.5, attempts), 1000); // Progressive backoff: 250ms, 375ms, 562ms, max 1s
          await delay(backoffDelay);
          continue;
        }

        // Non-sequence error - don't retry
        this.logger.error(`❌ Non-sequence error for task ${execution.taskId}: ${lastError.message}`);
        break;
      }
    }

    // All attempts failed
    this.logger.error(`💥 Sequence execution failed for task ${execution.taskId} after ${attempts} attempts`);
    return {
      taskId: execution.taskId,
      success: false,
      error: lastError || new Error('Unknown error'),
      sequence: sequence,
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0
    };
  }
} 