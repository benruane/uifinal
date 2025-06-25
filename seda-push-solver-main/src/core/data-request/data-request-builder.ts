/**
 * SEDA DataRequest Builder
 * Handles configuration and posting of DataRequests to SEDA network
 */

import { Signer } from '@seda-protocol/dev-tools';
import { getSedaNetworkConfig } from '../../config';
import { 
  buildDataRequestInput, 
  buildGasOptions, 
  buildAwaitOptions
} from './input-builder';
import { postDataRequestTransaction, awaitDataRequestResult } from './executor';
import { initializeSigner } from './signer';
import type { SedaConfig, DataRequestResult, DataRequestOptions } from '../../types';
import type { LoggingServiceInterface } from '../../services';

/**
 * SEDA DataRequest Builder
 * Handles configuration and posting of DataRequests to SEDA network
 */
export class SEDADataRequestBuilder {
  private config: SedaConfig;
  private signer: Signer | null = null;
  private isInitialized: boolean = false;
  private logger: LoggingServiceInterface;

  constructor(
    config: SedaConfig, 
    logger: LoggingServiceInterface
  ) {
    this.config = config;
    this.logger = logger;
    
    if (!this.config.mnemonic) {
      throw new Error('Mnemonic is required in SEDA configuration');
    }
  }

  /**
   * Initialize the builder (create signing configuration)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.signer = await initializeSigner(this.config, this.logger);
      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize signing configuration:', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Post a DataRequest to the SEDA network
   */
  async postDataRequest(options: DataRequestOptions = {}): Promise<DataRequestResult> {
    if (!this.isInitialized || !this.signer) {
      await this.initialize();
    }

    this.logger.info('📤 Posting DataRequest');
    this.logger.info(`   🌐 Network: ${this.config.network.toUpperCase()} | RPC: ${this.config.rpcEndpoint}`);
    this.logger.info(`   📝 Memo: ${options.memo || 'Default memo'}`);

    try {
      // Get network-specific DataRequest configuration
      const networkConfig = getSedaNetworkConfig(this.config.network);
      const drConfig = networkConfig.dataRequest;

      // Build the PostDataRequestInput using the modular function
      const postInput = buildDataRequestInput(drConfig, options);

      // Build gas and await options using modular functions
      const gasOptions = buildGasOptions(networkConfig);
      const awaitOptions = buildAwaitOptions(drConfig, options);

      // Post the DataRequest transaction first
      const postResult = await postDataRequestTransaction(
        this.signer!, 
        postInput, 
        gasOptions, 
        networkConfig,
        this.logger
      );

      // Then wait for results
      const queryConfig = { rpc: this.signer!.getEndpoint() };
      return await awaitDataRequestResult(
        queryConfig,
        postResult.drId,
        postResult.blockHeight,
        awaitOptions,
        networkConfig,
        this.logger
      );

    } catch (error) {
      this.logger.error('DataRequest Failed:', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): SedaConfig {
    return { ...this.config };
  }

  /**
   * Check if the builder is initialized
   */
  isBuilderInitialized(): boolean {
    return this.isInitialized;
  }
} 