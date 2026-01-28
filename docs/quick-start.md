# Quick Start Guide

Get up and running with the Solstice SDK in just a few minutes.

##  Installation

```bash
npm install @solsticeprotocol/sdk
```

##  Basic Setup

### 1. Import the SDK

```javascript
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';
```

### 2. Initialize the SDK

```javascript
const sdk = new EnhancedSolsticeSDK({
  network: 'devnet', // or 'mainnet'
  endpoint: 'https://api.devnet.solana.com',
  debug: true // Enable debug logging
});

// Initialize circuit loading (required for proof generation)
await sdk.initialize();
```

### 3. Process Aadhaar QR Code

```javascript
// Process an Aadhaar mAadhaar QR code
const aadhaarData = await sdk.processQRCode(qrCodeData);

console.log('Extracted data:', {
  name: aadhaarData.name,
  age: calculateAge(aadhaarData.dateOfBirth),
  state: aadhaarData.address?.state
});
```

### 4. Generate Zero-Knowledge Proofs

```javascript
// Generate age proof (prove age >= 18 without revealing exact age)
const ageProof = await sdk.generateAgeProof(aadhaarData, {
  threshold: 18,
  nonce: 'unique-session-id'
});

// Generate nationality proof
const nationalityProof = await sdk.generateNationalityProof(aadhaarData, {
  allowedStates: ['Karnataka', 'Maharashtra'],
  nonce: 'unique-session-id'
});

// Generate uniqueness proof (prevent double voting/claiming)
const uniquenessProof = await sdk.generateUniquenessProof(aadhaarData, {
  sessionId: 'voting-session-2024',
  nonce: 'unique-session-id'
});
```

### 5. Connect Wallet and Submit to Blockchain

```javascript
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Connect wallet
const wallet = new PhantomWalletAdapter();
await sdk.connect(wallet);

// Create identity on blockchain
const result = await sdk.createIdentity(aadhaarData);
console.log('Identity created:', result.signature);

// Verify proofs on-chain
const verification = await sdk.verifyIdentity(ageProof);
console.log('Verification result:', verification);
```

## 🌐 Web Environment Setup

For full functionality in web applications, ensure circuit files are accessible:

### React/Next.js Setup

1. Copy circuit files to your public directory:
```bash
cp -r node_modules/@solsticeprotocol/sdk/circuits public/
```

2. Configure your SDK with correct paths:
```javascript
const sdk = new EnhancedSolsticeSDK({
  network: 'devnet',
  circuitConfig: {
    age: {
      wasmPath: '/circuits/age_proof_js/age_proof.wasm',
      zkeyPath: '/circuits/age_proof_final.zkey'
    },
    nationality: {
      wasmPath: '/circuits/nationality_proof_js/nationality_proof.wasm',
      zkeyPath: '/circuits/nationality_proof_final.zkey'
    },
    uniqueness: {
      wasmPath: '/circuits/uniqueness_proof_js/uniqueness_proof.wasm',
      zkeyPath: '/circuits/uniqueness_proof_final.zkey'
    }
  }
});
```

## 🧪 Testing

Use the included testing utilities for development:

```javascript
import { Testing } from '@solsticeprotocol/sdk';

// Generate mock QR data for testing
const mockQRData = Testing.generateMockQRData();

// Test QR processing
const isValid = Testing.validateQRFormat(qrCodeData);
```

## 🔍 Error Handling

The SDK provides structured error handling:

```javascript
import { 
  SolsticeError, 
  CircuitLoadError, 
  InvalidQRDataError 
} from '@solsticeprotocol/sdk';

try {
  await sdk.processQRCode(qrData);
} catch (error) {
  if (error instanceof InvalidQRDataError) {
    console.error('Invalid QR code format');
  } else if (error instanceof CircuitLoadError) {
    console.error('Failed to load ZK circuits');
  }
}
```

## ⚡ Performance Tips

1. **Initialize once**: Call `sdk.initialize()` only once per application lifecycle
2. **Use caching**: The SDK automatically caches proofs in IndexedDB
3. **Batch operations**: Generate multiple proofs in parallel when possible
4. **Circuit preloading**: Initialize circuits during app startup for better UX

## 🔗 Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](./examples.md) - More detailed examples
- [Integration Guide](./integration.md) - Production deployment guide