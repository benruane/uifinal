/**
 * Mock Infrastructure Services for Testing
 * Extracted from production source to tests/mocks
 */

import type { ProcessServiceInterface, TimerServiceInterface, HealthServiceInterface, ProcessInfo, HealthCheckResult, SystemMetrics, OverallHealth, HealthCheckFunction } from '../../src/infrastructure';
import type { LoggingServiceInterface } from '../../src/services/logging-service';

/**
 * Mock process service for testing
 */
export class MockProcessService implements ProcessServiceInterface {
  private shutdownHandlers: Array<() => Promise<void> | void> = [];
  private isShuttingDownFlag = false;
  private signalHandlersActive = false;
  private mockStartTime = Date.now();
  private mockExitCode: number | null = null;

  onShutdown(handler: () => Promise<void> | void): void {
    this.shutdownHandlers.push(handler);
  }

  async gracefulShutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDownFlag) {
      return;
    }

    this.isShuttingDownFlag = true;
    this.mockExitCode = exitCode;

    // Run all shutdown handlers
    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        // Silently handle errors in mock
      }
    }
  }

  isShuttingDown(): boolean {
    return this.isShuttingDownFlag;
  }

  getProcessInfo(): ProcessInfo {
    return {
      pid: 12345,
      uptime: Date.now() - this.mockStartTime,
      platform: 'mock',
      nodeVersion: 'v18.0.0',
      memoryUsage: {
        rss: 50 * 1024 * 1024,      // 50MB
        heapTotal: 30 * 1024 * 1024, // 30MB
        heapUsed: 20 * 1024 * 1024,  // 20MB
        external: 5 * 1024 * 1024    // 5MB
      }
    };
  }

  startSignalHandling(): void {
    this.signalHandlersActive = true;
  }

  stopSignalHandling(): void {
    this.signalHandlersActive = false;
  }

  /**
   * Test helpers for mock
   */
  simulateShutdownSignal(signal: string = 'SIGINT'): Promise<void> {
    return this.gracefulShutdown(0);
  }

  getExitCode(): number | null {
    return this.mockExitCode;
  }

  reset(): void {
    this.shutdownHandlers = [];
    this.isShuttingDownFlag = false;
    this.signalHandlersActive = false;
    this.mockExitCode = null;
    this.mockStartTime = Date.now();
  }
}

/**
 * Mock timer service for testing with time control
 */
export class MockTimerService implements TimerServiceInterface {
  private mockTime = Date.now();
  private timers = new Map<number, { callback: () => void; triggerTime: number; interval?: number }>();
  private nextTimerId = 1;

  now(): number {
    return this.mockTime;
  }

  delay(ms: number): Promise<void> {
    // In mock, just advance time and resolve immediately
    this.mockTime += ms;
    return Promise.resolve();
  }

  setTimeout(callback: () => void, ms: number): number {
    const timerId = this.nextTimerId++;
    const triggerTime = this.mockTime + ms;
    
    this.timers.set(timerId, { callback, triggerTime });
    
    return timerId;
  }

  clearTimeout(timerId: number): void {
    this.timers.delete(timerId);
  }

  setInterval(callback: () => void, ms: number): number {
    const timerId = this.nextTimerId++;
    const triggerTime = this.mockTime + ms;
    
    this.timers.set(timerId, { callback, triggerTime, interval: ms });
    
    return timerId;
  }

  clearInterval(timerId: number): void {
    this.timers.delete(timerId);
  }

  isDelayActive(timerId: number): boolean {
    return this.timers.has(timerId);
  }

  /**
   * Advance mock time and trigger any timers that should fire
   */
  advanceTime(ms: number): void {
    const targetTime = this.mockTime + ms;
    
    while (this.mockTime < targetTime) {
      // Find the next timer to trigger
      let nextTriggerTime = targetTime;
      for (const timer of this.timers.values()) {
        if (timer.triggerTime > this.mockTime && timer.triggerTime < nextTriggerTime) {
          nextTriggerTime = timer.triggerTime;
        }
      }
      
      // Advance to next trigger time
      this.mockTime = nextTriggerTime;
      
      // Execute all timers that should trigger at this time
      const triggeredTimers: Array<{ id: number; timer: { callback: () => void; triggerTime: number; interval?: number } }> = [];
      
      for (const [id, timer] of this.timers.entries()) {
        if (timer.triggerTime <= this.mockTime) {
          triggeredTimers.push({ id, timer });
        }
      }
      
      // Execute triggered timers
      for (const { id, timer } of triggeredTimers) {
        try {
          timer.callback();
        } catch (error) {
          // Silent error handling in mock
        }
        
        if (timer.interval) {
          // Reset interval timer for next trigger
          timer.triggerTime = this.mockTime + timer.interval;
        } else {
          // Remove one-time timer
          this.timers.delete(id);
        }
      }
    }
  }

  getPendingTimers(): Array<{ id: number; triggerTime: number; isInterval: boolean }> {
    return Array.from(this.timers.entries()).map(([id, timer]) => ({
      id,
      triggerTime: timer.triggerTime,
      isInterval: !!timer.interval
    }));
  }

  clearAllTimers(): void {
    this.timers.clear();
  }

  setMockTime(timestamp: number): void {
    this.mockTime = timestamp;
  }

  /**
   * Get count of active timers (for testing)
   */
  getTimerCount(): number {
    return this.timers.size;
  }

  /**
   * Run only currently pending timers
   * Advances to the earliest timer and executes all timers that are ready
   */
  runOnlyPendingTimers(): void {
    if (this.timers.size === 0) return;
    
    // Find the earliest timer
    let earliestTime = Number.MAX_SAFE_INTEGER;
    for (const timer of this.timers.values()) {
      if (timer.triggerTime < earliestTime) {
        earliestTime = timer.triggerTime;
      }
    }
    
    // Advance to the earliest timer time
    if (earliestTime > this.mockTime) {
      this.mockTime = earliestTime;
    }
    
    const triggeredTimers: Array<{ id: number; timer: { callback: () => void; triggerTime: number; interval?: number } }> = [];
    
    // Find timers that should trigger at current time
    for (const [id, timer] of this.timers.entries()) {
      if (timer.triggerTime <= this.mockTime) {
        triggeredTimers.push({ id, timer });
      }
    }
    
    // Execute triggered timers
    for (const { id, timer } of triggeredTimers) {
      try {
        timer.callback();
      } catch (error) {
        // Silent error handling in mock
      }
      
      if (timer.interval) {
        // Reset interval timer for next execution
        timer.triggerTime = this.mockTime + timer.interval;
      } else {
        // Remove one-time timer
        this.timers.delete(id);
      }
    }
  }
}

/**
 * Mock health service for testing
 */
export class MockHealthService implements HealthServiceInterface {
  private checks = new Map<string, () => Promise<HealthCheckResult>>();
  private mockResults = new Map<string, HealthCheckResult>();
  private mockMetrics: SystemMetrics;
  private periodicCheckTimerId: number | null = null;

  constructor(
    private loggingService: LoggingServiceInterface,
    private timerService: TimerServiceInterface
  ) {
    this.mockMetrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      memory: { used: 0, total: 0, usage: 0 },
      uptime: 0,
      errors: { total: 0, lastHour: 0 }
    };
  }

  registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
  }

  unregisterCheck(name: string): void {
    this.checks.delete(name);
    this.mockResults.delete(name);
  }

  async runCheck(name: string): Promise<HealthCheckResult> {
    if (this.mockResults.has(name)) {
      return this.mockResults.get(name)!;
    }

    const checkFn = this.checks.get(name);
    if (!checkFn) {
      throw new Error(`Health check '${name}' not found`);
    }

    try {
      return await checkFn();
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        timestamp: this.timerService.now(),
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  async getOverallHealth(): Promise<OverallHealth> {
    const results: Record<string, HealthCheckResult> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name] of this.checks) {
      try {
        results[name] = await this.runCheck(name);
        if (results[name].status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (results[name].status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          responseTime: 0,
          timestamp: this.timerService.now(),
          error: error instanceof Error ? error.message : String(error)
        };
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      checks: results,
      uptime: this.timerService.now(),
      timestamp: this.timerService.now()
    };
  }

  getMetrics(): SystemMetrics {
    return { ...this.mockMetrics };
  }

  startPeriodicChecks(intervalMs: number): void {
    // Start a mock timer for periodic checks
    this.periodicCheckTimerId = this.timerService.setInterval(() => {
      // Mock periodic health check execution
    }, intervalMs);
  }

  stopPeriodicChecks(): void {
    // Clear the periodic check timer
    if (this.periodicCheckTimerId !== null) {
      this.timerService.clearInterval(this.periodicCheckTimerId);
      this.periodicCheckTimerId = null;
    }
  }

  recordRequest(successful: boolean, responseTime: number): void {
    this.mockMetrics.requests.total++;
    if (successful) {
      this.mockMetrics.requests.successful++;
    } else {
      this.mockMetrics.requests.failed++;
    }
  }

  recordError(error: Error | string): void {
    this.mockMetrics.errors.total++;
    this.mockMetrics.errors.lastHour++;
  }

  setMockResult(checkName: string, result: HealthCheckResult): void {
    this.mockResults.set(checkName, result);
  }

  setMockMetrics(metrics: Partial<SystemMetrics>): void {
    this.mockMetrics = { ...this.mockMetrics, ...metrics };
  }
} 