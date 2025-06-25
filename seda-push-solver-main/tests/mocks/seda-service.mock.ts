/**
 * Mock SEDA Service for Testing
 * Extracted from production source to tests/mocks
 */

import type { Signer } from '@seda-protocol/dev-tools';
import type { PostDataRequestInput, GasOptions } from '@seda-protocol/dev-tools';
import type { SedaServiceInterface } from '../../src/services/seda-service';
import type { SedaConfig } from '../../src/types';

/**
 * Mock implementation for testing
 */
export class MockSEDAService implements SedaServiceInterface {
  private mockResults: Map<string, any> = new Map();

  async createSigner(config: SedaConfig): Promise<Signer> {
    // Return a mock signer object
    return { 
      address: 'mock-address',
      mnemonic: config.mnemonic 
    } as any;
  }

  async postAndAwaitDataRequest(
    signer: Signer,
    input: PostDataRequestInput,
    gasOptions: GasOptions,
    awaitOptions: { timeoutSeconds: number; pollingIntervalSeconds: number }
  ) {
    // Return mock result matching the actual SEDA protocol response
    return {
      version: '1.0.0',
      drId: 'mock-dr-id-' + Date.now(),
      drBlockHeight: BigInt(12345),
      consensus: true,
      exitCode: 0,
      result: '0x1234567890abcdef',
      resultAsUtf8: 'mock-result',
      blockHeight: BigInt(12345),
      blockTimestamp: new Date(),
      gasUsed: BigInt(100000),
      paybackAddress: 'mock-payback-address',
      sedaPayload: 'mock-seda-payload'
    };
  }

  validateSigner(signer: Signer): boolean {
    return true; // Mock signer is always valid
  }

  /**
   * Set mock result for testing specific scenarios
   */
  setMockResult(key: string, result: any): void {
    this.mockResults.set(key, result);
  }
} 