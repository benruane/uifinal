/**
 * Mock Infrastructure Container for Testing
 * Replaces the createTest method that should not be in production code
 */

import type { LoggingServiceInterface } from '../../src/services';
import { MockProcessService } from './infrastructure.mock';
import { MockTimerService } from './infrastructure.mock';
import { MockHealthService } from './infrastructure.mock';

/**
 * Mock infrastructure container with test services
 */
export class MockInfrastructureContainer {
  public readonly processService: MockProcessService;
  public readonly timerService: MockTimerService;
  public readonly healthService: MockHealthService;

  constructor(loggingService: LoggingServiceInterface) {
    this.processService = new MockProcessService();
    this.timerService = new MockTimerService();
    this.healthService = new MockHealthService(loggingService, this.timerService);
  }

  /**
   * Create a mock infrastructure container for testing
   */
  static createTest(loggingService: LoggingServiceInterface): MockInfrastructureContainer {
    return new MockInfrastructureContainer(loggingService);
  }
} 