/**
 * Types Test - Validate core type definitions
 */

import type { SedaConfig, DataRequestResult, DataRequestOptions, NetworkType } from '../../src/types';

// Test type compilation and basic usage
const testConfig: SedaConfig = {
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

const testResult: DataRequestResult = {
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

const testOptions: DataRequestOptions = {
  memo: 'test memo',
  customTimeout: 60
};

console.log('✅ Types test passed - all interfaces compile correctly');
console.log('   Config network:', testConfig.network);
console.log('   Result DR ID:', testResult.drId);
console.log('   Options memo:', testOptions.memo);

// Test network type validation
const validNetworks: NetworkType[] = ['testnet', 'mainnet', 'local'];
console.log('   Valid networks:', validNetworks);

export { testConfig, testResult, testOptions }; 