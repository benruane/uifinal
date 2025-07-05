import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Example SEDA testnet endpoint and payload (adjust as needed)
    const sedaEndpoint = process.env.SEDA_API_URL || 'https://dxfeed.seda.xyz/feed';
    const payload = { assets };

    // Submit the data request to the SEDA testnet
    const sedaRes = await fetch(sedaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!sedaRes.ok) {
      const errorText = await sedaRes.text();
      res.status(500).json({ error: `SEDA network error: ${errorText}` });
      return;
    }

    const sedaData = await sedaRes.json();

    // Map the SEDA response to the frontend format
    res.status(200).json({
      drIds: sedaData.drIds || [sedaData.drId] || [],
      drBlockHeights: sedaData.drBlockHeights || [sedaData.blockHeight] || [],
      requestCount: sedaData.requestCount || 1,
      status: sedaData.status || 'processing',
      message: sedaData.message || 'Data request submitted',
      results: sedaData.results || [],
      totalResults: sedaData.totalResults || (sedaData.results ? sedaData.results.length : 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 