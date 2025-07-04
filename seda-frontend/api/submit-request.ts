import { NowRequest, NowResponse } from '@vercel/node';
import { SedaClient } from '@seda-protocol/dev-tools/build/index.js';

export default async function handler(req: NowRequest, res: NowResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { assets } = req.body;
  if (!assets || !Array.isArray(assets)) {
    res.status(400).json({ error: 'Assets array is required' });
    return;
  }

  try {
    // Initialize SEDA client
    const client = new SedaClient({
      network: 'testnet',
      oracleProgramId: process.env.ORACLE_PROGRAM_ID || '71b5d524d45c4bb170e82a91269e501dd1e8c2289a9930f1d67bfdd0d2786010'
    });

    // Submit data request
    const result = await client.submitDataRequest({
      assets,
      feedUrl: 'https://dxfeed.seda.xyz/feed'
    });

    res.status(200).json({
      drIds: [result.drId],
      drBlockHeights: [result.blockHeight],
      requestCount: 1,
      status: 'processing',
      message: 'Data request submitted',
      results: result.results || [],
      totalResults: (result.results || []).length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 