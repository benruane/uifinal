/**
 * Batch Converter
 * Converts batch data to EVM format for contract interaction
 */

import type { SignedBatch } from '../../types';
import { HexUtils } from '../../utils/hex';
import { padBytes } from 'viem';

/**
 * EVM Batch structure for contract interaction
 */
export interface EvmBatch {
  batchHeight: bigint;
  blockHeight: bigint;
  validatorsRoot: string;
  resultsRoot: string;
  provingMetadata: string;
}

/**
 * Convert SignedBatch to EVM format
 */
export function createEvmBatch(batch: SignedBatch): EvmBatch {
  const validatorRootHex = typeof batch.validatorRoot === 'string' 
    ? batch.validatorRoot 
    : Buffer.from(batch.validatorRoot).toString('hex');
  
  const dataResultRootHex = typeof batch.dataResultRoot === 'string' 
    ? batch.dataResultRoot 
    : Buffer.from(batch.dataResultRoot).toString('hex');
  
  return {
    batchHeight: BigInt(batch.batchNumber),
    blockHeight: BigInt(batch.blockHeight),
    validatorsRoot: HexUtils.normalize(validatorRootHex),
    resultsRoot: HexUtils.normalize(dataResultRootHex),
    provingMetadata: HexUtils.normalize(
      Buffer.from(padBytes(Buffer.alloc(32), { size: 32 })).toString('hex')
    ),
  };
} 