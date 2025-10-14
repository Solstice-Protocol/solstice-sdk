# Solstice SDK# Solstice SDK



[![NPM Version](https://img.shields.io/npm/v/@solsticeprotocol/sdk)](https://www.npmjs.com/package/@solsticeprotocol/sdk)Zero-Knowledge Identity Verification SDK for Solana

[![License](https://img.shields.io/npm/l/@solsticeprotocol/sdk)](https://github.com/Shaurya2k06/SolsticeProtocol/blob/main/LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)[![NPM Version](https://img.shields.io/npm/v/@solsticeprotocol/sdk)](https://www.npmjs.com/package/@solsticeprotocol/sdk)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Zero-Knowledge Identity Verification SDK for Solana using India's Aadhaar infrastructure.[![Build Status](https://img.shields.io/github/workflow/status/solstice-protocol/sdk/CI)](https://github.com/solstice-protocol/sdk/actions)



## 🚀 Quick Start## 🌟 Overview



```bashThe Solstice SDK enables **privacy-preserving identity verification** using zero-knowledge proofs on Solana. Transform government-issued identity credentials into portable, verifiable proofs without revealing personal data.

npm install @solsticeprotocol/sdk

```### Key Features



```javascript- 🔐 **Privacy-First**: All proof generation happens client-side

import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';- ⚡ **High Performance**: 5-second proof generation, sub-second verification

- 🗜️ **Compressed**: 256-byte proofs with Light Protocol compression

const sdk = new EnhancedSolsticeSDK({- 🎯 **Three Proof Types**: Age, nationality, and uniqueness verification

  network: 'devnet',- 🔗 **Solana Native**: Built for the Solana ecosystem

  endpoint: 'https://api.devnet.solana.com'- 📱 **mAadhaar Integration**: Uses India's Aadhaar QR code system

});- 🛡️ **Sybil Resistant**: Cryptographic uniqueness guarantees



await sdk.initialize();## 🚀 Installation

const aadhaarData = await sdk.processQRCode(qrCodeData);

const proof = await sdk.generateAgeProof(aadhaarData, { threshold: 18 });```bash

```npm install @solsticeprotocol/sdk

# or

## ✨ Featuresyarn add @solsticeprotocol/sdk

```

- **🔐 Zero-Knowledge Proofs**: Generate privacy-preserving identity proofs using Groth16 SNARKs

- **📱 Aadhaar Integration**: Process India's mAadhaar QR codes with UIDAI signature validation## 📋 Prerequisites

- **⚡ High Performance**: Sub-second proof generation with intelligent caching

- **🌐 Solana Native**: Built for Solana blockchain with Light Protocol compression- Node.js 16+ 

- **🛡️ Security First**: No sensitive data storage, cryptographic commitments only- A Solana wallet (Phantom, Solflare, etc.)

- **📦 TypeScript**: Full type support with comprehensive interfaces- mAadhaar QR code for identity verification



## 📚 Documentation## ⚡ Quick Start



- [📖 Quick Start Guide](./docs/quick-start.md) - Get started in 5 minutes### Basic Setup

- [🔧 API Reference](./docs/api-reference.md) - Complete API documentation

- [💡 Examples](./docs/examples.md) - Real-world integration examples```typescript

- [🏗️ Architecture](./docs/architecture.md) - Technical architecture overviewimport { SolsticeSDK } from '@solsticeprotocol/sdk';

- [🔗 Integration Guide](./docs/integration.md) - Production deployment guideimport { PublicKey } from '@solana/web3.js';



## 🎯 Use Cases// Initialize SDK

const sdk = new SolsticeSDK({

### DeFi Applications  endpoint: 'https://api.devnet.solana.com',

- Age verification for financial services  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz'),

- Geographic compliance for regulatory requirements  network: 'devnet',

- Sybil resistance for airdrops and governance  debug: true

});

### Identity Verification

- KYC/AML compliance without data exposure// Initialize and connect

- Anonymous voting systemsawait sdk.initialize();

- Access control for age-restricted contentawait sdk.connect(walletAdapter);

```

### Web3 Gaming

- Age-appropriate content filtering### Age Verification Example

- Regional game availability

- Anti-bot mechanisms```typescript

// Register identity (one-time setup)

## 🛠️ Core Componentsawait sdk.registerIdentity(qrData);



### EnhancedSolsticeSDK// Generate age proof

Main SDK class providing complete identity verification workflow.const ageProof = await sdk.generateAgeProofWithQR(qrData, {

  threshold: 18  // Prove age >= 18

### EnhancedProofGenerator});

Real zero-knowledge proof generation using snarkjs and Circom circuits.

// Verify on-chain

### QRProcessorconst result = await sdk.verifyIdentity(ageProof);

Advanced Aadhaar QR code processing with cryptographic validation.console.log('User is 18+:', result.verified);

```

### SolanaClient

Blockchain interaction layer with wallet integration.### Nationality Verification Example



## 🔍 Proof Types```typescript

// Generate nationality proof

### Age Proofconst nationalityProof = await sdk.generateNationalityProofWithQR(qrData, {

Prove age ≥ threshold without revealing exact age.  allowedCountries: ['US', 'CA', 'UK', 'AU', 'IN']

```javascript});

const ageProof = await sdk.generateAgeProof(aadhaarData, {

  threshold: 18,// Verify on-chain

  nonce: 'unique-session-id'const result = await sdk.verifyIdentity(nationalityProof);

});console.log('User from allowed country:', result.verified);

``````



### Nationality Proof### Sybil Resistance Example

Prove residency in allowed regions without revealing exact location.

```javascript```typescript

const nationalityProof = await sdk.generateNationalityProof(aadhaarData, {// Generate uniqueness proof for DAO voting

  allowedStates: ['Karnataka', 'Maharashtra'],const uniquenessProof = await sdk.generateUniquenessProofWithQR(qrData, {

  nonce: 'unique-session-id'  daoId: 'my-dao',

});  epochId: 'proposal-123'

```});



### Uniqueness Proof// Verify on-chain (prevents double voting)

Prevent double-spending/voting with same identity.const result = await sdk.verifyIdentity(uniquenessProof);

```javascriptconsole.log('Unique voter:', result.verified);

const uniquenessProof = await sdk.generateUniquenessProof(aadhaarData, {```

  sessionId: 'voting-session-2024',

  nonce: 'unique-session-id'## 📚 API Reference

});

```### SolsticeSDK



## 🌐 Environment Setup#### Constructor



### Web Applications```typescript

Copy circuit files to your public directory:new SolsticeSDK(config?: Partial<SolsticeConfig>)

```bash```

cp -r node_modules/@solsticeprotocol/sdk/circuits public/

```#### Methods



### Node.js Applications##### `initialize(): Promise<void>`

Basic functionality available immediately. Full ZK proof generation requires browser environment.Initialize the SDK and load ZK circuits.



## 🧪 Testing##### `connect(wallet: WalletAdapter): Promise<void>`

Connect a Solana wallet for blockchain operations.

Use included testing utilities:

```javascript##### `registerIdentity(qrData: string): Promise<string>`

import { Testing } from '@solsticeprotocol/sdk';Register identity commitment on blockchain from mAadhaar QR.



// Generate mock data for testing##### `generateAgeProofWithQR(qrData: string, params: AgeProofParams): Promise<ProofData>`

const mockQRData = Testing.generateMockQRData();Generate age verification proof.



// Validate QR format**Parameters:**

const isValid = Testing.validateQRFormat(qrCodeData);- `qrData`: mAadhaar QR code data

```- `params.threshold`: Minimum age to prove

- `params.includeNationality?`: Include nationality in proof

## 🔒 Security- `params.nonce?`: Custom nonce for uniqueness



- **UIDAI Signature Validation**: Verify official Aadhaar signatures##### `generateNationalityProofWithQR(qrData: string, params: NationalityProofParams): Promise<ProofData>`

- **Zero-Knowledge Proofs**: No sensitive data revealedGenerate nationality verification proof.

- **Cryptographic Commitments**: Only hash commitments stored

- **Memory Protection**: Sensitive data cleared after use**Parameters:**

- `qrData`: mAadhaar QR code data  

## 📊 Performance- `params.allowedCountries`: Array of allowed country codes

- `params.includeAge?`: Include age verification

| Operation | Time | Output Size |- `params.ageThreshold?`: Minimum age if including age

|-----------|------|-------------|- `params.nonce?`: Custom nonce for uniqueness

| QR Processing | ~50ms | - |

| Age Proof | ~500ms | 256 bytes |##### `generateUniquenessProofWithQR(qrData: string, params: UniquenessProofParams): Promise<ProofData>`

| Nationality Proof | ~600ms | 256 bytes |Generate uniqueness proof for Sybil resistance.

| Uniqueness Proof | ~550ms | 256 bytes |

**Parameters:**

## 🔗 Links- `qrData`: mAadhaar QR code data

- `params.daoId`: DAO or application identifier

- [NPM Package](https://www.npmjs.com/package/@solsticeprotocol/sdk)- `params.epochId?`: Voting round or epoch identifier

- [GitHub Repository](https://github.com/Shaurya2k06/SolsticeProtocol)- `params.nonce?`: Custom nonce for uniqueness

- [Documentation](./docs/)

##### `verifyIdentity(proof: ProofData): Promise<VerificationResult>`

## 🆘 SupportVerify proof on Solana blockchain.



For questions and support, please open an issue on our [GitHub repository](https://github.com/Shaurya2k06/SolsticeProtocol/issues).##### `verifyProofOffChain(proof: ProofData): Promise<boolean>`

Verify proof client-side (faster, less secure).

## 📄 License

##### `getIdentityStatus(): Promise<IdentityStatus>`

MIT License - see [LICENSE](./LICENSE) for details.Get current identity status from blockchain.

##### `batchGenerate(qrData: string, requests: BatchProofRequest[]): Promise<BatchProofResult>`
Generate multiple proofs in parallel.

## 🔧 Configuration

### SolsticeConfig

```typescript
interface SolsticeConfig {
  endpoint: string;           // Solana RPC endpoint
  programId: PublicKey;       // Smart contract program ID
  network?: 'mainnet' | 'devnet' | 'testnet';
  circuitConfig?: CircuitConfig;  // Custom circuit paths
  debug?: boolean;            // Enable debug logging
}
```

### Supported Networks

| Network | Endpoint | Program ID |
|---------|----------|------------|
| Devnet | `https://api.devnet.solana.com` | `8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz` |
| Mainnet | `https://api.mainnet-beta.solana.com` | TBD |

## 🎯 Use Cases

### DeFi Applications
```typescript
// Age verification for regulated DeFi protocols
const canTrade = await verifyAgeForDeFi(wallet, qrData, 18);
```

### DAO Governance  
```typescript
// Prevent Sybil attacks in voting
const canVote = await verifyUniqueVoter(wallet, qrData, 'proposal-123');
```

### Geographic Compliance
```typescript
// Verify user is from allowed jurisdiction
const isCompliant = await verifyGeographicCompliance(
  wallet, 
  qrData, 
  ['US', 'EU', 'UK']
);
```

### Gaming & Social
```typescript
// Age-gate mature content
const isAdult = await verifyAge(wallet, qrData, 21);

// Prevent bot accounts
const isUnique = await verifyUniqueness(wallet, qrData, 'game-server');
```

## 🔐 Security & Privacy

### Privacy Guarantees
- **Zero-Knowledge**: Proofs reveal nothing beyond the statement being proven
- **Unlinkability**: Different proofs cannot be correlated to the same user
- **Local Generation**: All proof generation happens in the user's browser
- **No Data Storage**: Personal data never leaves the user's device

### Security Features
- **Groth16 Proofs**: 128-bit security level with BN254 elliptic curves
- **Poseidon Hashing**: Optimized for zero-knowledge circuits
- **Light Protocol**: Compressed on-chain storage
- **Nullifier System**: Prevents proof reuse and Sybil attacks

## 📖 Examples

Complete examples are available in the [`examples/`](./examples/) directory:

- [`defi-age-verification.ts`](./examples/defi-age-verification.ts) - Age verification for DeFi
- [`geographic-restrictions.ts`](./examples/geographic-restrictions.ts) - Geographic compliance
- [`sybil-resistance.ts`](./examples/sybil-resistance.ts) - DAO governance and uniqueness

## 🛠️ Development

### Build from Source

```bash
git clone https://github.com/solstice-protocol/sdk.git
cd sdk
npm install
npm run build
```

### Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # Code linting
npm run type-check    # TypeScript type checking
```

### Integration Testing

```bash
# Set up test environment
export SOLANA_ENDPOINT="https://api.devnet.solana.com"
export PROGRAM_ID="8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz"

npm run test:integration
```

## 🚦 Error Handling

The SDK provides specific error types for better error handling:

```typescript
import { 
  SolsticeError, 
  ProofGenerationError, 
  WalletNotConnectedError,
  VerificationError,
  CircuitLoadError 
} from '@solsticeprotocol/sdk';

try {
  const proof = await sdk.generateAgeProofWithQR(qrData, { threshold: 18 });
} catch (error) {
  if (error instanceof ProofGenerationError) {
    console.error('Proof generation failed:', error.proofType, error.message);
  } else if (error instanceof WalletNotConnectedError) {
    console.error('Please connect your wallet first');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📊 Performance

| Operation | Time | Size | Cost |
|-----------|------|------|------|
| Proof Generation | ~5 seconds | - | Client-side |
| On-chain Verification | <1 second | 256 bytes | ~0.00002 SOL |
| Circuit Loading | ~2 seconds | 10MB | One-time |
| Identity Registration | ~3 seconds | 128 bytes | ~0.00001 SOL |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Website](https://solstice-protocol.com) (Coming Soon)
- [Documentation](https://docs.solstice-protocol.com) (Coming Soon)
- [GitHub](https://github.com/solstice-protocol/sdk)
- [Discord](https://discord.gg/solstice) (Coming Soon)
- [Twitter](https://twitter.com/SolsticeProtocol) (Coming Soon)

## ⚠️ Disclaimer

This SDK is currently in **alpha** and should not be used in production environments. The circuits and smart contracts have not been audited. Use at your own risk.

---

**Built with privacy, secured by mathematics, powered by Solana.**

// Initialize SDK
const sdk = new SolsticeSDK({
  endpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz')
});

// Connect wallet
await sdk.connect(walletAdapter);

// Register identity
const qrData = "..."; // mAadhaar QR code data
await sdk.registerIdentity(qrData);

// Generate age proof
const ageProof = await sdk.generateAgeProof({
  threshold: 18,
  includeNationality: false
});

// Verify on-chain
const txSignature = await sdk.verifyIdentity(ageProof);
```

## Core Concepts

### Identity Registration
Register your identity commitment on Solana blockchain using mAadhaar QR codes.

### Zero-Knowledge Proofs
Generate privacy-preserving proofs for:
- **Age verification**: Prove age > threshold without revealing exact age
- **Nationality check**: Prove citizenship without revealing identity
- **Uniqueness**: Prove you haven't registered before (Sybil resistance)

### Verification
Verify proofs on-chain with Groth16 verification in Solana smart contracts.

## API Reference

### Core SDK Class

```typescript
class SolsticeSDK {
  constructor(config: SolsticeConfig)
  
  // Connection & Setup
  connect(wallet: WalletAdapter): Promise<void>
  disconnect(): Promise<void>
  
  // Identity Management
  registerIdentity(qrData: string): Promise<string>
  updateIdentity(newQrData: string): Promise<string>
  getIdentityStatus(): Promise<IdentityStatus>
  
  // Proof Generation
  generateAgeProof(params: AgeProofParams): Promise<ProofData>
  generateNationalityProof(params: NationalityProofParams): Promise<ProofData>
  generateUniquenessProof(params: UniquenessProofParams): Promise<ProofData>
  
  // Verification
  verifyIdentity(proof: ProofData): Promise<string>
  verifyProofOffChain(proof: ProofData): Promise<boolean>
  
  // Sessions
  createSession(params: SessionParams): Promise<SessionData>
  closeSession(sessionId: string): Promise<void>
}
```

### Configuration

```typescript
interface SolsticeConfig {
  endpoint: string;              // Solana RPC endpoint
  programId: PublicKey;         // Smart contract program ID
  network?: 'mainnet' | 'devnet' | 'testnet';
  circuitConfig?: CircuitConfig; // Custom circuit paths
}
```

## Examples

### Age Verification for DeFi

```typescript
// Verify user is 18+ for DeFi platform
const isEligible = await sdk.generateAndVerifyAge({
  threshold: 18,
  autoVerify: true
});

if (isEligible.verified) {
  console.log('User verified as 18+');
  // Allow access to DeFi features
}
```

### Geographic Restrictions

```typescript
// Verify user nationality for compliance
const nationalityProof = await sdk.generateNationalityProof({
  allowedCountries: ['US', 'IN', 'UK', 'CA']
});

const isAllowed = await sdk.verifyIdentity(nationalityProof);
```

### Sybil Resistance for DAOs

```typescript
// Ensure unique participation in governance
const uniquenessProof = await sdk.generateUniquenessProof({
  daoId: 'governance-dao-v1',
  epochId: 'vote-2024-001'
});

await sdk.verifyIdentity(uniquenessProof);
// User can now participate in governance
```

## Advanced Usage

### Custom Circuit Configuration

```typescript
const sdk = new SolsticeSDK({
  endpoint: 'https://api.mainnet-beta.solana.com',
  programId: new PublicKey('...'),
  circuitConfig: {
    age: {
      wasmPath: '/custom/age_proof.wasm',
      zkeyPath: '/custom/age_proof.zkey'
    }
  }
});
```

### Batch Operations

```typescript
// Generate multiple proofs efficiently
const proofs = await sdk.batchGenerate([
  { type: 'age', params: { threshold: 18 } },
  { type: 'nationality', params: { countries: ['US'] } },
  { type: 'uniqueness', params: { daoId: 'test' } }
]);

// Verify all proofs in single transaction
const txSignature = await sdk.batchVerify(proofs);
```

## Error Handling

```typescript
try {
  const proof = await sdk.generateAgeProof({ threshold: 18 });
} catch (error) {
  if (error instanceof ProofGenerationError) {
    console.error('Failed to generate proof:', error.message);
  } else if (error instanceof WalletNotConnectedError) {
    console.error('Please connect your wallet first');
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [Documentation](https://docs.solstice-protocol.com)
- [GitHub](https://github.com/solstice-protocol/sdk)
- [Discord](https://discord.gg/solstice)
- [Twitter](https://twitter.com/solstice_proto)