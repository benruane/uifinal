/**
 * Result ID Deriver
 * Derives result IDs for tracking purposes
 */

import type { EvmNetworkConfig } from '../../types';
import type { LoggingServiceInterface } from '../../services';
import { readEvmContract } from '../../utils/transaction/evm-transaction-builder';
import { ABI_SEDA_CORE_V1 } from '../abi';
import { getErrorMessage } from '../../helpers/error-utils';
import type { DataResultEvm } from './data-result-converter';

/**
 * Derive the result ID for a given result
 */
export async function deriveResultId(
  network: EvmNetworkConfig,
  sedaCoreAddress: string,
  evmResult: DataResultEvm,
  logger?: LoggingServiceInterface
): Promise<string> {
  try {
    const resultId = await readEvmContract<string>(
      network,
      sedaCoreAddress,
      ABI_SEDA_CORE_V1 as unknown as any[],
      'deriveResultId',
      [evmResult]
    );

    return resultId;
  } catch (error) {
    logger?.debug(`Failed to derive result ID: ${getErrorMessage(error)}`);
    return 'unknown';
  }
} 