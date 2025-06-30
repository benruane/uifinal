import { spawn } from "child_process";
import { config } from "dotenv";

// Load environment variables
config();

const ORACLE_PROGRAM_ID = "1c2b7c60c2a51ab414c46faae567fc9bda4c69372db6afb127b310084d0742af";

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
    { name: "AAPL (USLF24)", input: "uslf_t:AAPL", description: "Apple Inc. extended hours" },
    { name: "TSLA (USLF24)", input: "uslf_t:TSLA", description: "Tesla Inc. extended hours" },
    { name: "NVDA (USLF24)", input: "uslf_t:NVDA", description: "NVIDIA Corporation extended hours" },
];

function runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function testSingleAssets() {
    console.log("🧪 Testing Oracle Program with Single Asset Data Requests\n");
    console.log(`Oracle Program ID: ${ORACLE_PROGRAM_ID}\n`);

    const results: Array<{asset: TestAsset, success: boolean, result?: string, error?: string}> = [];

    for (const asset of testAssets) {
        console.log(`📊 Testing: ${asset.name} (${asset.description})`);
        console.log(`   Input: ${asset.input}`);
        
        try {
            // For now, let's just test if we can submit a data request
            // We'll use a simple approach to test the Oracle Program
            console.log(`   🔄 Submitting data request...`);
            
            // Note: We'll need to implement the actual data request submission
            // For now, let's just simulate and check if the Oracle Program can handle the input
            console.log(`   ✅ Would submit DR for: ${asset.input}`);
            
            results.push({ 
                asset, 
                success: true, 
                result: `Test input: ${asset.input} - Ready for DR submission` 
            });

        } catch (error) {
            console.log(`   ❌ Error: ${error}`);
            results.push({ asset, success: false, error: error.toString() });
        }

        console.log("   " + "─".repeat(60) + "\n");
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log("📋 TEST SUMMARY");
    console.log("=".repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Ready for testing: ${successful.length}/${results.length}`);
    console.log(`❌ Issues: ${failed.length}/${results.length}\n`);
    
    if (successful.length > 0) {
        console.log("✅ ASSETS READY FOR DR TESTING:");
        successful.forEach(r => {
            console.log(`   ${r.asset.name}: ${r.result}`);
        });
    }
    
    if (failed.length > 0) {
        console.log("❌ ASSETS WITH ISSUES:");
        failed.forEach(r => {
            console.log(`   ${r.asset.name}: ${r.error}`);
        });
    }

    console.log("\n🚀 Next step: Submit actual data requests to test the Oracle Program");
}

// Run the tests
testSingleAssets().catch(console.error); 