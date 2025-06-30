# SEDA Asset Price Oracle - Frontend

This is the frontend for the SEDA Asset Price Oracle application. It provides a user interface for submitting data requests to the SEDA Network and viewing price results.

## Features

- **Asset Selection**: Choose from various asset categories including US Equities, Forex, Commodities, and US Listed Funds
- **Data Request Submission**: Submit multiple assets to the SEDA Network for price data
- **Real-time Results**: View price results as they come back from the network
- **Request History**: Track all previous data requests and their results
- **Explorer Links**: Direct links to view data requests on the SEDA Explorer

## Project Structure

```
seda-frontend/
├── src/
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   ├── api.ts           # API client functions
│   └── style.css        # Application styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## API Endpoints

The frontend expects the following backend API endpoints:

### POST /api/submit-request
Submit a data request to the SEDA Network.

**Request Body:**
```json
{
  "assets": ["equity:AAPL", "fx:EUR", "cfd:XAU:USD"]
}
```

**Response:**
```json
{
  "drIds": ["dr_id_1", "dr_id_2"],
  "drBlockHeights": ["5168907", "5168908"],
  "requestCount": 2,
  "status": "completed",
  "message": "Completed 2 data requests. Found 6 price results.",
  "results": [
    {"symbol": "equity:AAPL", "price": 150.25},
    {"symbol": "fx:EUR", "price": 1.0850}
  ],
  "totalResults": 6
}
```

### POST /api/poll-dr-chain
Poll for data request results from the SEDA Network.

**Request Body:**
```json
{
  "drId": "dr_id_1",
  "blockHeight": "5168907"
}
```

**Response:**
```json
{
  "status": "ok",
  "result": [
    {"symbol": "equity:AAPL", "price": 150.25}
  ],
  "blockHeight": "5168907",
  "batchNumber": "123"
}
```

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   # or
   yarn build
   # or
   bun run build
   ```

## Development

The frontend is built with:
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS** - Styling (no framework)

## Backend Requirements

Your backend should:

1. **Handle CORS** - The frontend runs on port 3000 and expects the backend on port 3004
2. **Implement API endpoints** - `/api/submit-request` and `/api/poll-dr-chain`
3. **SEDA Integration** - Connect to the SEDA Network using the SEDA SDK
4. **Environment Variables** - Configure SEDA network settings (RPC endpoint, mnemonic, etc.)

## Environment Variables

The backend will need these environment variables:
- `SEDA_RPC_URL` - SEDA network RPC endpoint
- `SEDA_MNEMONIC` - Wallet mnemonic for signing transactions
- `ORACLE_PROGRAM_ID` - The SEDA oracle program ID
- `SEDA_EXPLORER_URL` - SEDA explorer URL for generating links

## Asset Categories

The frontend supports these asset categories:

- **US Equities & ETFs**: AAPL, MSFT, TSLA, AMZN, NVDA, GOOG, META, UNH, SPY
- **Forex (*/USD)**: EUR/USD, GBP/USD
- **Forex Reverse (USD/*)**: USD/JPY
- **Commodities (CFD)**: Gold, WTI Crude Oil, Brent Crude Oil
- **US Listed Funds - Trade**: Various equity symbols with overnight session data

## Notes

- The frontend uses localStorage to persist selected assets and request history
- Results are displayed in real-time as they come back from the network
- The UI is responsive and works on desktop and mobile devices
- All API calls are proxied through Vite's dev server to avoid CORS issues 