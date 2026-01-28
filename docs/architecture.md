# Architecture Overview

Technical architecture and design decisions for the Solstice SDK.

##  High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                      │
├─────────────────────────────────────────────────────────────┤
│                   Solstice SDK (NPM)                       │
│  ┌─────────────────┬────────────────┬──────────────────────┐ │
│  │ Enhanced        │ Enhanced       │ QR Processor        │ │
│  │ Solstice SDK    │ Proof          │                     │ │
│  │                 │ Generator      │                     │ │
│  └─────────────────┴────────────────┴──────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Browser/Node.js                         │
│  ┌─────────────────┬────────────────┬──────────────────────┐ │
│  │ IndexedDB       │ snarkjs        │ Solana Web3.js      │ │
│  │ Cache           │ ZK Proofs      │ Blockchain           │ │
│  └─────────────────┴────────────────┴──────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Infrastructure                        │
│  ┌─────────────────┬────────────────┬──────────────────────┐ │
│  │ Circom          │ Solana         │ Light Protocol       │ │
│  │ ZK Circuits     │ Blockchain     │ Compression          │ │
│  └─────────────────┴────────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

##  Core Components

### 1. EnhancedSolsticeSDK

The main SDK class that orchestrates all operations.

**Responsibilities:**
- SDK initialization and configuration management
- Wallet connection and blockchain interaction
- High-level workflow orchestration
- Error handling and logging

**Key Features:**
- Lazy initialization of heavy components
- Configurable circuit paths for different environments
- Built-in caching and performance optimization
- Comprehensive error handling with typed exceptions

### 2. EnhancedProofGenerator

Handles zero-knowledge proof generation using real cryptographic libraries.

**Responsibilities:**
- Load and manage Circom circuit artifacts
- Generate ZK proofs using snarkjs
- Implement proof caching with TTL
- Validate proof parameters and inputs

**Technology Stack:**
- **snarkjs**: ZK proof generation and verification
- **circomlibjs**: Poseidon hash function
- **IndexedDB**: Client-side proof caching
- **WebAssembly**: Circuit execution in browsers

### 3. QRProcessor

Advanced Aadhaar QR code processing with cryptographic validation.

**Responsibilities:**
- Parse mAadhaar QR code XML structure
- Validate UIDAI digital signatures
- Extract and normalize demographic data
- Generate demographic hash commitments

**Security Features:**
- UIDAI signature verification
- XML parsing with validation
- Data sanitization and normalization
- Hash-based data integrity

### 4. SolanaClient

Blockchain interaction layer for Solana operations.

**Responsibilities:**
- Wallet adapter integration
- Transaction construction and submission
- Program interaction (Light Protocol)
- Account state management

**Features:**
- Connection pooling and retry logic
- Transaction confirmation handling
- Program-derived address (PDA) management
- Compressed account operations

##  Cryptographic Architecture

### Zero-Knowledge Proof System

```
┌─────────────────────────────────────────────────────────────┐
│                    ZK Proof Generation                     │
│                                                             │
│  Input Data (Aadhaar)                                      │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │ Data Extraction │    │ Poseidon Hashing │              │
│  │ & Validation    │───▶│ & Commitment     │              │
│  └─────────────────┘    └──────────────────┘              │
│         │                         │                        │
│         ▼                         ▼                        │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │ Circuit Inputs  │    │ Witness          │              │
│  │ Preparation     │───▶│ Generation       │              │
│  └─────────────────┘    └──────────────────┘              │
│         │                         │                        │
│         ▼                         ▼                        │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │ snarkjs         │    │ Groth16 Proof    │              │
│  │ Proof Gen       │───▶│ Output           │              │
│  └─────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Supported Proof Types

#### 1. Age Proof (age_proof.circom)
- **Purpose**: Prove age ≥ threshold without revealing exact age
- **Inputs**: Date of birth, threshold, nonce
- **Outputs**: Validity signal, commitment
- **Use Cases**: Age-gated services, adult verification

#### 2. Nationality Proof (nationality_proof.circom)
- **Purpose**: Prove residency in allowed regions
- **Inputs**: Address state, allowed states list, nonce
- **Outputs**: Validity signal, commitment
- **Use Cases**: Geographic restrictions, regulatory compliance

#### 3. Uniqueness Proof (uniqueness_proof.circom)
- **Purpose**: Prevent double-spending/voting with same identity
- **Inputs**: Identity hash, session ID, nonce
- **Outputs**: Nullifier hash, commitment
- **Use Cases**: Voting systems, airdrop eligibility

##  Data Architecture

### Aadhaar Data Structure

```typescript
interface AadhaarData {
  // Core Identity
  uid: string;                    // Masked Aadhaar number
  name: string;                   // Full name
  dateOfBirth: string;            // DOB in ISO format
  gender: 'M' | 'F' | 'T';       // Gender
  
  // Address Hierarchy
  address: {
    careOf?: string;              // Care of
    building?: string;            // Building/House
    street?: string;              // Street
    landmark?: string;            // Landmark
    locality?: string;            // Locality/Village
    vtc?: string;                 // Village/Town/City
    subDistrict?: string;         // Sub-district/Tehsil
    district?: string;            // District
    state?: string;               // State
    country?: string;             // Country
    pincode?: string;             // PIN code
  };
  
  // Optional Contact
  mobile?: string;                // Mobile number
  email?: string;                 // Email address
}
```

### Proof Data Structure

```typescript
interface ProofData {
  // Groth16 ZK Proof
  proof: {
    pi_a: string[];               // Proof point A
    pi_b: string[][];             // Proof point B  
    pi_c: string[];               // Proof point C
  };
  
  // Public Signals
  publicSignals: string[];        // Circuit public outputs
  
  // Metadata
  commitment: string;             // Identity commitment
  nullifierHash: string;          // Uniqueness nullifier
  timestamp: number;              // Proof generation time
  proofType: 'age' | 'nationality' | 'uniqueness';
}
```

##  Package Architecture

### Build System

```
┌─────────────────────────────────────────────────────────────┐
│                      Build Process                         │
│                                                             │
│  TypeScript Source                                          │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │ TypeScript      │    │ Type Checking    │              │
│  │ Compilation     │───▶│ & Validation     │              │
│  └─────────────────┘    └──────────────────┘              │
│         │                         │                        │
│         ▼                         ▼                        │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │ Rollup          │    │ Multiple Targets │              │
│  │ Bundling        │───▶│ ESM/CJS/UMD      │              │
│  └─────────────────┘    └──────────────────┘              │
│         │                         │                        │
│         ▼                         ▼                        │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │ Type Definitions│    │ NPM Package      │              │
│  │ Generation      │───▶│ Distribution     │              │
│  └─────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Output Formats

1. **ESM (index.esm.js)**: Modern ES modules for bundlers
2. **CommonJS (index.js)**: Node.js compatibility
3. **UMD (index.umd.min.js)**: Browser global variable
4. **TypeScript (index.d.ts)**: Type definitions

##  Performance Architecture

### Optimization Strategies

#### 1. Lazy Loading
- Circuits loaded only when needed
- Heavy cryptographic operations deferred
- Component initialization on demand

#### 2. Caching System
- **IndexedDB**: Client-side proof cache
- **Memory Cache**: Circuit artifacts
- **TTL Management**: Automatic cache expiration

#### 3. Parallel Processing
- Multiple proof generation in parallel
- Concurrent circuit loading
- Asynchronous blockchain operations

### Performance Metrics

| Operation | Time | Size |
|-----------|------|------|
| SDK Initialization | ~2-3s | - |
| Circuit Loading | ~1-2s | ~10MB total |
| Age Proof Generation | ~500ms | 256 bytes |
| Nationality Proof | ~600ms | 256 bytes |
| Uniqueness Proof | ~550ms | 256 bytes |
| QR Code Processing | ~50ms | - |

## 🔗 Integration Patterns

### 1. Component Architecture

```typescript
// Composition over inheritance
class EnhancedSolsticeSDK {
  private proofGenerator: EnhancedProofGenerator;
  private solanaClient: SolanaClient;
  private qrProcessor: QRProcessor;
  
  constructor(config: SolsticeConfig) {
    this.proofGenerator = new EnhancedProofGenerator(config.circuitConfig);
    this.solanaClient = new SolanaClient(config.endpoint, config.programId);
    this.qrProcessor = new QRProcessor();
  }
}
```

### 2. Error Handling Architecture

```typescript
// Hierarchical error system
abstract class SolsticeError extends Error {
  abstract code: string;
  timestamp: number = Date.now();
}

class CircuitLoadError extends SolsticeError {
  code = 'CIRCUIT_LOAD_FAILED';
}

class ProofGenerationError extends SolsticeError {
  code = 'PROOF_GENERATION_FAILED';
}
```

### 3. Configuration Management

```typescript
// Environment-aware configuration
interface SolsticeConfig {
  endpoint: string;
  programId: PublicKey;
  network?: 'mainnet' | 'devnet' | 'testnet';
  circuitConfig?: CircuitConfig;
  debug?: boolean;
}

// Default configurations
const DEFAULT_CONFIGS = {
  devnet: {
    endpoint: 'https://api.devnet.solana.com',
    programId: DEVNET_PROGRAM_ID
  },
  mainnet: {
    endpoint: 'https://api.mainnet-beta.solana.com',
    programId: MAINNET_PROGRAM_ID
  }
};
```

## 🛡️ Security Architecture

### 1. Data Protection

- **No Sensitive Data Storage**: Raw Aadhaar data never persisted
- **Memory Cleanup**: Sensitive data cleared after use
- **Commitment Schemes**: Only cryptographic commitments stored
- **Nonce Management**: Prevents replay attacks

### 2. Cryptographic Security

- **UIDAI Signature Verification**: Official signature validation
- **Poseidon Hashing**: ZK-friendly hash function
- **Groth16 Proofs**: Production-ready ZK system
- **Nullifier Hashes**: Prevent double-spending

### 3. Network Security

- **RPC Validation**: Endpoint verification
- **Transaction Signing**: Secure wallet integration
- **HTTPS Only**: Encrypted communication
- **CORS Protection**: Browser security

##  Workflow Architecture

### Complete Verification Flow

```
User Scans QR Code
        │
        ▼
┌─────────────────┐
│ QR Processing   │ ──── Extract & Validate Aadhaar Data
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Proof Generation│ ──── Generate ZK Proofs (Age/Nationality/Uniqueness)
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Wallet Connect  │ ──── Connect User's Solana Wallet
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Identity Create │ ──── Create Identity Commitment on Blockchain
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Proof Verify    │ ──── Verify ZK Proofs on Solana
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Complete        │ ──── Return Verification Result
└─────────────────┘
```

##  Monitoring Architecture

### 1. Error Tracking
- Structured error logging
- Performance monitoring
- Usage analytics
- Circuit load metrics

### 2. Performance Monitoring
- Proof generation times
- Circuit loading performance
- Blockchain interaction latency
- Cache hit rates

### 3. Usage Analytics
- SDK method usage
- Error frequency
- Performance trends
- User flow analysis

This architecture ensures the Solstice SDK is scalable, secure, and performant while maintaining ease of integration for developers.