/**
 * Transaction Validation Utilities
 * Validation functions for transaction parameters and signatures
 */

import { validateRequired, validateHexString, validatePositiveNumber, type ValidationResult } from './common-validators';

/**
 * Transaction parameters for validation
 */
export interface TransactionParams {
  to: string;
  value?: bigint;
  gasLimit?: number;
  gasPrice?: string;
  data?: string;
}

/**
 * Validate transaction parameters
 */
export function validateTransactionParams(params: TransactionParams): ValidationResult<TransactionParams> {
  // Validate 'to' address
  const toValidation = validateRequired(params.to, 'to address');
  if (!toValidation.valid) {
    return { valid: false, error: toValidation.error };
  }

  const addressValidation = validateHexString(params.to, 'to address', 20);
  if (!addressValidation.valid) {
    return { valid: false, error: addressValidation.error };
  }

  // Validate gas limit if present
  if (params.gasLimit !== undefined) {
    const gasLimitValidation = validatePositiveNumber(params.gasLimit, 'gasLimit');
    if (!gasLimitValidation.valid) {
      return { valid: false, error: gasLimitValidation.error };
    }

    if (params.gasLimit < 21000) {
      return { valid: false, error: 'Gas limit must be at least 21000' };
    }
  }

  // Validate gas price if present
  if (params.gasPrice !== undefined) {
    const gasPrice = Number(params.gasPrice);
    if (isNaN(gasPrice) || gasPrice <= 0) {
      return { valid: false, error: 'Gas price must be a positive number' };
    }
  }

  // Validate transaction data if present
  if (params.data !== undefined && params.data !== '') {
    const dataValidation = validateHexString(params.data, 'transaction data');
    if (!dataValidation.valid) {
      return { valid: false, error: dataValidation.error };
    }
  }

  return { valid: true, data: params };
}

/**
 * Validate signature format
 */
export function validateSignature(
  signature: string | Uint8Array,
  fieldName: string = 'signature'
): ValidationResult<string> {
  if (!signature) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof signature === 'string') {
    // Validate hex string signature (typically 65 bytes = 130 hex chars)
    const sigValidation = validateHexString(signature, fieldName);
    if (!sigValidation.valid) {
      return sigValidation;
    }

    // Check length for standard ECDSA signature (65 bytes)
    const cleanSig = signature.startsWith('0x') ? signature.slice(2) : signature;
    if (cleanSig.length !== 130) {
      return { 
        valid: false, 
        error: `${fieldName} must be 65 bytes (130 hex characters)` 
      };
    }

    return { valid: true, data: signature };
  } else if (signature instanceof Uint8Array) {
    // Validate Uint8Array signature
    if (signature.length !== 65) {
      return { 
        valid: false, 
        error: `${fieldName} must be 65 bytes` 
      };
    }

    return { valid: true, data: `0x${Buffer.from(signature).toString('hex')}` };
  }

  return { 
    valid: false, 
    error: `${fieldName} must be a hex string or Uint8Array` 
  };
}

/**
 * Validate proof array format
 */
export function validateProofArray(
  proof: string[],
  fieldName: string = 'proof'
): ValidationResult<string[]> {
  if (!Array.isArray(proof)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (proof.length === 0) {
    return { valid: false, error: `${fieldName} array cannot be empty` };
  }

  // Validate each proof element
  for (let i = 0; i < proof.length; i++) {
    const element = proof[i];
    if (typeof element !== 'string') {
      return { 
        valid: false, 
        error: `${fieldName}[${i}] must be a hex string` 
      };
    }

    const elementValidation = validateHexString(element, `${fieldName}[${i}]`);
    if (!elementValidation.valid) {
      return { valid: false, error: elementValidation.error };
    }
  }

  return { valid: true, data: proof };
} 