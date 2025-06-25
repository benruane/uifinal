import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";
import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest, postDataRequest, awaitDataResult } from '@seda-protocol/dev-tools';
import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import { sedachain } from "@seda-protocol/proto-messages";
import { DynamicGasOptimizer } from './dynamic_gas_optimizer.js';

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

// Improved configuration management
const CONFIG = {
  ORACLE_PROGRAM_ID: process.env.ORACLE_PROGRAM_ID!,
  MAX_ASSETS_PER_REQUEST: 3,
  SEQUENCE_DELAY_MS: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  REQUEST_TIMEOUT_MS: 60000
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

// Sequence management to prevent conflicts
class SequenceManager {
  private currentSequence: number = 0;
  private pendingSequences: Set<number> = new Set();
  private isInitialized: boolean = false;

  async initialize(signer: Signer): Promise<void> {
    try {
      // For now, start with sequence 0 and let the blockchain handle sequence validation
      // In a production system, we would query the current sequence from the blockchain
      this.currentSequence = 0;
      this.isInitialized = true;
      console.log(`🔢 Sequence manager initialized with starting sequence: ${this.currentSequence}`);
    } catch (error) {
      console.error('Failed to initialize sequence manager:', error);
      throw error;
    }
  }

  async getNextSequence(): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Sequence manager not initialized');
    }
    
    const sequence = this.currentSequence++;
    this.pendingSequences.add(sequence);
    return sequence;
  }

  markSequenceComplete(sequence: number): void {
    this.pendingSequences.delete(sequence);
  }

  markSequenceFailed(sequence: number): void {
    this.pendingSequences.delete(sequence);
    // Could implement retry logic here
  }

  getPendingCount(): number {
    return this.pendingSequences.size;
  }
}

// Global sequence manager instance
const sequenceManager = new SequenceManager();

const server = serve({
  port: 3003,
  async fetch(req) {
    const url = new URL(req.url);
    
    // API endpoint for SEDA data requests
    if (url.pathname === "/api/submit-request" && req.method === "POST") {
      return handleSedaRequest(req);
    }
    
    // New: API endpoint for polling DR result from chain
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

// Improved error handling with retry logic
async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = CONFIG.MAX_RETRIES,
  delayMs: number = CONFIG.RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

async function submitSingleDataRequest(signer: Signer, assets: string[]): Promise<DataRequestResult> {
  const inputString = assets.join(',');
  
  // Use dynamic gas optimizer
  const gasOptimizer = new DynamicGasOptimizer(CONFIG.ORACLE_PROGRAM_ID);
  const gasInfo = await gasOptimizer.calculateOptimalGasParams();
  
  const dataRequestInput: PostDataRequestInput = {
    consensusOptions: {
      method: 'none'
    },
    execProgramId: CONFIG.ORACLE_PROGRAM_ID,
    execInputs: Buffer.from(inputString),
    tallyInputs: Buffer.from([]),
    memo: Buffer.from(new Date().toISOString()),
    gasPrice: gasInfo.gasPrice
  };

  console.log('Submitting data request with input:', inputString);
  console.log(`  Estimated gas: ${gasInfo.estimatedGasPerAsset * BigInt(assets.length)}`);
  console.log(`  Estimated cost: ${gasInfo.estimatedCostPerDR} SEDA`);
  
  const result = await withRetry(() => postAndAwaitDataRequest(signer, dataRequestInput, {}));
  
  console.log('Full result object:', JSON.stringify(result, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
  console.log('Result properties:', Object.keys(result));
  
  if (result.exitCode !== 0) {
    throw new Error(`Data request failed with exit code: ${result.exitCode}`);
  }

  // Parse the result from the Oracle Program
  const resultString = result.resultAsUtf8;
  console.log('Raw result:', resultString);
  
  const parsedResults = JSON.parse(resultString);
  const priceResults: PriceResult[] = parsedResults.map((item: any) => ({
    symbol: item.symbol,
    price: parseFloat(item.price)
  }));
  
  return {
    results: priceResults,
    drId: result.drId.toString(),
    drBlockHeight: result.drBlockHeight.toString(),
    assets: assets
  };
}

async function handleSedaRequest(req: Request): Promise<Response> {
  try {
    const { assets } = await req.json();
    
    if (!CONFIG.ORACLE_PROGRAM_ID) {
      return new Response(JSON.stringify({ error: 'ORACLE_PROGRAM_ID environment variable is required' }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Use dynamic gas optimizer to split assets into optimal chunks
    const gasOptimizer = new DynamicGasOptimizer(CONFIG.ORACLE_PROGRAM_ID);
    const assetChunks = await gasOptimizer.optimizeAssetChunks(assets);
    const chunks = assetChunks.map(chunk => chunk.assets);
    
    console.log(`📊 Dynamic gas optimization: Processing ${assets.length} assets in ${chunks.length} optimal requests`);
    console.log(`💰 Total estimated cost: ${assetChunks.reduce((sum, chunk) => sum + chunk.estimatedCost, 0n).toString()} SEDA`);
    
    // Initialize signer and sequence manager
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);
    
    // Initialize sequence manager if not already done
    if (!sequenceManager.getPendingCount()) {
      await sequenceManager.initialize(signer);
    }
    
    // Submit chunks with proper sequence management
    const drIds: string[] = [];
    const drBlockHeights: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Submitting request ${i + 1}/${chunks.length}: ${chunks[i].join(',')}`);
      console.log(`  Estimated gas: ${assetChunks[i].estimatedGasCost.toString()}`);
      console.log(`  Estimated cost: ${assetChunks[i].estimatedCost.toString()} SEDA`);
      
      try {
        const drId = await withRetry(() => submitDataRequestAndGetId(signer, chunks[i]));
        drIds.push(drId);
        drBlockHeights.push('pending');
        
        // Add delay between submissions to avoid sequence conflicts
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.SEQUENCE_DELAY_MS));
        }
      } catch (error) {
        console.error(`Failed to submit chunk ${i + 1}:`, error);
        // Continue with other chunks instead of failing completely
        drIds.push('failed');
        drBlockHeights.push('failed');
      }
    }
    
    // Return DR IDs immediately for frontend polling
    return new Response(JSON.stringify({
      drIds,
      drBlockHeights,
      requestCount: chunks.length,
      isSplit: chunks.length > 1,
      status: 'submitted',
      message: `Submitted ${chunks.length} data requests using dynamic gas optimization. Polling for results...`,
      pendingSequences: sequenceManager.getPendingCount(),
      gasOptimization: {
        totalEstimatedCost: assetChunks.reduce((sum, chunk) => sum + chunk.estimatedCost, 0n).toString(),
        chunks: assetChunks.map(chunk => ({
          assets: chunk.assets,
          estimatedGas: chunk.estimatedGasCost.toString(),
          estimatedCost: chunk.estimatedCost.toString()
        }))
      }
    }, (key, value) => typeof value === 'bigint' ? value.toString() : value), {
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

// Improved function to submit DR and get DR ID immediately
async function submitDataRequestAndGetId(signer: Signer, assets: string[]): Promise<string> {
  const input = assets.join(',');
  console.log(`Submitting data request with input: ${input}`);
  
  // Use dynamic gas optimizer
  const gasOptimizer = new DynamicGasOptimizer(CONFIG.ORACLE_PROGRAM_ID);
  const gasInfo = await gasOptimizer.calculateOptimalGasParams();
  
  // Create the proper PostDataRequestInput object
  const dataRequestInput: PostDataRequestInput = {
    consensusOptions: { method: 'none' },
    execProgramId: CONFIG.ORACLE_PROGRAM_ID,
    execInputs: Buffer.from(input),
    tallyInputs: Buffer.from([]),
    memo: Buffer.from(new Date().toISOString()),
    gasPrice: gasInfo.gasPrice
  };
  
  // Use postDataRequest to submit immediately without waiting
  const result = await withRetry(() => postDataRequest(signer, dataRequestInput));
  
  // Return the DR ID immediately from the dr object
  return result.dr.id;
}

// New function to poll for DR results using Explorer API
async function pollDRResults(drIds: string[]): Promise<any[]> {
  // Poll all DRs in parallel
  return Promise.all(drIds.map(drId => pollSingleDR(drId)));
}

// Poll a single DR using the Explorer API
async function pollSingleDR(drId: string): Promise<any> {
  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const url = `https://explorer-api.testnet.seda.xyz/main/trpc/dataRequest.get?input=${encodeURI(JSON.stringify({drId}))}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result.drId) {
        console.log(`DR ${drId} found on explorer`);
        return data.result;
      }
    } catch (error: unknown) {
      console.log(`Error polling DR ${drId}:`, error instanceof Error ? error.message : String(error));
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
  }
  
  throw new Error(`DR ${drId} not found after ${maxAttempts} attempts`);
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

    // 1. Get DataResult (to get batch assignment) - like push solver
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

    // 2. Get the batch - like push solver
    const batchResp = await client.Batch({
      batchNumber,
      latestSigned: false
    });
    
    if (!batchResp.batch) {
      console.log(`[fetchDrResultFromChain] Batch ${batchNumber} not found`);
      return { status: "batch_not_found" };
    }
    
    // Check if batch has signatures (like push solver)
    if (!batchResp.batchSignatures || batchResp.batchSignatures.length === 0) {
      console.log(`[fetchDrResultFromChain] Batch ${batchNumber} has no signatures yet`);
      return { status: "batch_not_signed" };
    }
    
    console.log(`[fetchDrResultFromChain] Batch ${batchNumber} fetched successfully with ${batchResp.batchSignatures.length} signatures!`);
    
    // 3. Get the actual result using awaitDataResult (like push solver)
    console.log(`[fetchDrResultFromChain] Fetching actual result using awaitDataResult...`);
    
    const queryConfig = { rpc: SEDA_RPC_URL };
    const dataRequest = { id: drId, height: height };
    
    const rawResult = await awaitDataResult(queryConfig, dataRequest, {
      timeoutSeconds: 30,
      pollingIntervalSeconds: 2
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
  } catch (error: unknown) {
    console.error(`[fetchDrResultFromChain] Error:`, error);
    return { status: "error", error: getErrorMessage(error) };
  }
}

console.log(`🚀 SEDA UI Server running at http://localhost:${server.port}`);
console.log(`Environment loaded from: ${envPath}`);
console.log(`Oracle Program ID: ${process.env.ORACLE_PROGRAM_ID}`); 