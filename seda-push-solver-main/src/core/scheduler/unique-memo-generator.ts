/**
 * Unique Memo Generator for SEDA DataRequest Scheduler
 * Generates unique memos by appending sequence numbers to prevent DataRequest collisions
 */

import type { LoggingServiceInterface } from '../../services';

/**
 * Interface for unique memo metadata
 */
export interface UniqueMemoData {
  memo: string;
  sequenceNumber: number;
  timestamp: number;
}

/**
 * Unique Memo Generator
 * Creates unique memos by appending sequence numbers to the base memo
 */
export class UniqueMemoGenerator {
  private readonly startTime = Date.now();

  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Generate a unique memo using sequence number for uniqueness
   */
  generateUniqueMemo(baseMemo: string, sequenceNumber: number): UniqueMemoData {
    // Simple sequence-based uniqueness
    const uniqueMemo = `${baseMemo} | seq:${sequenceNumber}`;
    
    this.logger.info(`🆔 Generated unique memo (seq: ${sequenceNumber}): "${uniqueMemo}"`);
    
    return {
      memo: uniqueMemo,
      sequenceNumber,
      timestamp: this.getTimestamp()
    };
  }

  /**
   * Get generator statistics
   */
  getStats() {
    return {
      uptimeMs: Date.now() - this.startTime
    };
  }

  /**
   * Reset generator state (for cleanup)
   */
  reset(): void {
    this.logger.info('🔄 Unique memo generator reset');
  }

  private getTimestamp(): number {
    return Date.now();
  }
} 