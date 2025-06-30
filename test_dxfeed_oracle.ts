import { SedaVM } from "@seda-protocol/vm";
import { readFileSync } from "fs";
import { join } from "path";

// Test the DX Feed Oracle Program with various asset types
async function testDXFeedOracle() {
    console.log("🧪 Testing DX Feed Oracle Program...\n");

    // Load the compiled WASM binary
    const wasmPath = join(process.cwd(), "seda-starter-kit-main/target/wasm32-wasip1/release-wasm/oracle-program.wasm");
    const wasmBuffer = readFileSync(wasmPath);

    // Create VM instance
    const vm = new SedaVM(wasmBuffer);

    // Test case 1: US Equities
    console.log("📈 Testing US Equities...");
    const equityInput = "equity:AAPL,equity:MSFT,equity:TSLA,equity:SPY";

    try {
        console.log("Input:", equityInput);
        
        const equityResult = await vm.execute(equityInput);
        console.log("✅ Equity Result:", equityResult);
    } catch (error) {
        console.error("❌ Equity test failed:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test case 2: Forex pairs
    console.log("💱 Testing Forex pairs...");
    const forexInput = "fx:EUR,fx:GBP,fx_r:JPY";

    try {
        console.log("Input:", forexInput);
        
        const forexResult = await vm.execute(forexInput);
        console.log("✅ Forex Result:", forexResult);
    } catch (error) {
        console.error("❌ Forex test failed:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test case 3: Commodities
    console.log("🪙 Testing Commodities...");
    const commodityInput = "cfd:XAU:USD,cfd:WTI:USD";

    try {
        console.log("Input:", commodityInput);
        
        const commodityResult = await vm.execute(commodityInput);
        console.log("✅ Commodity Result:", commodityResult);
    } catch (error) {
        console.error("❌ Commodity test failed:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test case 4: USLF24 extended hours (trades only)
    console.log("🌙 Testing USLF24 extended hours (trades)...");
    const uslfInput = "uslf_t:AAPL,uslf_t:TSLA,uslf_t:NVDA";

    try {
        console.log("Input:", uslfInput);
        
        const uslfResult = await vm.execute(uslfInput);
        console.log("✅ USLF Result:", uslfResult);
    } catch (error) {
        console.error("❌ USLF test failed:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test case 5: Mixed asset types
    console.log("🎯 Testing Mixed Asset Types...");
    const mixedInput = "equity:AAPL,fx:EUR,cfd:XAU:USD,uslf_t:TSLA";

    try {
        console.log("Input:", mixedInput);
        
        const mixedResult = await vm.execute(mixedInput);
        console.log("✅ Mixed Result:", mixedResult);
    } catch (error) {
        console.error("❌ Mixed test failed:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test case 6: Single asset
    console.log("🎯 Testing Single Asset...");
    const singleInput = "equity:AAPL";

    try {
        console.log("Input:", singleInput);
        
        const singleResult = await vm.execute(singleInput);
        console.log("✅ Single Result:", singleResult);
    } catch (error) {
        console.error("❌ Single test failed:", error);
    }

    console.log("\n🎉 All tests completed!");
}

// Run the tests
testDXFeedOracle().catch(console.error); 