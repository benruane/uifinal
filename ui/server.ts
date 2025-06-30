import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";
import { PostDataRequestInput, Signer, buildSigningConfig, postDataRequestBundle, awaitDataResult } from '@seda-protocol/dev-tools';
import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import { sedachain } from "@seda-protocol/proto-messages";

// Load environment variables from parent directory
const envPath = join(import.meta.dir, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc: Record<string, string>, line: string) => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    acc[key.trim()] = valueParts.join('=').trim();
  }
  return acc;
}, {});

// Set environment variables
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    process.env[key] = value;
  }
});

// Simple configuration
const CONFIG = {
  ORACLE_PROGRAM_ID: process.env.ORACLE_PROGRAM_ID!,
  MAX_ASSETS_PER_REQUEST: 4,
  REQUEST_TIMEOUT_MS: 30000,
  POLLING_INTERVAL_SECONDS: 1,
  TIMEOUT_SECONDS: 30
};

interface PriceResult {
  symbol: string;
  price: number;
}

interface DataRequestResult {
  results: PriceResult[];
  drId: string;
  drBlockHeight: string;
  assets: string[];
}

// Helper function to split assets into chunks
const chunkAssets = (assets: string[], chunkSize: number = CONFIG.MAX_ASSETS_PER_REQUEST): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < assets.length; i += chunkSize) {
    chunks.push(assets.slice(i, i + chunkSize));
  }
  return chunks;
};

const server = serve({
  port: 3004,
  async fetch(req) {
    const url = new URL(req.url);
    
    // API endpoint for SEDA data requests
    if (url.pathname === "/api/submit-request" && req.method === "POST") {
      return handleSedaRequest(req);
    }
    
    // API endpoint for polling DR result from chain
    if (url.pathname === "/api/poll-dr-chain" && req.method === "POST") {
      try {
        const { drId, blockHeight } = await req.json();
        const result = await fetchDrResultFromChain(drId, blockHeight);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    // API endpoint for checking additional results from specific DRs
    if (url.pathname === "/api/check-results" && req.method === "POST") {
      try {
        const { drIds, blockHeights } = await req.json();
        const results = await checkAdditionalResults(drIds, blockHeights);
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    // Serve static files
    if (url.pathname === "/") {
      const html = readFileSync(join(import.meta.dir, "index.html"), "utf-8");
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    if (url.pathname === "/style.css") {
      const css = readFileSync(join(import.meta.dir, "style.css"), "utf-8");
      return new Response(css, {
        headers: { "Content-Type": "text/css" },
      });
    }
    
    if (url.pathname === "/dist/index.js") {
      const js = readFileSync(join(import.meta.dir, "dist/index.js"), "utf-8");
      return new Response(js, {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    
    return new Response("Not found", { status: 404 });
  },
});

// Helper for error message extraction
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

async function handleSedaRequest(req: Request): Promise<Response> {
  try {
    let { assets } = await req.json();
    
    if (!CONFIG.ORACLE_PROGRAM_ID) {
      return new Response(JSON.stringify({ error: 'ORACLE_PROGRAM_ID environment variable is required' }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (assets.length === 0) {
      return new Response(JSON.stringify({ error: 'No assets provided' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Group assets into DRs, each with up to 4 assets
    const assetChunks = chunkAssets(assets, CONFIG.MAX_ASSETS_PER_REQUEST);
    console.log(`📊 User selected ${assets.length} assets, creating ${assetChunks.length} DRs (up to ${CONFIG.MAX_ASSETS_PER_REQUEST} assets per DR)`);

    // Prepare DRs
    const dataRequestInputs: PostDataRequestInput[] = assetChunks.map((chunk, i) => ({
      consensusOptions: { method: 'none' },
      execProgramId: CONFIG.ORACLE_PROGRAM_ID,
      execInputs: Buffer.from(chunk.join(',')),
      tallyInputs: Buffer.from([]),
      memo: Buffer.from(`${new Date().toISOString()}-dr-${i + 1}`),
      gasPrice: 20000n,
      gasLimit: 1000000n
    }));

    // Initialize signer
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);
    const queryConfig = { rpc: process.env.SEDA_RPC_URL || "https://rpc.testnet.seda.xyz" };

    // Send all DRs in a single bundle
    let bundleResult;
    try {
      console.log(`Submitting bundle of ${dataRequestInputs.length} DRs...`);
      bundleResult = await postDataRequestBundle(signer, dataRequestInputs, {});
      console.log(`✅ Bundle posted! Transaction: ${bundleResult.tx}`);
      console.log(`Data Requests created: ${bundleResult.drs.length}`);
    } catch (error) {
      console.error('❌ Bundle post failed:', error);
      return new Response(JSON.stringify({ error: 'Failed to post DR bundle', details: (error as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // After posting the bundle, collect all DR IDs and block heights immediately
    const allDrIds = bundleResult.drs.map(dr => dr.id);
    const allDrBlockHeights = bundleResult.drs.map(dr => dr.height.toString());

    // Monitor each DR with faster response
    const allResults: any[] = [];
    // (no need to re-push to allDrIds/allDrBlockHeights in the monitoring loop)
    const monitoringPromises = bundleResult.drs.map(async (dr, index) => {
      try {
        console.log(`[DR ${index + 1}] Starting monitoring: ID=${dr.id}, Height=${dr.height}`);
        const dataResult = await awaitDataResult(queryConfig, dr, {
          timeoutSeconds: CONFIG.TIMEOUT_SECONDS,
          pollingIntervalSeconds: CONFIG.POLLING_INTERVAL_SECONDS
        });
        console.log(`[DR ${index + 1}] ✅ Completed: ID=${dr.id}`);
        if (dataResult.exitCode === 0 && dataResult.resultAsUtf8) {
          try {
            const parsedResults = JSON.parse(dataResult.resultAsUtf8);
            if (Array.isArray(parsedResults)) {
              allResults.push(...parsedResults);
              console.log(`[DR ${index + 1}] 📊 Added ${parsedResults.length} results`);
            }
          } catch (parseError) {
            console.warn(`Failed to parse results from DR ${index + 1}:`, parseError);
          }
        }
      } catch (error) {
        console.error(`❌ [DR ${index + 1}] FAILED:`, { drId: dr.id, error: (error as Error).message });
      }
    });

    // Wait for a shorter time to get initial results, then return what we have
    const initialWaitTime = Math.min(10000, CONFIG.REQUEST_TIMEOUT_MS); // Wait max 10 seconds for initial results
    console.log(`⏱️ Waiting ${initialWaitTime}ms for initial results...`);
    try {
      await Promise.race([
        Promise.all(monitoringPromises),
        new Promise(resolve => setTimeout(resolve, initialWaitTime))
      ]);
    } catch (error) {
      console.warn('Some DRs may still be processing:', error);
    }

    console.log(`🎉 Processed ${assetChunks.length} DRs`);
    console.log(`📊 Results collected so far: ${allResults.length}`);
    console.log(`📋 DR IDs: ${allDrIds.join(', ')}`);

    // Return results immediately with what we have
    return new Response(JSON.stringify({
      drIds: allDrIds,
      drBlockHeights: allDrBlockHeights,
      requestCount: assetChunks.length,
      status: allResults.length > 0 ? 'completed' : 'processing',
      message: `Processed ${assetChunks.length} DRs. Found ${allResults.length} price results.${allResults.length === 0 ? ' Some DRs may still be processing.' : ''}`,
      results: allResults,
      totalResults: allResults.length,
      processingTime: initialWaitTime
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    console.error('Error handling SEDA request:', error);
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error),
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

const SEDA_RPC_URL = process.env.SEDA_RPC_URL || "https://rpc.testnet.seda.xyz";

async function fetchDrResultFromChain(drId: string, blockHeight: string) {
  try {
    // Connect to SEDA chain
    const cometClient = await Comet38Client.connect(SEDA_RPC_URL);
    const queryClient = new QueryClient(cometClient);
    const protoClient = createProtobufRpcClient(queryClient);
    const client = new sedachain.batching.v1.QueryClientImpl(protoClient);

    // Handle blockHeight: if not a valid number, use 0 (latest)
    let height: bigint = 0n;
    if (blockHeight && !isNaN(Number(blockHeight)) && Number(blockHeight) > 0) {
      height = BigInt(blockHeight);
    }
    console.log(`[fetchDrResultFromChain] Querying DR: ${drId}, blockHeight: ${height}`);

    // 1. Get DataResult (to get batch assignment)
    const dataResultResp = await client.DataResult({
      dataRequestId: drId,
      dataRequestHeight: height
    });
    
    if (!dataResultResp.batchAssignment || !dataResultResp.dataResult) {
      console.log(`[fetchDrResultFromChain] DataResult not found for ${drId}`);
      return { status: "not_found" };
    }
    
    const batchNumber = dataResultResp.batchAssignment.batchNumber;
    console.log(`[fetchDrResultFromChain] DataResult found - assigned to batch ${batchNumber}`);

    // 2. Get the batch
    const batchResp = await client.Batch({
      batchNumber,
      latestSigned: false
    });
    
    if (!batchResp.batch) {
      console.log(`[fetchDrResultFromChain] Batch ${batchNumber} not found`);
      return { status: "batch_not_found" };
    }
    
    // Check if batch has signatures
    if (!batchResp.batchSignatures || batchResp.batchSignatures.length === 0) {
      console.log(`[fetchDrResultFromChain] Batch ${batchNumber} has no signatures yet`);
      return { status: "batch_not_signed" };
    }
    
    console.log(`[fetchDrResultFromChain] Batch ${batchNumber} fetched successfully with ${batchResp.batchSignatures.length} signatures!`);
    
    // 3. Get the actual result using awaitDataResult
    console.log(`[fetchDrResultFromChain] Fetching actual result using awaitDataResult...`);
    
    const queryConfig = { rpc: SEDA_RPC_URL };
    const dataRequest = { id: drId, height: height };
    
    const rawResult = await awaitDataResult(queryConfig, dataRequest, {
      timeoutSeconds: CONFIG.TIMEOUT_SECONDS,
      pollingIntervalSeconds: CONFIG.POLLING_INTERVAL_SECONDS
    });
    
    console.log(`[fetchDrResultFromChain] Result received:`, {
      drId: rawResult.drId,
      exitCode: rawResult.exitCode,
      result: rawResult.result,
      drBlockHeight: rawResult.drBlockHeight
    });
    
    // Parse the result if it exists
    let decodedResult = null;
    if (rawResult.result) {
      try {
        let jsonString = rawResult.result;
        
        // Check if result is hex-encoded (starts with 0x)
        if (typeof jsonString === 'string' && jsonString.startsWith('0x')) {
          console.log(`[fetchDrResultFromChain] Decoding hex-encoded result...`);
          // Remove 0x prefix and decode hex to UTF-8
          const hexString = jsonString.substring(2);
          jsonString = Buffer.from(hexString, 'hex').toString('utf8');
          console.log(`[fetchDrResultFromChain] Decoded hex result: ${jsonString}`);
        }
        
        // Try to parse as JSON
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === "object" && parsed.length) {
          console.log(`[fetchDrResultFromChain] Successfully parsed JSON with ${parsed.length} items`);
          decodedResult = parsed;
        }
      } catch (e) {
        console.log(`[fetchDrResultFromChain] Failed to parse result as JSON:`, e);
        // If not JSON, return the raw result
        decodedResult = rawResult.result;
      }
    }
    
    return {
      status: decodedResult ? "ok" : "no_result",
      result: decodedResult,
      blockHeight: batchResp.batch.blockHeight.toString(),
      batchNumber: batchNumber.toString(),
    };
    
  } catch (error) {
    console.error('[fetchDrResultFromChain] Error:', error);
    return { status: "error", error: getErrorMessage(error) };
  }
}

async function checkAdditionalResults(drIds: string[], blockHeights: string[]) {
  const results: any[] = [];
  const queryConfig = { rpc: SEDA_RPC_URL };
  
  const checkPromises = drIds.map(async (drId, index) => {
    try {
      const dataRequest = { id: drId, height: BigInt(blockHeights[index] || 0) };
      const dataResult = await awaitDataResult(queryConfig, dataRequest, {
        timeoutSeconds: 5,
        pollingIntervalSeconds: 0.5
      });

      console.log(`[checkAdditionalResults] DR ${drId} exitCode: ${dataResult.exitCode}, result:`, dataResult.result);

      if (dataResult.exitCode === 0) {
        let parsedResults = null;
        let raw = dataResult.resultAsUtf8 || dataResult.result;
        if (typeof raw === 'string' && raw.startsWith('0x')) {
          raw = Buffer.from(raw.slice(2), 'hex').toString('utf8');
        }
        try {
          parsedResults = JSON.parse(raw);
          if (Array.isArray(parsedResults)) {
            results.push(...parsedResults);
            console.log(`[checkAdditionalResults] Parsed ${parsedResults.length} results from DR ${drId}`);
          } else {
            // Not an array, but still valid JSON
            results.push(parsedResults);
            console.log(`[checkAdditionalResults] Parsed non-array JSON result from DR ${drId}`);
          }
        } catch (parseError) {
          // Not JSON, return raw result
          results.push(raw);
          console.warn(`[checkAdditionalResults] Returning raw result from DR ${drId}:`, raw);
        }
      }
    } catch (error) {
      console.log(`[checkAdditionalResults] DR ${drId} not ready yet or error:`, error);
    }
  });

  await Promise.allSettled(checkPromises);

  return {
    newResults: results,
    totalNewResults: results.length
  };
}

console.log(`🚀 SEDA UI Server running at http://localhost:3004`);
console.log(`Environment loaded from: ${envPath}`);
console.log(`Oracle Program ID: ${process.env.ORACLE_PROGRAM_ID}`); 