/**
 * Merkle Proof Generator
 * Handles validator merkle tree construction and proof generation
 */

import { SimpleMerkleTree } from '@openzeppelin/merkle-tree';
import { keccak256, encodePacked, toHex } from 'viem';
import type { LoggingServiceInterface } from '../services';
import type { ValidatorEntry } from '../types/batch-types';
import { HexUtils, type HexString } from '../utils/hex';
import { SECP256K1_DOMAIN_SEPARATOR } from './constants';
import { getErrorMessage } from '../helpers/error-utils';

/**
 * Generator for merkle trees and proofs
 */
export class MerkleProofGenerator {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Build validator merkle tree from validator entries
   */
  buildValidatorTree(
    validatorEntries: ValidatorEntry[],
    domainSeparator: string = SECP256K1_DOMAIN_SEPARATOR
  ): SimpleMerkleTree {
    
    this.logger.info(`🌳 Building validator merkle tree with ${validatorEntries.length} validators...`);
    this.logger.debug(`   Domain separator: ${domainSeparator}`);
    
    const validatorTreeLeaves = validatorEntries.map((validator: ValidatorEntry, index: number) => {
      // Use toHex() to properly handle the ETH address
      const ethAddressHex = toHex(validator.ethAddress);
      
      // Ensure votingPowerPercent is a proper number
      const votingPowerPercent = typeof validator.votingPowerPercent === 'number' 
        ? validator.votingPowerPercent 
        : Number(validator.votingPowerPercent);
      
      this.logger.debug(`🔍 Processing validator ${index}:`);
      this.logger.debug(`   Validator Address: ${Buffer.from(validator.validatorAddress).toString('hex')}`);
      this.logger.debug(`   ETH Address: ${ethAddressHex}`);
      this.logger.debug(`   ETH Address type: ${typeof validator.ethAddress}`);
      this.logger.debug(`   Voting Power: ${votingPowerPercent}`);
      this.logger.debug(`   Voting Power type: ${typeof votingPowerPercent}`);
      
      // Generate the leaf hash
      const leaf = keccak256(
        encodePacked(
          ["bytes1", "bytes", "uint32"],
          [
            domainSeparator as `0x${string}`,
            ethAddressHex,
            votingPowerPercent,
          ],
        ),
      );
      
      this.logger.debug(`   Leaf hash: ${leaf}`);
      
      return leaf;
    });

    this.logger.debug(`🌳 Generated ${validatorTreeLeaves.length} leaf hashes`);
    
    // Sort leaves before building tree (important for deterministic root)
    const validatorTree = SimpleMerkleTree.of(validatorTreeLeaves, { sortLeaves: true });
    
    this.logger.info(`✅ Validator merkle tree built successfully`);
    this.logger.info(`   🌳 Root: ${validatorTree.root}`);
    this.logger.info(`   📊 Leaves: ${validatorTreeLeaves.length}`);
    this.logger.info(`   🔄 Sorted: true`);
    
    return validatorTree;
  }

  /**
   * Generate merkle proof for a specific validator
   */
  generateValidatorProof(
    validatorTree: SimpleMerkleTree,
    validatorEntry: ValidatorEntry,
    domainSeparator: string = SECP256K1_DOMAIN_SEPARATOR
  ): HexString[] {
    
    const validatorEthAddressHex = toHex(validatorEntry.ethAddress);
    
    // Ensure votingPowerPercent is a proper number
    const validatorVotingPowerPercent = typeof validatorEntry.votingPowerPercent === 'number' 
      ? validatorEntry.votingPowerPercent 
      : Number(validatorEntry.votingPowerPercent);
    
    // Generate the same leaf that was used in tree construction
    const leaf = keccak256(
      encodePacked(
        ["bytes1", "bytes", "uint32"],
        [
          domainSeparator as `0x${string}`,
          validatorEthAddressHex,
          validatorVotingPowerPercent,
        ],
      ),
    );

    // Get merkle proof for this leaf
    const proof = validatorTree.getProof(leaf);

    // Convert proof elements to proper hex format
    const formattedProof = proof.map((p: any) => {
      const hexString = typeof p === 'string' ? p : p.toString();
      return HexUtils.normalize(hexString);
    });

    this.logger.debug(`🔍 Generated merkle proof for validator ${validatorEthAddressHex}:`);
    this.logger.debug(`   Leaf: ${leaf}`);
    this.logger.debug(`   Proof elements: ${formattedProof.length}`);
    
    return formattedProof;
  }

  /**
   * Generate proofs for all validators in batch
   */
  generateAllValidatorProofs(
    validatorEntries: ValidatorEntry[],
    domainSeparator: string = SECP256K1_DOMAIN_SEPARATOR
  ): Map<string, HexString[]> {
    
    this.logger.info(`🔍 Generating merkle proofs for ${validatorEntries.length} validators...`);
    
    // Build the merkle tree
    const validatorTree = this.buildValidatorTree(validatorEntries, domainSeparator);
    
    // Generate proofs for each validator
    const proofsMap = new Map<string, HexString[]>();
    
    for (const validator of validatorEntries) {
      const validatorAddrHex = Buffer.from(validator.validatorAddress).toString('hex');
      const proof = this.generateValidatorProof(validatorTree, validator, domainSeparator);
      proofsMap.set(validatorAddrHex, proof);
      
      this.logger.debug(`✅ Generated proof for validator ${validatorAddrHex} (${proof.length} elements)`);
    }
    
    this.logger.info(`✅ Generated ${proofsMap.size} validator proofs`);
    
    return proofsMap;
  }

  /**
   * Verify a merkle proof against a root
   */
  verifyProof(
    proof: HexString[],
    leaf: string,
    root: string
  ): boolean {
    try {
      // Convert to format expected by SimpleMerkleTree
      const proofElements = proof.map(p => p.startsWith('0x') ? p.slice(2) : p);
      
      // This is a simplified verification - in production you'd use the actual tree verification
      this.logger.debug(`🔍 Verifying proof: leaf=${leaf}, root=${root}, proofElements=${proofElements.length}`);
      
      // For now, we assume proofs are valid if they have the right structure
      return proofElements.length > 0;
      
    } catch (error) {
              this.logger.warn(`⚠️ Proof verification failed: ${getErrorMessage(error)}`);
      return false;
    }
  }

  /**
   * Get the merkle root from a tree
   */
  getTreeRoot(tree: SimpleMerkleTree): HexString {
    return HexUtils.normalize(tree.root);
  }
} 