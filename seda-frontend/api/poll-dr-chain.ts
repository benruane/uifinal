import { NowRequest, NowResponse } from '@vercel/node';
import { SedaClient } from '@seda-protocol/dev-tools/build/index.js';

export default async function handler(req: NowRequest, res: NowResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { drId, blockHeight } = req.body;
  if (!drId || !blockHeight) {
    res.status(400).json({ error: 'drId and blockHeight are required' });
    return;
  }

  try {
    // Initialize SEDA client
    const client = new SedaClient({
      network: 'testnet',
      oracleProgramId: process.env.ORACLE_PROGRAM_ID || '71b5d524d45c4bb170e82a91269e501dd1e8c2289a9930f1d67bfdd0d2786010'
    });

    // Poll for data request result
    const result = await client.getDataRequestResult({
      drId,
      blockHeight
    });

    res.status(200).json({
      results: result.results || [],
      totalResults: (result.results || []).length,
      status: result.status || 'pending',
      message: result.message || 'Polling complete'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 