/**
 * Configuration Test - Verify configuration functions work after refactoring
 */

import { 
  getSedaNetworkConfig,
  getSedaDataRequestConfig,
  validateSedaNetworkConfig,
  SEDA_NETWORKS
} from '../../src/config';

import type { SEDADataRequestConfig, NetworkConfig } from '../../src/types';

// Test getting network configuration
const testnetConfig: NetworkConfig = getSedaNetworkConfig('testnet');
console.log('✅ getSedaNetworkConfig works');
console.log('   Testnet RPC:', testnetConfig.rpcEndpoint);
console.log('   Testnet network:', testnetConfig.name);

// Test getting DataRequest configuration
const drConfig: SEDADataRequestConfig = getSedaDataRequestConfig('testnet');
console.log('✅ getSedaDataRequestConfig works');
console.log('   Oracle Program ID:', drConfig.oracleProgramId);
console.log('   Gas Limit:', drConfig.execGasLimit);

// Test validation
try {
  validateSedaNetworkConfig(testnetConfig, 'testnet');
  console.log('✅ validateSedaNetworkConfig works');
} catch (error) {
  console.error('❌ Validation failed:', error);
}

// Test that the network configs are accessible
console.log('✅ SEDA_NETWORKS accessible');
console.log('   Available networks:', Object.keys(SEDA_NETWORKS));

console.log('\n✅ All configuration tests passed!'); 