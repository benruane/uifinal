/**
 * Cryptographic Constants
 * Centralized constants for all cryptographic operations
 */

/**
 * Consensus threshold percentage (66.666666%)
 * Represented as parts per 100,000,000 for precision
 */
export const CONSENSUS_PERCENTAGE = 66_666_666;

/**
 * Domain separator for secp256k1 signature validation
 */
export const SECP256K1_DOMAIN_SEPARATOR = "0x01";

/**
 * Standard byte lengths for cryptographic operations
 */
export const BYTE_LENGTHS = {
  /** Standard hash length (32 bytes) */
  HASH: 32,
  /** Ethereum address length (20 bytes) */
  ETH_ADDRESS: 20,
  /** Public key length with prefix (65 bytes) */
  PUBLIC_KEY_WITH_PREFIX: 65,
  /** Public key length without prefix (64 bytes) */
  PUBLIC_KEY_WITHOUT_PREFIX: 64,
  /** Private key length (32 bytes) */
  PRIVATE_KEY: 32,
  /** Signature length (65 bytes for Ethereum format) */
  SIGNATURE: 65
} as const;

/**
 * Signature recovery ID offset for Ethereum format
 */
export const ETHEREUM_RECOVERY_OFFSET = 27; 