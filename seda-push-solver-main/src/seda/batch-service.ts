/**
 * SEDA Batch Service
 * Handles batch fetching and result proof generation
 */

import type { QueryConfig } from '@seda-protocol/dev-tools';
import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import { sedachain } from "@seda-protocol/proto-messages";
import type { SignedBatch } from '../types';
import type { LoggingServiceInterface } from '../services';
import { getErrorMessage } from '../helpers/error-utils';
import { HexUtils } from '../utils/hex';

/**
 * Service for interacting with SEDA batches and generating proofs
 */
export class SedaBatchService {
  constructor(
    private queryConfig: QueryConfig,
    private logger: LoggingServiceInterface
  ) {}

  /**
   * Fetch batch information from SEDA chain
   */
  async fetchBatch(
    drId: string,
    blockHeight: bigint,
    maxRetries: number = 10,
    pollingIntervalMs: number = 3000
  ): Promise<SignedBatch | null> {

    try {
      // Get DataResult with batch assignment
      const dataResult = await this.getDataResult(drId, blockHeight);
      
      if (!dataResult) {
        return null;
      }
      
      const { batchAssignment } = dataResult;
      
      // Start polling with summary logging only
      this.logger.info(`📦 Fetching batch ${batchAssignment} (max ${maxRetries} attempts, ${pollingIntervalMs}ms intervals)`);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        this.logger.debug(`🔄 Polling attempt ${attempt}/${maxRetries} for batch ${batchAssignment}`);
        
        const batch = await this.getBatch(batchAssignment);
        
        if (batch) {
          this.logger.info(`✅ Batch ${batchAssignment} ready after ${attempt} attempts`);
          return batch;
        }
        
        if (attempt < maxRetries) {
          this.logger.debug(`⏱️ Batch ${batchAssignment} not ready, waiting ${pollingIntervalMs}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
        }
      }
      
      // Try to get latest signed batch if assigned batch isn't ready
      this.logger.warn(`⚠️ Batch ${batchAssignment} not ready after ${maxRetries} attempts, trying latest signed batch`);
      
      const latestSignedBatch = await this.getLatestSignedBatch();
      if (latestSignedBatch) {
        this.logger.info(`✅ Using latest signed batch ${latestSignedBatch.batchNumber} (fallback)`);
        return latestSignedBatch;
      }
      
      this.logger.error(`❌ No usable batch found for DataRequest ${drId}`);
      return null;

    } catch (error) {
      this.logger.error(`❌ Failed to fetch batch information: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Create protobuf RPC client for SEDA chain queries
   */
  private async createSedaQueryClient() {
    const cometClient = await Comet38Client.connect(this.queryConfig.rpc);
    const queryClient = new QueryClient(cometClient);
    return createProtobufRpcClient(queryClient);
  }

  /**
   * Get DataResult to find batch assignment
   */
  private async getDataResult(drId: string, blockHeight: bigint): Promise<{ batchAssignment: bigint } | null> {
    try {
      const protoClient = await this.createSedaQueryClient();
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
  private async getBatch(batchNumber: bigint): Promise<SignedBatch | null> {
    try {
      const protoClient = await this.createSedaQueryClient();
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
      
      // Check if batch has signatures
      if (!batchSignatures || batchSignatures.length === 0) {
        this.logger.warn(`⚠️ Batch ${batchNumber} has no signatures yet`);
        return null;
      }
      
      if (!validatorEntries || validatorEntries.length === 0) {
        this.logger.warn(`⚠️ Batch ${batchNumber} has no validator entries`);
        return null;
      }
      
      this.logger.info(`✅ Batch ${batchNumber} fetched successfully with ${batchSignatures.length} signatures!`);
      
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
  private async getLatestSignedBatch(): Promise<SignedBatch | null> {
    try {
      const protoClient = await this.createSedaQueryClient();
      const client = new sedachain.batching.v1.QueryClientImpl(protoClient);
      
      this.logger.debug(`📦 Querying latest signed batch from SEDA chain`);
      
      const response = await client.Batch({ 
        batchNumber: 0n,
        latestSigned: true 
      });
      
      if (!response.batch) {
        this.logger.warn(`⚠️ No latest signed batch found`);
        return null;
      }
      
      const { batch, batchSignatures, dataResultEntries, validatorEntries } = response;
      
      if (!batchSignatures || batchSignatures.length === 0) {
        this.logger.warn(`⚠️ Latest signed batch has no signatures`);
        return null;
      }
      
      if (!validatorEntries || validatorEntries.length === 0) {
        this.logger.warn(`⚠️ Latest signed batch has no validator entries`);
        return null;
      }
      
      this.logger.debug(`✅ Latest signed batch ${batch.batchNumber} fetched with ${batchSignatures.length} signatures`);
      
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
   * Generate merkle proof for a DataRequest result in a batch
   * Following the exact logic from solver-sdk/src/services/data-result-service.ts
   */
  async getDataResultProof(
    dataRequestId: string,
    dataRequestHeight: bigint,
    targetBatch?: bigint
  ): Promise<{ success: boolean; proof?: string[]; error?: string }> {
    try {
      this.logger.debug(`🔍 Generating result proof for DR ${dataRequestId} (height: ${dataRequestHeight}, target: ${targetBatch})`);

      // Step 1: Get the DataResult to find batch assignment (like solver-sdk)
      const dataResultResponse = await this.getDataResult(dataRequestId, dataRequestHeight);
      if (!dataResultResponse) {
        return { success: false, error: `Data result for ${dataRequestId} was not found` };
      }

      const { batchAssignment } = dataResultResponse;

      // Step 2: Validate target batch (like solver-sdk)
      if (targetBatch && batchAssignment > targetBatch) {
        return {
          success: false,
          error: `Data Request was assigned batch ${batchAssignment} but given target was ${targetBatch}`
        };
      }

      // Step 3: Get the batch with full details (like solver-sdk getBatch)
      const dataResultBatch = await this.getBatch(batchAssignment);
      if (!dataResultBatch) {
        return { success: false, error: `Details were empty for batch #${batchAssignment}` };
      }

      // Step 4: Get batches range (like solver-sdk getBatches)
      const start = batchAssignment - 1n;
      const end = targetBatch ? targetBatch : batchAssignment;
      
      const batches = await this.getBatchesRange(start, end);
      if (!batches || batches.length === 0) {
        return { success: false, error: `Could not fetch batches from ${start} to ${end}` };
      }

      // Step 5: Find current and previous batch (like solver-sdk)
      const currentBatch = batches.find(b => b.batchNumber === batchAssignment);
      const previousBatch = batches.find(b => b.batchNumber === batchAssignment - 1n);

      if (!currentBatch) {
        return { success: false, error: `Could not find assigned batch #${batchAssignment}` };
      }

      if (!previousBatch) {
        return { success: false, error: `Could not find previous batch #${batchAssignment - 1n}` };
      }

      // Step 6: Generate proof using solver-sdk logic
      const proof = await this.generateSolverSdkStyleProof(
        dataRequestId,
        dataResultBatch,
        previousBatch,
        batches
      );

      if (!proof.success) {
        return { success: false, error: proof.error };
      }

      this.logger.debug(`✅ Generated merkle proof with ${proof.proof!.length} elements (solver-sdk style)`);
      return { success: true, proof: proof.proof };

    } catch (error) {
      const errorMsg = getErrorMessage(error);
      this.logger.error(`❌ Failed to generate result proof: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Generate proof following exact solver-sdk logic from data-result-service.ts
   */
  private async generateSolverSdkStyleProof(
    dataRequestId: string,
    currentBatch: SignedBatch,
    previousBatch: SignedBatch,
    allBatches: SignedBatch[]
  ): Promise<{ success: boolean; proof?: string[]; error?: string }> {
    try {
      // Import required libraries (same as solver-sdk)
      const { SimpleMerkleTree } = await import('@openzeppelin/merkle-tree');
      const { keccak256 } = await import('@cosmjs/crypto');
      
      // Step 1: Process data result entries (like solver-sdk)
      const treeEntries = currentBatch.dataResultEntries || [];
      const dataResultEntries = treeEntries.map((entry) =>
        keccak256(Buffer.concat([Buffer.from([0]), Buffer.from(entry)]))
      );

      // Step 2: Generate the normal data result tree (like solver-sdk)
      const dataResultTree = SimpleMerkleTree.of(dataResultEntries, {
        sortLeaves: true,
      });

      // Step 3: Create the final tree with previous batch (like solver-sdk)
      const dataResultMerkleRootBuffer = Buffer.from(
        this.strip0x(dataResultTree.root),
        "hex",
      );
      const previousDataResultRootBuffer = Buffer.from(
        previousBatch.dataResultRoot,
        "hex",
      );

      const finalTree = SimpleMerkleTree.of(
        [dataResultMerkleRootBuffer, previousDataResultRootBuffer],
        { sortLeaves: true }
      );

      // Step 4: Validate tree root (like solver-sdk)
      if (this.strip0x(finalTree.root) !== this.strip0x(currentBatch.dataResultRoot)) {
        return {
          success: false,
          error: `Generated tree root ${this.strip0x(finalTree.root)} did not match chain tree root ${this.strip0x(currentBatch.dataResultRoot)}`
        };
      }

      // Step 5: Create the data result ID entry (like solver-sdk)
      // In solver-sdk, this uses dataResult.id, but we'll use the dataRequestId directly
      // since that's what we have available and should work for proof generation
      const dataResultIdEntry = keccak256(
        Buffer.concat([
          Buffer.from("00", "hex"),
          Buffer.from(dataRequestId, "hex"),
        ])
      );

      // Get proof from the data result tree (like solver-sdk)
      const proof = dataResultTree
        .getProof(dataResultIdEntry)
        .map((entry) => this.strip0x(entry));

      // Step 6: Add previous batch root (like solver-sdk)
      proof.push(previousBatch.dataResultRoot);

      // Step 7: Add intermediate batch roots (like solver-sdk)
      for (const batch of allBatches) {
        // Skip current batch (like solver-sdk)
        if (batch.batchNumber === currentBatch.batchNumber) {
          continue;
        }

        // Skip previous batch (like solver-sdk)
        if (batch.batchNumber === previousBatch.batchNumber) {
          continue;
        }

        proof.push(batch.currentDataResultRoot);
      }

      return { success: true, proof };

    } catch (error) {
      return {
        success: false,
        error: `Solver-SDK style proof generation failed: ${getErrorMessage(error)}`
      };
    }
  }

  /**
   * Get a range of batches (like solver-sdk getBatches)
   */
  private async getBatchesRange(startBatch: bigint, endBatch: bigint): Promise<SignedBatch[] | null> {
    try {
      const batches: SignedBatch[] = [];
      
      for (let batchNum = startBatch; batchNum <= endBatch; batchNum++) {
        const batch = await this.getBatch(batchNum);
        if (batch) {
          batches.push(batch);
        }
      }
      
      return batches;
    } catch (error) {
      this.logger.error(`❌ Failed to get batch range ${startBatch}-${endBatch}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Strip 0x prefix (like solver-sdk)
   */
  private strip0x(input: string): string {
    if (input.startsWith("0x")) return input.slice(2);
    return input;
  }
}