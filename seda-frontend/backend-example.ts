// Example backend implementation for SEDA Asset Price Oracle
// This shows the expected API structure that the frontend expects

import { serve } from "bun";
import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';

// Configuration
const CONFIG = {
  ORACLE_PROGRAM_ID: process.env.ORACLE_PROGRAM_ID!,
  MAX_ASSETS_PER_REQUEST: 8,
  REQUEST_TIMEOUT_MS: 60000
};

// Helper function to split assets into chunks
const chunkAssets = (assets: string[], chunkSize: number = 8): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < assets.length; i += chunkSize) {
    chunks.push(assets.slice(i, i + chunkSize));
  }
  return chunks;
};

// Helper for error message extraction
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

// API endpoint for submitting data requests
async function handleSedaRequest(req: Request): Promise<Response> {
  try {
    let { assets } = await req.json();
    
    if (!CONFIG.ORACLE_PROGRAM_ID) {
      return new Response(JSON.stringify({ error: 'ORACLE_PROGRAM_ID environment variable is required' }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Split assets into chunks
    const assetChunks = chunkAssets(assets, CONFIG.MAX_ASSETS_PER_REQUEST);
    
    console.log(`📊 Processing ${assets.length} assets in ${assetChunks.length} data requests`);
    
    // Initialize signer
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);
    
    // Process each chunk
    const results = [];
    const drIds = [];
    const drBlockHeights = [];
    
    for (let i = 0; i < assetChunks.length; i++) {
      const chunk = assetChunks[i];
      const input = chunk.join(',');
      
      const dataRequestInput: PostDataRequestInput = {
        consensusOptions: { method: 'none' },
        execProgramId: CONFIG.ORACLE_PROGRAM_ID,
        execInputs: Buffer.from(input),
        tallyInputs: Buffer.from([]),
        memo: Buffer.from(`${new Date().toISOString()}-chunk-${i + 1}`),
        gasPrice: 2000000n
      };
      
      try {
        const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
        
        drIds.push(result.drId);
        drBlockHeights.push(result.drBlockHeight.toString());
        
        // Parse the result if successful
        if (result.exitCode === 0 && result.resultAsUtf8) {
          try {
            const parsedResults = JSON.parse(result.resultAsUtf8);
            if (Array.isArray(parsedResults)) {
              results.push(...parsedResults);
            }
          } catch (parseError) {
            console.warn(`Failed to parse results from request ${i + 1}:`, parseError);
          }
        }
        
      } catch (error) {
        console.error(`❌ Request ${i + 1} failed:`, error);
      }
    }
    
    return new Response(JSON.stringify({
      drIds,
      drBlockHeights,
      requestCount: assetChunks.length,
      status: 'completed',
      message: `Completed ${assetChunks.length} data requests. Found ${results.length} price results.`,
      results: results,
      totalResults: results.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error('Error handling SEDA request:', error);
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// API endpoint for polling DR results
async function handlePollRequest(req: Request): Promise<Response> {
  try {
    const { drId, blockHeight } = await req.json();
    
    // Implement your polling logic here
    // This should query the SEDA network for the data request result
    
    // Example response structure:
    return new Response(JSON.stringify({
      status: "ok",
      result: [
        {"symbol": "equity:AAPL", "price": 150.25}
      ],
      blockHeight: "5168907",
      batchNumber: "123"
    }), {
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

// Main server
const server = serve({
  port: 3004,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
    
    // API endpoints
    if (url.pathname === "/api/submit-request" && req.method === "POST") {
      const response = await handleSedaRequest(req);
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }
    
    if (url.pathname === "/api/poll-dr-chain" && req.method === "POST") {
      const response = await handlePollRequest(req);
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }
    
    return new Response("Not found", { status: 404 });
  },
});

console.log(`🚀 SEDA Backend Server running at http://localhost:3004`); 