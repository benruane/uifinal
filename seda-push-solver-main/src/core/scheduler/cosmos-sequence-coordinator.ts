/**
 * Cosmos Sequence Number Coordinator for SEDA DataRequest Scheduler
 * Provides reliable sequence management with atomic allocation, validation, and comprehensive recovery
 * Refactored to use extracted coordination modules
 */

import type { LoggingServiceInterface } from '../../services';
import type { Signer } from '@seda-protocol/dev-tools';

// Coordination modules
import { SequenceAllocator } from './sequence-coordination';
import { PendingSequenceManager, type PendingSequence } from './sequence-coordination';
import { SequenceValidator } from './sequence-coordination';
import { TransactionExecutor } from './sequence-coordination';
import type { SequencedPosting, PostingResult } from './sequence-coordination';

// Re-export types for external use
export type { SequencedPosting, PostingResult };

/**
 * Configuration for Cosmos Sequence Coordinator
 */
export interface CosmosSequenceConfig {
  postingTimeoutMs: number;
  drResultTimeout: number;
  maxQueueSize: number;
}

/**
 * Cosmos Sequence Coordinator
 * Features:
 * - Atomic sequence number allocation
 * - Regular blockchain validation (every 5 seconds)
 * - Comprehensive error detection and recovery
 * - Advanced pending sequence management
 * - Automatic sequence gap detection and healing
 */
export class CosmosSequenceCoordinator {
  private executionQueue: Array<{
    execution: SequencedPosting<any>;
    resolve: (result: PostingResult<any>) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private isProcessing = false;
  private isInitialized = false;
  private signer: Signer | null = null;

  // Coordination modules
  private sequenceAllocator: SequenceAllocator;
  private pendingManager: PendingSequenceManager;
  private validator: SequenceValidator;
  private executor: TransactionExecutor;

  // Configuration constants
  private readonly MAX_SEQUENCE_DRIFT = 5; // Maximum allowed drift before forced sync

  constructor(
    private logger: LoggingServiceInterface,
    private config: CosmosSequenceConfig
  ) {
    this.sequenceAllocator = new SequenceAllocator(this.logger);
    this.pendingManager = new PendingSequenceManager(this.logger);
    this.validator = new SequenceValidator(this.logger);
    this.executor = new TransactionExecutor(this.logger, this.config.postingTimeoutMs);
  }

  /**
   * Initialize with reliable sequence detection
   */
  async initialize(signer: Signer): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.signer = signer;
    const startingSequence = await this.validator.performReliableInitialization(signer);
    this.sequenceAllocator.initialize(startingSequence);
    this.isInitialized = true;
    
    this.logger.info(`🛡️ Sequence coordinator initialized with sequence: ${startingSequence}`);
  }

  /**
   * Execute a transaction with robust sequence coordination
   */
  async executeSequenced<T>(execution: SequencedPosting<T>): Promise<PostingResult<T>> {
    if (!this.isInitialized) {
      throw new Error('Sequence coordinator not initialized. Call initialize() first.');
    }

    if (this.executionQueue.length >= this.config.maxQueueSize) {
      throw new Error(`Sequence execution queue is full (max: ${this.config.maxQueueSize})`);
    }

    return new Promise((resolve, reject) => {
      this.executionQueue.push({
        execution,
        resolve,
        reject
      });

      this.logger.info(`🔢 Queued transaction for task ${execution.taskId} (queue size: ${this.executionQueue.length})`);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Reliable queue processing with validation and recovery
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.logger.info('🛡️ Starting sequence coordinator processing');

    while (this.executionQueue.length > 0) {
      // Perform periodic validation if needed
      if (this.validator.shouldValidate()) {
        await this.performPeriodicValidation();
      }

      const queueItem = this.executionQueue.shift();
      if (!queueItem) {
        break;
      }

      const { execution, resolve, reject } = queueItem;
      await this.executeWithReliableSequence(execution, resolve, reject);
    }

    this.isProcessing = false;
    this.logger.info('✅ Sequence coordinator processing completed');
  }

  /**
   * Execute single transaction with reliable sequence handling
   */
  private async executeWithReliableSequence(
    execution: SequencedPosting<any>,
    resolve: (result: PostingResult<any>) => void,
    reject: (error: Error) => void
  ): Promise<void> {
    // Atomically allocate sequence number
    const sequence = await this.sequenceAllocator.atomicAllocateSequence();
    const startTime = Date.now();

    // Track this sequence as pending
    const pendingSeq: PendingSequence = {
      sequence,
      taskId: execution.taskId,
      startTime,
      attempts: 1,
      resolve,
      reject
    };
    this.pendingManager.addPending(pendingSeq);

    try {
      const result = await this.executor.executeWithReliableSequence(
        execution,
        sequence,
        // onSequenceError callback
        async () => {
          await this.performComprehensiveRecovery();
        },
        // onSuccess callback
        (seq: number) => {
          this.pendingManager.removePending(seq);
          this.sequenceAllocator.markSequenceSuccess(seq);
        },
        // onFailure callback
        (seq: number) => {
          this.pendingManager.removePending(seq);
          this.sequenceAllocator.releaseSequence(seq);
        }
      );

      resolve(result);
    } catch (error) {
      this.pendingManager.removePending(sequence);
      this.sequenceAllocator.releaseSequence(sequence);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Perform periodic validation
   */
  private async performPeriodicValidation(): Promise<void> {
    if (!this.signer) return;

    const blockchainSequence = await this.validator.performPeriodicValidation(this.signer);
    if (blockchainSequence !== null) {
      this.sequenceAllocator.updateFromBlockchain(blockchainSequence, this.MAX_SEQUENCE_DRIFT);
    }
  }

  /**
   * Perform comprehensive recovery after sequence errors
   */
  private async performComprehensiveRecovery(): Promise<void> {
    this.logger.info('🔧 Performing comprehensive sequence recovery...');
    
    // Step 1: Clean up expired pending sequences
    this.pendingManager.cleanupExpiredPendingSequences();
    
    // Step 2: Force blockchain validation
    if (this.signer) {
      const blockchainSequence = await this.validator.validateWithRecovery(this.signer);
      if (blockchainSequence !== null) {
        this.sequenceAllocator.updateFromBlockchain(blockchainSequence, this.MAX_SEQUENCE_DRIFT);
      }
    }
    
    // Step 3: Clear stale allocations
    this.sequenceAllocator.clearAllocations();
    
    const allocatorState = this.sequenceAllocator.getState();
    this.logger.info(`🔧 Comprehensive recovery complete: next=${allocatorState.nextSequence}, confirmed=${allocatorState.confirmedSequence}, pending=${this.pendingManager.getPendingCount()}`);
  }

  /**
   * Get comprehensive statistics with enhanced metrics
   */
  getStats() {
    const allocatorState = this.sequenceAllocator.getState();
    const validatorStats = this.validator.getValidationStats();
    
    return {
      queueSize: this.executionQueue.length,
      isProcessing: this.isProcessing,
      currentSequenceNumber: allocatorState.confirmedSequence,
      nextSequenceNumber: allocatorState.nextSequence,
      lastValidatedSequence: allocatorState.confirmedSequence,
      pendingSequences: this.pendingManager.getPendingCount(),
      allocatedSequences: allocatorState.allocatedCount,
      sequenceDrift: allocatorState.sequenceDrift,
      maxQueueSize: this.config.maxQueueSize,
      isInitialized: this.isInitialized,
      lastValidationAge: validatorStats.lastValidationAge,
      validationInterval: validatorStats.validationInterval,
      allocationLocked: allocatorState.allocationLocked
    };
  }

  /**
   * Get the current confirmed sequence number
   */
  getCurrentSequenceNumber(): number {
    return this.sequenceAllocator.getCurrentSequence();
  }

  /**
   * Clear the execution queue and all pending sequences
   */
  clear(): void {
    // Reject all pending executions
    while (this.executionQueue.length > 0) {
      const queueItem = this.executionQueue.shift();
      if (queueItem) {
        queueItem.reject(new Error('Sequence coordinator cleared'));
      }
    }

    // Clear all coordination modules
    this.pendingManager.clear();
    this.sequenceAllocator.clearAllocations();
    this.isProcessing = false;
    
    this.logger.info('🔄 Sequence coordinator cleared');
  }

  /**
   * Wait for the queue to be completely empty
   */
  async waitForQueue(): Promise<void> {
    while (this.executionQueue.length > 0 || this.isProcessing || this.pendingManager.getPendingCount() > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
} 