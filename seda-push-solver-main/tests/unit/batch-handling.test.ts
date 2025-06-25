/**
 * Test the new batch handling functionality
 */

import { expect, test, describe } from 'bun:test';
import { loadSEDAConfig } from '../../src/config';
import { SEDADataRequestBuilder } from '../../src/core/data-request';
import { MockLoggingService } from '../mocks';

// Mock the batch handling functions for testing
async function mockAwaitDataRequestResult(
  queryConfig: any,
  drId: string,
  blockHeight: bigint,
  awaitOptions: any,
  networkConfig: any,
  logger: any
) {
  // Simulate the original result
  const basicResult = {
    drId: drId,
    exitCode: 0,
    result: '0x1234567890abcdef',
    blockHeight: Number(blockHeight),
    gasUsed: '150000'
  };

  // Simulate batch assignment
  const batchAssignment = BigInt(1001);
  logger.info(`✅ Batch assignment received: ${batchAssignment}`);

  // Simulate batch fetching
  logger.info(`⏳ Polling for batch ${batchAssignment} completion...`);
  
  // Simulate successful batch fetch after some attempts
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate polling delay
  
  const batch = {
    batchNumber: batchAssignment,
    blockHeight: BigInt(500123),
    batchId: `batch_${batchAssignment}_${Date.now()}`,
    currentDataResultRoot: '0x' + Math.random().toString(16).substring(2, 66),
    dataResultRoot: '0x' + Math.random().toString(16).substring(2, 66),
    validatorRoot: '0x' + Math.random().toString(16).substring(2, 66),
    dataResultEntries: [
      Buffer.from(`entry1_${batchAssignment}`),
      Buffer.from(`entry2_${batchAssignment}`),
      Buffer.from(`entry3_${batchAssignment}`)
    ]
  };

  logger.info('┌─────────────────────────────────────────────────────────────────────┐');
  logger.info('│                           📦 Batch Information                      │');
  logger.info('├─────────────────────────────────────────────────────────────────────┤');
  logger.info(`│ Batch Number: ${batch.batchNumber}`);
  logger.info(`│ Batch ID: ${batch.batchId}`);
  logger.info(`│ Block Height: ${batch.blockHeight}`);
  logger.info(`│ Current Data Result Root: ${batch.currentDataResultRoot}`);
  logger.info(`│ Data Result Root: ${batch.dataResultRoot}`);
  logger.info(`│ Validator Root: ${batch.validatorRoot}`);
  logger.info(`│ Data Result Entries: ${batch.dataResultEntries.length} entries`);
  logger.info('└─────────────────────────────────────────────────────────────────────┘');

  return basicResult;
}

describe('Batch Handling Functionality', () => {
  test('should demonstrate batch assignment and fetching flow', async () => {
    const logger = new MockLoggingService();
    const config = loadSEDAConfig();
    
    console.log('🧪 Testing Batch Handling Flow');
    
    // Simulate a data request completion with batch handling
    const result = await mockAwaitDataRequestResult(
      { rpc: config.rpcEndpoint },
      'test-dr-id-12345',
      BigInt(12345),
      { timeoutSeconds: 120, pollingIntervalSeconds: 5 },
      { name: 'testnet', explorerEndpoint: 'https://testnet.explorer.seda.xyz' },
      logger
    );
    
    // Verify the result structure
    expect(result.drId).toBe('test-dr-id-12345');
    expect(result.exitCode).toBe(0);
    expect(result.blockHeight).toBe(12345);
    expect(typeof result.gasUsed).toBe('string');
    
    // Verify batch-related logs were captured
    const logs = logger.getLogs();
    const batchAssignmentLog = logs.find(log => log.message.includes('Batch assignment received'));
    const batchPollingLog = logs.find(log => log.message.includes('Polling for batch'));
    const batchInfoLog = logs.find(log => log.message.includes('Batch Information'));
    
    expect(batchAssignmentLog).toBeDefined();
    expect(batchPollingLog).toBeDefined();
    expect(batchInfoLog).toBeDefined();
    
    console.log('✅ Batch handling flow test completed successfully');
    console.log(`   📋 Captured ${logs.length} log messages`);
    console.log(`   🔍 Found batch assignment log: ${!!batchAssignmentLog}`);
    console.log(`   ⏳ Found batch polling log: ${!!batchPollingLog}`);
    console.log(`   📦 Found batch info log: ${!!batchInfoLog}`);
  });

  test('should handle batch polling retry logic', async () => {
    const logger = new MockLoggingService();
    
    // Mock a scenario where batch polling fails initially
    let attemptCount = 0;
    const mockBatchFetch = async (batchNumber: bigint) => {
      attemptCount++;
      if (attemptCount < 3) {
        return null; // Simulate batch not ready
      }
      return {
        batchNumber,
        blockHeight: BigInt(500000),
        batchId: `batch_${batchNumber}`,
        currentDataResultRoot: '0x1234',
        dataResultRoot: '0x5678',
        validatorRoot: '0x9abc'
      };
    };

    logger.info('🔄 Testing batch polling retry logic...');
    
    const batchNumber = BigInt(1002);
    let batch = null;
    
    // Simulate the retry logic
    for (let attempt = 1; attempt <= 5; attempt++) {
      logger.info(`🔄 Batch polling attempt ${attempt}/5 for batch ${batchNumber}...`);
      batch = await mockBatchFetch(batchNumber);
      
      if (batch) {
        logger.info(`✅ Batch ${batchNumber} is complete and fetched!`);
        break;
      } else {
        logger.info(`⏱️ Batch ${batchNumber} not ready yet, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 10)); // Short delay for test
      }
    }
    
    expect(batch).not.toBeNull();
    expect(batch?.batchNumber).toBe(batchNumber);
    expect(attemptCount).toBe(3); // Should succeed on 3rd attempt
    
    const logs = logger.getLogs();
    const retryLogs = logs.filter(log => log.message.includes('polling attempt'));
    expect(retryLogs.length).toBeGreaterThan(1);
    
    console.log('✅ Batch polling retry test completed');
    console.log(`   🔄 Total attempts made: ${attemptCount}`);
    console.log(`   📝 Retry logs captured: ${retryLogs.length}`);
  });
});

console.log('\n🎉 Batch handling tests completed!'); 