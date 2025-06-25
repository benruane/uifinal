/**
 * Result Posting Prerequisite Validator
 * Validates prerequisites before posting DataRequest results to EVM networks
 */

import type { DataRequestResult } from '../../types';
import { validateNetworkPrerequisites, validateDataRequestResult } from '../../utils/validation/network-validation';
import type { ValidationResult } from '../../utils/validation/common-validators';

/**
 * Validate all prerequisites for result posting
 */
export function validateResultPostingPrerequisites(
  result: DataRequestResult,
  evmPrivateKey?: string
): ValidationResult<void> {
  // Validate private key configuration
  const networkValidation = validateNetworkPrerequisites(evmPrivateKey);
  if (!networkValidation.valid) {
    return networkValidation;
  }

  // Validate data request result structure
  const resultValidation = validateDataRequestResult(result);
  if (!resultValidation.valid) {
    return { valid: false, error: resultValidation.error };
  }

  return { valid: true };
} 