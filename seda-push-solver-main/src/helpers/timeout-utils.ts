/**
 * Timeout Utilities
 * Common timeout patterns and helpers used across the application
 */

/**
 * Create a promise that rejects after a timeout
 */
export function createTimeoutPromise(timeoutMs: number, errorMessage?: string): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage || `Operation timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Race an operation against a timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    operation,
    createTimeoutPromise(timeoutMs, errorMessage)
  ]);
}

/**
 * Create a delay promise for consistent timing operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 