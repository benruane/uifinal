/**
 * Simple Infrastructure Container
 * Simplified infrastructure service management
 */

import type { LoggingService } from '../services';
import { ProcessService, TimerService, HealthService } from './index';

/**
 * Simple infrastructure container with concrete implementations
 */
export class InfrastructureContainer {
  public readonly processService: ProcessService;
  public readonly timerService: TimerService;
  public readonly healthService: HealthService;

  constructor(loggingService: LoggingService) {
    this.timerService = new TimerService();
    this.processService = new ProcessService(loggingService);
    this.healthService = new HealthService(loggingService, this.timerService);
  }

  /**
   * Create a production infrastructure container
   */
  static createProduction(loggingService: LoggingService): InfrastructureContainer {
    return new InfrastructureContainer(loggingService);
  }
} 