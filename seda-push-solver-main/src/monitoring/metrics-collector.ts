/**
 * Metrics Collector
 * Centralized metrics collection system for monitoring and analytics
 */

import type { LoggingServiceInterface } from '../services';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

/**
 * Metric data point
 */
export interface MetricPoint {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: string;
}

/**
 * Metric summary for reporting
 */
export interface MetricSummary {
  name: string;
  type: MetricType;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  latest: number;
  tags?: Record<string, string>;
}

/**
 * Centralized metrics collector
 */
export class MetricsCollector {
  private metrics = new Map<string, MetricPoint[]>();
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private timers = new Map<string, number[]>();
  
  constructor(private logger?: LoggingServiceInterface) {}

  /**
   * Record a counter metric (incrementing value)
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.createKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value: current + value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Record a gauge metric (absolute value)
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.createKey(name, tags);
    this.gauges.set(key, value);
    
    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Record a timer metric (duration measurement)
   */
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    const key = this.createKey(name, tags);
    const times = this.timers.get(key) || [];
    times.push(duration);
    this.timers.set(key, times);
    
    this.recordMetric({
      name,
      type: MetricType.TIMER,
      value: duration,
      timestamp: Date.now(),
      tags,
      unit: 'ms'
    });
  }

  /**
   * Record a histogram metric (value distribution)
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Get metric summary for a specific metric name
   */
  getMetricSummary(name: string, tags?: Record<string, string>): MetricSummary | null {
    const key = this.createKey(name, tags);
    const points = this.metrics.get(key);
    
    if (!points || points.length === 0) {
      return null;
    }

    const values = points.map(p => p.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      name,
      type: points[0]?.type || MetricType.GAUGE,
      count: values.length,
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1] || 0,
      tags
    };
  }

  /**
   * Get all metric summaries
   */
  getAllMetricSummaries(): MetricSummary[] {
    const summaries: MetricSummary[] = [];
    const processedKeys = new Set<string>();
    
    for (const [key, points] of this.metrics.entries()) {
      if (points.length > 0 && !processedKeys.has(key)) {
        const { name, tags } = this.parseKey(key);
        const summary = this.getMetricSummary(name, tags);
        if (summary) {
          summaries.push(summary);
          processedKeys.add(key);
        }
      }
    }
    
    return summaries;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.timers.clear();
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    timers: Record<string, number[]>;
    summaries: MetricSummary[];
  } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timers: Object.fromEntries(this.timers),
      summaries: this.getAllMetricSummaries()
    };
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary(): void {
    if (!this.logger) return;
    
    const summaries = this.getAllMetricSummaries();
    
    this.logger.info('📊 Metrics Summary:');
    this.logger.info('┌─────────────────────────────────────────────────────────────────────┐');
    this.logger.info('│                           Metrics Report                           │');
    this.logger.info('├─────────────────────────────────────────────────────────────────────┤');
    
    for (const summary of summaries) {
      const tagsStr = summary.tags ? ` (${Object.entries(summary.tags).map(([k, v]) => `${k}=${v}`).join(', ')})` : '';
      this.logger.info(`│ ${summary.name}${tagsStr}:`);
      this.logger.info(`│   Type: ${summary.type}, Count: ${summary.count}`);
      this.logger.info(`│   Min: ${summary.min.toFixed(2)}, Max: ${summary.max.toFixed(2)}, Avg: ${summary.avg.toFixed(2)}`);
    }
    
    this.logger.info('└─────────────────────────────────────────────────────────────────────┘');
  }

  /**
   * Create a unique key for metric storage
   */
  private createKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
      
    return `${name}|${tagStr}`;
  }

  /**
   * Parse key back to name and tags
   */
  private parseKey(key: string): { name: string; tags?: Record<string, string> } {
    const parts = key.split('|');
    const name = parts[0];
    
    if (!name) {
      throw new Error(`Invalid metric key: ${key}`);
    }
    
    if (parts.length === 1) {
      return { name };
    }
    
    const tags: Record<string, string> = {};
    const tagPart = parts[1];
    if (tagPart) {
      const tagPairs = tagPart.split(',');
      
      for (const pair of tagPairs) {
        const [k, v] = pair.split('=');
        if (k && v) {
          tags[k] = v;
        }
      }
    }
    
    return { name, tags };
  }

  /**
   * Record metric point internally
   */
  private recordMetric(point: MetricPoint): void {
    const key = this.createKey(point.name, point.tags);
    const points = this.metrics.get(key) || [];
    points.push(point);
    
    // Keep only last 1000 points per metric to prevent memory leaks
    if (points.length > 1000) {
      points.shift();
    }
    
    this.metrics.set(key, points);
  }
} 