# Solstice SDK Development Guide

## 🏗️ Architecture Overview

The Solstice SDK provides a comprehensive zero-knowledge identity verification system built on Solana. This guide covers the internal architecture, development workflow, and contribution guidelines.

## 📁 Project Structure

```
solstice-sdk/
├── src/
│   ├── core/
│   │   └── SolsticeSDK.ts          # Main SDK orchestrator
│   ├── proofs/
│   │   └── ProofGenerator.ts       # ZK proof generation engine
│   ├── solana/
│   │   └── SolanaClient.ts         # Blockchain interaction layer
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   └── utils/
│       ├── constants.ts            # SDK constants and configuration
│       ├── errors.ts               # Custom error classes
│       └── helpers.ts              # Utility functions
├── examples/                       # Integration examples
│   ├── defi-age-verification.ts
│   ├── geographic-restrictions.ts
│   └── sybil-resistance.ts
├── tests/                          # Test suites
│   └── integration.test.ts
├── rollup.config.js               # Build configuration
├── tsconfig.json                  # TypeScript configuration
├── jest.config.js                 # Testing configuration
└── package.json                   # Dependencies and scripts
```

## 🧠 Core Architecture

### 1. SolsticeSDK (Core Orchestrator)

The main SDK class that coordinates all functionality:

```typescript
export class SolsticeSDK {
  private proofGenerator: ProofGenerator;    # ZK proof engine
  private solanaClient: SolanaClient;        # Blockchain interface
  private config: SolsticeConfig;            # SDK configuration
  private isInitialized: boolean;           # Initialization state
}
```

**Key Responsibilities:**
- SDK initialization and configuration
- Wallet connection management
- Identity registration and updates
- Proof generation coordination
- Blockchain interaction orchestration
- Session management
- Batch operations

### 2. ProofGenerator (ZK Proof Engine)

Handles all zero-knowledge proof generation:

```typescript
export class ProofGenerator {
  private circuits: Map<string, any>;       # Loaded circuits
  private poseidon: any;                     # Hash function
  private config: CircuitConfig;            # Circuit configuration
}
```

**Proof Types:**
- **Age Proof**: Proves age ≥ threshold without revealing exact age
- **Nationality Proof**: Proves citizenship without revealing identity
- **Uniqueness Proof**: Prevents Sybil attacks with nullifier system

**Key Features:**
- Circuit loading and caching
- Mock proof generation for development
- Timeout protection for proof generation
- Off-chain proof verification

### 3. SolanaClient (Blockchain Interface)

Manages all Solana blockchain interactions:

```typescript
export class SolanaClient {
  private connection: Connection;            # Solana RPC connection
  private wallet: WalletAdapter;             # Connected wallet
  private program: Program;                  # Anchor program interface
  private programId: PublicKey;              # Smart contract address
}
```

**Key Operations:**
- Identity registration and updates
- Proof verification on-chain
- Session creation and management
- Account state queries
- Batch transaction support

## 🔧 Development Workflow

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/solstice-protocol/sdk.git
cd solstice-sdk

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test
```

### 2. Development Scripts

```bash
npm run dev          # Development build with watch mode
npm run build        # Production build
npm run test         # Run all tests
npm run test:watch   # Watch mode testing
npm run lint         # Code linting
npm run type-check   # TypeScript type checking
npm run docs         # Generate documentation
```

### 3. Circuit Development

Currently using mock implementations for development. To integrate real circuits:

```typescript
// Replace mock implementations in ProofGenerator.ts
private async loadCircuit(circuitType: string): Promise<void> {
  // Load actual WASM and zkey files
  const wasmResponse = await fetch(config.wasmPath);
  const zkeyResponse = await fetch(config.zkeyPath);
  
  const circuit = {
    wasm: new Uint8Array(await wasmResponse.arrayBuffer()),
    zkey: new Uint8Array(await zkeyResponse.arrayBuffer())
  };
  
  this.circuits.set(circuitType, circuit);
}
```

## 🧪 Testing Strategy

### 1. Unit Tests
Test individual components in isolation:

```typescript
describe('ProofGenerator', () => {
  it('should generate valid age proof', async () => {
    const generator = new ProofGenerator();
    await generator.initialize();
    
    const proof = await generator.generateAgeProof(mockAadhaarData, {
      threshold: 18
    });
    
    expect(proof.attributeType).toBe('age');
    expect(proof.proof).toBeDefined();
  });
});
```

### 2. Integration Tests
Test complete workflows:

```typescript
describe('Solstice SDK Integration', () => {
  it('should complete full identity verification flow', async () => {
    const sdk = new SolsticeSDK(testConfig);
    await sdk.initialize();
    await sdk.connect(mockWallet);
    
    // Register identity
    await sdk.registerIdentity(mockQRData);
    
    // Generate and verify proof
    const proof = await sdk.generateAgeProofWithQR(mockQRData, {
      threshold: 18
    });
    
    const result = await sdk.verifyIdentity(proof);
    expect(result.verified).toBe(true);
  });
});
```

### 3. End-to-End Tests
Test against real Solana devnet:

```bash
# Set environment variables
export SOLANA_ENDPOINT="https://api.devnet.solana.com"
export PROGRAM_ID="8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz"
export PRIVATE_KEY="your_test_wallet_private_key"

npm run test:e2e
```

## 🔐 Security Considerations

### 1. Client-Side Security
- All proof generation happens in the browser
- No sensitive data transmitted to servers
- Cryptographic commitments stored on-chain

### 2. Circuit Security
- Groth16 proof system with 128-bit security
- Trusted setup ceremony required for production
- Circuit auditing recommended

### 3. Blockchain Security
- Program-derived addresses (PDAs) for deterministic accounts
- Ownership verification for all operations
- Reentrancy protection in smart contracts

## 🚀 Performance Optimization

### 1. Circuit Loading
```typescript
// Preload circuits during initialization
await Promise.all([
  this.loadCircuit('age'),
  this.loadCircuit('nationality'),
  this.loadCircuit('uniqueness')
]);
```

### 2. Batch Operations
```typescript
// Process multiple proofs in parallel
const proofs = await Promise.all(
  requests.map(request => this.generateProof(request))
);
```

### 3. Caching Strategy
```typescript
// Cache loaded circuits
private circuits: Map<string, any> = new Map();

private async getCircuit(type: string): Promise<any> {
  if (!this.circuits.has(type)) {
    await this.loadCircuit(type);
  }
  return this.circuits.get(type);
}
```

## 🔄 State Management

### 1. SDK State
- Initialization status
- Wallet connection state
- Circuit loading status
- Configuration management

### 2. Identity State
- On-chain identity commitment
- Verification status
- Attribute bitmap flags

### 3. Session State
- Active sessions
- Expiration tracking
- Permission management

## 📦 Build Configuration

### 1. Rollup Configuration
```javascript
// rollup.config.js
export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs'
    },
    {
      file: 'dist/index.esm.js', 
      format: 'esm'
    }
  ],
  plugins: [
    typescript(),
    resolve(),
    commonjs()
  ]
};
```

### 2. TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## 🤝 Contributing Guidelines

### 1. Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Add JSDoc comments for public APIs
- Write tests for new features

### 2. Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run `npm test` and `npm run lint`
5. Submit pull request with description

### 3. Commit Convention
```bash
feat: add nationality proof generation
fix: resolve wallet connection timeout
docs: update API documentation
test: add integration tests for batch operations
```

## 🐛 Debugging

### 1. Enable Debug Mode
```typescript
const sdk = new SolsticeSDK({
  debug: true  // Enables verbose logging
});
```

### 2. Common Issues

**Circuit Loading Failures:**
```typescript
// Check circuit paths and network connectivity
console.log('Circuit config:', sdk.configuration.circuitConfig);
```

**Wallet Connection Issues:**
```typescript
// Verify wallet adapter compatibility
if (!wallet.connected) {
  await wallet.connect();
}
```

**Proof Generation Timeouts:**
```typescript
// Increase timeout for large circuits
const proof = await generator.generateProofWithTimeout(
  circuit, 
  inputs, 
  60000  // 60 seconds
);
```

## 📚 Additional Resources

- [Solana Program Library](https://spl.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [Circom Documentation](https://docs.circom.io/)
- [Light Protocol](https://lightprotocol.com/)

## 🔮 Future Roadmap

### Phase 1: Core Features (Current)
- ✅ Basic proof generation
- ✅ Solana integration
- ✅ Mock circuit implementation
- ✅ TypeScript SDK

### Phase 2: Production Ready
- 🔄 Real circuit integration
- 🔄 Security audit
- 🔄 Mainnet deployment
- 🔄 Performance optimization

### Phase 3: Extended Features
- 📋 Multi-country support
- 📋 Advanced session management
- 📋 Cross-chain compatibility
- 📋 Mobile SDK support

---

For questions or support, please open an issue or join our Discord community.
- 256-byte compact proofs with Light Protocol compression

### 🎯 Developer-Friendly
- Simple, intuitive API
- Comprehensive TypeScript support
- Extensive examples and documentation
- Error handling with detailed messages

### 🔗 Solana Native
- Built specifically for Solana blockchain
- Uses Anchor framework for smart contracts
- Integrates with Solana wallet adapters

## Integration Patterns

### Basic Age Verification
```typescript
const sdk = new SolsticeSDK({
  endpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz')
});

await sdk.connect(walletAdapter);
const ageProof = await sdk.generateAgeProofWithQR(qrData, { threshold: 18 });
const result = await sdk.verifyIdentity(ageProof);
```

### Geographic Compliance
```typescript
const nationalityProof = await sdk.generateNationalityProofWithQR(qrData, {
  allowedCountries: ['US', 'CA', 'UK', 'AU']
});
const verification = await sdk.verifyIdentity(nationalityProof);
```

### Sybil Resistance
```typescript
const uniquenessProof = await sdk.generateUniquenessProofWithQR(qrData, {
  daoId: 'governance-dao',
  epochId: 'proposal-123'
});
const result = await sdk.verifyIdentity(uniquenessProof);
```

### Batch Operations
```typescript
const proofs = await sdk.batchGenerate(qrData, [
  { type: 'age', params: { threshold: 18 } },
  { type: 'nationality', params: { allowedCountries: ['US'] } },
  { type: 'uniqueness', params: { daoId: 'test' } }
]);

const txSignature = await sdk.batchVerify(proofs.proofs);
```

## Circuit Architecture

### Age Proof Circuit (~50K constraints)
- Proves age > threshold without revealing exact age
- Uses date arithmetic in zero-knowledge
- Optional nationality inclusion

### Nationality Proof Circuit (~30K constraints)  
- Proves citizenship in allowed countries
- Supports multiple country verification
- Optional age threshold inclusion

### Uniqueness Proof Circuit (~10K constraints)
- Generates nullifier for Sybil resistance
- Context-specific uniqueness (DAO, epoch, etc.)
- Prevents double-spending/voting

## Error Handling

The SDK provides comprehensive error types:

```typescript
try {
  const proof = await sdk.generateAgeProof({ threshold: 18 });
} catch (error) {
  if (error instanceof ProofGenerationError) {
    // Handle proof generation failure
  } else if (error instanceof WalletNotConnectedError) {
    // Handle wallet connection issue
  } else if (error instanceof CircuitLoadError) {
    // Handle circuit loading failure
  }
}
```

## Testing Strategy

### Unit Tests
- Individual component testing
- Mock external dependencies
- Edge case coverage

### Integration Tests
- Full flow testing
- Blockchain interaction testing
- Error scenario testing

### Performance Tests
- Proof generation benchmarks
- Memory usage monitoring
- Circuit loading performance

## Deployment Considerations

### Circuit Artifacts
- Host WASM and zkey files on CDN
- Implement caching strategies
- Consider circuit versioning

### RPC Endpoints
- Use reliable Solana RPC providers
- Implement failover mechanisms
- Monitor rate limits

### Browser Compatibility
- Support modern browsers with WebAssembly
- Handle mobile constraints
- Provide fallback UIs

## Security Considerations

### Circuit Security
- Trusted setup verification
- Circuit audit requirements
- Key rotation procedures

### Data Handling
- No plaintext sensitive data storage
- Secure QR code processing
- Memory cleanup after operations

### Blockchain Security
- Transaction simulation
- Slippage protection
- MEV considerations

## Performance Optimization

### Circuit Loading
- Lazy loading strategies
- Progressive circuit loading
- Caching mechanisms

### Proof Generation
- Web Worker utilization
- Memory optimization
- Batch processing

### Network Optimization
- Connection pooling
- Request batching
- Retry mechanisms

## Future Roadmap

### Enhanced Privacy
- Additional circuit types
- Advanced nullifier schemes
- Cross-chain compatibility

### Developer Experience
- CLI tools
- Browser extensions
- IDE integrations

### Ecosystem Integration
- Wallet integrations
- DeFi protocol plugins
- DAO tooling integration