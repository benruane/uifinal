/**
 * Logging Service
 * Provides structured logging with different levels
 */

import type { LoggingArgs } from '../types/core';

/**
 * Log levels for controlling output
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * Interface for logging operations
 * Allows mocking and controlling log output during testing
 */
export interface LoggingServiceInterface {
  /**
   * Log an info message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  info(message: string, ...args: LoggingArgs): void;

  /**
   * Log an error message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  error(message: string, ...args: LoggingArgs): void;

  /**
   * Log a warning message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  warn(message: string, ...args: LoggingArgs): void;

  /**
   * Log a debug message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  debug(message: string, ...args: LoggingArgs): void;

  /**
   * Set the current log level
   */
  setLogLevel(level: LogLevel): void;

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel;
}

/**
 * Console-based logging service implementation
 */
export class LoggingService implements LoggingServiceInterface {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel;
  }

  info(message: string, ...args: LoggingArgs): void {
    if (this.shouldLog('info')) {
      console.log(message, ...args);
    }
  }

  error(message: string, ...args: LoggingArgs): void {
    if (this.shouldLog('error')) {
      console.error(message, ...args);
    }
  }

  warn(message: string, ...args: LoggingArgs): void {
    if (this.shouldLog('warn')) {
      console.warn(message, ...args);
    }
  }

  debug(message: string, ...args: LoggingArgs): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  setLogLevel(level: LogLevel): void {
    const levelMap = {
      [LogLevel.DEBUG]: 'debug' as const,
      [LogLevel.INFO]: 'info' as const,
      [LogLevel.WARN]: 'warn' as const,
      [LogLevel.ERROR]: 'error' as const,
    };
    this.logLevel = levelMap[level];
  }

  getLogLevel(): LogLevel {
    const levelMap = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
    };
    return levelMap[this.logLevel];
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }
}

 