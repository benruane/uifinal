/**
 * Common Validation Utilities
 * Reusable validation patterns and interfaces
 */

import { HexUtils } from '../hex';

/**
 * Standard validation result interface
 */
export interface ValidationResult<T = void> {
  valid: boolean;
  error?: string;
  data?: T;
}

/**
 * Validate that a value is not null or undefined
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult<T> {
  if (value == null) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true, data: value };
}

/**
 * Validate hex string format
 */
export function validateHexString(
  value: string,
  fieldName: string,
  expectedLength?: number
): ValidationResult<string> {
  try {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: `${fieldName} must be a valid hex string` };
    }

    if (!HexUtils.validate(value)) {
      return { valid: false, error: `${fieldName} must be a valid hex string` };
    }

    if (expectedLength !== undefined) {
      const cleanHex = value.startsWith('0x') ? value.slice(2) : value;
      const expectedCharLength = expectedLength * 2;
      if (cleanHex.length !== expectedCharLength) {
        return { 
          valid: false, 
          error: `${fieldName} must be exactly ${expectedLength} bytes (${expectedCharLength} hex characters)` 
        };
      }
    }

    return { valid: true, data: value };
  } catch (error) {
    return { 
      valid: false, 
      error: `${fieldName} validation failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: number,
  fieldName: string
): ValidationResult<number> {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (value <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }
  
  return { valid: true, data: value };
}

/**
 * Validate URL format
 */
export function validateUrl(
  value: string,
  fieldName: string
): ValidationResult<string> {
  try {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: `${fieldName} must be a valid URL string` };
    }

    new URL(value);
    return { valid: true, data: value };
  } catch {
    return { valid: false, error: `${fieldName} must be a valid URL` };
  }
}

/**
 * Validate array with minimum length
 */
export function validateArrayMinLength<T>(
  value: T[],
  fieldName: string,
  minLength: number
): ValidationResult<T[]> {
  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }
  
  if (value.length < minLength) {
    return { 
      valid: false, 
      error: `${fieldName} must have at least ${minLength} items` 
    };
  }
  
  return { valid: true, data: value };
}

/**
 * Validate Ethereum address format
 */
export function validateEthereumAddress(
  value: string,
  fieldName: string
): ValidationResult<string> {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a valid Ethereum address` };
  }

  // Check if it's a valid hex string with 40 characters (20 bytes)
  const hexValidation = validateHexString(value, fieldName, 20);
  if (!hexValidation.valid) {
    return { valid: false, error: `${fieldName} must be a valid Ethereum address (40 hex characters)` };
  }

  return { valid: true, data: value };
} 