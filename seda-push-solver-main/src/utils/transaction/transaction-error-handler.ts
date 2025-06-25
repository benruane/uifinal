/**
 * Transaction Error Handler
 * Utilities for categorizing and handling transaction errors
 */

/**
 * Transaction error categories
 */
export enum TransactionErrorCategory {
  SEQUENCE_ERROR = 'SEQUENCE_ERROR',
  GAS_ERROR = 'GAS_ERROR',
  BALANCE_ERROR = 'BALANCE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Categorized error information
 */
export interface CategorizedError {
  category: TransactionErrorCategory;
  originalError: Error | string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}

/**
 * Categorize EVM transaction errors
 */
export function categorizeEvmError(error: Error | string): CategorizedError {
  const errorMessage = error instanceof Error ? error.message : error;
  const lowerMessage = errorMessage.toLowerCase();

  // Gas-related errors
  if (lowerMessage.includes('gas') || 
      lowerMessage.includes('out of gas') ||
      lowerMessage.includes('intrinsic gas too low')) {
    return {
      category: TransactionErrorCategory.GAS_ERROR,
      originalError: error,
      message: 'Transaction failed due to gas issues',
      recoverable: true,
      retryable: true
    };
  }

  // Balance/funds errors
  if (lowerMessage.includes('insufficient funds') ||
      lowerMessage.includes('insufficient balance') ||
      lowerMessage.includes('not enough')) {
    return {
      category: TransactionErrorCategory.BALANCE_ERROR,
      originalError: error,
      message: 'Insufficient funds for transaction',
      recoverable: false,
      retryable: false
    };
  }

  // Network connectivity errors
  if (lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('fetch')) {
    return {
      category: TransactionErrorCategory.NETWORK_ERROR,
      originalError: error,
      message: 'Network connectivity issues',
      recoverable: true,
      retryable: true
    };
  }

  // Contract-specific errors
  if (lowerMessage.includes('revert') ||
      lowerMessage.includes('execution reverted') ||
      lowerMessage.includes('already exists') ||
      lowerMessage.includes('enforced pause')) {
    return {
      category: TransactionErrorCategory.CONTRACT_ERROR,
      originalError: error,
      message: 'Contract execution failed',
      recoverable: false,
      retryable: false
    };
  }

  // Validation errors
  if (lowerMessage.includes('invalid') ||
      lowerMessage.includes('malformed') ||
      lowerMessage.includes('bad request')) {
    return {
      category: TransactionErrorCategory.VALIDATION_ERROR,
      originalError: error,
      message: 'Transaction validation failed',
      recoverable: false,
      retryable: false
    };
  }

  return {
    category: TransactionErrorCategory.UNKNOWN_ERROR,
    originalError: error,
    message: errorMessage,
    recoverable: false,
    retryable: false
  };
}

/**
 * Categorize Cosmos transaction errors
 */
export function categorizeCosmosError(error: Error | string): CategorizedError {
  const errorMessage = error instanceof Error ? error.message : error;
  const lowerMessage = errorMessage.toLowerCase();

  // Sequence errors
  if (lowerMessage.includes('sequence') ||
      lowerMessage.includes('nonce') ||
      lowerMessage.includes('account sequence mismatch')) {
    return {
      category: TransactionErrorCategory.SEQUENCE_ERROR,
      originalError: error,
      message: 'Transaction sequence error',
      recoverable: true,
      retryable: true
    };
  }

  // Gas errors
  if (lowerMessage.includes('gas') ||
      lowerMessage.includes('out of gas')) {
    return {
      category: TransactionErrorCategory.GAS_ERROR,
      originalError: error,
      message: 'Transaction gas error',
      recoverable: true,
      retryable: true
    };
  }

  // Insufficient funds
  if (lowerMessage.includes('insufficient funds') ||
      lowerMessage.includes('insufficient balance')) {
    return {
      category: TransactionErrorCategory.BALANCE_ERROR,
      originalError: error,
      message: 'Insufficient funds',
      recoverable: false,
      retryable: false
    };
  }

  // Network errors
  if (lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('rpc')) {
    return {
      category: TransactionErrorCategory.NETWORK_ERROR,
      originalError: error,
      message: 'Network error',
      recoverable: true,
      retryable: true
    };
  }

  return {
    category: TransactionErrorCategory.UNKNOWN_ERROR,
    originalError: error,
    message: errorMessage,
    recoverable: false,
    retryable: false
  };
}

/**
 * Check if error should trigger a retry
 */
export function shouldRetryTransaction(categorizedError: CategorizedError): boolean {
  return categorizedError.retryable && categorizedError.recoverable;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(categorizedError: CategorizedError): string {
  switch (categorizedError.category) {
    case TransactionErrorCategory.SEQUENCE_ERROR:
      return 'Transaction sequence conflict. This will be retried automatically.';
    
    case TransactionErrorCategory.GAS_ERROR:
      return 'Transaction failed due to gas estimation issues. Please check gas settings.';
    
    case TransactionErrorCategory.BALANCE_ERROR:
      return 'Insufficient funds to complete the transaction. Please check your balance.';
    
    case TransactionErrorCategory.NETWORK_ERROR:
      return 'Network connectivity issues. The transaction will be retried.';
    
    case TransactionErrorCategory.CONTRACT_ERROR:
      return 'Smart contract execution failed. Please check contract state and parameters.';
    
    case TransactionErrorCategory.VALIDATION_ERROR:
      return 'Transaction validation failed. Please check your input parameters.';
    
    case TransactionErrorCategory.TIMEOUT_ERROR:
      return 'Transaction timed out. It may still be processing.';
    
    default:
      return categorizedError.message || 'An unknown error occurred during transaction execution.';
  }
} 