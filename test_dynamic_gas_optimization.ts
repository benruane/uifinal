import { DynamicGasOptimizer } from './dynamic_gas_optimizer.js';

async function main() {
    // Example asset list
    const assets = [
        'AAPL', 'MSFT', 'TSLA', 'GOOG', 'AMZN', 'META', 'NVDA', 'NFLX', 'BABA', 'ORCL', 'INTC', 'AMD'
    ];
    const ORACLE_PROGRAM_ID = 'your_oracle_program_id_here';
    const optimizer = new DynamicGasOptimizer(ORACLE_PROGRAM_ID);

    // Dynamically split assets into optimal DRs
    const chunks = await optimizer.optimizeAssetChunks(assets);

    // Print the result
    console.log('\nOptimal DR Chunks:');
    chunks.forEach((chunk, idx) => {
        console.log(`DR ${idx + 1}:`, chunk.assets);
        console.log(`  Estimated gas: ${chunk.estimatedGasCost.toString()}`);
        console.log(`  Estimated cost: ${chunk.estimatedCost.toString()} SEDA`);
    });
}

main().catch(console.error); 