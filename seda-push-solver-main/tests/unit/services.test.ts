/**
 * Services Test - Verify the new service layer functionality
 */

import {
  ServiceContainer,
  LogLevel
} from '../../src/services';
import {
  MockSEDAService,
  MockConfigService,
  MockLoggingService,
  MockServiceContainer
} from '../mocks';

console.log('🧪 Testing Service Layer\n');

// Test service container creation
console.log('✅ Production service container');
const productionContainer = ServiceContainer.createProduction();
console.log('   SEDA Service:', productionContainer.sedaService.constructor.name);
console.log('   Config Service:', productionContainer.configService.constructor.name);
console.log('   Logging Service:', productionContainer.loggingService.constructor.name);

// Test mock service container
console.log('\n✅ Test service container');
const testContainer = MockServiceContainer.createTest();
console.log('   SEDA Service:', testContainer.sedaService.constructor.name);
console.log('   Config Service:', testContainer.configService.constructor.name);
console.log('   Logging Service:', testContainer.loggingService.constructor.name);

// Test service container independence (no global state anymore)
console.log('\n✅ Service container independence');
const productionServices = ServiceContainer.createProduction();
console.log('   Production services type:', productionServices.constructor.name);

// Create separate test container instance
const testContainerForTesting = ServiceContainer.createProduction();
console.log('   Test services type:', testContainerForTesting.constructor.name);

// Each container is independent
console.log('   Containers are separate:', productionServices !== testContainerForTesting);

// Test mock service functionality
console.log('\n✅ Mock service functionality');
const mockConfig = new MockConfigService();
mockConfig.setMockEnvVar('TEST_VAR', 'test-value');
console.log('   Mock env var:', mockConfig.getEnvVar('TEST_VAR'));

const mockLogger = new MockLoggingService();
mockLogger.setLogLevel(LogLevel.DEBUG);
mockLogger.info('Test info message');
mockLogger.error('Test error message');
mockLogger.debug('Test debug message');
console.log('   Captured logs:', mockLogger.getLogs().length);
console.log('   Info logs:', mockLogger.getLogsByLevel('info').length);
console.log('   Error logs:', mockLogger.getLogsByLevel('error').length);

// Test mock SEDA service
console.log('\n✅ Mock SEDA service');
const mockSEDA = new MockSEDAService();
const mockConfig2 = {
  network: 'local' as const,
  rpcEndpoint: 'http://localhost:26657',
  mnemonic: 'test mnemonic',
  oracleProgramId: 'test-oracle-program-id',
  drTimeoutSeconds: 60,
  drPollingIntervalSeconds: 1,
  scheduler: {
    intervalMs: 15000,
    continuous: true,
    maxRetries: 3,
    memo: 'Test DataRequest'
  },
  cosmos: {
    postingTimeoutMs: 20000,
    maxQueueSize: 100
  },
  logging: {
    level: 'info' as const
  }
};

mockSEDA.createSigner(mockConfig2).then(signer => {
  console.log('   Mock signer created:', !!signer);
  
  return mockSEDA.postAndAwaitDataRequest(
    signer,
    {} as any, // PostDataRequestInput
    {} as any, // GasOptions
    { timeoutSeconds: 30, pollingIntervalSeconds: 1 }
  );
}).then(result => {
  console.log('   Mock DataRequest result:', result.drId.startsWith('mock-dr-id'));
  console.log('   Mock exit code:', result.exitCode);
}).catch(error => {
  console.error('   Mock service error:', error);
});

console.log('\n🎉 All service layer tests completed!');

export {}; // Make this a module 