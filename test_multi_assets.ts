import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';
import { config } from "dotenv";

// Load environment variables
config();

const ORACLE_PROGRAM_ID = "71b5d524d45c4bb170e82a91269e501dd1e8c2289a9930f1d67bfdd0d2786010";

// 8 random assets from different categories
const multiAssetInput = "equity:AAPL,fx:EUR,cfd:XAU:USD,uslf_q:ES,equity:TSLA,fx_r:JPY,cfd:WTI:USD,uslf_t:ES";

async function testMultiAssets() {
    console.log("🧪 Testing Oracle Program with Multi-Asset Data Request\n");
    console.log(`Oracle Program ID: ${ORACLE_PROGRAM_ID}\n`);
    console.log(`📊 Testing 8 assets: ${multiAssetInput}\n`);

    // Takes the mnemonic from the .env file (SEDA_MNEMONIC and SEDA_RPC_ENDPOINT)
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);

    try {
        console.log(`🔄 Submitting multi-asset data request...`);
        
        const dataRequestInput: PostDataRequestInput = {
            consensusOptions: {
                method: 'none'
            },
            execProgramId: ORACLE_PROGRAM_ID,
            execInputs: Buffer.from(multiAssetInput),
            tallyInputs: Buffer.from([]),
            memo: Buffer.from(`Test DR for 8 assets - ${new Date().toISOString()}`),
            gasPrice: 20000n,
            gasLimit: 1000000n
        };

        const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
        
        console.log(`✅ DR completed successfully!`);
        console.log(`📈 Raw result: ${result.result}`);
        
        // Try to parse the result if it's JSON
        try {
            // Decode hex if the result starts with 0x
            let jsonString = result.result;
            if (result.result.startsWith('0x')) {
                const hexString = result.result.slice(2); // Remove '0x' prefix
                const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                jsonString = new TextDecoder().decode(bytes);
            }
            
            const parsedResult = JSON.parse(jsonString);
            console.log(`📊 Parsed result:`, JSON.stringify(parsedResult, null, 2));
            
            // Display each asset result
            console.log("\n📋 ASSET RESULTS:");
            console.log("=".repeat(60));
            parsedResult.forEach((asset: any, index: number) => {
                console.log(`${index + 1}. ${asset.symbol}: $${asset.price}`);
            });
            
        } catch (parseError) {
            console.log(`📊 Raw result: ${result.result}`);
            console.log("❌ Could not parse result as JSON");
            console.log("Parse error:", parseError);
        }

    } catch (error) {
        console.log(`❌ Error: ${error}`);
    }
}

// Run the test
testMultiAssets().catch(console.error); 