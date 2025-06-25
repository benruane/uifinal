/**
 * Batch Validation Utilities
 * Validation functions specific to batch operations
 */

import type { SignedBatch, ValidatorEntry, BatchSignature } from '../../types';
import { validateRequired, validateArrayMinLength, validateHexString, type ValidationResult } from './common-validators';

/**
 * Validate signed batch structure
 */
export function validateSignedBatch(batch: SignedBatch): ValidationResult<SignedBatch> {
  // Validate batch number
  if (batch.batchNumber == null) {
    return { valid: false, error: 'batchNumber is required' };
  }

  // Validate validator entries
  if (!batch.validatorEntries || batch.validatorEntries.length === 0) {
    return { 
      valid: false, 
      error: 'Batch must contain validator entries for production posting' 
    };
  }

  // Validate each validator entry
  for (const entry of batch.validatorEntries) {
    const entryValidation = validateValidatorEntry(entry);
    if (!entryValidation.valid) {
      return { valid: false, error: `Invalid validator entry: ${entryValidation.error}` };
    }
  }

  // Validate batch signatures
  if (!batch.batchSignatures || batch.batchSignatures.length === 0) {
    return { 
      valid: false, 
      error: 'Batch must contain validator signatures for production posting' 
    };
  }

  // Validate each signature
  for (const signature of batch.batchSignatures) {
    const sigValidation = validateBatchSignature(signature);
    if (!sigValidation.valid) {
      return { valid: false, error: `Invalid batch signature: ${sigValidation.error}` };
    }
  }

  // Validate validator root if present
  if (batch.validatorRoot) {
    const rootValidation = validateHexString(batch.validatorRoot, 'validatorRoot');
    if (!rootValidation.valid) {
      return { valid: false, error: rootValidation.error };
    }
  }

  return { valid: true, data: batch };
}

/**
 * Validate validator entry structure
 */
export function validateValidatorEntry(entry: ValidatorEntry): ValidationResult<ValidatorEntry> {
  // Validate validator address
  if (!entry.validatorAddress || entry.validatorAddress.length === 0) {
    return { valid: false, error: 'Validator entry must have a validator address' };
  }

  // Validate voting power
  if (typeof entry.votingPowerPercent !== 'number' || entry.votingPowerPercent <= 0) {
    return { valid: false, error: 'Validator entry must have positive voting power percentage' };
  }

  // Validate Ethereum address
  if (!entry.ethAddress || entry.ethAddress.length === 0) {
    return { valid: false, error: 'Validator entry must have an Ethereum address' };
  }

  return { valid: true, data: entry };
}

/**
 * Validate batch signature structure
 */
export function validateBatchSignature(signature: BatchSignature): ValidationResult<BatchSignature> {
  // Validate signature bytes
  if (!signature.secp256k1Signature || signature.secp256k1Signature.length === 0) {
    return { valid: false, error: 'Batch signature must contain secp256k1 signature bytes' };
  }

  // Validate validator address
  if (!signature.validatorAddress || signature.validatorAddress.length === 0) {
    return { valid: false, error: 'Batch signature must contain validator address' };
  }

  return { valid: true, data: signature };
}

/**
 * Validate batch consensus requirements
 */
export function validateBatchConsensus(
  totalVotingPower: number,
  requiredThreshold: number = 66_666_666 // 66.666666%
): ValidationResult<void> {
  if (totalVotingPower < requiredThreshold) {
    const powerPercent = (totalVotingPower / 1_000_000).toFixed(2);
    const thresholdPercent = (requiredThreshold / 1_000_000).toFixed(2);
    return { 
      valid: false, 
      error: `Insufficient voting power: ${powerPercent}% < ${thresholdPercent}% consensus threshold` 
    };
  }

  return { valid: true };
} 