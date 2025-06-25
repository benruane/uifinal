/**
 * Mock Service Container for Testing
 * Replaces the createTest method that should not be in production code
 */

import { MockConfigService } from './config-service.mock';
import { MockLoggingService } from './logging-service.mock';
import { MockSEDAService } from './seda-service.mock';

/**
 * Mock service container with test services
 */
export class MockServiceContainer {
  public readonly configService: MockConfigService;
  public readonly loggingService: MockLoggingService;
  public readonly sedaService: MockSEDAService;

  constructor() {
    this.configService = new MockConfigService();
    this.loggingService = new MockLoggingService();
    this.sedaService = new MockSEDAService();
  }

  /**
   * Create a mock service container for testing
   */
  static createTest(): MockServiceContainer {
    return new MockServiceContainer();
  }
} 