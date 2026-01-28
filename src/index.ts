/**
 * Solstice SDK - Zero-Knowledge Identity Verification for Solana
 *
 * Main entry point for the SDK
 */

export { SolsticeSDK } from './core/SolsticeSDK';
export { EnhancedSolsticeSDK } from './core/EnhancedSolsticeSDK';
export { ProofGenerator } from './proofs/ProofGenerator';
export { EnhancedProofGenerator } from './proofs/EnhancedProofGenerator';
export { SolanaClient } from './solana/SolanaClient';
export { QRProcessor } from './utils/QRProcessor';

// Type exports
export type {
  SolsticeConfig,
  IdentityStatus,
  ProofData,
  SessionData,
  AgeProofParams,
  NationalityProofParams,
  UniquenessProofParams,
  SessionParams,
  CircuitConfig,
  VerificationResult,
  AadhaarData,
  ProofCache,
} from './types';

// Error exports
export {
  SolsticeError,
  ProofGenerationError,
  WalletNotConnectedError,
  VerificationError,
  CircuitLoadError,
  InvalidQRDataError,
} from './utils/errors';

// Constants
export { SOLSTICE_PROGRAM_ID, DEFAULT_RPC_ENDPOINTS } from './utils/constants';

// Utility functions
export {
  validateQRData,
  parseAadhaarQR,
  formatProofForVerification,
  calculateAge,
  hashInputs,
} from './utils/helpers';

// Testing utilities (separate export for optional inclusion)
export * as Testing from './testing';
