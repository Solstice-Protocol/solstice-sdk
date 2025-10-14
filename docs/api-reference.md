# API Reference

Complete API documentation for the Solstice SDK.

## EnhancedSolsticeSDK

The main SDK class providing zero-knowledge identity verification capabilities.

### Constructor

```typescript
new EnhancedSolsticeSDK(config?: Partial<SolsticeConfig>)
```

#### Parameters

- `config` (optional): Configuration object

```typescript
interface SolsticeConfig {
  endpoint: string;              // Solana RPC endpoint
  programId: PublicKey;          // Smart contract program ID
  network?: 'mainnet' | 'devnet' | 'testnet';
  circuitConfig?: CircuitConfig; // Custom circuit paths
  debug?: boolean;               // Enable debug logging
}
```

### Methods

#### `initialize(): Promise<void>`

Initialize the SDK and load ZK circuits. Must be called before using proof generation features.

```javascript
await sdk.initialize();
```

#### `connect(wallet: WalletAdapter): Promise<void>`

Connect a Solana wallet for blockchain operations.

```javascript
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
const wallet = new PhantomWalletAdapter();
await sdk.connect(wallet);
```

#### `processQRCode(qrData: string): Promise<AadhaarData>`

Process an Aadhaar mAadhaar QR code and extract identity data.

```javascript
const aadhaarData = await sdk.processQRCode(qrCodeString);
```

**Returns**: `AadhaarData` object containing:
- `uid`: Aadhaar number (masked)
- `name`: Full name
- `dateOfBirth`: Date of birth
- `gender`: Gender
- `address`: Address object
- `mobile`: Mobile number (if available)
- `email`: Email (if available)

#### `generateAgeProof(data: AadhaarData, params: AgeProofParams): Promise<ProofData>`

Generate a zero-knowledge proof of age without revealing the exact age.

```javascript
const ageProof = await sdk.generateAgeProof(aadhaarData, {
  threshold: 18,
  nonce: 'unique-session-id'
});
```

**Parameters**:
- `threshold`: Minimum age to prove (e.g., 18 for adult verification)
- `nonce`: Unique identifier for this proof session

#### `generateNationalityProof(data: AadhaarData, params: NationalityProofParams): Promise<ProofData>`

Generate a zero-knowledge proof of nationality/location without revealing exact location.

```javascript
const nationalityProof = await sdk.generateNationalityProof(aadhaarData, {
  allowedStates: ['Karnataka', 'Maharashtra'],
  nonce: 'unique-session-id'
});
```

**Parameters**:
- `allowedStates`: Array of allowed states/regions
- `nonce`: Unique identifier for this proof session

#### `generateUniquenessProof(data: AadhaarData, params: UniquenessProofParams): Promise<ProofData>`

Generate a zero-knowledge proof of uniqueness to prevent double-spending/voting.

```javascript
const uniquenessProof = await sdk.generateUniquenessProof(aadhaarData, {
  sessionId: 'voting-session-2024',
  nonce: 'unique-session-id'
});
```

**Parameters**:
- `sessionId`: Unique identifier for the application session
- `nonce`: Unique identifier for this proof session

#### `createIdentity(data: AadhaarData): Promise<VerificationResult>`

Create an identity commitment on the Solana blockchain.

```javascript
const result = await sdk.createIdentity(aadhaarData);
```

#### `verifyIdentity(proof: ProofData): Promise<VerificationResult>`

Verify a zero-knowledge proof on the blockchain.

```javascript
const verification = await sdk.verifyIdentity(proof);
```

#### `completeVerificationWorkflow(qrData: string, requirements: VerificationRequirements): Promise<WorkflowResult>`

Complete end-to-end verification workflow from QR code to blockchain verification.

```javascript
const result = await sdk.completeVerificationWorkflow(qrData, {
  requireAge: 18,
  allowedStates: ['Karnataka'],
  sessionId: 'app-session-123'
});
```

## Type Definitions

### AadhaarData

```typescript
interface AadhaarData {
  uid: string;
  name: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'T';
  address: {
    careOf?: string;
    building?: string;
    street?: string;
    landmark?: string;
    locality?: string;
    vtc?: string;
    subDistrict?: string;
    district?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  mobile?: string;
  email?: string;
}
```

### ProofData

```typescript
interface ProofData {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
  commitment: string;
  nullifierHash: string;
  timestamp: number;
  proofType: 'age' | 'nationality' | 'uniqueness';
}
```

### VerificationResult

```typescript
interface VerificationResult {
  success: boolean;
  signature?: string;
  identityCommitment?: string;
  transactionHash?: string;
  error?: string;
}
```

## Error Types

### SolsticeError

Base error class for all SDK errors.

```typescript
class SolsticeError extends Error {
  code: string;
  timestamp: number;
}
```

### CircuitLoadError

Error loading ZK circuits.

```typescript
class CircuitLoadError extends SolsticeError {
  code: 'CIRCUIT_LOAD_FAILED';
}
```

### InvalidQRDataError

Error processing QR code data.

```typescript
class InvalidQRDataError extends SolsticeError {
  code: 'INVALID_QR_DATA';
}
```

### ProofGenerationError

Error generating zero-knowledge proofs.

```typescript
class ProofGenerationError extends SolsticeError {
  code: 'PROOF_GENERATION_FAILED';
}
```

### WalletNotConnectedError

Error when wallet operations are attempted without connection.

```typescript
class WalletNotConnectedError extends SolsticeError {
  code: 'WALLET_NOT_CONNECTED';
}
```

## Utility Functions

### calculateAge(dateOfBirth: string): number

Calculate age from date of birth string.

```javascript
import { calculateAge } from '@solsticeprotocol/sdk';
const age = calculateAge('1990-01-01');
```

### validateQRData(qrData: string): boolean

Validate Aadhaar QR code format.

```javascript
import { validateQRData } from '@solsticeprotocol/sdk';
const isValid = validateQRData(qrCodeString);
```

### hashInputs(inputs: any[]): string

Hash inputs for proof generation.

```javascript
import { hashInputs } from '@solsticeprotocol/sdk';
const hash = hashInputs([name, age, nonce]);
```

## Testing Utilities

### Testing.generateMockQRData()

Generate mock Aadhaar QR data for testing.

```javascript
import { Testing } from '@solsticeprotocol/sdk';
const mockData = Testing.generateMockQRData();
```

### Testing.testValidators

Validation functions for testing.

```javascript
const { validateProofFormat, validateAadhaarData } = Testing.testValidators;
```

## Constants

### SOLSTICE_PROGRAM_ID

Default Solana program ID for the Solstice smart contract.

```javascript
import { SOLSTICE_PROGRAM_ID } from '@solsticeprotocol/sdk';
```

### DEFAULT_RPC_ENDPOINTS

Default RPC endpoints for different networks.

```javascript
import { DEFAULT_RPC_ENDPOINTS } from '@solsticeprotocol/sdk';
console.log(DEFAULT_RPC_ENDPOINTS.devnet);
```