interface PriceResult {
  symbol: string;
  price: number;
}

interface DataRequestResponse {
  drIds: string[];
  drBlockHeights: string[];
  requestCount: number;
  status: string;
  message: string;
  results: PriceResult[];
  totalResults: number;
}

export async function submitDataRequest(assets: string[]): Promise<DataRequestResponse> {
  const response = await fetch('/api/submit-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assets }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function pollDataRequest(drId: string, blockHeight: string): Promise<any> {
  const response = await fetch('/api/poll-dr-chain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ drId, blockHeight }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
} 