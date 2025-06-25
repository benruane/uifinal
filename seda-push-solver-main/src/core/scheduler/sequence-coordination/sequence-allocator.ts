/**
 * Sequence Allocator
 * Handles atomic sequence number allocation and tracking
 */

import type { LoggingServiceInterface } from '../../../services';

/**
 * Sequence Allocator
 * Manages atomic sequence allocation and tracking
 */
export class SequenceAllocator {
  private nextSequence: number = 0;
  private confirmedSequence: number = 0;
  private allocatedSequences = new Set<number>();
  private sequenceAllocationLock = false;

  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Initialize sequence numbers
   */
  initialize(startingSequence: number): void {
    this.confirmedSequence = startingSequence;
    this.nextSequence = startingSequence;
    this.logger.debug(`🔢 Sequence allocator initialized at ${startingSequence}`);
  }

  /**
   * Atomically allocate the next sequence number
   */
  async atomicAllocateSequence(): Promise<number> {
    // Use a more efficient non-blocking approach instead of polling
    if (this.sequenceAllocationLock) {
      // If locked, wait for a single promise instead of polling
      await new Promise<void>((resolve) => {
        const checkLock = () => {
          if (!this.sequenceAllocationLock) {
            resolve();
          } else {
            // Use immediate callback for responsive waiting
            setImmediate(checkLock);
          }
        };
        checkLock();
      });
    }

    this.sequenceAllocationLock = true;
    
    try {
      // Find next available sequence (skip any that are still allocated)
      while (this.allocatedSequences.has(this.nextSequence)) {
        this.nextSequence++;
      }

      const allocatedSequence = this.nextSequence;
      this.allocatedSequences.add(allocatedSequence);
      this.nextSequence++;

      this.logger.debug(`🔒 Atomically allocated sequence ${allocatedSequence}, next available: ${this.nextSequence}`);
      return allocatedSequence;
      
    } finally {
      this.sequenceAllocationLock = false;
    }
  }

  /**
   * Mark a sequence as successfully used
   */
  markSequenceSuccess(sequence: number): void {
    this.allocatedSequences.delete(sequence);
    this.confirmedSequence = Math.max(this.confirmedSequence, sequence);
    this.nextSequence = Math.max(this.nextSequence, this.confirmedSequence + 1);
    
    this.logger.debug(`🔢 Sequence ${sequence} confirmed, next allocation: ${this.nextSequence}`);
  }

  /**
   * Release an allocated sequence (on failure)
   */
  releaseSequence(sequence: number): void {
    this.allocatedSequences.delete(sequence);
    this.logger.debug(`🔓 Released sequence ${sequence}`);
  }

  /**
   * Update sequence numbers from blockchain validation
   */
  updateFromBlockchain(blockchainSequence: number, maxDrift: number): boolean {
    const drift = Math.abs(this.nextSequence - blockchainSequence);
    
    if (drift > maxDrift) {
      this.logger.warn(`🚨 CRITICAL sequence drift detected: local=${this.nextSequence}, blockchain=${blockchainSequence}, drift=${drift}`);
      
      // Force synchronization for large drifts
      if (this.nextSequence < blockchainSequence) {
        this.logger.info(`🔧 FORCE SYNC: Adjusting sequences to blockchain`);
        this.confirmedSequence = blockchainSequence;
        this.nextSequence = blockchainSequence;
        
        // Clear any stale allocated sequences that are now invalid
        this.allocatedSequences.clear();
        return true; // Indicates major sync occurred
      }
    } else if (drift > 0) {
      this.logger.debug(`🔄 Minor sequence drift: local=${this.nextSequence}, blockchain=${blockchainSequence}, drift=${drift}`);
    }

    // Update confirmed sequence conservatively
    this.confirmedSequence = Math.max(this.confirmedSequence, blockchainSequence);
    return false; // No major sync needed
  }

  /**
   * Clear all allocated sequences
   */
  clearAllocations(): void {
    this.allocatedSequences.clear();
    this.sequenceAllocationLock = false;
    this.logger.debug('🧹 Cleared all sequence allocations');
  }

  /**
   * Get current sequence state
   */
  getState() {
    return {
      nextSequence: this.nextSequence,
      confirmedSequence: this.confirmedSequence,
      allocatedCount: this.allocatedSequences.size,
      sequenceDrift: Math.abs(this.nextSequence - this.confirmedSequence),
      allocationLocked: this.sequenceAllocationLock
    };
  }

  /**
   * Get current confirmed sequence number
   */
  getCurrentSequence(): number {
    return this.confirmedSequence;
  }
} 