/**
 * Index Exports Test - Verify all types and classes are accessible through main export
 */

import { 
  SEDADataRequestBuilder,
  loadSEDAConfig,
  SEDADataRequestScheduler
} from '../../src/index';

import type { 
  SedaConfig, 
  DataRequestResult, 
  DataRequestOptions,
  NetworkType
} from '../../src/index';

// Test that all types are accessible
const config: SedaConfig = {
  network: 'testnet' as NetworkType,
  rpcEndpoint: 'https://rpc.testnet.seda.xyz',
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

const result: DataRequestResult = {
  drId: 'test-id',
  drBlockHeight: 12345n,
  exitCode: 0,
  gasUsed: 100000n,
  result: 'test-result',
  paybackAddress: 'test-address',
  sedaPayload: 'test-payload',
  version: 'test-version',
  blockTimestamp: 1640995200000n
};

const options: DataRequestOptions = {
  memo: 'test memo'
};

console.log('✅ Index exports test passed - all types accessible');
console.log('   SEDAConfig:', typeof config);
console.log('   DataRequestResult:', typeof result);
console.log('   DataRequestOptions:', typeof options);
console.log('   SEDADataRequestBuilder:', typeof SEDADataRequestBuilder);
console.log('   loadSEDAConfig:', typeof loadSEDAConfig);
console.log('   SEDADataRequestScheduler:', typeof SEDADataRequestScheduler); 