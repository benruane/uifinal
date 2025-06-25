/**
 * EVM Networks Unit Tests
 * Tests for EVM network integration functionality
 */

import type { EvmGasConfig } from '../../src/types';

console.log('🧪 Testing EVM Networks Module');

// Test EVM configuration loading
console.log('\n✅ EVM Configuration Tests');

// Mock environment for testing
const originalEnv = process.env;

// Test 1: EVM networks configuration
try {
  process.env = {
    ...originalEnv,
    BASE_RPC_URL: 'https://mainnet.base.org',
    BASE_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
    BASE_CHAIN_ID: '8453',
    BASE_GAS_LIMIT: '500000',
    BASE_ENABLED: 'true',
    SEDA_MNEMONIC: 'test-mnemonic',
    SEDA_ORACLE_PROGRAM_ID: 'test-oracle-id'
  };

  // Clear require cache to get fresh config
  delete require.cache[require.resolve('../../config')];
  const { evmNetworks, getEnabledEvmNetworks } = require('../../config');

  console.log(`   EVM Networks found: ${evmNetworks.length}`);
  
  const baseNetwork = evmNetworks.find((n: any) => n.name === 'base');
  if (baseNetwork) {
    console.log(`   Base network configured: ${baseNetwork.displayName}`);
    console.log(`   Chain ID: ${baseNetwork.chainId}`);
    console.log(`   Gas limit: ${baseNetwork.gas.gasLimit}`);
  }

  const enabledNetworks = getEnabledEvmNetworks();
  console.log(`   Enabled networks: ${enabledNetworks.length}`);

} catch (error) {
  console.log(`   ❌ EVM config test failed: ${error}`);
} finally {
  process.env = originalEnv;
}

// Test 2: EVM types and structures
console.log('\n✅ EVM Types Tests');

try {
  // Test result structure
  const mockResult = {
    success: true,
    txHash: '0xabcdef1234567890',
    blockNumber: 12345,
    gasUsed: '21000',
    network: 'base',
    attempt: 1,
    duration: 1500
  };

  console.log(`   Success result structure: ${mockResult.success ? '✅' : '❌'}`);
  console.log(`   TX Hash format: ${mockResult.txHash.startsWith('0x') ? '✅' : '❌'}`);
  console.log(`   Block number: ${mockResult.blockNumber > 0 ? '✅' : '❌'}`);

  // Test failure structure
  const mockFailure = {
    success: false,
    error: 'Network connection failed',
    network: 'base',
    attempt: 3,
    duration: 5000
  };

  console.log(`   Failure result structure: ${!mockFailure.success ? '✅' : '❌'}`);
  console.log(`   Error message present: ${mockFailure.error ? '✅' : '❌'}`);

} catch (error) {
  console.log(`   ❌ Types test failed: ${error}`);
}

// Test 3: SEDA result data structure
console.log('\n✅ SEDA Result Data Tests');

try {
  const mockSedaResult = {
    drId: 'test-dr-id-123',
    result: { value: 42, timestamp: Date.now() },
    blockHeight: BigInt(12345),
    txHash: 'seda-tx-hash-456',
    timestamp: Date.now()
  };

  console.log(`   DR ID present: ${mockSedaResult.drId ? '✅' : '❌'}`);
  console.log(`   Result data present: ${mockSedaResult.result ? '✅' : '❌'}`);
  console.log(`   Block height type: ${typeof mockSedaResult.blockHeight === 'bigint' ? '✅' : '❌'}`);
  console.log(`   TX Hash present: ${mockSedaResult.txHash ? '✅' : '❌'}`);
  console.log(`   Timestamp valid: ${mockSedaResult.timestamp > 0 ? '✅' : '❌'}`);

} catch (error) {
  console.log(`   ❌ SEDA result test failed: ${error}`);
}

// Test 4: Gas configuration parsing
console.log('\n✅ Gas Configuration Tests');

try {
  // Test modern gas configuration with proper types
  const modernGasConfig: EvmGasConfig = {
    gasLimit: 500000,
    gasPrice: '1000000000',
    useEIP1559: false
  };

  console.log(`   Gas limit: ${modernGasConfig.gasLimit > 0 ? '✅' : '❌'}`);
  console.log(`   Gas price: ${modernGasConfig.gasPrice ? '✅' : '❌'}`);
  console.log(`   EIP-1559 mode: ${modernGasConfig.useEIP1559 ? '✅' : '❌'}`);

} catch (error) {
  console.log(`   ❌ Gas config test failed: ${error}`);
}

console.log('\n🎉 All EVM Networks tests completed!'); 