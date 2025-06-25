/**
 * Signature Processor
 * Handles secp256k1 signature validation, recovery, and processing
 */

import { ExtendedSecp256k1Signature, Secp256k1 } from '@cosmjs/crypto';
import { keccak256, encodePacked, toHex } from 'viem';
import type { LoggingServiceInterface } from '../services';
import type { SignedBatch, ProcessedBatchSignature, ValidatorEntry, BatchSignature } from '../types/batch-types';
import { HexUtils, type HexString } from '../utils/hex';
import { BYTE_LENGTHS, ETHEREUM_RECOVERY_OFFSET } from './constants';
import { getErrorMessage } from '../helpers/error-utils';

// Signature processing constants
const CONSENSUS_PERCENTAGE = 66_666_666; // 66.666666%, represented as parts per 100,000,000
const SECP256K1_DOMAIN_SEPARATOR = "0x01";

/**
 * Result of signature processing
 */
export interface SignatureProcessingResult {
  /** Successfully processed signatures */
  processedSignatures: ProcessedBatchSignature[];
  /** Total voting power of processed signatures */
  totalVotingPower: number;
  /** Ethereum format signatures (r + s + v) */
  ethereumSignatures: HexString[];
  /** Whether consensus threshold is met */
  consensusReached: boolean;
}

/**
 * Processor for cryptographic signature operations
 */
export class SignatureProcessor {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Recover secp256k1 public key from signature and message
   */
  private recoverSecp256k1PublicKey(signature: Uint8Array, message: Buffer): Buffer {
    const extended = ExtendedSecp256k1Signature.fromFixedLength(signature);
    return Buffer.from(Secp256k1.recoverPubkey(extended, message));
  }

  /**
   * Create Ethereum address from public key
   */
  private createEthAddress(publicKey: Buffer): Buffer {
    const pubKeyNoPrefix = publicKey.length === 65 ? publicKey.subarray(1) : publicKey;
    const ethAddressHash = keccak256(pubKeyNoPrefix);
    // Convert hex string to buffer and take last 20 bytes as Ethereum address
    const hashBuffer = Buffer.from(ethAddressHash.slice(2), 'hex'); // Remove '0x' prefix
    return hashBuffer.slice(-20);
  }

  /**
   * Process a single signature and validator entry
   */
  private async processSingleSignature(
    signature: BatchSignature,
    validatorEntry: ValidatorEntry,
    batchId: string | Buffer,
    validatorTreeProof: HexString[]
  ): Promise<ProcessedBatchSignature | null> {
    try {
      // Prepare batch ID buffer
      const batchIdBuffer = Buffer.isBuffer(batchId) 
        ? batchId 
        : Buffer.from(batchId, 'hex');
      
      const validatorAddrHex = Buffer.from(signature.validatorAddress).toString('hex');
      
      this.logger.debug(`🔍 Processing signature for validator ${validatorAddrHex}:`);
      this.logger.debug(`   Batch ID type: ${typeof batchId}`);
      this.logger.debug(`   Batch ID (hex): ${batchIdBuffer.toString('hex')}`);
      this.logger.debug(`   Signature length: ${signature.secp256k1Signature.length}`);
      
      // Recover public key from signature
      const publicKey = this.recoverSecp256k1PublicKey(
        signature.secp256k1Signature,
        batchIdBuffer
      );
      
      this.logger.debug(`   Recovered public key length: ${publicKey.length}`);
      this.logger.debug(`   Public key (hex): ${publicKey.toString('hex')}`);

      // Use the ETH address from validator entry
      const ethAddress = Buffer.from(validatorEntry.ethAddress);
      
      this.logger.debug(`🔍 Using ETH address from validator entry for ${validatorAddrHex}:`);
      this.logger.debug(`   ETH Address: ${ethAddress.toString('hex')}`);
      
      // Optional: Generate ETH address for comparison/debugging
      const generatedEthAddress = this.createEthAddress(publicKey);
      const generatedEthAddrHex = generatedEthAddress.toString('hex');
      const storedEthAddrHex = ethAddress.toString('hex');
      
      if (generatedEthAddrHex.toLowerCase() === storedEthAddrHex.toLowerCase()) {
        this.logger.debug(`   ✅ Generated ETH address matches stored address`);
      } else {
        this.logger.debug(`   ℹ️ Generated ETH address differs from stored (using stored):`);
        this.logger.debug(`     Generated: ${generatedEthAddrHex}`);
        this.logger.debug(`     Stored:    ${storedEthAddrHex}`);
      }

      // Convert signature to Ethereum format
      const extendedSig = ExtendedSecp256k1Signature.fromFixedLength(signature.secp256k1Signature);
      const recoveryId = extendedSig.recovery + 27;
      const ethereumSig = Buffer.concat([
        extendedSig.r(32),
        extendedSig.s(32),
        Buffer.from([recoveryId])
      ]);

      // Convert proof elements to proper format
      const formattedProof = validatorTreeProof.map((p: HexString) => {
        const normalized = HexUtils.normalize(p);
        return Buffer.from(normalized.slice(2), 'hex'); // Remove '0x' prefix
      });

      // Ensure votingPowerPercent is a proper number
      const votingPowerPercentage = typeof validatorEntry.votingPowerPercent === 'number' 
        ? validatorEntry.votingPowerPercent 
        : Number(validatorEntry.votingPowerPercent);

      return {
        validatorAddr: validatorAddrHex,
        ethAddress,
        votingPowerPercentage,
        signature: ethereumSig,
        proof: formattedProof
      };

    } catch (error) {
      this.logger.warn(`⚠️ Failed to process signature: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Process all signatures in a batch and validate consensus
   */
  async processSignatures(
    batch: SignedBatch,
    validatorTreeProofs: Map<string, HexString[]>
  ): Promise<SignatureProcessingResult> {
    
    if (!batch.batchSignatures || batch.batchSignatures.length === 0) {
      this.logger.warn(`⚠️ Batch ${batch.batchNumber} has no signatures`);
      return {
        processedSignatures: [],
        totalVotingPower: 0,
        ethereumSignatures: [],
        consensusReached: false
      };
    }

    if (!batch.validatorEntries || batch.validatorEntries.length === 0) {
      this.logger.warn(`⚠️ Batch ${batch.batchNumber} has no validator entries`);
      return {
        processedSignatures: [],
        totalVotingPower: 0,
        ethereumSignatures: [],
        consensusReached: false
      };
    }

    this.logger.info(`🔐 Processing signatures for batch ${batch.batchNumber}...`);
    this.logger.info(`   📝 Signatures available: ${batch.batchSignatures.length}`);
    this.logger.info(`   👥 Validators available: ${batch.validatorEntries.length}`);

    let totalVotingPower = 0;
    const processedSignatures: ProcessedBatchSignature[] = [];

    for (const signature of batch.batchSignatures) {
      // Find corresponding validator entry
      const validatorEntry = batch.validatorEntries.find((v: ValidatorEntry) => 
        Buffer.from(v.validatorAddress).equals(signature.validatorAddress)
      );

      if (!validatorEntry) {
        this.logger.warn(`⚠️ Validator entry not found for signature from ${Buffer.from(signature.validatorAddress).toString('hex')}`);
        continue;
      }

      // Get merkle proof for this validator
      const validatorAddrHex = Buffer.from(signature.validatorAddress).toString('hex');
      const proof = validatorTreeProofs.get(validatorAddrHex);
      
      if (!proof) {
        this.logger.warn(`⚠️ No merkle proof found for validator ${validatorAddrHex}`);
        continue;
      }

      // Process this signature
      const processed = await this.processSingleSignature(
        signature,
        validatorEntry,
        batch.batchId,
        proof
      );

      if (processed) {
        totalVotingPower += processed.votingPowerPercentage;
        processedSignatures.push(processed);
        
        this.logger.info(`✅ Processed signature from validator ${processed.ethAddress.toString('hex')} (power: ${processed.votingPowerPercentage})`);
      }
    }

    // Sort signatures lexicographically by ETH address (required by contract)
    const sortedSignatures = processedSignatures
      .sort((a, b) => a.ethAddress.toString('hex').localeCompare(b.ethAddress.toString('hex')));

    // Extract Ethereum signatures in sorted order
    const ethereumSignatures = sortedSignatures
      .map(sig => HexUtils.normalize(sig.signature.toString('hex')));

    const consensusReached = totalVotingPower >= CONSENSUS_PERCENTAGE;

    this.logger.info(`🔐 Signature processing complete:`);
    this.logger.info(`   ✅ Valid signatures: ${sortedSignatures.length}`);
    this.logger.info(`   ⚖️ Total voting power: ${totalVotingPower}`);
    this.logger.info(`   📊 Required threshold: ${CONSENSUS_PERCENTAGE} (66.67%)`);
    this.logger.info(`   🎯 Consensus reached: ${consensusReached ? 'YES' : 'NO'}`);

    return {
      processedSignatures: sortedSignatures,
      totalVotingPower,
      ethereumSignatures,
      consensusReached
    };
  }

  /**
   * Validate consensus threshold
   */
  validateConsensusThreshold(totalVotingPower: number): boolean {
    return totalVotingPower >= CONSENSUS_PERCENTAGE;
  }

  /**
   * Get consensus threshold percentage for display
   */
  getConsensusThresholdPercentage(): number {
    return CONSENSUS_PERCENTAGE / 1_000_000; // Convert to actual percentage
  }

  /**
   * Get domain separator for validator tree leaves
   */
  getDomainSeparator(): string {
    return SECP256K1_DOMAIN_SEPARATOR;
  }

  /**
   * Recover a secp256k1 public key from a signature and message
   */
  static recoverPublicKey(signature: Uint8Array, message: Buffer): Buffer {
    const extended = ExtendedSecp256k1Signature.fromFixedLength(signature);
    return Buffer.from(Secp256k1.recoverPubkey(extended, message));
  }

  /**
   * Generate Ethereum address from public key
   */
  static generateEthereumAddress(publicKey: Buffer): Buffer {
    // Remove prefix byte if present (first byte should be 0x04 for uncompressed key)
    const pubKeyNoPrefix = publicKey.length === BYTE_LENGTHS.PUBLIC_KEY_WITH_PREFIX 
      ? publicKey.subarray(1) 
      : publicKey;
    
    // Hash the public key using keccak256 (viem returns hex string)
    const ethAddressHash = keccak256(pubKeyNoPrefix);
    // Convert hex string to buffer and take last 20 bytes as Ethereum address
    const hashBuffer = Buffer.from(ethAddressHash.slice(2), 'hex'); // Remove '0x' prefix
    return hashBuffer.slice(-BYTE_LENGTHS.ETH_ADDRESS);
  }

  /**
   * Convert secp256k1 signature to Ethereum format
   */
  static toEthereumFormat(signature: Uint8Array): Buffer {
    const extendedSig = ExtendedSecp256k1Signature.fromFixedLength(signature);
    const recoveryId = extendedSig.recovery + ETHEREUM_RECOVERY_OFFSET;
    
    return Buffer.concat([
      extendedSig.r(32),
      extendedSig.s(32),
      Buffer.from([recoveryId])
    ]);
  }

  /**
   * Validate signature against expected parameters
   */
  static validateSignature(
    signature: Uint8Array,
    message: Buffer,
    expectedEthAddress: Buffer
  ): { valid: boolean; publicKey?: Buffer; error?: string } {
    try {
      // Recover public key from signature
      const publicKey = this.recoverPublicKey(signature, message);
      
      // Generate Ethereum address from recovered public key
      const generatedEthAddress = this.generateEthereumAddress(publicKey);
      
      // Compare with expected address (case-insensitive hex comparison)
      const expectedHex = expectedEthAddress.toString('hex').toLowerCase();
      const generatedHex = generatedEthAddress.toString('hex').toLowerCase();
      const valid = expectedHex === generatedHex;
      

      
      return {
        valid,
        publicKey,
        error: valid ? undefined : 'Signature does not match expected Ethereum address'
      };
      
    } catch (error) {

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown signature validation error'
      };
    }
  }
} 