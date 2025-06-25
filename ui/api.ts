import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';

interface PriceResult {
  symbol: string;
  price: number;
}

export async function submitDataRequest(assets: string[]): Promise<PriceResult[]> {
  if (!process.env.ORACLE_PROGRAM_ID) {
    throw new Error('ORACLE_PROGRAM_ID environment variable is required');
  }

  const signingConfig = buildSigningConfig({});
  const signer = await Signer.fromPartial(signingConfig);

  const inputString = assets.join(',');
  
  const dataRequestInput: PostDataRequestInput = {
    consensusOptions: {
      method: 'none'
    },
    execProgramId: process.env.ORACLE_PROGRAM_ID,
    execInputs: Buffer.from(inputString),
    tallyInputs: Buffer.from([]),
    memo: Buffer.from(new Date().toISOString()),
    gasPrice: 20000n
  };

  console.log('Submitting data request with input:', inputString);
  
  const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
  
  if (result.exitCode !== 0) {
    throw new Error(`Data request failed with exit code: ${result.exitCode}`);
  }

  // Parse the result from the Oracle Program
  const resultString = result.resultAsUtf8;
  console.log('Raw result:', resultString);
  
  try {
    const parsedResults = JSON.parse(resultString);
    return parsedResults.map((item: any) => ({
      symbol: item.symbol,
      price: parseFloat(item.price)
    }));
  } catch (error) {
    throw new Error(`Failed to parse result: ${error}`);
  }
} 