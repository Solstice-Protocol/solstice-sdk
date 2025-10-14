import { PublicKey } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-adapter-base';

/**
 * Configuration for initializing the Solstice SDK
 */
export interface SolsticeConfig {
  /** Solana RPC endpoint */
  endpoint: string;
  /** Smart contract program ID */
  programId: PublicKey;
  /** Network environment */
  network?: 'mainnet' | 'devnet' | 'testnet';
  /** Custom circuit configuration */
  circuitConfig?: CircuitConfig;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Circuit configuration for custom circuit paths
 */
export interface CircuitConfig {
  age?: CircuitArtifacts;
  nationality?: CircuitArtifacts;
  uniqueness?: CircuitArtifacts;
}

export interface CircuitArtifacts {
  wasmPath: string;
  zkeyPath: string;
  vkeyPath?: string;
}

/**
 * Identity status on the blockchain
 */
export interface IdentityStatus {
  exists: boolean;
  isVerified: boolean;
  owner: PublicKey;
  identityCommitment: string;
  merkleRoot: string;
  attributesVerified: number; // Bitmap
  verificationTimestamp: number;
}

/**
 * Generated proof data
 */
export interface ProofData {
  proof: any; // Groth16 proof object
  publicSignals: string[];
  attributeType: 'age' | 'nationality' | 'uniqueness';
  metadata?: ProofMetadata;
}

export interface ProofMetadata {
  threshold?: number;
  countries?: string[];
  daoId?: string;
  epochId?: string;
  ageThreshold?: number;
  timestamp: number;
  identityCommitment?: string;
  nullifier?: string;
}

/**
 * Session data for authentication
 */
export interface SessionData {
  sessionId: string;
  user: PublicKey;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

/**
 * Parameters for age proof generation
 */
export interface AgeProofParams {
  /** Minimum age threshold to prove */
  threshold: number;
  /** Whether to include nationality in the proof */
  includeNationality?: boolean;
  /** Custom nonce for uniqueness */
  nonce?: string;
}

/**
 * Parameters for nationality proof generation
 */
export interface NationalityProofParams {
  /** List of allowed countries (ISO codes) */
  allowedCountries: string[];
  /** Whether to include age verification */
  includeAge?: boolean;
  /** Minimum age if including age */
  ageThreshold?: number;
  /** Custom nonce for uniqueness */
  nonce?: string;
}

/**
 * Parameters for uniqueness proof generation
 */
export interface UniquenessProofParams {
  /** DAO or application identifier */
  daoId: string;
  /** Epoch or voting round identifier */
  epochId?: string;
  /** Custom nonce for additional uniqueness */
  nonce?: string;
}

/**
 * Parameters for creating authentication sessions
 */
export interface SessionParams {
  /** Session duration in seconds */
  duration: number;
  /** Optional custom session ID */
  sessionId?: string;
  /** Required attributes for this session */
  requiredAttributes?: ('age' | 'nationality' | 'uniqueness')[];
  /** Custom session metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of proof verification
 */
export interface VerificationResult {
  /** Whether the verification was successful */
  verified: boolean;
  /** Transaction signature if verified on-chain */
  signature?: string;
  /** Error message if verification failed */
  error?: string;
  /** Verification timestamp */
  timestamp: number;
}

/**
 * Parsed Aadhaar data from QR code
 */
export interface AadhaarData {
  referenceId: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD format
  gender: 'M' | 'F' | 'T';
  address: string;
  careOf?: string;
  district?: string;
  landmark?: string;
  house?: string;
  location?: string;
  pincode?: string;
  postOffice?: string;
  state?: string;
  street?: string;
  subDistrict?: string;
  vtc?: string;
  last4Aadhaar?: string;
  mobileHash?: string;
  emailHash?: string;
  signature: string; // UIDAI RSA signature
  xmlData: string; // Original XML data
}

/**
 * Proof cache entry for optimization
 */
export interface ProofCache {
  proofData: ProofData;
  createdAt: number;
  expiresAt: number;
}

/**
 * Batch operation request
 */
export interface BatchProofRequest {
  type: 'age' | 'nationality' | 'uniqueness';
  params: any; // Using any to allow flexibility
}

/**
 * Batch operation result
 */
export interface BatchProofResult {
  proofs: ProofData[];
  signatures?: string[];
  errors?: string[];
}