/**
 * Alerts Manager
 * Simple alerting system for critical events
 */

import type { LoggingServiceInterface } from '../services';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert data
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * Simple alerts manager
 */
export class AlertsManager {
  private alerts: Alert[] = [];
  private maxAlerts = 1000;

  constructor(private logger?: LoggingServiceInterface) {}

  /**
   * Send an alert
   */
  sendAlert(
    severity: AlertSeverity,
    message: string,
    source: string,
    metadata?: Record<string, any>
  ): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      message,
      timestamp: Date.now(),
      source,
      metadata
    };

    this.alerts.push(alert);

    // Trim alerts to prevent memory leaks
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log alert
    this.logAlert(alert);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Log alert to console
   */
  private logAlert(alert: Alert): void {
    if (!this.logger) return;

    const icon = this.getSeverityIcon(alert.severity);
    const metadataStr = alert.metadata ? ` | ${JSON.stringify(alert.metadata)}` : '';
    
    switch (alert.severity) {
      case AlertSeverity.INFO:
        this.logger.info(`${icon} [${alert.source}] ${alert.message}${metadataStr}`);
        break;
      case AlertSeverity.WARNING:
        this.logger.warn(`${icon} [${alert.source}] ${alert.message}${metadataStr}`);
        break;
      case AlertSeverity.ERROR:
      case AlertSeverity.CRITICAL:
        this.logger.error(`${icon} [${alert.source}] ${alert.message}${metadataStr}`);
        break;
    }
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'ℹ️';
      case AlertSeverity.WARNING:
        return '⚠️';
      case AlertSeverity.ERROR:
        return '❌';
      case AlertSeverity.CRITICAL:
        return '🚨';
      default:
        return '📢';
    }
  }
} 