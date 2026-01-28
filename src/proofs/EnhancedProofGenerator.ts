import * as snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import {
  ProofData,
  AgeProofParams,
  NationalityProofParams,
  UniquenessProofParams,
  CircuitConfig,
  AadhaarData,
  CircuitArtifacts,
  ProofCache,
} from '../types';
import {
  ProofGenerationError,
  CircuitLoadError,
  InvalidParametersError,
} from '../utils/errors';
import {
  DEFAULT_CIRCUIT_PATHS,
  PROOF_TIMEOUTS,
  SUPPORTED_COUNTRIES,
  CIRCUIT_CACHE_TTL,
} from '../utils/constants';
import {
  validateAgeThreshold,
  validateNationalityParams,
  validateDaoId,
  generateNonce,
  dateToTimestamp,
  calculateAge,
  hashInputs,
} from '../utils/helpers';

/**
 * Enhanced ProofGenerator with real snarkjs integration and optimization
 */
export class EnhancedProofGenerator {
  private circuits: Map<string, any> = new Map();
  private wasmCache: Map<string, ArrayBuffer> = new Map();
  private zkeyCache: Map<string, ArrayBuffer> = new Map();
  private poseidon: any = null;
  private config: CircuitConfig;
  private proofCache: Map<string, ProofCache> = new Map();

  constructor(config: CircuitConfig = {}) {
    this.config = {
      age: config.age || DEFAULT_CIRCUIT_PATHS.age,
      nationality: config.nationality || DEFAULT_CIRCUIT_PATHS.nationality,
      uniqueness: config.uniqueness || DEFAULT_CIRCUIT_PATHS.uniqueness,
    };
  }

  /**
   * Initialize the proof generator with real circuit loading
   */
  async initialize(): Promise<void> {
    try {
      console.log(' Initializing Enhanced ProofGenerator...');

      // Initialize Poseidon hash function
      this.poseidon = await buildPoseidon();
      console.log(' Poseidon hash function loaded');

      // Preload all circuits in parallel
      const circuitPromises = Object.keys(this.config).map(
        async (circuitName) => {
          return this.loadCircuitArtifacts(circuitName as keyof CircuitConfig);
        }
      );

      await Promise.all(circuitPromises);
      console.log(' All circuits loaded successfully');

      // Initialize proof cache from IndexedDB if available
      if (typeof window !== 'undefined' && window.indexedDB) {
        await this.initializeProofCache();
      }

      console.log(' Enhanced ProofGenerator initialized');
    } catch (error) {
      throw new CircuitLoadError(
        `Failed to initialize Enhanced ProofGenerator: ${error}`
      );
    }
  }

  /**
   * Load circuit artifacts (WASM and zkey files)
   */
  private async loadCircuitArtifacts(
    circuitName: keyof CircuitConfig
  ): Promise<void> {
    const artifacts = this.config[circuitName];
    if (!artifacts) {
      throw new CircuitLoadError(
        `Circuit configuration not found: ${circuitName}`
      );
    }

    try {
      console.log(` Loading ${circuitName} circuit artifacts...`);

      // Load WASM file
      const wasmResponse = await fetch(artifacts.wasmPath);
      if (!wasmResponse.ok) {
        throw new Error(`Failed to load WASM: ${wasmResponse.statusText}`);
      }
      const wasmBuffer = await wasmResponse.arrayBuffer();
      this.wasmCache.set(circuitName, wasmBuffer);

      // Load zkey file
      const zkeyResponse = await fetch(artifacts.zkeyPath);
      if (!zkeyResponse.ok) {
        throw new Error(`Failed to load zkey: ${zkeyResponse.statusText}`);
      }
      const zkeyBuffer = await zkeyResponse.arrayBuffer();
      this.zkeyCache.set(circuitName, zkeyBuffer);

      console.log(` ${circuitName} circuit loaded successfully`);
    } catch (error) {
      throw new CircuitLoadError(
        `Failed to load ${circuitName} circuit: ${error}`
      );
    }
  }

  /**
   * Initialize proof cache using IndexedDB
   */
  private async initializeProofCache(): Promise<void> {
    try {
      // Check if there's cached proof data
      const cachedProofs = await this.getCachedProofs();
      for (const [key, proof] of cachedProofs) {
        if (proof.expiresAt > Date.now()) {
          this.proofCache.set(key, proof);
        }
      }
      console.log(`📋 Loaded ${this.proofCache.size} cached proofs`);
    } catch (error) {
      console.warn('Failed to initialize proof cache:', error);
    }
  }

  /**
   * Enhanced age proof generation with real snarkjs
   */
  async generateAgeProof(
    aadhaarData: AadhaarData,
    params: AgeProofParams
  ): Promise<ProofData> {
    validateAgeThreshold(params.threshold);

    // Check cache first
    const cacheKey = this.generateCacheKey('age', aadhaarData, params);
    const cachedProof = this.proofCache.get(cacheKey);
    if (cachedProof && cachedProof.expiresAt > Date.now()) {
      console.log(' Using cached age proof');
      return cachedProof.proofData;
    }

    console.log(' Generating age proof with snarkjs...');

    try {
      const nonce = params.nonce || generateNonce();

      // Calculate age
      const age = calculateAge(aadhaarData.dateOfBirth);
      if (age < params.threshold) {
        throw new InvalidParametersError(
          `User age (${age}) does not meet threshold (${params.threshold})`
        );
      }

      // Generate identity commitment using Poseidon
      const identityCommitment = this.poseidon([
        aadhaarData.referenceId,
        aadhaarData.name,
        aadhaarData.dateOfBirth,
        nonce,
      ]);

      // Prepare circuit inputs
      const inputs = {
        minAge: params.threshold.toString(),
        isAboveAge: '1', // Boolean: 1 if above age
        commitmentHash: this.poseidon.F.toString(identityCommitment),
        age: age.toString(),
        identitySecret: nonce,
      };

      // Generate proof with timeout
      const { proof, publicSignals } = await this.generateProofWithSnarkjs(
        'age',
        inputs,
        PROOF_TIMEOUTS.age
      );

      const proofData: ProofData = {
        proof,
        publicSignals,
        attributeType: 'age',
        metadata: {
          threshold: params.threshold,
          timestamp: Date.now(),
          identityCommitment: this.poseidon.F.toString(identityCommitment),
        },
      };

      // Cache the proof
      await this.cacheProof(cacheKey, proofData);

      console.log(' Age proof generated and cached successfully');
      return proofData;
    } catch (error) {
      throw new ProofGenerationError(
        `Age proof generation failed: ${error}`,
        'age'
      );
    }
  }

  /**
   * Enhanced nationality proof generation
   */
  async generateNationalityProof(
    aadhaarData: AadhaarData,
    params: NationalityProofParams
  ): Promise<ProofData> {
    validateNationalityParams(params.allowedCountries);

    // Check cache first
    const cacheKey = this.generateCacheKey('nationality', aadhaarData, params);
    const cachedProof = this.proofCache.get(cacheKey);
    if (cachedProof && cachedProof.expiresAt > Date.now()) {
      console.log(' Using cached nationality proof');
      return cachedProof.proofData;
    }

    console.log('🌍 Generating nationality proof with snarkjs...');

    try {
      const nonce = params.nonce || generateNonce();

      // Extract country from state/address (simplified for India = 91)
      const countryCode = 91; // India country code

      // Check if country is allowed
      const isAllowed =
        params.allowedCountries.includes('IN') ||
        params.allowedCountries.includes('91');

      if (!isAllowed) {
        throw new InvalidParametersError(
          `Country not in allowed list: ${countryCode}`
        );
      }

      // Generate identity commitment
      const identityCommitment = this.poseidon([
        aadhaarData.referenceId,
        aadhaarData.address,
        countryCode,
        nonce,
      ]);

      // Prepare circuit inputs
      const inputs = {
        allowedCountry: '91', // India
        isFromCountry: '1', // Boolean: 1 if from allowed country
        commitmentHash: this.poseidon.F.toString(identityCommitment),
        countryCode: countryCode.toString(),
        identitySecret: nonce,
      };

      // Generate proof
      const { proof, publicSignals } = await this.generateProofWithSnarkjs(
        'nationality',
        inputs,
        PROOF_TIMEOUTS.nationality
      );

      const proofData: ProofData = {
        proof,
        publicSignals,
        attributeType: 'nationality',
        metadata: {
          countries: params.allowedCountries,
          timestamp: Date.now(),
          identityCommitment: this.poseidon.F.toString(identityCommitment),
        },
      };

      // Cache the proof
      await this.cacheProof(cacheKey, proofData);

      console.log(' Nationality proof generated and cached successfully');
      return proofData;
    } catch (error) {
      throw new ProofGenerationError(
        `Nationality proof generation failed: ${error}`,
        'nationality'
      );
    }
  }

  /**
   * Enhanced uniqueness proof generation
   */
  async generateUniquenessProof(
    aadhaarData: AadhaarData,
    params: UniquenessProofParams
  ): Promise<ProofData> {
    // Check cache first
    const cacheKey = this.generateCacheKey('uniqueness', aadhaarData, params);
    const cachedProof = this.proofCache.get(cacheKey);
    if (cachedProof && cachedProof.expiresAt > Date.now()) {
      console.log(' Using cached uniqueness proof');
      return cachedProof.proofData;
    }

    console.log(' Generating uniqueness proof with snarkjs...');

    try {
      const nonce = params.nonce || generateNonce();

      // Generate nullifier for Sybil resistance
      const nullifier = this.poseidon([
        aadhaarData.referenceId, // Unique Aadhaar reference
        params.daoId || 'global', // DAO/App specific identifier
        params.epochId || '1', // Epoch for time-based uniqueness
      ]);

      // Generate identity commitment
      const identityCommitment = this.poseidon([
        aadhaarData.referenceId,
        nonce,
      ]);

      // Generate Aadhaar hash (without revealing actual number)
      const aadhaarHash = this.poseidon([aadhaarData.referenceId]);

      // Generate merkle root (simplified - in production would be full tree)
      const merkleRoot = this.poseidon([identityCommitment, nullifier]);

      // Prepare circuit inputs
      const inputs = {
        nullifier: this.poseidon.F.toString(nullifier),
        merkleRoot: this.poseidon.F.toString(merkleRoot),
        identitySecret: nonce,
        aadhaarHash: this.poseidon.F.toString(aadhaarHash),
      };

      // Generate proof
      const { proof, publicSignals } = await this.generateProofWithSnarkjs(
        'uniqueness',
        inputs,
        PROOF_TIMEOUTS.uniqueness
      );

      const proofData: ProofData = {
        proof,
        publicSignals,
        attributeType: 'uniqueness',
        metadata: {
          daoId: params.daoId,
          epochId: params.epochId,
          timestamp: Date.now(),
          nullifier: this.poseidon.F.toString(nullifier),
          identityCommitment: this.poseidon.F.toString(identityCommitment),
        },
      };

      // Cache the proof
      await this.cacheProof(cacheKey, proofData);

      console.log(' Uniqueness proof generated and cached successfully');
      return proofData;
    } catch (error) {
      throw new ProofGenerationError(
        `Uniqueness proof generation failed: ${error}`,
        'uniqueness'
      );
    }
  }

  /**
   * Generate proof using snarkjs with timeout
   */
  private async generateProofWithSnarkjs(
    circuitName: string,
    inputs: any,
    timeout: number
  ): Promise<{ proof: any; publicSignals: string[] }> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Proof generation timeout (${timeout}ms) for ${circuitName}`
          )
        );
      }, timeout);

      try {
        const wasmBuffer = this.wasmCache.get(circuitName);
        const zkeyBuffer = this.zkeyCache.get(circuitName);

        if (!wasmBuffer || !zkeyBuffer) {
          throw new Error(`Circuit artifacts not loaded for ${circuitName}`);
        }

        console.log(`⚡ Generating ${circuitName} proof with snarkjs...`);
        const startTime = Date.now();

        // Generate proof using snarkjs
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
          inputs,
          wasmBuffer,
          zkeyBuffer
        );

        const endTime = Date.now();
        console.log(
          ` ${circuitName} proof generated in ${endTime - startTime}ms`
        );

        clearTimeout(timeoutId);
        resolve({ proof, publicSignals });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Generate cache key for proof caching
   */
  private generateCacheKey(
    proofType: string,
    aadhaarData: AadhaarData,
    params: any
  ): string {
    const dataHash = hashInputs([
      aadhaarData.referenceId,
      proofType,
      JSON.stringify(params),
    ]);
    return `${proofType}_${dataHash}`;
  }

  /**
   * Cache proof with expiration
   */
  private async cacheProof(key: string, proofData: ProofData): Promise<void> {
    const cacheEntry: ProofCache = {
      proofData,
      createdAt: Date.now(),
      expiresAt: Date.now() + CIRCUIT_CACHE_TTL,
    };

    this.proofCache.set(key, cacheEntry);

    // Persist to IndexedDB if available
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        await this.persistProofToIndexedDB(key, cacheEntry);
      } catch (error) {
        console.warn('Failed to persist proof to IndexedDB:', error);
      }
    }
  }

  /**
   * Get cached proofs from IndexedDB
   */
  private async getCachedProofs(): Promise<Map<string, ProofCache>> {
    // Implementation would use IndexedDB to retrieve cached proofs
    // For now, return empty map
    return new Map();
  }

  /**
   * Persist proof to IndexedDB for offline access
   */
  private async persistProofToIndexedDB(
    key: string,
    proof: ProofCache
  ): Promise<void> {
    // Implementation would use IndexedDB to store proofs
    // This is a placeholder for the actual implementation
    console.log(`💾 Persisting proof ${key} to IndexedDB`);
  }

  /**
   * Batch generate multiple proofs optimally
   */
  async generateBatchProofs(
    aadhaarData: AadhaarData,
    requests: {
      age?: AgeProofParams;
      nationality?: NationalityProofParams;
      uniqueness?: UniquenessProofParams;
    }
  ): Promise<{
    age?: ProofData;
    nationality?: ProofData;
    uniqueness?: ProofData;
  }> {
    console.log(' Generating batch proofs...');
    const startTime = Date.now();

    const proofPromises: Promise<any>[] = [];
    const results: any = {};

    if (requests.age) {
      proofPromises.push(
        this.generateAgeProof(aadhaarData, requests.age).then((proof) => {
          results.age = proof;
        })
      );
    }

    if (requests.nationality) {
      proofPromises.push(
        this.generateNationalityProof(aadhaarData, requests.nationality).then(
          (proof) => {
            results.nationality = proof;
          }
        )
      );
    }

    if (requests.uniqueness) {
      proofPromises.push(
        this.generateUniquenessProof(aadhaarData, requests.uniqueness).then(
          (proof) => {
            results.uniqueness = proof;
          }
        )
      );
    }

    await Promise.all(proofPromises);

    const endTime = Date.now();
    console.log(` Batch proofs generated in ${endTime - startTime}ms`);

    return results;
  }

  /**
   * Clear expired proofs from cache
   */
  clearExpiredProofs(): void {
    const now = Date.now();
    for (const [key, proof] of this.proofCache.entries()) {
      if (proof.expiresAt <= now) {
        this.proofCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalProofs: number;
    expiredProofs: number;
    cacheHitRate: number;
  } {
    const now = Date.now();
    let expired = 0;

    for (const proof of this.proofCache.values()) {
      if (proof.expiresAt <= now) {
        expired++;
      }
    }

    return {
      totalProofs: this.proofCache.size,
      expiredProofs: expired,
      cacheHitRate: 0, // Would track this in real implementation
    };
  }
}
