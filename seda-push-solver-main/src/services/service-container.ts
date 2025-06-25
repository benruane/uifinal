/**
 * Simple Service Container
 * Simplified service management without over-engineering
 */

import { SEDAService, ConfigService, LoggingService } from './index';

/**
 * Simple service container with concrete implementations
 */
export class ServiceContainer {
  public readonly sedaService: SEDAService;
  public readonly configService: ConfigService;
  public readonly loggingService: LoggingService;

  constructor() {
    this.loggingService = new LoggingService();
    this.configService = new ConfigService();
    this.sedaService = new SEDAService();
  }

  /**
   * Create a production service container
   */
  static createProduction(): ServiceContainer {
    return new ServiceContainer();
  }
}

/**
 * Default service instances for simple access
 */
export const DEFAULT_SERVICES = ServiceContainer.createProduction(); 