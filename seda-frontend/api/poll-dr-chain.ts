import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Example SEDA testnet endpoint and payload (adjust as needed)
    const sedaEndpoint = process.env.SEDA_POLL_URL || 'https://dxfeed.seda.xyz/poll';
    const payload = { drId, blockHeight };

    // Poll the SEDA testnet for the data request result
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
      results: sedaData.results || [],
      totalResults: sedaData.totalResults || (sedaData.results ? sedaData.results.length : 0),
      status: sedaData.status || 'pending',
      message: sedaData.message || 'Polling complete'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 