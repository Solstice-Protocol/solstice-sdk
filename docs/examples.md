# Integration Examples

Real-world integration examples for the Solstice SDK.

## React Application Integration

### Complete React Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { EnhancedSolsticeSDK, AadhaarData, ProofData } from '@solsticeprotocol/sdk';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

const IdentityVerification: React.FC = () => {
  const [sdk, setSdk] = useState<EnhancedSolsticeSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [qrData, setQrData] = useState('');
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [proofs, setProofs] = useState<{
    age?: ProofData;
    nationality?: ProofData;
    uniqueness?: ProofData;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      const solsticeSDK = new EnhancedSolsticeSDK({
        network: 'devnet',
        endpoint: 'https://api.devnet.solana.com',
        debug: true
      });

      await solsticeSDK.initialize();
      setSdk(solsticeSDK);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
    }
  };

  const processQRCode = async () => {
    if (!sdk || !qrData) return;

    setLoading(true);
    try {
      const data = await sdk.processQRCode(qrData);
      setAadhaarData(data);
    } catch (error) {
      console.error('Failed to process QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateProofs = async () => {
    if (!sdk || !aadhaarData) return;

    setLoading(true);
    try {
      // Generate age proof (18+)
      const ageProof = await sdk.generateAgeProof(aadhaarData, {
        threshold: 18,
        nonce: Date.now().toString()
      });

      // Generate nationality proof
      const nationalityProof = await sdk.generateNationalityProof(aadhaarData, {
        allowedStates: ['Karnataka', 'Maharashtra', 'Delhi'],
        nonce: Date.now().toString()
      });

      // Generate uniqueness proof
      const uniquenessProof = await sdk.generateUniquenessProof(aadhaarData, {
        sessionId: 'demo-session-2024',
        nonce: Date.now().toString()
      });

      setProofs({
        age: ageProof,
        nationality: nationalityProof,
        uniqueness: uniquenessProof
      });
    } catch (error) {
      console.error('Failed to generate proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWalletAndVerify = async () => {
    if (!sdk || !proofs.age) return;

    setLoading(true);
    try {
      // Connect Phantom wallet
      const wallet = new PhantomWalletAdapter();
      await sdk.connect(wallet);

      // Create identity on blockchain
      if (aadhaarData) {
        const identityResult = await sdk.createIdentity(aadhaarData);
        console.log('Identity created:', identityResult);
      }

      // Verify age proof on blockchain
      const verificationResult = await sdk.verifyIdentity(proofs.age);
      console.log('Verification result:', verificationResult);
      
      alert('Verification successful!');
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Solstice Identity Verification</h1>
      
      {!isInitialized ? (
        <div className="text-center">
          <p>Initializing SDK...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* QR Code Input */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Step 1: Scan Aadhaar QR Code</h2>
            <textarea
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder="Paste Aadhaar mAadhaar QR code data here..."
              className="w-full h-32 p-3 border rounded"
            />
            <button
              onClick={processQRCode}
              disabled={!qrData || loading}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : 'Process QR Code'}
            </button>
          </div>

          {/* Extracted Data */}
          {aadhaarData && (
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Step 2: Extracted Data</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Name:</strong> {aadhaarData.name}
                </div>
                <div>
                  <strong>Gender:</strong> {aadhaarData.gender}
                </div>
                <div>
                  <strong>State:</strong> {aadhaarData.address?.state}
                </div>
                <div>
                  <strong>District:</strong> {aadhaarData.address?.district}
                </div>
              </div>
              <button
                onClick={generateProofs}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
              >
                {loading ? 'Generating Proofs...' : 'Generate ZK Proofs'}
              </button>
            </div>
          )}

          {/* Generated Proofs */}
          {Object.keys(proofs).length > 0 && (
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Step 3: Zero-Knowledge Proofs</h2>
              <div className="space-y-2">
                {proofs.age && (
                  <div className="text-green-600">✅ Age Proof (18+) Generated</div>
                )}
                {proofs.nationality && (
                  <div className="text-green-600">✅ Nationality Proof Generated</div>
                )}
                {proofs.uniqueness && (
                  <div className="text-green-600">✅ Uniqueness Proof Generated</div>
                )}
              </div>
              <button
                onClick={connectWalletAndVerify}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
              >
                {loading ? 'Verifying...' : 'Connect Wallet & Verify'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;
```

## Next.js Application

### Setup in Next.js

1. Install dependencies:
```bash
npm install @solsticeprotocol/sdk @solana/wallet-adapter-phantom
```

2. Copy circuit files:
```bash
cp -r node_modules/@solsticeprotocol/sdk/circuits public/
```

3. Create a custom hook:

```tsx
// hooks/useSolsticeSDK.ts
import { useState, useEffect } from 'react';
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';

export const useSolsticeSDK = () => {
  const [sdk, setSdk] = useState<EnhancedSolsticeSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      const solsticeSDK = new EnhancedSolsticeSDK({
        network: 'devnet',
        endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
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

      try {
        await solsticeSDK.initialize();
        setSdk(solsticeSDK);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Solstice SDK:', error);
      }
    };

    initSDK();
  }, []);

  return { sdk, isInitialized };
};
```

## DeFi Integration Example

### Age-Gated DeFi Protocol

```typescript
import { EnhancedSolsticeSDK, AadhaarData, ProofData } from '@solsticeprotocol/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

class AgeGatedDefiProtocol {
  private sdk: EnhancedSolsticeSDK;
  private connection: Connection;

  constructor() {
    this.sdk = new EnhancedSolsticeSDK({
      network: 'devnet',
      endpoint: 'https://api.devnet.solana.com'
    });
    this.connection = new Connection('https://api.devnet.solana.com');
  }

  async initialize() {
    await this.sdk.initialize();
  }

  async verifyAgeForLending(qrData: string, minimumAge: number): Promise<boolean> {
    try {
      // Process Aadhaar QR code
      const aadhaarData = await this.sdk.processQRCode(qrData);
      
      // Generate age proof
      const ageProof = await this.sdk.generateAgeProof(aadhaarData, {
        threshold: minimumAge,
        nonce: Date.now().toString()
      });

      // Verify proof on blockchain
      const verification = await this.sdk.verifyIdentity(ageProof);
      
      return verification.success;
    } catch (error) {
      console.error('Age verification failed:', error);
      return false;
    }
  }

  async checkGeographicEligibility(qrData: string, allowedRegions: string[]): Promise<boolean> {
    try {
      const aadhaarData = await this.sdk.processQRCode(qrData);
      
      const nationalityProof = await this.sdk.generateNationalityProof(aadhaarData, {
        allowedStates: allowedRegions,
        nonce: Date.now().toString()
      });

      const verification = await this.sdk.verifyIdentity(nationalityProof);
      return verification.success;
    } catch (error) {
      console.error('Geographic verification failed:', error);
      return false;
    }
  }

  async preventSybilAttacks(qrData: string, sessionId: string): Promise<boolean> {
    try {
      const aadhaarData = await this.sdk.processQRCode(qrData);
      
      const uniquenessProof = await this.sdk.generateUniquenessProof(aadhaarData, {
        sessionId,
        nonce: Date.now().toString()
      });

      const verification = await this.sdk.verifyIdentity(uniquenessProof);
      return verification.success;
    } catch (error) {
      console.error('Uniqueness verification failed:', error);
      return false;
    }
  }
}

// Usage
const defiProtocol = new AgeGatedDefiProtocol();
await defiProtocol.initialize();

// Verify user is 21+ for advanced trading features
const isEligible = await defiProtocol.verifyAgeForLending(qrData, 21);

// Check if user is from allowed regions
const isAllowedRegion = await defiProtocol.checkGeographicEligibility(
  qrData, 
  ['Karnataka', 'Maharashtra', 'Delhi']
);

// Prevent multiple accounts in airdrop
const isUnique = await defiProtocol.preventSybilAttacks(qrData, 'airdrop-2024');
```

## Voting System Integration

### Secure Voting with Identity Verification

```typescript
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';

class SecureVotingSystem {
  private sdk: EnhancedSolsticeSDK;
  private electionId: string;

  constructor(electionId: string) {
    this.electionId = electionId;
    this.sdk = new EnhancedSolsticeSDK({
      network: 'mainnet', // Use mainnet for production voting
      endpoint: process.env.SOLANA_RPC_ENDPOINT!
    });
  }

  async initialize() {
    await this.sdk.initialize();
  }

  async registerVoter(qrData: string): Promise<{ success: boolean; voterId?: string }> {
    try {
      // Process voter's Aadhaar
      const aadhaarData = await this.sdk.processQRCode(qrData);
      
      // Verify voter is 18+
      const ageProof = await this.sdk.generateAgeProof(aadhaarData, {
        threshold: 18,
        nonce: this.electionId
      });

      // Verify voter is from eligible constituency
      const nationalityProof = await this.sdk.generateNationalityProof(aadhaarData, {
        allowedStates: ['Karnataka'], // Example: Karnataka state election
        nonce: this.electionId
      });

      // Prevent double registration
      const uniquenessProof = await this.sdk.generateUniquenessProof(aadhaarData, {
        sessionId: this.electionId,
        nonce: Date.now().toString()
      });

      // Create voter identity on blockchain
      const identity = await this.sdk.createIdentity(aadhaarData);
      
      return {
        success: true,
        voterId: identity.identityCommitment
      };
    } catch (error) {
      console.error('Voter registration failed:', error);
      return { success: false };
    }
  }

  async castVote(voterId: string, candidateId: string): Promise<boolean> {
    try {
      // Implementation would verify voter ID and record vote
      // This is simplified for example purposes
      console.log(`Vote cast by ${voterId} for candidate ${candidateId}`);
      return true;
    } catch (error) {
      console.error('Vote casting failed:', error);
      return false;
    }
  }
}
```

## Express.js Backend Integration

### Server-side QR Processing

```typescript
import express from 'express';
import { EnhancedSolsticeSDK, validateQRData } from '@solsticeprotocol/sdk';

const app = express();
app.use(express.json());

const sdk = new EnhancedSolsticeSDK({
  network: 'devnet',
  endpoint: 'https://api.devnet.solana.com'
});

// Initialize SDK on server start
sdk.initialize().then(() => {
  console.log('Solstice SDK initialized');
});

// Process QR code endpoint
app.post('/api/process-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!validateQRData(qrData)) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    const aadhaarData = await sdk.processQRCode(qrData);
    
    // Return sanitized data (remove sensitive info)
    res.json({
      success: true,
      data: {
        name: aadhaarData.name,
        state: aadhaarData.address?.state,
        hasValidAge: !!aadhaarData.dateOfBirth
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process QR code' });
  }
});

// Generate age proof endpoint
app.post('/api/generate-age-proof', async (req, res) => {
  try {
    const { qrData, threshold } = req.body;
    
    const aadhaarData = await sdk.processQRCode(qrData);
    const proof = await sdk.generateAgeProof(aadhaarData, {
      threshold,
      nonce: Date.now().toString()
    });
    
    res.json({ success: true, proof });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate proof' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Error Handling Best Practices

```typescript
import { 
  SolsticeError, 
  CircuitLoadError, 
  InvalidQRDataError,
  ProofGenerationError,
  WalletNotConnectedError 
} from '@solsticeprotocol/sdk';

async function handleSDKOperations() {
  try {
    // Your SDK operations here
    await sdk.processQRCode(qrData);
  } catch (error) {
    if (error instanceof InvalidQRDataError) {
      // Handle invalid QR format
      console.error('Please scan a valid Aadhaar QR code');
    } else if (error instanceof CircuitLoadError) {
      // Handle circuit loading issues
      console.error('Failed to load ZK circuits. Please check your network connection.');
    } else if (error instanceof ProofGenerationError) {
      // Handle proof generation failures
      console.error('Failed to generate proof. Please try again.');
    } else if (error instanceof WalletNotConnectedError) {
      // Handle wallet connection issues
      console.error('Please connect your wallet first');
    } else if (error instanceof SolsticeError) {
      // Handle other SDK errors
      console.error(`SDK Error: ${error.message}`);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
  }
}
```