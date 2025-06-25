/**
 * Mock Logging Service for Testing
 * Extracted from production source to tests/mocks
 */

import type { LoggingServiceInterface } from '../../src/services/logging-service';
import { LogLevel } from '../../src/services/logging-service';

/**
 * Mock implementation for testing
 */
export class MockLoggingService implements LoggingServiceInterface {
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: Array<{ level: string; message: string; args: any[] }> = [];

  info(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.INFO) {
      this.logs.push({ level: 'info', message, args });
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.ERROR) {
      this.logs.push({ level: 'error', message, args });
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.WARN) {
      this.logs.push({ level: 'warn', message, args });
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.logs.push({ level: 'debug', message, args });
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Get all captured logs (for testing)
   */
  getLogs(): Array<{ level: string; message: string; args: any[] }> {
    return [...this.logs];
  }

  /**
   * Clear all captured logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs of a specific level
   */
  getLogsByLevel(level: string): Array<{ level: string; message: string; args: any[] }> {
    return this.logs.filter(log => log.level === level);
  }
} 