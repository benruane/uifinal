/**
 * Sequence Validator
 * Handles blockchain sequence validation and recovery
 */

import type { LoggingServiceInterface } from '../../../services';
import type { Signer } from '@seda-protocol/dev-tools';
import { SequenceQueryService } from '../sequence-query-service';
import { delay } from '../../../helpers';

/**
 * Sequence Validator
 * Validates sequences against blockchain and handles recovery
 */
export class SequenceValidator {
  private queryService: SequenceQueryService;
  private lastValidationTime: number = 0;
  private readonly VALIDATION_INTERVAL_MS = 5000; // Validate every 5 seconds

  constructor(private logger: LoggingServiceInterface) {
    this.queryService = new SequenceQueryService(this.logger);
  }

  /**
   * Perform reliable sequence initialization
   */
  async performReliableInitialization(signer: Signer): Promise<number> {
    this.logger.info('🛡️ Performing reliable sequence initialization...');

    // Try multiple strategies with retries
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const blockchainSequence = await this.queryService.queryAccountSequence(signer);
        this.lastValidationTime = Date.now();
        
        this.logger.info(`✅ Initialization complete: Blockchain sequence ${blockchainSequence}`);
        return blockchainSequence;
        
      } catch (error) {
        this.logger.warn(`⚠️ Blockchain query attempt ${attempt + 1} failed: ${error}`);
        if (attempt < 2) {
          await delay(2000); // Wait before retry
        }
      }
    }

    // Fallback with conservative approach
    this.logger.warn('⚠️ Using conservative fallback sequence initialization');
    this.lastValidationTime = Date.now();
    return 0; // Conservative fallback
  }

  /**
   * Perform periodic validation
   */
  async performPeriodicValidation(signer: Signer): Promise<number | null> {
    const now = Date.now();
    if (now - this.lastValidationTime < this.VALIDATION_INTERVAL_MS) {
      return null; // Too soon to validate again
    }

    return await this.validateWithRecovery(signer);
  }

  /**
   * Validate current sequence against blockchain with recovery
   */
  async validateWithRecovery(signer: Signer): Promise<number | null> {
    try {
      const blockchainSequence = await this.queryService.queryAccountSequence(signer);
      this.lastValidationTime = Date.now();
      return blockchainSequence;
      
    } catch (error) {
      this.logger.warn(`⚠️ Sequence validation failed: ${error}`);
      return null;
    }
  }

  /**
   * Check if enough time has passed for validation
   */
  shouldValidate(): boolean {
    return Date.now() - this.lastValidationTime > this.VALIDATION_INTERVAL_MS;
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      lastValidationTime: this.lastValidationTime,
      lastValidationAge: Date.now() - this.lastValidationTime,
      validationInterval: this.VALIDATION_INTERVAL_MS,
      shouldValidateNow: this.shouldValidate()
    };
  }
} 