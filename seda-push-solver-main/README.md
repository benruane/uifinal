# SEDA Push Solver
git add
A robust TypeScript-based **SEDA Oracle Push Solver** for enterprise-grade Oracle integrations. This system posts DataRequests to the SEDA oracle network, orchestrates EVM integrations across multiple chains, and provides comprehensive batch processing with advanced reliability features.

## 🌟 Features

- 🔗 **Multi-Chain Oracle Integration** - Seamlessly integrate SEDA oracle data with multiple EVM chains
- 🏗️ **Enterprise Architecture** - Service-oriented design with dependency injection and clean separation of concerns
- 🔄 **Robust Batch Processing** - Advanced batch handling with signature validation and merkle proof generation
- ⚡ **Type-Safe Operations** - Full TypeScript support with comprehensive type definitions
- 🛡️ **Production-Ready Reliability** - Comprehensive error handling, retry logic, and graceful degradation
- 📊 **Advanced Scheduling** - Cosmos sequence coordination, task management, and intelligent retry mechanisms
- 🌐 **Multi-Network Support** - Testnet, mainnet, and local development environments
- 🔧 **Consolidated Configuration** - Centralized, environment-based configuration management
- 📝 **Structured Logging** - Comprehensive execution tracking with configurable log levels
- 🧪 **Comprehensive Testing** - Full test coverage with mock services and integration tests

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment (copy and edit)
cp env.example .env

# Run the push solver
npm start

# Or run in development mode
npm run dev
```

## 📁 Project Architecture

```
seda-push-solver/
├── src/
│   ├── index.ts                      # Main exports
│   ├── runner.ts                     # Application runner
│   ├── scheduler.ts                  # Main scheduler entry point
│   │
│   ├── config/                       # 🔧 Consolidated Configuration
│   │   ├── index.ts                  # Configuration exports
│   │   ├── seda.ts                   # SEDA network configurations
│   │   ├── evm.ts                    # EVM network configurations
│   │   ├── environment.ts            # Environment utilities
│   │   └── validators.ts             # Configuration validation
│   │
│   ├── types/                        # 📋 Type Definitions
│   │   ├── index.ts                  # Type exports
│   │   ├── core.ts                   # Core system types
│   │   ├── seda.ts                   # SEDA-specific types
│   │   ├── evm.ts                    # EVM-specific types
│   │   └── batch-types.ts            # Batch processing types
│   │
│   ├── core/                         # 🏗️ Core Business Logic
│   │   ├── data-request/             # DataRequest operations
│   │   │   ├── data-request-builder.ts  # DataRequest construction
│   │   │   ├── executor.ts           # DataRequest execution
│   │   │   ├── input-builder.ts      # Input parameter building
│   │   │   ├── signer.ts             # SEDA signer management
│   │   │   ├── config-loader.ts      # Configuration loading
│   │   │   └── index.ts              # Module exports
│   │   │
│   │   ├── scheduler/                # Advanced scheduling system
│   │   │   ├── scheduler-core.ts     # Core scheduling logic
│   │   │   ├── task-manager.ts       # Task lifecycle management
│   │   │   ├── task-executor.ts      # Task execution engine
│   │   │   ├── cosmos-sequence-coordinator.ts # Cosmos sequence handling
│   │   │   ├── retry-handler.ts      # Intelligent retry logic
│   │   │   ├── statistics.ts         # Performance metrics
│   │   │   └── types.ts              # Scheduler types
│   │   │
│   │   └── network/                  # Network abstractions (legacy compatibility)
│   │       └── index.ts              # Re-exports from config module
│   │
│   ├── evm/                          # 🔗 EVM Integration
│   │   ├── orchestrator.ts           # Multi-chain orchestration
│   │   ├── batch-poster.ts           # Batch posting to EVM chains
│   │   ├── result-poster.ts          # Result posting logic
│   │   ├── prover-discovery.ts       # Prover contract discovery
│   │   └── abi/                      # Contract ABIs
│   │
│   ├── crypto/                       # 🔐 Cryptographic Operations
│   │   ├── signature-processor.ts    # Signature validation and processing
│   │   ├── merkle-proof-generator.ts # Merkle proof generation
│   │   └── constants.ts              # Crypto constants
│   │
│   ├── seda/                         # 🌐 SEDA Network Integration
│   │   ├── batch-client.ts           # Batch data client
│   │   ├── batch-service.ts          # Batch processing service
│   │   └── data-request-client.ts    # DataRequest client
│   │
│   ├── services/                     # 🎯 Service Layer
│   │   ├── service-container.ts      # Dependency injection container
│   │   ├── seda-service.ts           # SEDA operations service
│   │   ├── config-service.ts         # Configuration management service
│   │   ├── logging-service.ts        # Structured logging service
│   │   └── index.ts                  # Service exports
│   │
│   ├── infrastructure/               # 🏗️ Infrastructure Services
│   │   ├── infrastructure-container.ts # Infrastructure DI container
│   │   ├── timer-service.ts          # Timer abstractions
│   │   ├── process-service.ts        # Process lifecycle management
│   │   ├── health-service.ts         # Health monitoring
│   │   └── index.ts                  # Infrastructure exports
│   │
│   ├── helpers/                      # 🔧 Utility Functions
│   │   ├── error-utils.ts            # Error handling utilities
│   │   ├── timeout-utils.ts          # Timeout management
│   │   └── index.ts                  # Helper exports
│   │
│   └── utils/                        # 🛠️ General Utilities
│       └── hex.ts                    # Hex conversion utilities
│
├── tests/                            # 🧪 Test Suite
│   ├── unit/                         # Unit tests
│   │   ├── types.test.ts             # Type definition tests
│   │   ├── config.test.ts            # Configuration tests
│   │   ├── services.test.ts          # Service layer tests
│   │   ├── infrastructure.test.ts    # Infrastructure tests
│   │   └── index-exports.test.ts     # Export validation tests
│   │
│   ├── mocks/                        # Mock implementations
│   │   ├── config-service.mock.ts    # Mock configuration service
│   │   ├── seda-service.mock.ts      # Mock SEDA service
│   │   ├── logging-service.mock.ts   # Mock logging service
│   │   └── infrastructure.mock.ts    # Mock infrastructure services
│   │
│   └── integration/                  # Integration tests
│
├── config.ts                         # Global configuration
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
└── .env                              # Environment variables (create from template)
```

## 🔧 Configuration

### Environment Setup

Create a `.env` file with your configuration:

```bash
# SEDA Network Configuration
SEDA_NETWORK=testnet                           # testnet, mainnet, or local
SEDA_MNEMONIC="your 24-word mnemonic"          # Your SEDA wallet mnemonic
SEDA_RPC_ENDPOINT=                             # Optional: custom RPC endpoint
SEDA_ORACLE_PROGRAM_ID="your-program-id"       # Your Oracle Program ID

# DataRequest Configuration
SEDA_REPLICATION_FACTOR=1                      # Number of oracle replications
SEDA_DR_TIMEOUT_SECONDS=120                    # DataRequest timeout
SEDA_DR_POLLING_INTERVAL_SECONDS=5             # Polling interval
SEDA_DR_MEMO="Custom DataRequest"              # Custom memo text

# Scheduler Configuration
SCHEDULER_INTERVAL_MS=60000                    # Interval between operations (ms)
SCHEDULER_CONTINUOUS=true                      # Run continuously
SCHEDULER_MAX_RETRIES=3                        # Maximum retry attempts
SCHEDULER_MEMO="Scheduled Operation"           # Scheduler memo

# EVM Configuration (if using EVM integration)
EVM_PRIVATE_KEY="your-private-key"             # EVM private key
EVM_NETWORKS=sepolia,polygon                   # Enabled EVM networks

# Advanced Configuration
COSMOS_POSTING_TIMEOUT_MS=20000               # Cosmos posting timeout
COSMOS_MAX_QUEUE_SIZE=100                     # Maximum queue size
LOG_LEVEL=info                                # Logging level (debug, info, warn, error)
```

### Network Configuration

The project now uses consolidated configuration in `src/config/seda.ts`:

```typescript
// Network configurations are now centralized and type-safe
export const SEDA_NETWORKS = {
  testnet: {
    name: 'testnet',
    rpcEndpoint: 'https://rpc.testnet.seda.xyz',
    explorerEndpoint: 'https://testnet.explorer.seda.xyz',
    dataRequest: {
      oracleProgramId: getRequiredOracleProgramId(),
      replicationFactor: 1,
      execGasLimit: BigInt(150_000_000_000_000),
      gasPrice: BigInt(10_000),
      consensusOptions: { method: 'none' as const },
      timeoutSeconds: 120,
      pollingIntervalSeconds: 1,
      memo: 'DX Feed Oracle DataRequest'
    }
  }
  // ... other networks
};
```

## 🎯 Available Scripts

- `npm start` - Start the push solver in production mode
- `npm run dev` - Start in development mode with hot reload
- `npm run build` - Build and type-check the project
- `npm test` - Run the test suite
- `npm run lint` - Lint the codebase
- `npm run clean` - Clean build artifacts

## 💡 Usage Examples

### Programmatic Usage

```typescript
import { 
  SEDADataRequestBuilder, 
  loadSEDAConfig,
  ServiceContainer 
} from './src';

// Initialize services
const services = ServiceContainer.createProduction();
const config = services.configService.loadSEDAConfig();

// Create and initialize builder
const builder = new SEDADataRequestBuilder(config);
await builder.initialize();

// Post a DataRequest
const result = await builder.postDataRequest({
  memo: 'My custom DataRequest'
});

console.log('DataRequest ID:', result.drId);
console.log('Exit Code:', result.exitCode);
```

### Service Container Usage

```typescript
import { ServiceContainer, getServices } from './src/services';

// Use production services
const services = ServiceContainer.createProduction();

// Access individual services
const sedaService = services.sedaService;
const logger = services.loggingService;
const config = services.configService;

// Or use global services
const globalServices = getServices();
```

### Advanced Scheduler Usage

```typescript
import { SEDADataRequestScheduler } from './src';

// Create scheduler with custom configuration
const scheduler = new SEDADataRequestScheduler({
  intervalMs: 30000,  // 30 seconds
  continuous: true,
  maxRetries: 3,
  memo: 'Scheduled DataRequest'
});

// Start the scheduler
await scheduler.initialize();
await scheduler.start();
```

## 🏗️ Architecture Highlights

### 🔧 **Consolidated Configuration Management**
- **Centralized**: All configuration now lives in `src/config/`
- **Type-Safe**: Full TypeScript support with proper interfaces
- **Environment-Driven**: Easy deployment configuration
- **Backward Compatible**: Legacy imports still work

### 🎯 **Service-Oriented Architecture**
- **Dependency Injection**: Clean service container pattern
- **Interface-Based**: Easy testing and mocking
- **Separation of Concerns**: Clear boundaries between layers
- **Production-Ready**: Full error handling and logging

### 📋 **Enhanced Type Safety**
- **Eliminated `any` Types**: Replaced with proper TypeScript interfaces
- **Comprehensive Type Definitions**: Full coverage of all operations
- **Runtime Safety**: Type validation and error handling
- **Developer Experience**: Better IDE support and autocomplete

### 🔄 **Advanced Batch Processing**
- **Signature Validation**: Cryptographic signature verification
- **Merkle Proof Generation**: Efficient proof generation for validators
- **Multi-Chain Support**: Simultaneous EVM chain integration
- **Error Recovery**: Robust error handling and retry logic

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:types

# Run with coverage
npm run test:coverage
```

### Test Categories:
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Type Tests**: TypeScript compilation and type safety
- **Mock Services**: Isolated testing with mock implementations

## 🔗 Requirements

- **Node.js** v18 or higher
- **TypeScript** v4.5 or higher
- **SEDA Account** with testnet/mainnet tokens
- **Oracle Program** deployed to SEDA network
- **EVM Private Key** (for EVM integration features)

## 🌐 Resources

- [SEDA Documentation](https://docs.seda.xyz/)
- [SEDA SDK Repository](https://github.com/sedaprotocol/seda-sdk)
- [SEDA Testnet Explorer](https://testnet.explorer.seda.xyz/)
- [SEDA Discord](https://discord.gg/seda)
- [SEDA Testnet Faucet](https://faucet.testnet.seda.xyz/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request