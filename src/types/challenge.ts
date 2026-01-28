/**
 * Challenge-Response Protocol Types
 * For third-party apps to request proofs from users
 */

export interface VerificationChallenge {
  /** Unique challenge ID */
  challengeId: string;
  /** App requesting verification */
  appId: string;
  /** App name for display */
  appName: string;
  /** Type of proof requested */
  proofType: 'age' | 'nationality' | 'uniqueness';
  /** Proof parameters */
  params: ChallengeParams;
  /** Challenge expiration timestamp */
  expiresAt: number;
  /** Callback URL for proof submission */
  callbackUrl?: string;
  /** Nonce for replay protection */
  nonce: string;
  /** Created timestamp */
  createdAt: number;
}

export type ChallengeParams =
  | { type: 'age'; threshold: number }
  | { type: 'nationality'; allowedCountries: string[] }
  | { type: 'uniqueness'; scope: string };

export interface ChallengeQRData {
  /** Challenge details */
  challenge: VerificationChallenge;
  /** QR code format version */
  version: string;
}

export interface ProofResponse {
  /** Challenge ID this responds to */
  challengeId: string;
  /** ZK proof data */
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    publicSignals: string[];
  };
  /** Response signature */
  signature?: string;
  /** User's identity commitment (public) */
  identityCommitment: string;
  /** Timestamp */
  timestamp: number;
}

export interface ChallengeVerificationResult {
  /** Whether proof is valid */
  verified: boolean;
  /** Challenge that was verified */
  challengeId: string;
  /** Error message if verification failed */
  error?: string;
  /** Proof metadata */
  metadata?: {
    proofType: string;
    identityCommitment: string;
    timestamp: number;
  };
}

export interface ChallengeOptions {
  /** Custom expiration time in seconds (default: 300 = 5 minutes) */
  expirationSeconds?: number;
  /** Callback URL for async proof delivery */
  callbackUrl?: string;
  /** Custom nonce */
  nonce?: string;
}
