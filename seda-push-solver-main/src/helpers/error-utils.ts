/**
 * Error Handling Utilities
 * Standardized error handling patterns and utilities
 */

/**
 * Check if an error is related to Cosmos sequence numbers
 */
export function isSequenceError(error: Error | string): boolean {
  const errorMessage = error instanceof Error ? error.message : error;
  const sequenceErrorPatterns = [
    'account sequence mismatch',
    'incorrect account sequence',
    'sequence number',
    'nonce too low',
    'sequence too low'
  ];

  return sequenceErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Check if an error indicates that a DataRequest already exists
 */
export function isDataRequestExistsError(error: Error | string): boolean {
  const errorMessage = error instanceof Error ? error.message : error;
  return errorMessage.includes('DataRequestAlreadyExists');
}

/**
 * Convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
} 