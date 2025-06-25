/**
 * Pending Sequence Manager
 * Manages pending sequences with timeout and cleanup
 */

import type { LoggingServiceInterface } from '../../../services';

/**
 * Interface for tracking pending sequences with enhanced metadata
 */
export interface PendingSequence {
  sequence: number;
  taskId: string;
  startTime: number;
  attempts: number;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

/**
 * Pending Sequence Manager
 * Tracks and manages sequences that are currently being processed
 */
export class PendingSequenceManager {
  private pendingSequences = new Map<number, PendingSequence>();
  private readonly PENDING_TIMEOUT_MS = 30000; // 30 seconds for pending sequences

  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Add a pending sequence
   */
  addPending(pendingSeq: PendingSequence): void {
    this.pendingSequences.set(pendingSeq.sequence, pendingSeq);
    this.logger.debug(`📋 Added pending sequence ${pendingSeq.sequence} for task ${pendingSeq.taskId}`);
  }

  /**
   * Remove a pending sequence
   */
  removePending(sequence: number): PendingSequence | undefined {
    const pending = this.pendingSequences.get(sequence);
    if (pending) {
      this.pendingSequences.delete(sequence);
      this.logger.debug(`✅ Removed pending sequence ${sequence} for task ${pending.taskId}`);
    }
    return pending;
  }

  /**
   * Check if a sequence is pending
   */
  isPending(sequence: number): boolean {
    return this.pendingSequences.has(sequence);
  }

  /**
   * Get pending sequence count
   */
  getPendingCount(): number {
    return this.pendingSequences.size;
  }

  /**
   * Clean up expired pending sequences
   */
  cleanupExpiredPendingSequences(): number {
    const now = Date.now();
    const expiredSequences: number[] = [];
    
    for (const [seq, pending] of this.pendingSequences.entries()) {
      if (now - pending.startTime > this.PENDING_TIMEOUT_MS) {
        this.logger.warn(`⚠️ Cleaning up expired pending sequence ${seq} for task ${pending.taskId} (attempt ${pending.attempts})`);
        expiredSequences.push(seq);
      }
    }
    
    // Remove expired sequences
    expiredSequences.forEach(seq => {
      this.pendingSequences.delete(seq);
    });
    
    if (expiredSequences.length > 0) {
      this.logger.info(`🧹 Cleaned up ${expiredSequences.length} expired sequences`);
    }

    return expiredSequences.length;
  }

  /**
   * Clear all pending sequences
   */
  clear(): void {
    this.pendingSequences.clear();
    this.logger.debug('🧹 Cleared all pending sequences');
  }

  /**
   * Get all pending sequences for debugging
   */
  getAllPending(): PendingSequence[] {
    return Array.from(this.pendingSequences.values());
  }
} 