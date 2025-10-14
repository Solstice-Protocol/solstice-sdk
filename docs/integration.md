# Integration Guide

Step-by-step guide for integrating the Solstice SDK into your application.

## 🎯 Pre-Integration Checklist

- [ ] Node.js 16+ installed
- [ ] Solana wallet adapter configured (for blockchain operations)
- [ ] Basic understanding of zero-knowledge proofs
- [ ] Access to Aadhaar mAadhaar QR codes for testing

## 📦 Installation

### NPM Installation

```bash
npm install @solsticeprotocol/sdk
```

### Additional Dependencies

For web applications, you'll also need:

```bash
npm install @solana/wallet-adapter-base @solana/wallet-adapter-phantom @solana/web3.js
```

## 🏗️ Project Setup

### 1. Environment Configuration

Create a `.env` file in your project root:

```env
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com

# Solstice SDK Configuration
NEXT_PUBLIC_SOLSTICE_PROGRAM_ID=8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz
NEXT_PUBLIC_DEBUG_MODE=true
```

### 2. Circuit Files Setup (Web Applications)

For web applications, copy circuit files to your public directory:

```bash
# For Next.js/React
mkdir -p public/circuits
cp -r node_modules/@solsticeprotocol/sdk/circuits/* public/circuits/

# For Vite
mkdir -p public/circuits
cp -r node_modules/@solsticeprotocol/sdk/circuits/* public/circuits/
```

### 3. TypeScript Configuration

Ensure your `tsconfig.json` includes proper module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "lib": ["es2020", "dom"],
    "target": "es2020"
  }
}
```

## 🔧 Framework-Specific Integration

### React Integration

#### 1. Create SDK Context

```tsx
// contexts/SolsticeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';

interface SolsticeContextType {
  sdk: EnhancedSolsticeSDK | null;
  isInitialized: boolean;
  error: string | null;
}

const SolsticeContext = createContext<SolsticeContextType>({
  sdk: null,
  isInitialized: false,
  error: null
});

export const SolsticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sdk, setSdk] = useState<EnhancedSolsticeSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const solsticeSDK = new EnhancedSolsticeSDK({
          network: process.env.NEXT_PUBLIC_SOLANA_NETWORK as any || 'devnet',
          endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
          debug: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
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

        await solsticeSDK.initialize();
        setSdk(solsticeSDK);
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize SDK');
      }
    };

    initializeSDK();
  }, []);

  return (
    <SolsticeContext.Provider value={{ sdk, isInitialized, error }}>
      {children}
    </SolsticeContext.Provider>
  );
};

export const useSolstice = () => {
  const context = useContext(SolsticeContext);
  if (!context) {
    throw new Error('useSolstice must be used within a SolsticeProvider');
  }
  return context;
};
```

#### 2. Wrap Your App

```tsx
// App.tsx or _app.tsx
import { SolsticeProvider } from './contexts/SolsticeContext';

function App() {
  return (
    <SolsticeProvider>
      {/* Your app components */}
    </SolsticeProvider>
  );
}
```

#### 3. Use in Components

```tsx
// components/IdentityVerification.tsx
import { useSolstice } from '../contexts/SolsticeContext';

const IdentityVerification = () => {
  const { sdk, isInitialized, error } = useSolstice();

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  // Use sdk here
  return <div>SDK ready!</div>;
};
```

### Next.js Integration

#### 1. Install Dependencies

```bash
npm install @solsticeprotocol/sdk @solana/wallet-adapter-base @solana/wallet-adapter-phantom
```

#### 2. Create SDK Hook

```tsx
// hooks/useSolsticeSDK.ts
import { useState, useEffect } from 'react';
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';

export const useSolsticeSDK = () => {
  const [sdk, setSdk] = useState<EnhancedSolsticeSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        const solsticeSDK = new EnhancedSolsticeSDK({
          network: 'devnet',
          endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC!,
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

        await solsticeSDK.initialize();
        setSdk(solsticeSDK);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initSDK();
  }, []);

  return { sdk, isLoading, error };
};
```

#### 3. Use in Pages

```tsx
// pages/verify.tsx
import { useSolsticeSDK } from '../hooks/useSolsticeSDK';

export default function VerifyPage() {
  const { sdk, isLoading, error } = useSolsticeSDK();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Identity Verification</h1>
      {/* Your verification UI */}
    </div>
  );
}
```

### Node.js/Express Integration

#### 1. Basic Setup

```typescript
// server.ts
import express from 'express';
import { EnhancedSolsticeSDK, validateQRData, calculateAge } from '@solsticeprotocol/sdk';

const app = express();
app.use(express.json());

// Initialize SDK
const sdk = new EnhancedSolsticeSDK({
  network: 'devnet',
  endpoint: 'https://api.devnet.solana.com'
});

let sdkInitialized = false;

sdk.initialize().then(() => {
  sdkInitialized = true;
  console.log('Solstice SDK initialized');
}).catch(console.error);

// Middleware to check SDK initialization
const requireSDK = (req: any, res: any, next: any) => {
  if (!sdkInitialized) {
    return res.status(503).json({ error: 'SDK not initialized' });
  }
  next();
};

// Process QR endpoint
app.post('/api/process-qr', requireSDK, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!validateQRData(qrData)) {
      return res.status(400).json({ error: 'Invalid QR format' });
    }

    const aadhaarData = await sdk.processQRCode(qrData);
    
    res.json({
      success: true,
      data: {
        name: aadhaarData.name,
        age: calculateAge(aadhaarData.dateOfBirth),
        state: aadhaarData.address?.state
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.listen(3000);
```

## 🔒 Security Best Practices

### 1. Environment Variables

Never expose sensitive configuration in client-side code:

```typescript
// ✅ Good: Server-side only
const sdk = new EnhancedSolsticeSDK({
  network: process.env.SOLANA_NETWORK,
  endpoint: process.env.SOLANA_RPC_ENDPOINT
});

// ❌ Bad: Client-side exposure
const sdk = new EnhancedSolsticeSDK({
  network: 'mainnet',
  endpoint: 'https://api.mainnet-beta.solana.com'
});
```

### 2. Data Sanitization

Always sanitize extracted data before displaying:

```typescript
const sanitizeAadhaarData = (data: AadhaarData) => ({
  name: data.name,
  state: data.address?.state,
  // Don't expose: uid, dateOfBirth, exact address
});
```

### 3. Proof Validation

Always verify proofs on the blockchain:

```typescript
// ✅ Good: Verify on blockchain
const verification = await sdk.verifyIdentity(proof);
if (!verification.success) {
  throw new Error('Proof verification failed');
}

// ❌ Bad: Trust client-side verification only
if (proof.publicSignals.length > 0) {
  // This can be faked
}
```

## 🧪 Testing Integration

### 1. Unit Tests

```typescript
// tests/sdk.test.ts
import { EnhancedSolsticeSDK, Testing } from '@solsticeprotocol/sdk';

describe('Solstice SDK Integration', () => {
  let sdk: EnhancedSolsticeSDK;

  beforeAll(async () => {
    sdk = new EnhancedSolsticeSDK({
      network: 'devnet',
      endpoint: 'https://api.devnet.solana.com'
    });
    await sdk.initialize();
  });

  test('should process mock QR data', async () => {
    const mockQRData = Testing.generateMockQRData();
    const result = await sdk.processQRCode(mockQRData.data);
    
    expect(result.name).toBeDefined();
    expect(result.address?.state).toBeDefined();
  });

  test('should generate age proof', async () => {
    const mockQRData = Testing.generateMockQRData();
    const aadhaarData = await sdk.processQRCode(mockQRData.data);
    
    const proof = await sdk.generateAgeProof(aadhaarData, {
      threshold: 18,
      nonce: 'test-nonce'
    });
    
    expect(proof.proof).toBeDefined();
    expect(proof.publicSignals).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
// tests/integration.test.ts
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';
import { Connection } from '@solana/web3.js';

describe('Blockchain Integration', () => {
  let sdk: EnhancedSolsticeSDK;
  let connection: Connection;

  beforeAll(async () => {
    sdk = new EnhancedSolsticeSDK({
      network: 'devnet',
      endpoint: 'https://api.devnet.solana.com'
    });
    
    connection = new Connection('https://api.devnet.solana.com');
    await sdk.initialize();
  });

  test('should connect to Solana network', async () => {
    const version = await connection.getVersion();
    expect(version).toBeDefined();
  });
});
```

## 🚀 Production Deployment

### 1. Environment Configuration

```env
# Production .env
NODE_ENV=production
SOLANA_NETWORK=mainnet
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
SOLSTICE_PROGRAM_ID=your_production_program_id
```

### 2. Performance Optimization

```typescript
// Optimize SDK initialization
const sdk = new EnhancedSolsticeSDK({
  network: 'mainnet',
  endpoint: process.env.SOLANA_RPC_ENDPOINT,
  debug: false, // Disable debug in production
});

// Initialize once at application startup
let sdkInstance: EnhancedSolsticeSDK | null = null;

export const getSDK = async (): Promise<EnhancedSolsticeSDK> => {
  if (!sdkInstance) {
    sdkInstance = new EnhancedSolsticeSDK({
      network: 'mainnet',
      endpoint: process.env.SOLANA_RPC_ENDPOINT!
    });
    await sdkInstance.initialize();
  }
  return sdkInstance;
};
```

### 3. Error Monitoring

```typescript
import * as Sentry from '@sentry/node';

try {
  const result = await sdk.processQRCode(qrData);
} catch (error) {
  Sentry.captureException(error);
  // Handle error appropriately
}
```

## 📊 Monitoring and Analytics

### 1. Usage Tracking

```typescript
// Track SDK usage
const trackSDKUsage = (operation: string, success: boolean) => {
  // Your analytics service
  analytics.track('solstice_sdk_operation', {
    operation,
    success,
    timestamp: Date.now()
  });
};

// Usage
try {
  await sdk.processQRCode(qrData);
  trackSDKUsage('process_qr', true);
} catch (error) {
  trackSDKUsage('process_qr', false);
  throw error;
}
```

### 2. Performance Monitoring

```typescript
// Monitor performance
const measurePerformance = async (operation: string, fn: () => Promise<any>) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Log performance metrics
    console.log(`Operation ${operation} took ${duration}ms`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Operation ${operation} failed after ${duration}ms`);
    throw error;
  }
};

// Usage
const proof = await measurePerformance('generate_age_proof', () =>
  sdk.generateAgeProof(aadhaarData, { threshold: 18, nonce: 'test' })
);
```

## 🆘 Troubleshooting

### Common Issues

1. **Circuit Loading Failures**
   - Ensure circuit files are accessible via HTTP
   - Check CORS settings for WASM files
   - Verify file paths are correct

2. **RPC Connection Issues**
   - Use reliable RPC endpoints
   - Implement retry logic
   - Monitor rate limits

3. **Wallet Connection Problems**
   - Ensure wallet adapter compatibility
   - Handle wallet disconnection gracefully
   - Provide clear user instructions

4. **Memory Issues**
   - Initialize SDK once per application
   - Clear proof cache periodically
   - Monitor memory usage in browser

For more help, see our [troubleshooting guide](./troubleshooting.md) or open an issue on [GitHub](https://github.com/Shaurya2k06/SolsticeProtocol/issues).