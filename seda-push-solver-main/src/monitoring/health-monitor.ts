/**
 * Health Monitor
 * System health monitoring and health checks
 */

import type { LoggingServiceInterface } from '../services';

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  responseTime: number;
  timestamp: number;
  details?: Record<string, any>;
  error?: string;
}

/**
 * Health check function signature
 */
export type HealthCheckFn = () => Promise<HealthCheckResult>;

/**
 * Registered health check
 */
interface RegisteredHealthCheck {
  name: string;
  checkFn: HealthCheckFn;
  interval?: number;
  timeout?: number;
  lastResult?: HealthCheckResult;
  lastExecuted?: number;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  status: HealthStatus;
  checks: Record<string, HealthCheckResult>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
  };
}

/**
 * Health monitor for system health checks
 */
export class HealthMonitor {
  private checks = new Map<string, RegisteredHealthCheck>();
  private periodicCheckInterval?: NodeJS.Timeout;

  constructor(private logger?: LoggingServiceInterface) {}

  /**
   * Register a health check
   */
  registerCheck(
    name: string,
    checkFn: HealthCheckFn,
    options: {
      interval?: number;
      timeout?: number;
    } = {}
  ): void {
    this.checks.set(name, {
      name,
      checkFn,
      interval: options.interval,
      timeout: options.timeout || 5000
    });

    this.logger?.debug(`Registered health check: ${name}`);
  }

  /**
   * Remove a health check
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
    this.logger?.debug(`Unregistered health check: ${name}`);
  }

  /**
   * Execute a specific health check
   */
  async executeCheck(name: string): Promise<HealthCheckResult | null> {
    const check = this.checks.get(name);
    if (!check) {
      return null;
    }

    const startTime = Date.now();
    
    try {
      // Execute with timeout
      const result = await this.withTimeout(check.checkFn(), check.timeout || 5000);
      
      check.lastResult = result;
      check.lastExecuted = Date.now();
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorResult: HealthCheckResult = {
        status: HealthStatus.UNHEALTHY,
        responseTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      };
      
      check.lastResult = errorResult;
      check.lastExecuted = Date.now();
      
      return errorResult;
    }
  }

  /**
   * Execute all health checks
   */
  async executeAllChecks(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};
    
    const checkPromises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.executeCheck(name);
      if (result) {
        results[name] = result;
      }
    });

    await Promise.allSettled(checkPromises);
    return results;
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const checkResults = await this.executeAllChecks();
    
    const summary = {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unknown: 0
    };

    for (const result of Object.values(checkResults)) {
      summary.total++;
      summary[result.status]++;
    }

    // Determine overall status
    let overallStatus = HealthStatus.HEALTHY;
    if (summary.unhealthy > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (summary.degraded > 0) {
      overallStatus = HealthStatus.DEGRADED;
    } else if (summary.unknown > 0) {
      overallStatus = HealthStatus.UNKNOWN;
    }

    return {
      status: overallStatus,
      checks: checkResults,
      summary
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(defaultInterval: number = 30000): void {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }

    this.periodicCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        if (health.status !== HealthStatus.HEALTHY) {
          this.logger?.warn(`System health degraded: ${health.status}`);
          this.logHealthSummary(health);
        } else {
          this.logger?.debug('System health check passed');
        }
      } catch (error) {
        this.logger?.error('Health check execution failed:', error instanceof Error ? error : String(error));
      }
    }, defaultInterval);

    this.logger?.info(`Started periodic health checks (interval: ${defaultInterval}ms)`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = undefined;
      this.logger?.info('Stopped periodic health checks');
    }
  }

  /**
   * Get status of all registered checks
   */
  getCheckStatus(): Record<string, { lastResult?: HealthCheckResult; lastExecuted?: number }> {
    const status: Record<string, { lastResult?: HealthCheckResult; lastExecuted?: number }> = {};
    
    for (const [name, check] of this.checks.entries()) {
      status[name] = {
        lastResult: check.lastResult,
        lastExecuted: check.lastExecuted
      };
    }
    
    return status;
  }

  /**
   * Log health summary
   */
  logHealthSummary(health?: SystemHealth): void {
    if (!this.logger) return;

    if (!health) {
      // Execute checks synchronously for logging
      this.getSystemHealth().then(h => this.logHealthSummary(h));
      return;
    }

    this.logger.info('🏥 Health Summary:');
    this.logger.info('┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info(`│                    System Health: ${health.status.toUpperCase()}                     │`);
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    this.logger.info(`│ Total Checks: ${health.summary.total}`);
    this.logger.info(`│ Healthy: ${health.summary.healthy}, Degraded: ${health.summary.degraded}`);
    this.logger.info(`│ Unhealthy: ${health.summary.unhealthy}, Unknown: ${health.summary.unknown}`);
    
    if (Object.keys(health.checks).length > 0) {
      this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
      for (const [name, result] of Object.entries(health.checks)) {
        const statusIcon = this.getStatusIcon(result.status);
        this.logger.info(`│ ${statusIcon} ${name}: ${result.status} (${result.responseTime}ms)`);
        if (result.error) {
          this.logger.info(`│   Error: ${result.error}`);
        }
      }
    }
    
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
  }

  /**
   * Execute function with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Health check timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get status icon for logging
   */
  private getStatusIcon(status: HealthStatus): string {
    switch (status) {
      case HealthStatus.HEALTHY:
        return '✅';
      case HealthStatus.DEGRADED:
        return '⚠️';
      case HealthStatus.UNHEALTHY:
        return '❌';
      case HealthStatus.UNKNOWN:
        return '❓';
      default:
        return '⚪';
    }
  }
} 