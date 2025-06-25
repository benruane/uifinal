/**
 * EVM Batch Poster
 * Handles posting batches to EVM networks with signature validation
 * Refactored to use extracted processing modules
 */

import type { LoggingServiceInterface } from '../services';
import type { SignedBatch, EvmNetworkConfig, BatchPostingResult } from '../types';
import { getErrorMessage } from '../helpers/error-utils';
import { evmPrivateKey } from '../../config';

// Processing modules
import { validateBatchPrerequisites } from './batch-processing';
import { processBatchSignatures } from './batch-processing';
import { createEvmBatch } from './batch-processing';
import { executeBatchTransaction } from './batch-processing';
import { categorizeBatchPostingError, getBatchExplorerUrl } from './batch-processing';

export class BatchPoster {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Post a batch to an EVM network
   * Simplified main method using extracted modules
   */
  async postBatch(
    network: EvmNetworkConfig,
    batch: SignedBatch,
    proverAddress: string
  ): Promise<BatchPostingResult> {
    try {
      this.logger.info(`Posting batch ${batch.batchNumber} to ${network.displayName}`);
      
      // Validate prerequisites using extracted validator
      const validationResult = validateBatchPrerequisites(batch, evmPrivateKey);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Process signatures and validate consensus using extracted processor
      const signatureResult = await processBatchSignatures(batch, this.logger);
      if (!signatureResult.success) {
        return { success: false, error: signatureResult.error };
      }

      // Create EVM batch structure using extracted converter
      const evmBatch = createEvmBatch(batch);

      // Post the batch to the network using extracted executor
      const txHash = await executeBatchTransaction(
        network,
        evmPrivateKey!,
        proverAddress,
        evmBatch,
        signatureResult.signatures!,
        signatureResult.proofs!,
        this.logger
      );

      this.logger.info(`Successfully posted batch ${batch.batchNumber} to ${network.displayName}`);
      this.logger.info(`TX Hash: ${txHash}`);
      this.logger.info(`Explorer: ${getBatchExplorerUrl(network, txHash)}`);
      
      return { success: true, txHash };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to post batch to ${network.displayName}: ${errorMessage}`);
      
      return { 
        success: false, 
        error: categorizeBatchPostingError(errorMessage) 
      };
    }
  }
} 