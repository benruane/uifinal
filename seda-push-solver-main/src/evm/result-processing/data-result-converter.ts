/**
 * Data Result Converter
 * Converts DataResult to EVM format for contract interaction
 */

import type { Hex, ContractFunctionArgs } from 'viem';
import { ABI_SEDA_CORE_V1 } from '../abi';

/**
 * EVM Result structure for posting (extracted from ABI like simple-solver)
 */
export type DataResultEvm = ContractFunctionArgs<
  typeof ABI_SEDA_CORE_V1,
  'nonpayable',
  'postResult'
>[0];

/**
 * Convert DataResult to EVM format
 * Using the exact same logic as simple-solver's convertDataResultToDataResultEvm()
 */
export function convertDataResultToDataResultEvm(input: any): DataResultEvm {
  // Follow the exact simple-solver pattern - no assumptions, use actual values
  return {
    blockHeight: BigInt(input.blockHeight),
    blockTimestamp: input.blockTimestamp,
    consensus: input.consensus,
    drId: add0x(input.drId),
    exitCode: input.exitCode,
    gasUsed: input.gasUsed,
    paybackAddress: add0x(input.paybackAddress.toString("hex")),
    result: add0x(input.result.toString("hex")),
    sedaPayload: add0x(input.sedaPayload.toString("hex")),
    version: input.version,
  };
}

/**
 * Add 0x prefix to hex string (simple-solver pattern)
 */
export function add0x(input: string): Hex {
  if (input.startsWith('0x')) return input as Hex;
  return `0x${input}` as Hex;
}

/**
 * Strip 0x prefix from hex string
 */
export function strip0x(input: string): string {
  if (input.startsWith('0x')) return input.slice(2);
  return input;
} 