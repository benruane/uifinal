/**
 * Result Existence Checker
 * Checks if a DataRequest result already exists on an EVM network
 */

import type { EvmNetworkConfig } from '../../types';
import type { LoggingServiceInterface } from '../../services';
import { readEvmContract } from '../../utils/transaction/evm-transaction-builder';
import { ABI_SEDA_CORE_V1 } from '../abi';
import { getErrorMessage } from '../../helpers/error-utils';

/**
 * Check if a result already exists on the network
 */
export async function checkResultExists(
  network: EvmNetworkConfig,
  sedaCoreAddress: string,
  drId: string,
  logger?: LoggingServiceInterface
): Promise<boolean> {
  try {
    const requestId = drId.startsWith('0x') ? drId : `0x${drId}`;

    const hasResult = await readEvmContract<boolean>(
      network,
      sedaCoreAddress,
      ABI_SEDA_CORE_V1 as unknown as any[],
      'hasResult',
      [requestId]
    );

    return hasResult;
  } catch (error) {
    logger?.debug(`Failed to check result existence: ${getErrorMessage(error)}`);
    return false; // Assume doesn't exist if we can't check
  }
} 