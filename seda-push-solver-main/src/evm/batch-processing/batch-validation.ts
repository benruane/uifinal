/**
 * Batch Validation
 * Validates batch prerequisites and consensus requirements for EVM posting
 */

import type { SignedBatch } from '../../types';
import { CONSENSUS_PERCENTAGE } from '../../crypto/constants';

/**
 * Validate batch prerequisites for EVM posting
 */
export function validateBatchPrerequisites(
  batch: SignedBatch,
  evmPrivateKey?: string
): { valid: boolean; error?: string } {
  if (!evmPrivateKey) {
    return { valid: false, error: 'EVM_PRIVATE_KEY not configured' };
  }

  if (!batch.batchSignatures || batch.batchSignatures.length === 0) {
    return { 
      valid: false, 
      error: 'Batch has no validator signatures - production posting requires signatures' 
    };
  }

  if (!batch.validatorEntries || batch.validatorEntries.length === 0) {
    return { 
      valid: false, 
      error: 'Batch has no validator entries - production posting requires validator data' 
    };
  }

  return { valid: true };
}

/**
 * Validate consensus threshold
 */
export function validateConsensusThreshold(
  totalVotingPower: number
): { valid: boolean; error?: string } {
  const powerPercent = (totalVotingPower / 1_000_000).toFixed(2);
  
  if (totalVotingPower < CONSENSUS_PERCENTAGE) {
    return { 
      valid: false, 
      error: `Insufficient voting power: ${powerPercent}% < 66.67% consensus threshold` 
    };
  }

  return { valid: true };
}

/**
 * Validate validator root consistency
 */
export function validateValidatorRoot(
  localRoot: string,
  batchRoot: string
): { valid: boolean; error?: string } {
  if (localRoot.toLowerCase() !== batchRoot.toLowerCase()) {
    return {
      valid: false,
      error: `Validator root mismatch! Local: ${localRoot}, Batch: ${batchRoot}. This indicates a problem with validator data structure or merkle tree generation.`
    };
  }

  return { valid: true };
} 