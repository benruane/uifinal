/**
 * Signature Processor
 * Processes and validates batch signatures for EVM posting
 */

import type { SignedBatch, ProcessedSignature, ValidatorProofData } from '../../types';
import type { LoggingServiceInterface } from '../../services';
import type { HexString } from '../../utils/hex';
import { HexUtils } from '../../utils/hex';
import { SignatureProcessor as CryptoSignatureProcessor } from '../../crypto/signature-processor';
import { MerkleProofGenerator } from '../../crypto/merkle-proof-generator';
import { getErrorMessage } from '../../helpers/error-utils';
import { validateConsensusThreshold, validateValidatorRoot } from './batch-validation';

/**
 * Signature processing result
 */
export interface SignatureProcessingResult {
  success: boolean;
  error?: string;
  signatures?: HexString[];
  proofs?: ValidatorProofData[];
  totalVotingPower?: number;
}

/**
 * Process all signatures in a batch
 */
export async function processBatchSignatures(
  batch: SignedBatch,
  logger?: LoggingServiceInterface
): Promise<SignatureProcessingResult> {
  logger?.debug(`Processing ${batch.batchSignatures!.length} signatures (${batch.validatorEntries!.length} validators)`);

  // Generate merkle tree for validators
  const merkleGenerator = new MerkleProofGenerator(logger!);
  const validatorTree = merkleGenerator.buildValidatorTree(
    batch.validatorEntries!,
    '0x01' // SECP256K1_DOMAIN_SEPARATOR
  );

  // Validate validator root consistency
  const localValidatorRoot = merkleGenerator.getTreeRoot(validatorTree);
  const batchValidatorRoot = typeof batch.validatorRoot === 'string' 
    ? HexUtils.normalize(batch.validatorRoot)
    : HexUtils.normalize(Buffer.from(batch.validatorRoot).toString('hex'));

  logger?.info(`🔍 Validator Root Validation:`);
  logger?.info(`   Local root:  ${localValidatorRoot}`);
  logger?.info(`   Batch root:  ${batchValidatorRoot}`);

  const rootValidation = validateValidatorRoot(localValidatorRoot, batchValidatorRoot);
  if (!rootValidation.valid) {
    return { success: false, error: rootValidation.error };
  }

  logger?.info(`✅ Validator root validation passed - proofs will be valid`);

  let totalVotingPower = 0;
  const processedSignatures: ProcessedSignature[] = [];
  const validatorProofs: ValidatorProofData[] = [];
  const ethereumSignatures: HexString[] = [];

  // Process each signature
  for (const signature of batch.batchSignatures!) {
    try {
      const result = processIndividualSignature(
        signature,
        batch,
        merkleGenerator,
        validatorTree
      );

      if (result.success && result.data) {
        totalVotingPower += result.data.votingPower;
        processedSignatures.push(result.data);
        validatorProofs.push(result.data.proof);
        ethereumSignatures.push(result.data.ethereumSignature);
        
        logger?.debug(`Processed signature (power: ${result.data.votingPower})`);
      } else {
        logger?.warn(`Failed to process signature: ${result.error}`);
      }
    } catch (error) {
      logger?.warn(`Failed to process signature: ${getErrorMessage(error)}`);
    }
  }

  const powerPercent = (totalVotingPower / 1_000_000).toFixed(2);
  logger?.info(`Processed ${processedSignatures.length} signatures (${powerPercent}% voting power)`);

  // Validate consensus threshold
  const consensusValidation = validateConsensusThreshold(totalVotingPower);
  if (!consensusValidation.valid) {
    return { success: false, error: consensusValidation.error };
  }

  // Sort signatures lexicographically by ETH address (required by contract)
  const sortedIndices = processedSignatures
    .map((sig, index) => ({ sig, index }))
    .sort((a, b) => a.sig.ethAddress.toString('hex').localeCompare(b.sig.ethAddress.toString('hex')))
    .map(item => item.index);

  const sortedValidatorProofs = sortedIndices.map(i => validatorProofs[i]).filter((proof): proof is ValidatorProofData => proof !== undefined);
  const sortedEthereumSignatures = sortedIndices.map(i => ethereumSignatures[i]).filter((sig): sig is HexString => sig !== undefined);

  return {
    success: true,
    signatures: sortedEthereumSignatures,
    proofs: sortedValidatorProofs,
    totalVotingPower
  };
}

/**
 * Process an individual signature
 */
function processIndividualSignature(
  signature: any,
  batch: SignedBatch,
  merkleGenerator: MerkleProofGenerator,
  validatorTree: any
): { success: boolean; error?: string; data?: any } {
  // Find corresponding validator entry
  const validatorEntry = batch.validatorEntries!.find((v: any) => 
    Buffer.from(v.validatorAddress).equals(signature.validatorAddress)
  );

  if (!validatorEntry) {
    return {
      success: false,
      error: `Validator entry not found for signature from ${Buffer.from(signature.validatorAddress).toString('hex')}`
    };
  }

  // Prepare batch ID for signature validation
  const batchIdBuffer = Buffer.isBuffer(batch.batchId) 
    ? batch.batchId 
    : Buffer.from(batch.batchId, 'hex');

  // Validate signature
  const validationResult = CryptoSignatureProcessor.validateSignature(
    signature.secp256k1Signature,
    batchIdBuffer,
    Buffer.from(validatorEntry.ethAddress)
  );

  if (!validationResult.valid) {
    return { success: false, error: validationResult.error };
  }

  // Generate merkle proof
  const proof = merkleGenerator.generateValidatorProof(validatorTree, validatorEntry, '0x01');

  // Convert signature to Ethereum format
  const ethereumSig = CryptoSignatureProcessor.toEthereumFormat(signature.secp256k1Signature);

  const votingPowerPercent = typeof validatorEntry.votingPowerPercent === 'number' 
    ? validatorEntry.votingPowerPercent 
    : Number(validatorEntry.votingPowerPercent);

  return {
    success: true,
    data: {
      ethAddress: Buffer.from(validatorEntry.ethAddress),
      votingPower: votingPowerPercent,
      ethereumSignature: HexUtils.normalize(ethereumSig.toString('hex')),
      proof: {
        signer: HexUtils.normalize(Buffer.from(validatorEntry.ethAddress).toString('hex')),
        votingPower: votingPowerPercent,
        merkleProof: proof.map((p: string) => HexUtils.normalize(p))
      }
    }
  };
} 