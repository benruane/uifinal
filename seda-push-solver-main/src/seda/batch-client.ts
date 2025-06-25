/**
 * SEDA Batch Client
 * Handles fetching batch information from the SEDA chain
 */

import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import { sedachain } from "@seda-protocol/proto-messages";
import type { QueryConfig } from '@seda-protocol/dev-tools';
import type { LoggingServiceInterface } from '../services';
import type { SignedBatch } from '../types';
import { getErrorMessage } from '../helpers/error-utils';

/**
 * Client for SEDA batch operations
 */
export class BatchClient {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Create protobuf RPC client for SEDA chain queries
   */
  private async createSedaQueryClient(rpc: string) {
    const cometClient = await Comet38Client.connect(rpc);
    const queryClient = new QueryClient(cometClient);
    return createProtobufRpcClient(queryClient);
  }

  /**
   * Get DataResult to find batch assignment
   */
  private async getDataResult(
    drId: string,
    blockHeight: bigint,
    queryConfig: QueryConfig
  ): Promise<{ batchAssignment: bigint } | null> {
    try {
      const protoClient = await this.createSedaQueryClient(queryConfig.rpc);
      const client = new sedachain.batching.v1.QueryClientImpl(protoClient);
      
      this.logger.info(`📋 Querying DataResult for ${drId} at height ${blockHeight}...`);
      
      const response = await client.DataResult({ 
        dataRequestId: drId, 
        dataRequestHeight: blockHeight 
      });
      
      if (!response.batchAssignment || !response.dataResult) {
        this.logger.warn(`⚠️ DataResult not found for ${drId}`);
        return null;
      }
      
      this.logger.info(`✅ DataResult found - assigned to batch ${response.batchAssignment.batchNumber}`);
      
      return {
        batchAssignment: response.batchAssignment.batchNumber
      };
      
    } catch (error) {
      this.logger.error(`❌ Failed to get DataResult: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Get batch information directly from SEDA chain
   */
  private async getBatch(
    batchNumber: bigint,
    queryConfig: QueryConfig
  ): Promise<SignedBatch | null> {
    try {
      const protoClient = await this.createSedaQueryClient(queryConfig.rpc);
      const client = new sedachain.batching.v1.QueryClientImpl(protoClient);
      
      this.logger.info(`📦 Querying batch ${batchNumber} from SEDA chain...`);
      
      const response = await client.Batch({ 
        batchNumber, 
        latestSigned: false 
      });
      
      if (!response.batch) {
        this.logger.warn(`⚠️ Batch ${batchNumber} not found`);
        return null;
      }
      
      const { batch, batchSignatures, dataResultEntries, validatorEntries } = response;
      
      // Check if batch has signatures (indicates it's been signed by validators)
      if (!batchSignatures || batchSignatures.length === 0) {
        this.logger.warn(`⚠️ Batch ${batchNumber} has no signatures yet (still being processed by validators)`);
        return null;
      }
      
      if (!validatorEntries || validatorEntries.length === 0) {
        this.logger.warn(`⚠️ Batch ${batchNumber} has no validator entries`);
        return null;
      }
      
      this.logger.info(`✅ Batch ${batchNumber} fetched successfully with ${batchSignatures.length} signatures and ${validatorEntries.length} validators!`);
      
      return {
        batchNumber: batch.batchNumber,
        batchId: Buffer.from(batch.batchId).toString('hex'),
        blockHeight: batch.blockHeight,
        currentDataResultRoot: batch.currentDataResultRoot,
        dataResultRoot: batch.dataResultRoot,
        validatorRoot: batch.validatorRoot,
        dataResultEntries: dataResultEntries?.entries || [],
        batchSignatures: batchSignatures || [],
        validatorEntries: validatorEntries || []
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        this.logger.warn(`⚠️ Batch ${batchNumber} not found on chain`);
        return null;
      }
      this.logger.error(`❌ Failed to get batch ${batchNumber}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Get the latest signed batch from SEDA chain
   */
  private async getLatestSignedBatch(queryConfig: QueryConfig): Promise<SignedBatch | null> {
    try {
      const protoClient = await this.createSedaQueryClient(queryConfig.rpc);
      const client = new sedachain.batching.v1.QueryClientImpl(protoClient);
      
      this.logger.info(`📦 Querying latest signed batch from SEDA chain...`);
      
      const response = await client.Batch({ 
        batchNumber: 0n, // Ignored when latestSigned is true
        latestSigned: true 
      });
      
      if (!response.batch) {
        this.logger.warn(`⚠️ No latest signed batch found`);
        return null;
      }
      
      const { batch, batchSignatures, dataResultEntries, validatorEntries } = response;
      
      // Check if batch has signatures
      if (!batchSignatures || batchSignatures.length === 0) {
        this.logger.warn(`⚠️ Latest signed batch has no signatures`);
        return null;
      }
      
      if (!validatorEntries || validatorEntries.length === 0) {
        this.logger.warn(`⚠️ Latest signed batch has no validator entries`);
        return null;
      }
      
      this.logger.info(`✅ Latest signed batch ${batch.batchNumber} fetched with ${batchSignatures.length} signatures!`);
      
      return {
        batchNumber: batch.batchNumber,
        batchId: Buffer.from(batch.batchId).toString('hex'),
        blockHeight: batch.blockHeight,
        currentDataResultRoot: batch.currentDataResultRoot,
        dataResultRoot: batch.dataResultRoot,
        validatorRoot: batch.validatorRoot,
        dataResultEntries: dataResultEntries?.entries || [],
        batchSignatures: batchSignatures || [],
        validatorEntries: validatorEntries || []
      };
      
    } catch (error) {
      this.logger.error(`❌ Failed to get latest signed batch: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Fetch batch information for a specific DataRequest
   * Main public method for getting batch data
   */
  async fetchBatchForDataRequest(
    drId: string,
    blockHeight: bigint,
    queryConfig: QueryConfig,
    maxRetries: number,
    pollingIntervalMs: number
  ): Promise<SignedBatch | null> {
    try {
      this.logger.info('\n🔍 Fetching batch assignment and batch information from SEDA chain...');
      
      // Step 1: Get DataResult with batch assignment
      const dataResult = await this.getDataResult(drId, blockHeight, queryConfig);
      
      if (!dataResult) {
        return null;
      }
      
      const { batchAssignment } = dataResult;
      
      // Step 2: Poll for batch completion and fetch batch details
      this.logger.info(`⏳ Polling for batch ${batchAssignment} completion...`);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        this.logger.info(`🔄 Batch polling attempt ${attempt}/${maxRetries} for batch ${batchAssignment}...`);
        
        const batch = await this.getBatch(batchAssignment, queryConfig);
        
        if (batch) {
          this.logger.info(`✅ Batch ${batchAssignment} fetched successfully from SEDA chain!`);
          return batch;
        }
        
        if (attempt < maxRetries) {
          this.logger.info(`⏱️ Batch ${batchAssignment} not ready yet, waiting ${pollingIntervalMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
        }
      }
      
      // If the assigned batch doesn't have signatures yet, try to get the latest signed batch
      this.logger.warn(`⚠️ Assigned batch ${batchAssignment} not ready after ${maxRetries} attempts`);
      this.logger.info(`🔄 Trying to fetch latest signed batch instead...`);
      
      try {
        const latestSignedBatch = await this.getLatestSignedBatch(queryConfig);
        if (latestSignedBatch) {
          this.logger.info(`✅ Using latest signed batch ${latestSignedBatch.batchNumber} instead of assigned batch ${batchAssignment}`);
          return latestSignedBatch;
        }
      } catch (error) {
        this.logger.error(`❌ Failed to fetch latest signed batch: ${getErrorMessage(error)}`);
      }
      
      this.logger.error(`❌ Failed to fetch any usable batch for DataRequest ${drId}`);
      return null;

    } catch (error) {
      this.logger.error(`❌ Failed to fetch batch information: ${getErrorMessage(error)}`);
      return null;
    }
  }
} 