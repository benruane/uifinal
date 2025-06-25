interface GasInfo {
    gasPrice: bigint;
    estimatedGasPerAsset: bigint;
    maxGasPerDR: bigint;
    maxAssetsPerDR: number;
    estimatedCostPerDR: bigint;
}

interface AssetChunk {
    assets: string[];
    estimatedGasCost: bigint;
    estimatedCost: bigint; // in SEDA tokens
}

export class DynamicGasOptimizer {
    private readonly ORACLE_PROGRAM_ID: string;
    private readonly ESTIMATED_GAS_PER_ASSET = 60000000n; // Reduced estimate per asset with higher gas price
    private readonly MAX_GAS_PER_DR = 10000000000n; // Much higher gas limit (10B gas) as suggested by SEDA CTO
    private readonly GAS_PRICE_MULTIPLIER = 120n; // 20% buffer for safety (120/100)
    private readonly MAX_ASSETS_PER_DR = 10; // Increased limit to test new gas configuration

    constructor(oracleProgramId: string) {
        this.ORACLE_PROGRAM_ID = oracleProgramId;
    }

    /**
     * Get current SEDA gas price (simulated for now)
     * In production, this would fetch from SEDA network
     */
    private async getSedaGasPrice(): Promise<bigint> {
        // Updated to match the gas price set by SEDA engineer in post-dr.ts
        return 200000n;
    }

    /**
     * Calculate optimal gas parameters based on SEDA network configuration
     */
    async calculateOptimalGasParams(): Promise<GasInfo> {
        const sedaGasPrice = await this.getSedaGasPrice();
        
        // Use the standard gas per asset estimate
        const adjustedGasPerAsset = this.ESTIMATED_GAS_PER_ASSET;
        
        // Use conservative limit of 5 assets per DR to avoid gas issues
        const maxAssetsPerDR = this.MAX_ASSETS_PER_DR;
        
        const gasInfo: GasInfo = {
            gasPrice: sedaGasPrice,
            estimatedGasPerAsset: adjustedGasPerAsset,
            maxGasPerDR: this.MAX_GAS_PER_DR,
            maxAssetsPerDR: maxAssetsPerDR,
            estimatedCostPerDR: (sedaGasPrice * BigInt(maxAssetsPerDR) * adjustedGasPerAsset / 1000000000n)
        };

        console.log('📊 SEDA Gas Analysis (Updated with CTO guidance):');
        console.log(`  • SEDA gas price: ${sedaGasPrice.toString()}`);
        console.log(`  • Gas per asset: ${adjustedGasPerAsset.toString()}`);
        console.log(`  • Max gas per DR: ${this.MAX_GAS_PER_DR.toString()} (10B gas limit)`);
        console.log(`  • Max assets per DR: ${maxAssetsPerDR} (conservative limit)`);
        console.log(`  • Estimated cost per DR: ${gasInfo.estimatedCostPerDR.toString()} SEDA`);

        return gasInfo;
    }

    /**
     * Split assets into optimal chunks based on SEDA gas configuration
     */
    async optimizeAssetChunks(assets: string[]): Promise<AssetChunk[]> {
        const gasInfo = await this.calculateOptimalGasParams();
        
        console.log(`\n📦 Optimizing ${assets.length} assets with SEDA gas config...`);
        
        const chunks: AssetChunk[] = [];
        
        for (let i = 0; i < assets.length; i += gasInfo.maxAssetsPerDR) {
            const chunk = assets.slice(i, i + gasInfo.maxAssetsPerDR);
            const estimatedGasCost = gasInfo.estimatedGasPerAsset * BigInt(chunk.length);
            const estimatedCost = (estimatedGasCost * gasInfo.gasPrice) / 1000000000n; // Convert to SEDA tokens
            
            chunks.push({
                assets: chunk,
                estimatedGasCost,
                estimatedCost
            });
        }

        console.log(`✅ Split into ${chunks.length} optimal DRs:`);
        chunks.forEach((chunk, index) => {
            console.log(`  DR ${index + 1}: ${chunk.assets.join(', ')}`);
            console.log(`    Estimated gas: ${chunk.estimatedGasCost.toString()}`);
            console.log(`    Estimated cost: ${chunk.estimatedCost.toString()} SEDA`);
        });

        return chunks;
    }

    /**
     * Get network status based on SEDA configuration
     */
    getNetworkStatus(): 'stable' | 'busy' | 'optimal' {
        // For SEDA, we assume stable network conditions
        // In a real implementation, you could check network metrics
        return 'stable';
    }

    /**
     * Get recommended action based on SEDA network conditions
     */
    getRecommendation(assetCount: number): string {
        const status = this.getNetworkStatus();
        
        switch (status) {
            case 'optimal':
                return `🚀 SEDA network: OPTIMAL - Great time to process ${assetCount} assets efficiently (10 assets per DR with new gas config)`;
            case 'stable':
                return `✅ SEDA network: STABLE - Standard processing recommended for ${assetCount} assets (10 assets per DR with new gas config)`;
            case 'busy':
                return `⚠️ SEDA network: BUSY - Consider processing in smaller batches`;
        }
    }

    /**
     * Monitor SEDA network status and provide recommendations
     */
    async monitorNetworkStatus(durationMinutes: number = 5): Promise<void> {
        console.log(`🔍 Monitoring SEDA network for ${durationMinutes} minutes...`);
        
        const startTime = Date.now();
        const endTime = startTime + (durationMinutes * 60 * 1000);
        
        while (Date.now() < endTime) {
            const gasPrice = await this.getSedaGasPrice();
            const status = this.getNetworkStatus();
            const recommendation = this.getRecommendation(12);
            
            console.log(`[${new Date().toLocaleTimeString()}] Gas: ${gasPrice.toString()}, Status: ${status.toUpperCase()}`);
            console.log(`  ${recommendation}`);
            
            // Wait 30 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
} 