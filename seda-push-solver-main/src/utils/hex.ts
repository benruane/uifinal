/**
 * Simplified Hex String Utilities
 * Consolidated to 5 core methods for all hex operations
 */

export type HexString = `0x${string}`;

export class HexUtils {
  /**
   * Normalize input to proper hex string with 0x prefix
   */
  static normalize(input: string | Buffer): HexString {
    if (Buffer.isBuffer(input)) {
      return `0x${input.toString('hex')}`;
    }
    
    if (typeof input !== 'string') {
      throw new Error(`Expected string or Buffer, got ${typeof input}`);
    }
    
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      throw new Error('Empty hex string');
    }
    
    return trimmed.startsWith('0x') ? trimmed as HexString : `0x${trimmed}`;
  }
  
  /**
   * Convert hex string to Buffer
   */
  static toBuffer(hex: string): Buffer {
    const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
    
    if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
      throw new Error(`Invalid hex string: ${hex}`);
    }
    
    return Buffer.from(cleaned, 'hex');
  }
  
  /**
   * Convert Buffer to hex string with 0x prefix
   */
  static fromBuffer(buffer: Buffer): HexString {
    return `0x${buffer.toString('hex')}`;
  }
  
  /**
   * Validate hex string format
   */
  static validate(hex: string): boolean {
    try {
      const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
      return /^[0-9a-fA-F]*$/.test(cleaned);
    } catch {
      return false;
    }
  }
  
  /**
   * Ensure hex string is exactly the specified byte length
   */
  static ensureLength(hex: string, bytes: number): HexString {
    const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
    const expectedLength = bytes * 2;
    
    if (cleaned.length !== expectedLength) {
      throw new Error(`Invalid hex length: expected ${expectedLength} characters (${bytes} bytes), got ${cleaned.length}`);
    }
    
    return `0x${cleaned}` as HexString;
  }

  /**
   * Convert big-endian hex string to number
   */
  static toBigEndianNumber(hex: string): number {
    const normalized = HexUtils.normalize(hex);
    return parseInt(normalized, 16);
  }
}

// Note: Legacy exports removed in Phase 3 refactoring - use HexUtils class methods directly 