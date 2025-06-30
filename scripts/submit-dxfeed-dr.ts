import { SedaClient } from "@seda-protocol/dev-tools";
import { config } from "dotenv";

// Load environment variables
config();

interface AssetRequest {
    symbol: string;
    asset_type: string;
}

interface PriceResult {
    symbol: string;
    price: number;
    confidence: number;
    timestamp: number;
}

async function submitDXFeedDataRequest(assets: AssetRequest[]): Promise<PriceResult[]> {
    console.log("🚀 Submitting DX Feed Data Request to SEDA Network...");
    console.log("Assets:", JSON.stringify(assets, null, 2));

    // Initialize SEDA client
    const client = new SedaClient({
        rpcEndpoint: process.env.SEDA_RPC_ENDPOINT!,
        mnemonic: process.env.SEDA_MNEMONIC!,
    });

    // Get Oracle Program ID from environment
    const oracleProgramId = process.env.ORACLE_PROGRAM_ID;
    if (!oracleProgramId) {
        throw new Error("ORACLE_PROGRAM_ID not set in environment variables");
    }

    // Prepare the input data
    const inputData = JSON.stringify(assets);
    console.log("Input data:", inputData);

    try {
        // Submit the data request
        console.log("📡 Submitting data request...");
        const result = await client.submitDataRequest({
            oracleProgramId,
            input: inputData,
            // Optional: Set replication factor for consensus
            replicationFactor: 3,
        });

        console.log("✅ Data request submitted successfully!");
        console.log("Transaction hash:", result.txHash);
        console.log("Data request ID:", result.dataRequestId);

        // Wait for the result
        console.log("⏳ Waiting for result...");
        const finalResult = await client.waitForDataRequestResult(result.dataRequestId);
        
        console.log("🎉 Data request completed!");
        console.log("Final result:", finalResult);

        // Parse the result
        const priceResults: PriceResult[] = JSON.parse(finalResult);
        return priceResults;

    } catch (error) {
        console.error("❌ Error submitting data request:", error);
        throw error;
    }
}

// Example usage functions
export async function submitEquityPrices() {
    const assets: AssetRequest[] = [
        { symbol: "AAPL", asset_type: "equity" },
        { symbol: "MSFT", asset_type: "equity" },
        { symbol: "TSLA", asset_type: "equity" },
        { symbol: "NVDA", asset_type: "equity" },
        { symbol: "GOOG", asset_type: "equity" },
        { symbol: "META", asset_type: "equity" },
        { symbol: "AMZN", asset_type: "equity" },
        { symbol: "SPY", asset_type: "equity" }
    ];

    return await submitDXFeedDataRequest(assets);
}

export async function submitForexPrices() {
    const assets: AssetRequest[] = [
        { symbol: "EUR", asset_type: "forex" },
        { symbol: "GBP", asset_type: "forex" },
        { symbol: "JPY", asset_type: "forex_reverse" }
    ];

    return await submitDXFeedDataRequest(assets);
}

export async function submitCommodityPrices() {
    const assets: AssetRequest[] = [
        { symbol: "XAU/USD", asset_type: "commodity" },
        { symbol: "WTI/USD", asset_type: "commodity" },
        { symbol: "BRN/USD", asset_type: "commodity" }
    ];

    return await submitDXFeedDataRequest(assets);
}

export async function submitUSLFPrices() {
    const assets: AssetRequest[] = [
        { symbol: "AAPL", asset_type: "uslf" },
        { symbol: "TSLA", asset_type: "uslf" },
        { symbol: "NVDA", asset_type: "uslf" },
        { symbol: "GOOG", asset_type: "uslf" },
        { symbol: "META", asset_type: "uslf" },
        { symbol: "MSFT", asset_type: "uslf" },
        { symbol: "SPY", asset_type: "uslf" },
        { symbol: "AMZN", asset_type: "uslf" }
    ];

    return await submitDXFeedDataRequest(assets);
}

export async function submitMixedPrices() {
    const assets: AssetRequest[] = [
        // Equities
        { symbol: "AAPL", asset_type: "equity" },
        { symbol: "TSLA", asset_type: "equity" },
        // Forex
        { symbol: "EUR", asset_type: "forex" },
        { symbol: "JPY", asset_type: "forex_reverse" },
        // Commodities
        { symbol: "XAU/USD", asset_type: "commodity" },
        // USLF
        { symbol: "NVDA", asset_type: "uslf" }
    ];

    return await submitDXFeedDataRequest(assets);
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    async function main() {
        try {
            let results: PriceResult[];

            switch (command) {
                case "equity":
                    results = await submitEquityPrices();
                    break;
                case "forex":
                    results = await submitForexPrices();
                    break;
                case "commodity":
                    results = await submitCommodityPrices();
                    break;
                case "uslf":
                    results = await submitUSLFPrices();
                    break;
                case "mixed":
                    results = await submitMixedPrices();
                    break;
                default:
                    console.log("Usage: bun run submit-dxfeed-dr.ts [equity|forex|commodity|uslf|mixed]");
                    console.log("Available commands:");
                    console.log("  equity   - Submit US equity prices");
                    console.log("  forex    - Submit forex pair prices");
                    console.log("  commodity - Submit commodity prices");
                    console.log("  uslf     - Submit USLF24 extended hours prices");
                    console.log("  mixed    - Submit mixed asset types");
                    process.exit(1);
            }

            console.log("\n📊 Final Price Results:");
            results.forEach(result => {
                console.log(`  ${result.symbol}: $${result.price.toFixed(4)} (${(result.confidence * 100).toFixed(1)}% confidence)`);
            });

        } catch (error) {
            console.error("❌ Error:", error);
            process.exit(1);
        }
    }

    main();
} 