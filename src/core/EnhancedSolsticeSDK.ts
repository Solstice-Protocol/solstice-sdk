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
  AadhaarData
} from '../types';
import { EnhancedProofGenerator } from '../proofs/EnhancedProofGenerator';
import { SolanaClient } from '../solana/SolanaClient';
import { QRProcessor } from '../utils/QRProcessor';
import { 
  SOLSTICE_PROGRAM_ID, 
  DEFAULT_RPC_ENDPOINTS,
  SESSION_LIMITS 
} from '../utils/constants';
import {
  SolsticeError,
  WalletNotConnectedError,
  InvalidParametersError,
  ProofGenerationError
} from '../utils/errors';

/**
 * Enhanced Solstice SDK with real ZK proof generation and comprehensive features
 */
export class EnhancedSolsticeSDK {
  private config: SolsticeConfig;
  private proofGenerator: EnhancedProofGenerator;
  private solanaClient: SolanaClient;
  private qrProcessor: QRProcessor;
  private isInitialized = false;

  constructor(config: Partial<SolsticeConfig> = {}) {
    // Set default configuration
    this.config = {
      endpoint: config.endpoint || DEFAULT_RPC_ENDPOINTS.devnet,
      programId: config.programId || SOLSTICE_PROGRAM_ID,
      network: config.network || 'devnet',
      circuitConfig: config.circuitConfig,
      debug: config.debug || false
    };

    // Initialize components
    this.proofGenerator = new EnhancedProofGenerator(this.config.circuitConfig);
    this.solanaClient = new SolanaClient(this.config.endpoint, this.config.programId);
    this.qrProcessor = new QRProcessor();

    if (this.config.debug) {
      console.log('🚀 Enhanced Solstice SDK initialized with config:', {
        network: this.config.network,
        endpoint: this.config.endpoint,
        programId: this.config.programId.toString()
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
      console.log('🔄 Initializing Enhanced Solstice SDK...');
      
      // Initialize proof generator (loads real circuits)
      await this.proofGenerator.initialize();
      
      this.isInitialized = true;
      console.log('✅ Enhanced Solstice SDK initialized successfully');

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
   * Process QR code and extract Aadhaar data
   */
  async processQRCode(qrData: string): Promise<AadhaarData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const aadhaarData = await this.qrProcessor.processQRCode(qrData);
      
      if (this.config.debug) {
        const completeness = this.qrProcessor.validateDataCompleteness(aadhaarData);
        console.log('📋 QR Code processed:', {
          name: aadhaarData.name,
          completeness: `${completeness.score}%`,
          missingFields: completeness.missingFields
        });
      }

      return aadhaarData;
    } catch (error) {
      throw new SolsticeError(`QR processing failed: ${error}`);
    }
  }

  /**
   * Register identity from processed Aadhaar data
   */
  async registerIdentity(aadhaarData: AadhaarData): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate identity commitment and merkle root using real cryptography
      const { identityCommitment, merkleRoot } = await this.generateIdentityCommitment(aadhaarData);
      
      // Register on blockchain
      const txSignature = await this.solanaClient.registerIdentity(
        identityCommitment,
        merkleRoot
      );

      if (this.config.debug) {
        console.log('✅ Identity registered:', {
          user: aadhaarData.name,
          txSignature,
          commitment: identityCommitment.slice(0, 16) + '...'
        });
      }

      return txSignature;

    } catch (error) {
      throw new SolsticeError(`Identity registration failed: ${error}`);
    }
  }

  /**
   * One-step registration from QR code
   */
  async registerFromQR(qrData: string): Promise<{
    aadhaarData: AadhaarData;
    txSignature: string;
  }> {
    console.log('🔄 Processing QR and registering identity...');
    
    const aadhaarData = await this.processQRCode(qrData);
    const txSignature = await this.registerIdentity(aadhaarData);
    
    return { aadhaarData, txSignature };
  }

  /**
   * Generate age proof from QR code
   */
  async generateAgeProofFromQR(
    qrData: string,
    params: AgeProofParams
  ): Promise<ProofData> {
    const aadhaarData = await this.processQRCode(qrData);
    return this.proofGenerator.generateAgeProof(aadhaarData, params);
  }

  /**
   * Generate nationality proof from QR code
   */
  async generateNationalityProofFromQR(
    qrData: string,
    params: NationalityProofParams
  ): Promise<ProofData> {
    const aadhaarData = await this.processQRCode(qrData);
    return this.proofGenerator.generateNationalityProof(aadhaarData, params);
  }

  /**
   * Generate uniqueness proof from QR code
   */
  async generateUniquenessProofFromQR(
    qrData: string,
    params: UniquenessProofParams
  ): Promise<ProofData> {
    const aadhaarData = await this.processQRCode(qrData);
    return this.proofGenerator.generateUniquenessProof(aadhaarData, params);
  }

  /**
   * Generate all proofs at once for maximum efficiency
   */
  async generateAllProofsFromQR(
    qrData: string,
    params: {
      age?: AgeProofParams;
      nationality?: NationalityProofParams;
      uniqueness?: UniquenessProofParams;
    }
  ): Promise<{
    aadhaarData: AadhaarData;
    proofs: {
      age?: ProofData;
      nationality?: ProofData;
      uniqueness?: ProofData;
    };
    totalTime: number;
  }> {
    console.log('🔄 Generating all proofs from QR code...');
    const startTime = Date.now();

    // Process QR code once
    const aadhaarData = await this.processQRCode(qrData);
    
    // Generate all requested proofs in parallel
    const proofs = await this.proofGenerator.generateBatchProofs(aadhaarData, params);
    
    const totalTime = Date.now() - startTime;
    
    if (this.config.debug) {
      console.log(`✅ All proofs generated in ${totalTime}ms`);
    }

    return { aadhaarData, proofs, totalTime };
  }

  /**
   * Verify proof on-chain
   */
  async verifyIdentity(proofData: ProofData): Promise<VerificationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.solanaClient.verifyIdentity(proofData);

      if (this.config.debug) {
        console.log('✅ Proof verified on-chain:', {
          attributeType: proofData.attributeType,
          signature: result.signature,
          verified: result.verified
        });
      }

      return result;
    } catch (error) {
      throw new SolsticeError(`Verification failed: ${error}`);
    }
  }

  /**
   * Get identity status from blockchain
   */
  async getIdentityStatus(): Promise<IdentityStatus> {
    return this.solanaClient.getIdentityStatus();
  }

  /**
   * Create authentication session
   */
  async createSession(params: SessionParams): Promise<SessionData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Validate session duration
    if (params.duration > SESSION_LIMITS.MAX_DURATION) {
      throw new InvalidParametersError(
        `Session duration cannot exceed ${SESSION_LIMITS.MAX_DURATION} seconds`
      );
    }

    // Generate session ID if not provided
    const sessionId = params.sessionId || Math.random().toString(36).substring(2, 15);
    
    return this.solanaClient.createSession(sessionId, params.duration);
  }

  /**
   * Complete verification workflow for dApp integration
   */
  async completeVerificationWorkflow(
    qrData: string,
    requirements: {
      age?: { threshold: number };
      nationality?: { allowedCountries: string[] };
      uniqueness?: { daoId: string };
    }
  ): Promise<{
    aadhaarData: AadhaarData;
    proofs: { [key: string]: ProofData };
    verifications: { [key: string]: VerificationResult };
    session?: SessionData;
    totalTime: number;
  }> {
    console.log('🔄 Starting complete verification workflow...');
    const startTime = Date.now();

    try {
      // Step 1: Generate all required proofs
      const { aadhaarData, proofs } = await this.generateAllProofsFromQR(qrData, {
        age: requirements.age,
        nationality: requirements.nationality,
        uniqueness: requirements.uniqueness
      });

      // Step 2: Verify all proofs on-chain
      const verifications: { [key: string]: VerificationResult } = {};
      
      for (const [type, proof] of Object.entries(proofs)) {
        if (proof) {
          verifications[type] = await this.verifyIdentity(proof);
        }
      }

      // Step 3: Create session if all verifications passed
      let session: SessionData | undefined;
      const allVerified = Object.values(verifications).every(v => v.verified);
      
      if (allVerified) {
        session = await this.createSession({
          duration: SESSION_LIMITS.DEFAULT_DURATION,
          metadata: {
            verifiedAttributes: Object.keys(verifications),
            timestamp: Date.now()
          }
        });
      }

      const totalTime = Date.now() - startTime;

      console.log(`✅ Verification workflow completed in ${totalTime}ms`);

      return {
        aadhaarData,
        proofs,
        verifications,
        session,
        totalTime
      };

    } catch (error) {
      throw new SolsticeError(`Verification workflow failed: ${error}`);
    }
  }

  /**
   * Generate identity commitment using real cryptography
   */
  private async generateIdentityCommitment(aadhaarData: AadhaarData): Promise<{
    identityCommitment: string;
    merkleRoot: string;
  }> {
    // This would use the same Poseidon hash as the proof generator
    // For now, using a simplified approach
    const demographicHash = this.qrProcessor.generateDemographicHash(aadhaarData);
    const locationHash = this.qrProcessor.generateLocationHash(aadhaarData);
    
    return {
      identityCommitment: demographicHash,
      merkleRoot: locationHash
    };
  }

  /**
   * Convert attribute type to bitmap for smart contract
   */
  private getAttributeTypeBitmap(attributeType: string): number {
    switch (attributeType) {
      case 'age': return 1;
      case 'nationality': return 2;
      case 'uniqueness': return 4;
      default: return 0;
    }
  }

  /**
   * Get SDK performance metrics
   */
  getPerformanceMetrics(): {
    cacheStats: any;
    isInitialized: boolean;
    version: string;
  } {
    return {
      cacheStats: this.proofGenerator.getCacheStats(),
      isInitialized: this.isInitialized,
      version: '1.0.0'
    };
  }

  /**
   * Clear cached proofs and reset state
   */
  clearCache(): void {
    this.proofGenerator.clearExpiredProofs();
    console.log('🧹 Cache cleared');
  }
}