import { afterEach, describe, it, expect, mock } from "bun:test";
import { file } from "bun";
import { testOracleProgramExecution, testOracleProgramTally } from "@seda-protocol/dev-tools"
import { BigNumber } from 'bignumber.js'

const WASM_PATH = "target/wasm32-wasip1/release-wasm/oracle-program.wasm";

const fetchMock = mock();

afterEach(() => {
  fetchMock.mockRestore();
});

describe("proxy data feed execution", () => {
  it("should fetch US equity data", async () => {
    fetchMock.mockImplementation((url) => {
      console.log('fetchMock url argument:', url);
      const urlStr = typeof url?.url === 'string' ? url.url : (typeof url === 'string' ? url : '');
      if (urlStr.includes("/proxy/equity/AAPL")) {
        return new Response(JSON.stringify({ 
          symbol: "AAPL", 
          price: 150.25, 
          volume: 1000000,
          timestamp: 1234567890 
        }));
      }
      return new Response('Unknown request');
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("equity:AAPL"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expect(result).toEqual(BigNumber('150250000'));
  });

  it("should fetch forex data", async () => {
    fetchMock.mockImplementation((url) => {
      const urlStr = typeof url?.url === 'string' ? url.url : (typeof url === 'string' ? url : '');
      if (urlStr.includes("/proxy/fx/EUR")) {
        return new Response(JSON.stringify({ 
          symbol: "EUR/USD", 
          bid: 1.0850, 
          ask: 1.0852,
          timestamp: 1234567890 
        }));
      }
      return new Response('Unknown request');
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("fx:EUR"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expect(result).toEqual(BigNumber('1085000'));
  });

  it("should fetch commodity data", async () => {
    fetchMock.mockImplementation((url) => {
      const urlStr = typeof url?.url === 'string' ? url.url : (typeof url === 'string' ? url : '');
      if (urlStr.includes("/proxy/cfd/XAU/USD")) {
        return new Response(JSON.stringify({ 
          symbol: "XAU/USD", 
          price: 2050.75, 
          timestamp: 1234567890 
        }));
      }
      return new Response('Unknown request');
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("cfd:XAU:USD"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expect(result).toEqual(BigNumber('2050750000'));
  });

  it("should fetch overnight session quote data", async () => {
    fetchMock.mockImplementation((url) => {
      const urlStr = typeof url?.url === 'string' ? url.url : (typeof url === 'string' ? url : '');
      if (urlStr.includes("/proxy/uslf_q/AAPL")) {
        return new Response(JSON.stringify({ 
          symbol: "AAPL", 
          bid: 149.80, 
          ask: 150.20,
          bid_size: 1000,
          ask_size: 1500,
          timestamp: 1234567890 
        }));
      }
      return new Response('Unknown request');
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("uslf_q:AAPL"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    // Mid price: (149.80 + 150.20) / 2 = 150.00
    expect(result).toEqual(BigNumber('150000000'));
  });

  it("should fetch overnight session trade data", async () => {
    fetchMock.mockImplementation((url) => {
      const urlStr = typeof url?.url === 'string' ? url.url : (typeof url === 'string' ? url : '');
      if (urlStr.includes("/proxy/uslf_t/AAPL")) {
        return new Response(JSON.stringify({ 
          symbol: "AAPL", 
          price: 150.15, 
          size: 500,
          timestamp: 1234567890 
        }));
      }
      return new Response('Unknown request');
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("uslf_t:AAPL"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expect(result).toEqual(BigNumber('150150000'));
  });

  it("should handle invalid input format", async () => {
    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("invalid"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(1);
  });

  it("should handle unsupported data type", async () => {
    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("unsupported:AAPL"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(1);
  });
});

describe("proxy data feed tally", () => {
  it('should tally equity results correctly', async () => {
    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    // Multiple equity price results
    let buffer1 = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    let buffer2 = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    let buffer3 = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    
    // Set values: 150250000, 150300000, 150200000
    buffer1.writeBigUInt64LE(BigInt(150250000), 0);
    buffer2.writeBigUInt64LE(BigInt(150300000), 0);
    buffer3.writeBigUInt64LE(BigInt(150200000), 0);

    const vmResult = await testOracleProgramTally(Buffer.from(oracleProgram), Buffer.from('tally-inputs'), [
      {
        exitCode: 0,
        gasUsed: 0,
        inConsensus: true,
        result: buffer1,
      },
      {
        exitCode: 0,
        gasUsed: 0,
        inConsensus: true,
        result: buffer2,
      },
      {
        exitCode: 0,
        gasUsed: 0,
        inConsensus: true,
        result: buffer3,
      }
    ]);

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result).toString('hex');
    const result = BigNumber(`0x${hex}`);
    // Median of 150200000, 150250000, 150300000 = 150250000
    expect(result).toEqual(BigNumber('150250000'));
  });
});
