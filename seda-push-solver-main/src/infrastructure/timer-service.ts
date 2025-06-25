/**
 * Timer Service
 * Abstracts timing operations (setTimeout, setInterval) for better testing and control
 */

import type { LoggingArgs } from '../types/core';

export type TimerId = number;

/**
 * Interface for timer operations
 */
export interface TimerServiceInterface {
  /**
   * Set a recurring timer
   */
  setInterval(callback: () => void, ms: number): TimerId;

  /**
   * Set a one-time timer
   */
  setTimeout(callback: () => void, ms: number): TimerId;

  /**
   * Clear an interval timer
   */
  clearInterval(id: TimerId): void;

  /**
   * Clear a timeout timer
   */
  clearTimeout(id: TimerId): void;

  /**
   * Create a delay promise
   */
  delay(ms: number): Promise<void>;

  /**
   * Get current timestamp
   */
  now(): number;

  /**
   * Clear all active timers
   */
  clearAllTimers(): void;
}

/**
 * Production timer service using native JavaScript timers
 */
export class TimerService implements TimerServiceInterface {
  private activeTimers = new Set<TimerId>();
  private logger?: { error: (msg: string, ...args: LoggingArgs) => void };

  constructor(logger?: { error: (msg: string, ...args: LoggingArgs) => void }) {
    this.logger = logger;
  }

  setInterval(callback: () => void, ms: number): TimerId {
    const id = setInterval(() => {
      try {
        callback();
      } catch (error) {
        // Log error but continue interval
        if (this.logger) {
          this.logger.error('Timer callback error:', error instanceof Error ? error : String(error));
        }
      }
    }, ms) as unknown as TimerId;
    
    this.activeTimers.add(id);
    return id;
  }

  setTimeout(callback: () => void, ms: number): TimerId {
    const id = setTimeout(() => {
      this.activeTimers.delete(id);
      try {
        callback();
      } catch (error) {
        if (this.logger) {
          this.logger.error('Timer callback error:', error instanceof Error ? error : String(error));
        }
      }
    }, ms) as unknown as TimerId;
    
    this.activeTimers.add(id);
    return id;
  }

  clearInterval(id: TimerId): void {
    clearInterval(id);
    this.activeTimers.delete(id);
  }

  clearTimeout(id: TimerId): void {
    clearTimeout(id);
    this.activeTimers.delete(id);
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.setTimeout(() => resolve(), ms);
    });
  }

  now(): number {
    return Date.now();
  }

  clearAllTimers(): void {
    for (const id of this.activeTimers) {
      clearTimeout(id);
      clearInterval(id);
    }
    this.activeTimers.clear();
  }
}

 