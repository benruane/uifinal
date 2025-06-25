/**
 * Infrastructure Services Tests
 * Comprehensive test suite for all infrastructure services
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  ProcessService,
  TimerService,
  HealthService,
  InfrastructureContainer
} from '../../src/infrastructure';
import {
  MockProcessService,
  MockTimerService,
  MockHealthService,
  MockInfrastructureContainer
} from '../mocks';
import { LoggingService } from '../../src/services';

describe('Infrastructure Services', () => {
  let mockLoggingService: LoggingService;

  beforeEach(() => {
    mockLoggingService = new LoggingService();
  });

  describe('ProcessService', () => {
    it('should register and call shutdown handlers', async () => {
      const processService = new MockProcessService();
      let shutdownCalled = false;

      processService.onShutdown(() => {
        shutdownCalled = true;
      });

      await processService.gracefulShutdown();
      expect(shutdownCalled).toBe(true);
    });

    it('should handle async shutdown handlers', async () => {
      const processService = new MockProcessService();
      let asyncResult = '';

      processService.onShutdown(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        asyncResult = 'completed';
      });

      await processService.gracefulShutdown();
      expect(asyncResult).toBe('completed');
    });

    it('should track shutdown state', async () => {
      const processService = new MockProcessService();
      expect(processService.isShuttingDown()).toBe(false);

      const shutdownPromise = processService.gracefulShutdown();
      expect(processService.isShuttingDown()).toBe(true);

      await shutdownPromise;
      expect(processService.isShuttingDown()).toBe(true);
    });

    it('should provide process information', () => {
      const processService = new MockProcessService();
      const info = processService.getProcessInfo();

      expect(info.pid).toBeDefined();
      expect(info.uptime).toBeGreaterThanOrEqual(0);
      expect(info.platform).toBeDefined();
      expect(info.nodeVersion).toBeDefined();
      expect(info.memoryUsage).toBeDefined();
    });
  });

  describe('TimerService', () => {
    it('should set and clear timeouts', () => {
      const timerService = new MockTimerService();
      let timeoutCalled = false;

      const timeoutId = timerService.setTimeout(() => {
        timeoutCalled = true;
      }, 100);

      // Advance time to trigger timeout
      timerService.advanceTime(150);
      expect(timeoutCalled).toBe(true);

      // Clear timeout should not affect already fired timer
      timerService.clearTimeout(timeoutId);
    });

    it('should set and clear intervals', () => {
      const timerService = new MockTimerService();
      let intervalCount = 0;

      const intervalId = timerService.setInterval(() => {
        intervalCount++;
      }, 100);

      // Advance time to trigger interval multiple times
      timerService.advanceTime(250);
      expect(intervalCount).toBe(2);

      // Clear interval
      timerService.clearInterval(intervalId);
      timerService.advanceTime(200);
      expect(intervalCount).toBe(2); // Should not increase
    });

    it('should handle delay promises', async () => {
      const timerService = new MockTimerService();
      const startTime = timerService.now();

      await timerService.delay(100);
      const endTime = timerService.now();

      expect(endTime - startTime).toBe(100);
    });

    it('should track timer count', () => {
      const timerService = new MockTimerService();
      expect(timerService.getTimerCount()).toBe(0);

      timerService.setTimeout(() => {}, 100);
      expect(timerService.getTimerCount()).toBe(1);

      timerService.setInterval(() => {}, 100);
      expect(timerService.getTimerCount()).toBe(2);

      timerService.clearAllTimers();
      expect(timerService.getTimerCount()).toBe(0);
    });

    it('should run only pending timers', () => {
      const timerService = new MockTimerService();
      let timeoutCalled = false;
      let intervalCalled = false;

      timerService.setTimeout(() => { timeoutCalled = true; }, 100);
      timerService.setInterval(() => { intervalCalled = true; }, 200);

      timerService.runOnlyPendingTimers();
      expect(timeoutCalled).toBe(true);
      expect(intervalCalled).toBe(false);
    });
  });

  describe('HealthService', () => {
    let healthService: MockHealthService;
    let timerService: MockTimerService;

    beforeEach(() => {
      timerService = new MockTimerService();
      healthService = new MockHealthService(mockLoggingService, timerService);
    });

    it('should register and run health checks', async () => {
      healthService.registerCheck('test-check', async () => ({
        status: 'healthy',
        responseTime: 10,
        timestamp: Date.now()
      }));

      const result = await healthService.runCheck('test-check');
      expect(result.status).toBe('healthy');
    });

    it('should handle health check failures', async () => {
      healthService.registerCheck('failing-check', async () => {
        throw new Error('Check failed');
      });

      // Set mock result for failing check
      healthService.setMockResult('failing-check', {
        status: 'unhealthy',
        responseTime: 5,
        timestamp: Date.now(),
        error: 'Check failed'
      });

      const result = await healthService.runCheck('failing-check');
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Check failed');
    });

    it('should provide overall health status', async () => {
      healthService.registerCheck('healthy-check', async () => ({
        status: 'healthy',
        responseTime: 5,
        timestamp: Date.now()
      }));

      healthService.registerCheck('degraded-check', async () => ({
        status: 'degraded',
        responseTime: 15,
        timestamp: Date.now()
      }));

      // Set mock results for the checks
      healthService.setMockResult('healthy-check', {
        status: 'healthy',
        responseTime: 5,
        timestamp: Date.now()
      });

      healthService.setMockResult('degraded-check', {
        status: 'degraded',
        responseTime: 15,
        timestamp: Date.now()
      });

      const health = await healthService.getOverallHealth();
      expect(health.status).toBe('degraded');
      expect(Object.keys(health.checks)).toContain('healthy-check');
      expect(Object.keys(health.checks)).toContain('degraded-check');
    });

    it('should track metrics', () => {
      healthService.recordRequest(true, 100);
      healthService.recordRequest(false, 200);
      healthService.recordError('Test error');

      const metrics = healthService.getMetrics();
      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.successful).toBe(1);
      expect(metrics.requests.failed).toBe(1);
      expect(metrics.errors.total).toBe(1);
    });

    it('should start and stop periodic checks', () => {
      healthService.startPeriodicChecks(1000);
      expect(timerService.getTimerCount()).toBe(1);

      healthService.stopPeriodicChecks();
      expect(timerService.getTimerCount()).toBe(0);
    });
  });

  describe('InfrastructureContainer', () => {
    it('should create production container', () => {
      const container = InfrastructureContainer.createProduction(mockLoggingService);
      
      expect(container.processService).toBeDefined();
      expect(container.timerService).toBeDefined();
      expect(container.healthService).toBeDefined();
    });

        it('should create test container with mocks', () => {
      const container = MockInfrastructureContainer.createTest(mockLoggingService);

      expect(container.processService).toBeInstanceOf(MockProcessService);
      expect(container.timerService).toBeInstanceOf(MockTimerService);
      expect(container.healthService).toBeInstanceOf(MockHealthService);
    });

         it('should create independent infrastructure instances', () => {
      const container1 = InfrastructureContainer.createProduction(mockLoggingService);
      const container2 = InfrastructureContainer.createProduction(mockLoggingService);
      
      expect(container1).not.toBe(container2);
      expect(container1.processService).not.toBe(container2.processService);
    });
  });

  describe('Integration', () => {
    it('should work together in a complete infrastructure setup', async () => {
      const container = MockInfrastructureContainer.createTest(mockLoggingService);

      const { processService, timerService, healthService } = container;

      // Register health check
      healthService.registerCheck('integration-test', async () => ({
        status: 'healthy',
        responseTime: 10,
        timestamp: timerService.now()
      }));

      // Set up process shutdown handler
      let shutdownCalled = false;
      processService.onShutdown(() => {
        shutdownCalled = true;
        healthService.stopPeriodicChecks();
      });

      // Start health monitoring
      healthService.startPeriodicChecks(100);

      // Check everything is working
      expect(healthService.getMetrics().uptime).toBeGreaterThanOrEqual(0);
      
      const health = await healthService.getOverallHealth();
      expect(health.status).toBe('healthy');

      // Simulate graceful shutdown
      await processService.gracefulShutdown();
      expect(shutdownCalled).toBe(true);
    });
  });
}); 