import { execSync } from 'child_process';

async function main() {
    if (!process.env.ORACLE_PROGRAM_ID) {
        throw new Error('Please set the ORACLE_PROGRAM_ID in your env file');
    }

    console.log('Posting Data Request using SEDA CLI...');
    
    // Use the SEDA CLI to submit a Data Request
    // Note: This is a simplified approach - you may need to adjust based on actual CLI capabilities
    try {
        const result = execSync(`bunx seda-sdk data-request post --exec-program-id ${process.env.ORACLE_PROGRAM_ID} --exec-inputs "equity:AAPL" --tally-inputs "" --memo "Test proxy data feed"`, {
            encoding: 'utf8',
            env: process.env
        });
        
        console.log('Data Request submitted:', result);
    } catch (error) {
        console.error('Error submitting Data Request:', error);
    }
}

main(); 