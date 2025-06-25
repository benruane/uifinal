/**
 * Performance Tracker
 * Enhanced performance monitoring for operations across the system
 */

import type { LoggingServiceInterface } from '../services';
import { MetricsCollector } from './metrics-collector';

/**
 * Performance measurement for an operation
 */
export interface PerformanceMeasurement {
  operationId: string;
  operationType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  operationType: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

/**
 * Enhanced performance tracker
 */
export class PerformanceTracker {
  private measurements = new Map<string, PerformanceMeasurement>();
  private completedMeasurements: PerformanceMeasurement[] = [];
  private metricsCollector: MetricsCollector;

  constructor(private logger?: LoggingServiceInterface) {
    this.metricsCollector = new MetricsCollector(logger);
  }

  /**
   * Start tracking an operation
   */
  startOperation(
    operationId: string,
    operationType: string,
    metadata?: Record<string, any>
  ): void {
    const measurement: PerformanceMeasurement = {
      operationId,
      operationType,
      startTime: Date.now(),
      status: 'running',
      metadata
    };

    this.measurements.set(operationId, measurement);
    this.metricsCollector.incrementCounter('operations_started', 1, { type: operationType });
  }

  /**
   * Complete an operation successfully
   */
  completeOperation(operationId: string, metadata?: Record<string, any>): number | null {
    const measurement = this.measurements.get(operationId);
    if (!measurement) {
      this.logger?.warn(`No measurement found for operation ${operationId}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - measurement.startTime;

    measurement.endTime = endTime;
    measurement.duration = duration;
    measurement.status = 'completed';
    if (metadata) {
      measurement.metadata = { ...measurement.metadata, ...metadata };
    }

    // Record metrics
    this.metricsCollector.incrementCounter('operations_completed', 1, { type: measurement.operationType });
    this.metricsCollector.recordTimer(`operation_duration_${measurement.operationType}`, duration);

    // Move to completed measurements
    this.completedMeasurements.push(measurement);
    this.measurements.delete(operationId);

    // Trim completed measurements to prevent memory leaks (keep last 10000)
    if (this.completedMeasurements.length > 10000) {
      this.completedMeasurements = this.completedMeasurements.slice(-10000);
    }

    return duration;
  }

  /**
   * Mark an operation as failed
   */
  failOperation(operationId: string, error?: string, metadata?: Record<string, any>): number | null {
    const measurement = this.measurements.get(operationId);
    if (!measurement) {
      this.logger?.warn(`No measurement found for operation ${operationId}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - measurement.startTime;

    measurement.endTime = endTime;
    measurement.duration = duration;
    measurement.status = 'failed';
    if (metadata) {
      measurement.metadata = { ...measurement.metadata, ...metadata };
    }
    if (error) {
      measurement.metadata = { ...measurement.metadata, error };
    }

    // Record metrics
    this.metricsCollector.incrementCounter('operations_failed', 1, { type: measurement.operationType });
    this.metricsCollector.recordTimer(`operation_duration_${measurement.operationType}`, duration);

    // Move to completed measurements
    this.completedMeasurements.push(measurement);
    this.measurements.delete(operationId);

    return duration;
  }

  /**
   * Get performance statistics for an operation type
   */
  getPerformanceStats(operationType: string): PerformanceStats | null {
    const measurements = this.completedMeasurements.filter(
      m => m.operationType === operationType && m.duration !== undefined
    );

    if (measurements.length === 0) {
      return null;
    }

    const durations = measurements.map(m => m.duration!).sort((a, b) => a - b);
    const successful = measurements.filter(m => m.status === 'completed').length;
    const failed = measurements.filter(m => m.status === 'failed').length;

    return {
      operationType,
      totalOperations: measurements.length,
      successfulOperations: successful,
      failedOperations: failed,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      percentiles: {
        p50: this.calculatePercentile(durations, 0.5),
        p95: this.calculatePercentile(durations, 0.95),
        p99: this.calculatePercentile(durations, 0.99)
      }
    };
  }

  /**
   * Get all performance statistics
   */
  getAllPerformanceStats(): PerformanceStats[] {
    const operationTypes = new Set(this.completedMeasurements.map(m => m.operationType));
    return Array.from(operationTypes)
      .map(type => this.getPerformanceStats(type))
      .filter((stats): stats is PerformanceStats => stats !== null);
  }

  /**
   * Get currently running operations
   */
  getRunningOperations(): PerformanceMeasurement[] {
    return Array.from(this.measurements.values());
  }

  /**
   * Get operation by ID
   */
  getOperation(operationId: string): PerformanceMeasurement | null {
    return this.measurements.get(operationId) || 
           this.completedMeasurements.find(m => m.operationId === operationId) || 
           null;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
    this.completedMeasurements = [];
    this.metricsCollector.clear();
  }

  /**
   * Log performance summary
   */
  logPerformanceSummary(): void {
    if (!this.logger) return;

    const stats = this.getAllPerformanceStats();
    const runningOps = this.getRunningOperations();

    this.logger.info('⚡ Performance Summary:');
    this.logger.info('┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                        Performance Report                           │');
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');

    for (const stat of stats) {
      const successRate = ((stat.successfulOperations / stat.totalOperations) * 100).toFixed(1);
      this.logger.info(`│ ${stat.operationType}:`);
      this.logger.info(`│   Total: ${stat.totalOperations}, Success Rate: ${successRate}%`);
      this.logger.info(`│   Avg: ${stat.averageDuration.toFixed(0)}ms, P95: ${stat.percentiles.p95.toFixed(0)}ms`);
    }

    if (runningOps.length > 0) {
      this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
      this.logger.info(`│ Currently Running: ${runningOps.length} operations`);
    }

    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
  }

  /**
   * Get metrics collector for advanced metrics
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = percentile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower] || 0;
    }
    
    const weight = index - lower;
    const lowerVal = sortedValues[lower] || 0;
    const upperVal = sortedValues[upper] || 0;
    return lowerVal * (1 - weight) + upperVal * weight;
  }
} 