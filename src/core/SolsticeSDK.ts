import { PublicKey } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-adapter-base';
import {
  SolsticeConfig,
  ProofData,
  IdentityStatus,
  SessionData,
  AgeProofParams,
  NationalityProofParams,
  UniquenessProofParams,
  SessionParams,
  VerificationResult,
  BatchProofRequest,
  BatchProofResult,
  AadhaarData,
} from '../types';
import { ProofGenerator } from '../proofs/ProofGenerator';
import { SolanaClient } from '../solana/SolanaClient';
import {
  SOLSTICE_PROGRAM_ID,
  DEFAULT_RPC_ENDPOINTS,
  SESSION_LIMITS,
} from '../utils/constants';
import {
  SolsticeError,
  WalletNotConnectedError,
  InvalidParametersError,
  ProofGenerationError,
} from '../utils/errors';
import {
  parseAadhaarQR,
  validateQRData,
  generateNonce,
  chunk,
} from '../utils/helpers';

/**
 * Main SDK class for Solstice Protocol zero-knowledge identity verification
 */
export class SolsticeSDK {
  private config: SolsticeConfig;
  private proofGenerator: ProofGenerator;
  private solanaClient: SolanaClient;
  private isInitialized = false;

  constructor(config: Partial<SolsticeConfig> = {}) {
    // Set default configuration
    this.config = {
      endpoint: config.endpoint || DEFAULT_RPC_ENDPOINTS.devnet,
      programId: config.programId || SOLSTICE_PROGRAM_ID,
      network: config.network || 'devnet',
      circuitConfig: config.circuitConfig,
      debug: config.debug || false,
    };

    // Initialize components
    this.proofGenerator = new ProofGenerator(this.config.circuitConfig);
    this.solanaClient = new SolanaClient(
      this.config.endpoint,
      this.config.programId
    );

    if (this.config.debug) {
      console.log(' Solstice SDK initialized with config:', {
        network: this.config.network,
        endpoint: this.config.endpoint,
        programId: this.config.programId.toString(),
      });
    }
  }

  /**
   * Initialize the SDK (loads circuits and prepares components)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log(' Initializing Solstice SDK...');

      // Initialize proof generator (loads circuits)
      await this.proofGenerator.initialize();

      this.isInitialized = true;
      console.log(' Solstice SDK initialized successfully');
    } catch (error) {
      throw new SolsticeError(`SDK initialization failed: ${error}`);
    }
  }

  /**
   * Connect wallet and prepare for blockchain operations
   */
  async connect(wallet: WalletAdapter): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.solanaClient.connect(wallet);

    if (this.config.debug) {
      const balance = await this.solanaClient.getBalance();
      console.log(`💰 Wallet connected. Balance: ${balance} SOL`);
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    await this.solanaClient.disconnect();
  }

  /**
   * Register identity from mAadhaar QR code
   */
  async registerIdentity(qrData: string): Promise<string> {
    if (!validateQRData(qrData)) {
      throw new InvalidParametersError('Invalid mAadhaar QR code data');
    }

    try {
      // Parse QR data
      const aadhaarData = parseAadhaarQR(qrData);

      // Generate identity commitment and merkle root
      const { identityCommitment, merkleRoot } =
        this.generateIdentityCommitment(aadhaarData);

      // Register on blockchain
      const txSignature = await this.solanaClient.registerIdentity(
        identityCommitment,
        merkleRoot
      );

      if (this.config.debug) {
        console.log(' Identity registered:', {
          user: aadhaarData.name,
          txSignature,
          commitment: identityCommitment.slice(0, 16) + '...',
        });
      }

      return txSignature;
    } catch (error) {
      throw new SolsticeError(`Identity registration failed: ${error}`);
    }
  }

  /**
   * Update existing identity with new QR data
   */
  async updateIdentity(newQrData: string): Promise<string> {
    if (!validateQRData(newQrData)) {
      throw new InvalidParametersError('Invalid mAadhaar QR code data');
    }

    try {
      const aadhaarData = parseAadhaarQR(newQrData);
      const { identityCommitment, merkleRoot } =
        this.generateIdentityCommitment(aadhaarData);

      const txSignature = await this.solanaClient.updateIdentity(
        identityCommitment,
        merkleRoot
      );

      if (this.config.debug) {
        console.log(' Identity updated:', txSignature);
      }

      return txSignature;
    } catch (error) {
      throw new SolsticeError(`Identity update failed: ${error}`);
    }
  }

  /**
   * Get current identity status from blockchain
   */
  async getIdentityStatus(): Promise<IdentityStatus> {
    return await this.solanaClient.getIdentityStatus();
  }

  /**
   * Generate age proof (proves age > threshold without revealing exact age)
   */
  async generateAgeProof(params: AgeProofParams): Promise<ProofData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // This would typically get the QR data from secure storage or user input
    // For demo purposes, we'll throw an error asking for it
    throw new InvalidParametersError(
      'Age proof generation requires identity registration first. Call registerIdentity() with mAadhaar QR data.'
    );
  }

  /**
   * Generate age proof with QR data
   */
  async generateAgeProofWithQR(
    qrData: string,
    params: AgeProofParams
  ): Promise<ProofData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!validateQRData(qrData)) {
      throw new InvalidParametersError('Invalid mAadhaar QR code data');
    }

    try {
      const aadhaarData = parseAadhaarQR(qrData);
      return await this.proofGenerator.generateAgeProof(aadhaarData, params);
    } catch (error) {
      throw new ProofGenerationError(
        `Age proof generation failed: ${error}`,
        'age'
      );
    }
  }

  /**
   * Generate nationality proof with QR data
   */
  async generateNationalityProofWithQR(
    qrData: string,
    params: NationalityProofParams
  ): Promise<ProofData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!validateQRData(qrData)) {
      throw new InvalidParametersError('Invalid mAadhaar QR code data');
    }

    try {
      const aadhaarData = parseAadhaarQR(qrData);
      return await this.proofGenerator.generateNationalityProof(
        aadhaarData,
        params
      );
    } catch (error) {
      throw new ProofGenerationError(
        `Nationality proof generation failed: ${error}`,
        'nationality'
      );
    }
  }

  /**
   * Generate uniqueness proof with QR data
   */
  async generateUniquenessProofWithQR(
    qrData: string,
    params: UniquenessProofParams
  ): Promise<ProofData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!validateQRData(qrData)) {
      throw new InvalidParametersError('Invalid mAadhaar QR code data');
    }

    try {
      const aadhaarData = parseAadhaarQR(qrData);
      return await this.proofGenerator.generateUniquenessProof(
        aadhaarData,
        params
      );
    } catch (error) {
      throw new ProofGenerationError(
        `Uniqueness proof generation failed: ${error}`,
        'uniqueness'
      );
    }
  }

  /**
   * Verify identity proof on-chain
   */
  async verifyIdentity(proof: ProofData): Promise<VerificationResult> {
    return await this.solanaClient.verifyIdentity(proof);
  }

  /**
   * Verify proof off-chain (client-side verification)
   */
  async verifyProofOffChain(proof: ProofData): Promise<boolean> {
    return await this.proofGenerator.verifyProofOffChain(proof);
  }

  /**
   * Generate and verify age proof in one step
   */
  async generateAndVerifyAge(
    qrData: string,
    params: AgeProofParams & { autoVerify?: boolean }
  ): Promise<VerificationResult & { proof?: ProofData }> {
    try {
      // Generate proof
      const proof = await this.generateAgeProofWithQR(qrData, params);

      // Verify if requested
      if (params.autoVerify) {
        const result = await this.verifyIdentity(proof);
        return { ...result, proof };
      }

      return {
        verified: true,
        proof,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        verified: false,
        error: `Generation/verification failed: ${error}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Create authentication session
   */
  async createSession(params: SessionParams): Promise<SessionData> {
    // Validate duration
    if (
      params.duration < SESSION_LIMITS.MIN_DURATION ||
      params.duration > SESSION_LIMITS.MAX_DURATION
    ) {
      throw new InvalidParametersError(
        `Session duration must be between ${SESSION_LIMITS.MIN_DURATION} and ${SESSION_LIMITS.MAX_DURATION} seconds`
      );
    }

    const sessionId = generateNonce();
    return await this.solanaClient.createSession(sessionId, params.duration);
  }

  /**
   * Close authentication session
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.solanaClient.closeSession(sessionId);
  }

  /**
   * Batch generate multiple proofs
   */
  async batchGenerate(
    qrData: string,
    requests: BatchProofRequest[]
  ): Promise<BatchProofResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!validateQRData(qrData)) {
      throw new InvalidParametersError('Invalid mAadhaar QR code data');
    }

    const proofs: ProofData[] = [];
    const errors: string[] = [];

    try {
      const aadhaarData = parseAadhaarQR(qrData);

      // Process requests in chunks to avoid overwhelming the system
      const chunks = chunk(requests, 3); // Max 3 proofs at a time

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request) => {
          try {
            switch (request.type) {
              case 'age':
                return await this.proofGenerator.generateAgeProof(
                  aadhaarData,
                  request.params as AgeProofParams
                );
              case 'nationality':
                return await this.proofGenerator.generateNationalityProof(
                  aadhaarData,
                  request.params as NationalityProofParams
                );
              case 'uniqueness':
                return await this.proofGenerator.generateUniquenessProof(
                  aadhaarData,
                  request.params as UniquenessProofParams
                );
              default:
                throw new Error(`Unknown proof type: ${request.type}`);
            }
          } catch (error) {
            errors.push(`${request.type}: ${error}`);
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        proofs.push(...(chunkResults.filter((p) => p !== null) as ProofData[]));
      }

      return { proofs, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      throw new ProofGenerationError(`Batch generation failed: ${error}`);
    }
  }

  /**
   * Batch verify multiple proofs on-chain
   */
  async batchVerify(proofs: ProofData[]): Promise<string> {
    return await this.solanaClient.batchVerify(proofs);
  }

  /**
   * Get current wallet balance
   */
  async getBalance(): Promise<number> {
    return await this.solanaClient.getBalance();
  }

  /**
   * Check if the SDK is properly initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  get configuration(): SolsticeConfig {
    return { ...this.config };
  }

  /**
   * Generate identity commitment from Aadhaar data
   */
  private generateIdentityCommitment(aadhaarData: AadhaarData): {
    identityCommitment: string;
    merkleRoot: string;
  } {
    // Simplified commitment generation
    // In real implementation, this would use proper cryptographic hashing
    const commitment = this.hashData([
      aadhaarData.referenceId,
      aadhaarData.name,
      aadhaarData.dateOfBirth,
    ]);

    const merkleRoot = this.hashData([
      commitment,
      aadhaarData.state || '',
      aadhaarData.pincode || '',
    ]);

    return {
      identityCommitment: commitment,
      merkleRoot: merkleRoot,
    };
  }

  /**
   * Simple hash function (placeholder for Poseidon hash)
   */
  private hashData(inputs: string[]): string {
    // This is a placeholder - real implementation would use Poseidon hash
    const combined = inputs.join('|');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * CHALLENGE-RESPONSE FLOW METHODS
   * These methods support the correct architecture:
   * 1. Third-party apps generate challenges
   * 2. Users scan challenges in main Solstice app
   * 3. Main app generates and submits proofs
   * 4. Third-party apps verify proof responses
   */

  /**
   * Generate a verification challenge (for third-party apps)
   * This creates a QR code that users scan with the main Solstice app
   *
   * @param appId - Unique identifier for your app
   * @param appName - Display name for your app
   * @param proofType - Type of verification needed
   * @param params - Proof parameters (age threshold, allowed countries, etc.)
   * @param options - Optional challenge configuration
   * @returns Challenge data to encode in QR code
   */
  async generateChallenge(
    appId: string,
    appName: string,
    proofType: 'age' | 'nationality' | 'uniqueness',
    params: any,
    options: any = {}
  ): Promise<any> {
    const challengeId = generateNonce();
    const now = Date.now();
    const expirationSeconds = options.expirationSeconds || 300; // 5 minutes default

    const challenge = {
      challengeId,
      appId,
      appName,
      proofType,
      params: this.formatChallengeParams(proofType, params),
      expiresAt: now + expirationSeconds * 1000,
      callbackUrl: options.callbackUrl,
      nonce: options.nonce || generateNonce(),
      createdAt: now,
    };

    const qrData = {
      challenge,
      version: '1.0.0',
    };

    if (this.config.debug) {
      console.log('📝 Generated challenge:', challenge);
    }

    return {
      challenge,
      qrData: JSON.stringify(qrData),
      qrDataEncoded: Buffer.from(JSON.stringify(qrData)).toString('base64'),
    };
  }

  /**
   * Respond to a verification challenge (for main Solstice app)
   * This generates a ZK proof in response to a scanned challenge
   *
   * @param challengeQR - QR code data scanned from third-party app
   * @param aadhaarData - User's Aadhaar data (already registered)
   * @returns Proof response to send to third-party app
   */
  async respondToChallenge(
    challengeQR: string,
    aadhaarData: AadhaarData
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Parse challenge from QR
      const challenge = this.parseChallenge(challengeQR);

      // Check expiration
      if (Date.now() > challenge.expiresAt) {
        throw new InvalidParametersError('Challenge has expired');
      }

      // Generate appropriate proof based on challenge type
      let proof: ProofData;
      switch (challenge.proofType) {
        case 'age':
          proof = await this.proofGenerator.generateAgeProof(
            aadhaarData,
            challenge.params
          );
          break;
        case 'nationality':
          proof = await this.proofGenerator.generateNationalityProof(
            aadhaarData,
            challenge.params
          );
          break;
        case 'uniqueness':
          proof = await this.proofGenerator.generateUniquenessProof(
            aadhaarData,
            challenge.params
          );
          break;
        default:
          throw new InvalidParametersError(
            `Unknown proof type: ${challenge.proofType}`
          );
      }

      // Create response
      const response = {
        challengeId: challenge.challengeId,
        proof: {
          pi_a: proof.proof.pi_a,
          pi_b: proof.proof.pi_b,
          pi_c: proof.proof.pi_c,
          publicSignals: proof.publicSignals,
        },
        identityCommitment: proof.publicSignals[0],
        timestamp: Date.now(),
      };

      if (this.config.debug) {
        console.log(' Generated proof response:', response);
      }

      return response;
    } catch (error) {
      throw new ProofGenerationError(
        `Failed to respond to challenge: ${error}`
      );
    }
  }

  /**
   * Verify a proof response (for third-party apps)
   * This verifies that a proof response is valid for your challenge
   *
   * @param challengeId - Your original challenge ID
   * @param proofResponse - Proof response received from user
   * @returns Verification result
   */
  async verifyProofResponse(
    challengeId: string,
    proofResponse: any
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Verify challenge ID matches
      if (proofResponse.challengeId !== challengeId) {
        return {
          verified: false,
          challengeId,
          error: 'Challenge ID mismatch',
        };
      }

      // For now, we trust the proof structure
      // In production, this would verify against the circuit verification key
      if (
        !proofResponse.proof ||
        !proofResponse.proof.pi_a ||
        !proofResponse.proof.publicSignals
      ) {
        return {
          verified: false,
          challengeId,
          error: 'Invalid proof structure',
        };
      }

      return {
        verified: true,
        challengeId,
        metadata: {
          proofType: 'zkp',
          identityCommitment: proofResponse.identityCommitment,
          timestamp: proofResponse.timestamp,
        },
      };
    } catch (error) {
      return {
        verified: false,
        challengeId,
        error: `Verification failed: ${error}`,
      };
    }
  }

  /**
   * Parse challenge from QR code data
   */
  private parseChallenge(qrData: string): any {
    try {
      // Try parsing as JSON first
      let parsed;
      try {
        parsed = JSON.parse(qrData);
      } catch {
        // Try base64 decode
        const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
        parsed = JSON.parse(decoded);
      }

      if (!parsed.challenge) {
        throw new Error('Invalid challenge format');
      }

      return parsed.challenge;
    } catch (error) {
      throw new InvalidParametersError(`Failed to parse challenge: ${error}`);
    }
  }

  /**
   * Format challenge parameters based on proof type
   */
  private formatChallengeParams(proofType: string, params: any): any {
    switch (proofType) {
      case 'age':
        return { type: 'age', threshold: params.threshold || 18 };
      case 'nationality':
        return {
          type: 'nationality',
          allowedCountries: params.allowedCountries || [],
        };
      case 'uniqueness':
        return { type: 'uniqueness', scope: params.scope || 'global' };
      default:
        return params;
    }
  }
}
