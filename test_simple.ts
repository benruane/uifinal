import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';
import { config } from "dotenv";

// Load environment variables
config();

const ORACLE_PROGRAM_ID = "71b5d524d45c4bb170e82a91269e501dd1e8c2289a9930f1d67bfdd0d2786010";

async function testSimple() {
    console.log("🧪 Testing Simple Data Request\n");
    console.log(`Oracle Program ID: ${ORACLE_PROGRAM_ID}\n`);

    // Takes the mnemonic from the .env file (SEDA_MNEMONIC and SEDA_RPC_ENDPOINT)
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);

    try {
        console.log(`🔄 Submitting simple data request...`);
        
        const dataRequestInput: PostDataRequestInput = {
            consensusOptions: {
                method: 'none'
            },
            execProgramId: ORACLE_PROGRAM_ID,
            execInputs: Buffer.from('equity:AAPL'),
            tallyInputs: Buffer.from([]),
            memo: Buffer.from(`Simple test - ${new Date().toISOString()}`),
            gasPrice: 20000n
        };

        console.log("Submitting data request...");
        
        const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
        
        console.log(`✅ DR completed successfully!`);
        console.log(`📈 Result: ${result.result}`);
        console.log(`🆔 DR ID: ${result.drId}`);
        console.log(`📊 Block Height: ${result.drBlockHeight}`);
        
    } catch (error) {
        console.log(`❌ Error: ${error}`);
        console.log("Full error:", error);
    }
}

// Run the test
testSimple().catch(console.error); 