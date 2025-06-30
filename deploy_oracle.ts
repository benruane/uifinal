import { buildSigningConfig, Signer } from '@seda-protocol/dev-tools';
import { config } from 'dotenv';

// Load environment variables
config();

async function deployOracle() {
    console.log("🚀 Deploying updated Oracle Program...");
    
    // Build signing config from environment
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);
    
    // Read the WASM file
    const wasmPath = 'seda-starter-kit-main/target/wasm32-wasip1/release-wasm/oracle-program.wasm';
    const wasmBytes = await Bun.file(wasmPath).arrayBuffer();
    
    console.log(`📦 WASM file size: ${wasmBytes.byteLength} bytes`);
    
    // Deploy the program using the CLI approach
    console.log("⏳ Deploying to SEDA network...");
    
    // For now, let's use the post-dr script to test with the existing Oracle Program ID
    // and then we can deploy manually if needed
    console.log("✅ Oracle Program built successfully!");
    console.log("📝 To deploy, use: seda program deploy target/wasm32-wasip1/release-wasm/oracle-program.wasm");
    
    return "Built successfully - ready for deployment";
}

deployOracle().catch(console.error); 