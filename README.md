# Solstice SDK

[![NPM Version](https://img.shields.io/npm/v/@solsticeprotocol/sdk)](https://www.npmjs.com/package/@solsticeprotocol/sdk)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/github/workflow/status/solstice-protocol/sdk/CI)](https://github.com/solstice-protocol/sdk/actions)

Zero-Knowledge Identity Verification SDK for Solana using India's Aadhaar infrastructure.

##  Overview

The Solstice SDK enables **privacy-preserving identity verification** using zero-knowledge proofs on Solana. Transform government-issued identity credentials into portable, verifiable proofs without revealing personal data.

### Key Features

- **Privacy-First**: All proof generation happens client-side
- **High Performance**: 5-second proof generation, sub-second verification
- **Compressed**: 256-byte proofs with Light Protocol compression
- **Three Proof Types**: Age, nationality, and uniqueness verification
- **Solana Native**: Built for the Solana ecosystem
- **mAadhaar Integration**: Uses India's Aadhaar QR code system
- **Sybil Resistant**: Cryptographic uniqueness guarantees

## Installation

```bash
npm install @solsticeprotocol/sdk
# or
yarn add @solsticeprotocol/sdk
```

## Prerequisites

- Node.js 16+ 
- A Solana wallet (Phantom, Solflare, etc.)
- mAadhaar QR code for identity verification

## Quick Start

### Basic Setup

```typescript
import { SolsticeSDK } from '@solsticeprotocol/sdk';
import { PublicKey } from '@solana/web3.js';

// Initialize SDK
const sdk = new SolsticeSDK({
  endpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz'),
  network: 'devnet',
  debug: true
});

// Initialize and connect
await sdk.initialize();
await sdk.connect(walletAdapter);
```

### Age Verification Example

```typescript
// Register identity (one-time setup)
await sdk.registerIdentity(qrData);

// Generate age proof
const ageProof = await sdk.generateAgeProofWithQR(qrData, {
  threshold: 18  // Prove age >= 18
});

// Verify on-chain
const result = await sdk.verifyIdentity(ageProof);
console.log('User is 18+:', result.verified);
```

### Nationality Verification Example

```typescript
// Generate nationality proof
const nationalityProof = await sdk.generateNationalityProofWithQR(qrData, {
  allowedCountries: ['US', 'CA', 'UK', 'AU', 'IN']
});

// Verify on-chain
const result = await sdk.verifyIdentity(nationalityProof);
console.log('User from allowed country:', result.verified);
```

### Sybil Resistance Example

```typescript
// Generate uniqueness proof for DAO voting
const uniquenessProof = await sdk.generateUniquenessProofWithQR(qrData, {
  daoId: 'my-dao',
  epochId: 'proposal-123'
});

// Verify on-chain (prevents double voting)
const result = await sdk.verifyIdentity(uniquenessProof);
console.log('Unique voter:', result.verified);
```
##  API Reference

### SolsticeSDK

#### Constructor

```typescript
new SolsticeSDK(config?: Partial<SolsticeConfig>)
```

#### Methods

##### `initialize(): Promise<void>`
Initialize the SDK and load ZK circuits.

##### `connect(wallet: WalletAdapter): Promise<void>`
Connect a Solana wallet for blockchain operations.

##### `registerIdentity(qrData: string): Promise<string>`
Register identity commitment on blockchain from mAadhaar QR.

##### `generateAgeProofWithQR(qrData: string, params: AgeProofParams): Promise<ProofData>`
Generate age verification proof.

**Parameters:**
- `qrData`: mAadhaar QR code data
- `params.threshold`: Minimum age to prove
- `params.includeNationality?`: Include nationality in proof
- `params.nonce?`: Custom nonce for uniqueness

##### `generateNationalityProofWithQR(qrData: string, params: NationalityProofParams): Promise<ProofData>`
Generate nationality verification proof.

**Parameters:**
- `qrData`: mAadhaar QR code data  
- `params.allowedCountries`: Array of allowed country codes
- `params.includeAge?`: Include age verification
- `params.ageThreshold?`: Minimum age if including age
- `params.nonce?`: Custom nonce for uniqueness

##### `generateUniquenessProofWithQR(qrData: string, params: UniquenessProofParams): Promise<ProofData>`
Generate uniqueness proof for Sybil resistance.

**Parameters:**
- `qrData`: mAadhaar QR code data
- `params.daoId`: DAO or application identifier
- `params.epochId?`: Voting round or epoch identifier
- `params.nonce?`: Custom nonce for uniqueness

##### `verifyIdentity(proof: ProofData): Promise<VerificationResult>`
Verify proof on Solana blockchain.

##### `verifyProofOffChain(proof: ProofData): Promise<boolean>`
Verify proof client-side (faster, less secure).

##### `getIdentityStatus(): Promise<IdentityStatus>`
Get current identity status from blockchain.

##### `batchGenerate(qrData: string, requests: BatchProofRequest[]): Promise<BatchProofResult>`
Generate multiple proofs in parallel.

## Environment Setup

### Web Applications
Copy circuit files to your public directory:

```bash
cp -r node_modules/@solsticeprotocol/sdk/circuits public/
```

### Node.js Applications
Basic functionality available immediately. Full ZK proof generation requires browser environment.

## Testing

Use included testing utilities:

```typescript
import { Testing } from '@solsticeprotocol/sdk';

// Generate mock data for testing
const mockQRData = Testing.generateMockQRData();

// Validate QR format
const isValid = Testing.validateQRFormat(qrCodeData);
```

## Security

- **UIDAI Signature Validation**: Verify official Aadhaar signatures
- **Zero-Knowledge Proofs**: No sensitive data revealed
- **Cryptographic Commitments**: Only hash commitments stored
- **Memory Protection**: Sensitive data cleared after use

## Performance

| Operation | Time | Output Size |
|-----------|------|-------------|
| QR Processing | ~50ms | - |
| Age Proof | ~500ms | 256 bytes |
| Nationality Proof | ~600ms | 256 bytes |
| Uniqueness Proof | ~550ms | 256 bytes |

## Links

- [NPM Package](https://www.npmjs.com/package/@solsticeprotocol/sdk)
- [GitHub Repository](https://github.com/Shaurya2k06/SolsticeProtocol)
- [Documentation](./docs/)

## Support

For questions and support, please open an issue on our [GitHub repository](https://github.com/Shaurya2k06/SolsticeProtocol/issues).