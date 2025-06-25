/**
 * EVM Result Poster
 * Handles posting DataRequest results to EVM networks after batch confirmation
 * Refactored to use extracted processing and validation modules
 */

import type { LoggingServiceInterface } from '../services';
import type { DataRequestResult, EvmNetworkConfig, SignedBatch } from '../types';
import { getErrorMessage } from '../helpers/error-utils';
import { evmPrivateKey, sedaConfig } from '../../config';

import { Solver } from '@seda-protocol/solver-sdk';

// Validation modules
import { validateResultPostingPrerequisites } from './result-validation';
import { checkResultExists } from './result-validation';

// Processing modules
import { getCurrentBatchHeight } from './result-processing';
import { convertDataResultToDataResultEvm, type DataResultEvm } from './result-processing';
import { executeResultTransaction } from './result-processing';
import { deriveResultId } from './result-processing';
import { categorizeResultPostingError } from './result-processing';

export interface ResultPostingResult {
  success: boolean;
  txHash?: string;
  error?: string;
  resultId?: string;
}

/**
 * Posts DataRequest results to EVM networks
 * Refactored to use extracted processing modules
 */
export class ResultPoster {
  private solver: Solver | null = null;

  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Initialize the solver SDK for proof generation
   */
  private async initializeSolver(): Promise<Solver> {
    if (this.solver) {
      return this.solver;
    }

    try {
      this.solver = await Solver.fromConfig({
        rpc: sedaConfig.rpcEndpoint,
        mnemonic: sedaConfig.mnemonic,
        minimumBalance: 1_000_000_000_000_000_000n, // 1 SEDA
        batchPollingIntervalMs: 3000,
        dataResultPollingIntervalMs: 5000,
        coreContractAddress: 'auto'
      });

      this.logger.debug('✅ Solver SDK initialized for proof generation');
      return this.solver;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize solver SDK: ${errorMessage}`);
    }
  }

  /**
   * Post a DataRequest result to an EVM network
   * Simplified main method using extracted modules
   */
  async postResult(
    network: EvmNetworkConfig,
    dataRequestResult: DataRequestResult,
    batch: SignedBatch,
    sedaCoreAddress: string
  ): Promise<ResultPostingResult> {
    try {
      this.logger.info(`🔍 Posting result for DR ${dataRequestResult.drId} to ${network.displayName}`);

      // Validate prerequisites using extracted validator
      const validation = validateResultPostingPrerequisites(dataRequestResult, evmPrivateKey);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check if result already exists using extracted checker
      const resultExists = await checkResultExists(network, sedaCoreAddress, dataRequestResult.drId, this.logger);
      if (resultExists) {
        this.logger.debug(`✅ Result already exists for DR ${dataRequestResult.drId} on ${network.displayName}`);
        return { success: true, error: 'Result already exists' };
      }

      // Get the actual DataResult from solver SDK
      const solver = await this.initializeSolver();
      const dataResultResponse = await solver.getDataResult(dataRequestResult.drId, 0n);
      
      if (dataResultResponse.isErr) {
        return { success: false, error: `Failed to get DataResult: ${dataResultResponse.error}` };
      }
      
      if (dataResultResponse.value.isNothing) {
        return { success: false, error: `DataResult not found for ${dataRequestResult.drId}` };
      }
      
      const dataResult = dataResultResponse.value.value;
      
      // Convert DataResult to EVM format using extracted converter
      const evmResult = convertDataResultToDataResultEvm(dataResult);

      // Get the current batch height using extracted resolver
      const currentBatchHeight = await getCurrentBatchHeight(network, sedaCoreAddress, batch, this.logger);
      
      // Always assume permissionless contract (as requested)
      const isPermissioned = false; // FORCE: Always treat as permissionless
      
      this.logger.info(`🔍 Contract treatment: ${sedaCoreAddress} - FORCED Permissionless: ${!isPermissioned}`);
      this.logger.info(`📊 Current batch height: ${currentBatchHeight}, Batch assignment: ${batch.batchNumber}`);
      
      let proof: string[] = [];
      const targetBatch = currentBatchHeight;
      
      // For permissionless contracts, generate proper merkle proof using solver SDK
      this.logger.info(`🌳 Generating merkle proof for permissionless contract (current batch: ${currentBatchHeight})`);
      
      try {
        const solver = await this.initializeSolver();
        this.logger.debug(`🔧 Calling solver.getDataResultProof('${dataRequestResult.drId}', ${targetBatch}) - using default dataRequestHeight=0n like simple-solver`);
        
        const proofResult = await solver.getDataResultProof(dataRequestResult.drId, targetBatch);
        
        if (proofResult.isErr) {
          this.logger.error(`❌ Solver SDK proof generation failed: ${proofResult.error}`);
          throw new Error(`Solver SDK proof generation failed: ${proofResult.error}`);
        }
        
        proof = proofResult.value;
        this.logger.info(`✅ Generated merkle proof with ${proof.length} elements using solver SDK`);
        this.logger.debug(`🌳 Proof elements: ${JSON.stringify(proof)}`);
      } catch (proofError) {
        const proofErrorMessage = proofError instanceof Error ? proofError.message : String(proofError);
        this.logger.error(`❌ Failed to generate merkle proof: ${proofErrorMessage}`);
        return { success: false, error: `Failed to generate merkle proof: ${proofErrorMessage}` };
      }
      
      // Log result data for debugging
      const serializableResult = {
        ...evmResult,
        blockHeight: evmResult.blockHeight.toString(),
        blockTimestamp: evmResult.blockTimestamp.toString(),
        gasUsed: evmResult.gasUsed.toString()
      };
      this.logger.debug(`📊 Result data: ${JSON.stringify(serializableResult, null, 2)}`);
      this.logger.debug(`📊 Target batch: ${targetBatch}, Proof length: ${proof.length}`);

      // Execute the transaction using extracted executor
      const txHash = await executeResultTransaction(
        network,
        evmPrivateKey!,
        sedaCoreAddress,
        evmResult,
        targetBatch,
        proof,
        this.logger
      );

      // Derive result ID for tracking using extracted deriver
      const resultId = await deriveResultId(network, sedaCoreAddress, evmResult, this.logger);

      this.logger.info(`✅ Successfully posted result for DR ${dataRequestResult.drId} to ${network.displayName}`);
      this.logger.info(`   📋 Result ID: ${resultId}`);
      this.logger.info(`   🔗 TX Hash: ${txHash}`);
      
      return { success: true, txHash, resultId };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const currentBatchHeight = await getCurrentBatchHeight(network, sedaCoreAddress, batch, this.logger);
      this.logger.info(`📊 Current batch height: ${currentBatchHeight}, Batch assignment: ${batch.batchNumber}`);

      this.logger.error(`❌ Failed to post result to ${network.displayName}: ${errorMessage}`);
      
      return { 
        success: false, 
        error: categorizeResultPostingError(errorMessage)
      };
    }
  }
}