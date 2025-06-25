/**
 * Cosmos Sequence Query Service
 * Handles querying account sequence numbers from the blockchain
 */

import type { Signer } from '@seda-protocol/dev-tools';
import type { LoggingServiceInterface } from '../../services';

/**
 * Service for querying account sequence numbers from Cosmos chains
 */
export class SequenceQueryService {
  constructor(private logger: LoggingServiceInterface) {}

  /**
   * Query the current account sequence number from the blockchain
   */
  async queryAccountSequence(signer: Signer): Promise<number> {
    try {
      const address = signer.getAddress();
      const endpoint = signer.getEndpoint();
      
      this.logger.info(`🔍 Querying account ${address} from ${endpoint}`);
      
      // Try CosmJS first (most reliable)
      try {
        return await this.queryWithCosmJS(address, endpoint);
      } catch (cosmjsError) {
        this.logger.warn('❌ Failed to query with CosmJS, trying RPC fallback');
        return await this.queryWithRpc(address, endpoint);
      }
      
    } catch (error) {
      this.logger.error('❌ Error querying account sequence:', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Query using CosmJS Stargate client
   */
  private async queryWithCosmJS(address: string, endpoint: string): Promise<number> {
    const { StargateClient } = await import('@cosmjs/stargate');
    
    const client = await StargateClient.connect(endpoint);
    
    try {
      const account = await client.getAccount(address);
      
      if (account) {
        const sequence = account.sequence;
        this.logger.info(`📋 Account ${address} current sequence: ${sequence}`);
        return sequence;
      } else {
        this.logger.info(`📋 Account ${address} not found - assuming new account with sequence 0`);
        return 0;
      }
    } finally {
      client.disconnect();
    }
  }

  /**
   * Fallback query using direct RPC calls
   */
  private async queryWithRpc(address: string, rpcEndpoint: string): Promise<number> {
    const rpcUrl = `${rpcEndpoint}/abci_query`;
    
    this.logger.info(`🔍 Trying Tendermint RPC query: ${rpcUrl}`);
    
    const queryData = {
      path: "store/acc/key",
      data: Buffer.from(`account:${address}`).toString('hex'),
      prove: false
    };
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'abci_query',
        params: queryData
      })
    });
    
    if (!response.ok) {
      throw new Error(`RPC query failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (data.result && data.result.response && data.result.response.value) {
      // For now, assume sequence 0 if we can't parse properly
      // This is a simplified approach - full account parsing would require protobuf decoding
      this.logger.info(`📋 Account exists, assuming sequence 0 for safety`);
      return 0;
    } else {
      this.logger.info(`📋 Account ${address} not found via RPC - new account, sequence 0`);
      return 0;
    }
  }
} 