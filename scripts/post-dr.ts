import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';

async function main() {
    if (!process.env.ORACLE_PROGRAM_ID) {
        throw new Error('Please set the ORACLE_PROGRAM_ID in your env file');
    }

    // Takes the mnemonic from the .env file (SEDA_MNEMONIC and SEDA_RPC_ENDPOINT)
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);

    console.log('Posting and waiting for a result, this may take a little while..');

    // Example data request for three assets to test consensus
    const dataRequestInput: PostDataRequestInput = {
        consensusOptions: {
            method: 'none'
        },
        execProgramId: process.env.ORACLE_PROGRAM_ID,
        execInputs: Buffer.from('equity:AAPL,fx:EUR,cfd:XAU:USD'),
        tallyInputs: Buffer.from([]),
        memo: Buffer.from(new Date().toISOString()),
        gasPrice: 200000n
    };

    const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});
    const explorerLink = process.env.SEDA_EXPLORER_URL ? process.env.SEDA_EXPLORER_URL + `/data-requests/${result.drId}/${result.drBlockHeight}` : "Configure env.SEDA_EXPLORER_URL to generate a link to your DR";

    console.table({
        ...result,
        blockTimestamp: result.blockTimestamp ? result.blockTimestamp.toISOString() : '',
        explorerLink
    });
}

main();