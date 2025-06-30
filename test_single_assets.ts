import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';
import { config } from "dotenv";

// Load environment variables
config();

const ORACLE_PROGRAM_ID = "71b5d524d45c4bb170e82a91269e501dd1e8c2289a9930f1d67bfdd0d2786010";

interface TestAsset {
    name: string;
    input: string;
    description: string;
}

const testAssets: TestAsset[] = [
    // US Equities
    { name: "AAPL (Equity)", input: "equity:AAPL", description: "Apple Inc. stock" },
    { name: "MSFT (Equity)", input: "equity:MSFT", description: "Microsoft Corporation stock" },
    { name: "TSLA (Equity)", input: "equity:TSLA", description: "Tesla Inc. stock" },
    { name: "SPY (ETF)", input: "equity:SPY", description: "SPDR S&P 500 ETF" },
    
    // Forex pairs
    { name: "EUR/USD", input: "fx:EUR", description: "Euro vs US Dollar" },
    { name: "GBP/USD", input: "fx:GBP", description: "British Pound vs US Dollar" },
    { name: "USD/JPY", input: "fx_r:JPY", description: "US Dollar vs Japanese Yen" },
    
    // Commodities
    { name: "Gold (XAU/USD)", input: "cfd:XAU:USD", description: "Gold vs US Dollar" },
    { name: "Oil (WTI/USD)", input: "cfd:WTI:USD", description: "US Crude Oil" },
    { name: "Brent (BRN/USD)", input: "cfd:BRN:USD", description: "Brent Crude Oil" },
    
    // USLF24 Extended Hours
    { name: "ES (USLF24 Quote)", input: "uslf_q:ES", description: "E-mini S&P 500 extended hours quote" },
    { name: "ES (USLF24 Trade)", input: "uslf_t:ES", description: "E-mini S&P 500 extended hours trade" },
];

async function testSingleAssets() {
    console.log("🧪 Testing Oracle Program with Single Asset Data Requests\n");
    console.log(`Oracle Program ID: ${ORACLE_PROGRAM_ID}\n`);

    // Takes the mnemonic from the .env file (SEDA_MNEMONIC and SEDA_RPC_ENDPOINT)
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);

    const results: Array<{asset: TestAsset, success: boolean, result?: any, error?: string}> = [];

    for (const asset of testAssets) {
        console.log(`📊 Testing: ${asset.name} (${asset.description})`);
        console.log(`   Input: ${asset.input}`);
        
        try {
            console.log(`   🔄 Submitting data request...`);
            
            const dataRequestInput: PostDataRequestInput = {
                consensusOptions: {
                    method: 'none'
                },
                execProgramId: ORACLE_PROGRAM_ID,
                execInputs: Buffer.from(asset.input),
                tallyInputs: Buffer.from([]),
                memo: Buffer.from(`Test DR for ${asset.name} - ${new Date().toISOString()}`),
                gasPrice: 20000n
            };

            const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
            
            console.log(`   ✅ DR completed successfully!`);
            console.log(`   📈 Result: ${result.result}`);
            
            // Try to parse the result if it's JSON
            try {
                const parsedResult = JSON.parse(result.result);
                console.log(`   📊 Parsed result:`, parsedResult);
                results.push({ asset, success: true, result: parsedResult });
            } catch (parseError) {
                console.log(`   📊 Raw result: ${result.result}`);
                results.push({ asset, success: true, result: result.result });
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error}`);
            results.push({ asset, success: false, error: error.toString() });
        }

        console.log("   " + "─".repeat(60) + "\n");
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Summary
    console.log("📋 TEST SUMMARY");
    console.log("=".repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}\n`);
    
    if (successful.length > 0) {
        console.log("✅ SUCCESSFUL ASSETS:");
        successful.forEach(r => {
            console.log(`   ${r.asset.name}: ${JSON.stringify(r.result)}`);
        });
    }
    
    if (failed.length > 0) {
        console.log("❌ FAILED ASSETS:");
        failed.forEach(r => {
            console.log(`   ${r.asset.name}: ${r.error}`);
        });
    }
}

// Run the tests
testSingleAssets().catch(console.error); 