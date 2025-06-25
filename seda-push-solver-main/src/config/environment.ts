/**
 * Environment Validation
 * Centralized environment variable validation and access
 */

export function validateEnvironment(): void {
  const required = [
    'SEDA_MNEMONIC',
    'SEDA_ORACLE_PROGRAM_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test') {
      console.warn(`Warning: Missing test environment variables: ${missing.join(', ')}`);
      return;
    }
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

export function getEnvVarInt(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`);
  }
  return parsed;
}

export function getEnvVarBool(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value.toLowerCase() === 'true';
} 