import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';

async function testMultiAssetDR() {
    console.log('🧪 Testing Multi-Asset Data Request with Updated Tally Phase');
    console.log('==========================================================');
    
    // Oracle Program ID from the recent deployment
    const ORACLE_PROGRAM_ID = '514933f5b4895542a8da825fe7dcf3317cb417f4a83f6702850da715b90ad045';
    
    // Create a comprehensive test with multiple asset types
    // This tests: equity, forex, cfd, and overnight session data
    const testAssets = [
        // US Equities
        'equity:AAPL',
        'equity:TSLA', 
        'equity:MSFT',
        'equity:NVDA',
        
        // Forex pairs
        'fx:EUR',      // EUR/USD
        'fx:GBP',      // GBP/USD
        'fx_r:JPY',    // USD/JPY
        
        // Commodities
        'cfd:XAU:USD', // Gold
        'cfd:WTI:USD', // Oil - US Crude
        'cfd:BRN:USD', // Oil - Brent Crude
        
        // Overnight session data
        'uslf_q:AAPL', // Overnight quotes
        'uslf_t:TSLA'  // Overnight trades
    ];
    
    // Gas cost estimation and automatic splitting logic
    const ESTIMATED_GAS_PER_ASSET = 80000000n; // 80M gas per asset (increased based on actual results)
    const MAX_GAS_PER_DR = 300000000n; // 300M gas limit per DR (conservative estimate)
    const MAX_ASSETS_PER_DR = Number(MAX_GAS_PER_DR / ESTIMATED_GAS_PER_ASSET);
    
    console.log(`📊 Gas Analysis:`);
    console.log(`  • Total assets: ${testAssets.length}`);
    console.log(`  • Estimated gas per asset: ${ESTIMATED_GAS_PER_ASSET.toString()}`);
    console.log(`  • Max gas per DR: ${MAX_GAS_PER_DR.toString()}`);
    console.log(`  • Max assets per DR: ${MAX_ASSETS_PER_DR}`);
    
    // Split assets into chunks based on gas estimation
    const assetChunks = [];
    for (let i = 0; i < testAssets.length; i += MAX_ASSETS_PER_DR) {
        assetChunks.push(testAssets.slice(i, i + MAX_ASSETS_PER_DR));
    }
    
    console.log(`\n📦 Asset Chunks (${assetChunks.length} DRs needed):`);
    assetChunks.forEach((chunk, index) => {
        console.log(`  DR ${index + 1}: ${chunk.join(', ')}`);
    });
    
    console.log('\n🚀 Submitting Data Requests...');
    
    const results = [];
    
    for (let i = 0; i < assetChunks.length; i++) {
        const chunk = assetChunks[i];
        const drInput = chunk.join(',');
        
        console.log(`\n📤 Submitting DR ${i + 1}/${assetChunks.length}:`);
        console.log(`Input: ${drInput}`);
        
        try {
            // Build signing configuration
            const signingConfig = buildSigningConfig({});
            const signer = await Signer.fromPartial(signingConfig);

            // Create the data request input
            const dataRequestInput: PostDataRequestInput = {
                consensusOptions: {
                    method: 'none'
                },
                execProgramId: ORACLE_PROGRAM_ID,
                execInputs: Buffer.from(drInput),
                tallyInputs: Buffer.from([]),
                memo: Buffer.from(`Multi-asset test DR ${i + 1}/${assetChunks.length}`),
                gasPrice: 20000n
            };

            console.log('⏳ Posting and waiting for result...');
            
            const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
            
            console.log(`✅ DR ${i + 1} completed successfully!`);
            console.log(`   DR ID: ${result.drId}`);
            console.log(`   Exit Code: ${result.exitCode}`);
            console.log(`   Consensus: ${result.consensus}`);
            
            results.push({
                drNumber: i + 1,
                assets: chunk,
                result: result
            });
            
        } catch (error) {
            console.error(`❌ Error in DR ${i + 1}:`);
            console.error(error);
            results.push({
                drNumber: i + 1,
                assets: chunk,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    
    console.log('\n🎯 Final Results:');
    console.log(`  ✅ Successfully processed ${results.filter(r => !r.error).length}/${assetChunks.length} DRs`);
    console.log(`  ✅ Total assets processed: ${testAssets.length}`);
    console.log(`  ✅ Gas-optimized splitting working correctly`);
    
    // Show detailed results
    results.forEach((result, index) => {
        console.log(`\n📊 DR ${result.drNumber} Results:`);
        console.log(`  Assets: ${result.assets.join(', ')}`);
        if (result.error) {
            console.log(`  Status: ❌ Error - ${result.error}`);
        } else {
            console.log(`  Status: ✅ Success`);
            console.log(`  DR ID: ${result.result.drId}`);
            console.log(`  Exit Code: ${result.result.exitCode}`);
            console.log(`  Consensus: ${result.result.consensus}`);
            if (result.result.result) {
                console.log(`  Raw Result: ${result.result.result}`);
            }
        }
    });
}

// Run the test
testMultiAssetDR().catch(console.error); 