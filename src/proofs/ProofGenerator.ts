import { 
  ProofData, 
  AgeProofParams, 
  NationalityProofParams, 
  UniquenessProofParams,
  CircuitConfig,
  AadhaarData
} from '../types';
import { 
  ProofGenerationError, 
  CircuitLoadError,
  InvalidParametersError 
} from '../utils/errors';
import { 
  DEFAULT_CIRCUIT_PATHS, 
  PROOF_TIMEOUTS,
  SUPPORTED_COUNTRIES 
} from '../utils/constants';
import { 
  validateAgeThreshold,
  validateNationalityParams,
  validateDaoId,
  generateNonce,
  dateToTimestamp,
  calculateAge
} from '../utils/helpers';

/**
 * Handles zero-knowledge proof generation for identity verification
 */
export class ProofGenerator {
  private circuits: Map<string, any> = new Map();
  private poseidon: any = null;
  private config: CircuitConfig;

  constructor(config: CircuitConfig = {}) {
    this.config = {
      age: config.age || DEFAULT_CIRCUIT_PATHS.age,
      nationality: config.nationality || DEFAULT_CIRCUIT_PATHS.nationality,
      uniqueness: config.uniqueness || DEFAULT_CIRCUIT_PATHS.uniqueness
    };
  }

  /**
   * Initialize the proof generator (loads circuits)
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Poseidon hash function (mock for now)
      this.poseidon = this.mockPoseidon;
      
      // Preload all circuits
      await Promise.all([
        this.loadCircuit('age'),
        this.loadCircuit('nationality'),
        this.loadCircuit('uniqueness')
      ]);

      console.log('🔧 ProofGenerator initialized successfully');
    } catch (error) {
      throw new CircuitLoadError(`Failed to initialize ProofGenerator: ${error}`);
    }
  }

  /**
   * Mock Poseidon hash function
   */
  private mockPoseidon(inputs: any[]): any {
    // Simple hash simulation - in real implementation use circomlibjs
    const hash = inputs.reduce((acc, val) => acc + val.toString(), '');
    return { toString: () => hash.substring(0, 64) };
  }

  /**
   * Generates age proof (proves age > threshold without revealing exact age)
   */
  async generateAgeProof(
    aadhaarData: AadhaarData,
    params: AgeProofParams
  ): Promise<ProofData> {
    validateAgeThreshold(params.threshold);

    console.log(' Generating age proof...');
    
    try {
      const circuit = await this.getCircuit('age');
      const nonce = params.nonce || generateNonce();
      
      // Calculate age
      const age = calculateAge(aadhaarData.dateOfBirth);
      if (age < params.threshold) {
        throw new InvalidParametersError(`User age (${age}) does not meet threshold (${params.threshold})`);
      }

      // Generate identity nullifier
      const identityNullifier = this.poseidon([
        aadhaarData.referenceId,
        aadhaarData.name,
        aadhaarData.dateOfBirth
      ]);

      // Prepare circuit inputs
      const inputs: any = {
        identity_nullifier: identityNullifier.toString(),
        date_of_birth: dateToTimestamp(aadhaarData.dateOfBirth).toString(),
        nonce: nonce,
        age_threshold: params.threshold.toString(),
        current_timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate proof with timeout
      const { proof, publicSignals } = await this.generateProofWithTimeout(
        circuit,
        inputs,
        PROOF_TIMEOUTS.age
      );

      console.log(' Age proof generated successfully');

      return {
        proof,
        publicSignals,
        attributeType: 'age',
        metadata: {
          threshold: params.threshold,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      throw new ProofGenerationError(`Age proof generation failed: ${error}`, 'age');
    }
  }

  /**
   * Generates nationality proof (proves citizenship without revealing identity)
   */
  async generateNationalityProof(
    aadhaarData: AadhaarData,
    params: NationalityProofParams
  ): Promise<ProofData> {
    validateNationalityParams(params.allowedCountries);

    console.log('🌍 Generating nationality proof...');

    try {
      const circuit = await this.getCircuit('nationality');
      const nonce = params.nonce || generateNonce();
      
      // Get country code from state
      const userCountry = this.getCountryCode(aadhaarData.state || '');
      
      // Verify user's country is in allowed list
      if (!params.allowedCountries.includes(userCountry)) {
        throw new InvalidParametersError('User nationality not in allowed countries list');
      }

      // Generate identity nullifier
      const identityNullifier = this.poseidon([
        aadhaarData.referenceId,
        aadhaarData.name,
        aadhaarData.dateOfBirth
      ]);

      // Prepare circuit inputs
      const inputs: any = {
        identity_nullifier: identityNullifier.toString(),
        user_nationality: this.countryToIndex(userCountry).toString(),
        nonce: nonce,
        allowed_countries: params.allowedCountries.map(c => this.countryToIndex(c).toString())
      };

      // Generate proof with timeout
      const { proof, publicSignals } = await this.generateProofWithTimeout(
        circuit,
        inputs,
        PROOF_TIMEOUTS.nationality
      );

      console.log(' Nationality proof generated successfully');

      return {
        proof,
        publicSignals,
        attributeType: 'nationality',
        metadata: {
          countries: params.allowedCountries,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      throw new ProofGenerationError(`Nationality proof generation failed: ${error}`, 'nationality');
    }
  }

  /**
   * Generates uniqueness proof (prevents Sybil attacks)
   */
  async generateUniquenessProof(
    aadhaarData: AadhaarData,
    params: UniquenessProofParams
  ): Promise<ProofData> {
    validateDaoId(params.daoId);

    console.log('🔒 Generating uniqueness proof...');

    try {
      const circuit = await this.getCircuit('uniqueness');
      const nonce = params.nonce || generateNonce();
      const epochId = params.epochId || 'global';

      // Generate nullifier hash for uniqueness
      const nullifierHash = this.poseidon([
        aadhaarData.referenceId,
        params.daoId,
        epochId
      ]);

      // Generate identity nullifier
      const identityNullifier = this.poseidon([
        aadhaarData.referenceId,
        aadhaarData.name,
        aadhaarData.dateOfBirth
      ]);

      // Prepare circuit inputs
      const inputs: any = {
        identity_nullifier: identityNullifier.toString(),
        aadhaar_number_hash: this.poseidon([aadhaarData.referenceId]).toString(),
        nonce: nonce,
        dao_id: this.stringToFieldElement(params.daoId),
        epoch_id: this.stringToFieldElement(epochId),
        nullifier_hash: nullifierHash.toString()
      };

      // Generate proof with timeout
      const { proof, publicSignals } = await this.generateProofWithTimeout(
        circuit,
        inputs,
        PROOF_TIMEOUTS.uniqueness
      );

      console.log(' Uniqueness proof generated successfully');

      return {
        proof,
        publicSignals,
        attributeType: 'uniqueness',
        metadata: {
          daoId: params.daoId,
          epochId: epochId,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      throw new ProofGenerationError(`Uniqueness proof generation failed: ${error}`, 'uniqueness');
    }
  }

  /**
   * Verifies a proof off-chain (client-side verification)
   */
  async verifyProofOffChain(proofData: ProofData): Promise<boolean> {
    try {
      // Mock verification for development
      console.log('🔍 Verifying proof off-chain...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real implementation, use snarkjs.groth16.verify
      return true;
    } catch (error) {
      console.error('Off-chain verification failed:', error);
      return false;
    }
  }

  /**
   * Load circuit artifacts
   */
  private async loadCircuit(circuitType: string): Promise<void> {
    try {
      const circuitConfig = this.config[circuitType as keyof CircuitConfig];
      if (!circuitConfig) {
        throw new CircuitLoadError(`Circuit configuration not found for ${circuitType}`);
      }

      // Mock circuit loading for development
      const circuit = {
        wasmPath: circuitConfig.wasmPath,
        zkeyPath: circuitConfig.zkeyPath,
        vkeyPath: circuitConfig.vkeyPath,
        loaded: true,
        vKey: null
      };

      this.circuits.set(circuitType, circuit);
      console.log(`🔧 Loaded ${circuitType} circuit (mock)`);
    } catch (error) {
      throw new CircuitLoadError(`Failed to load ${circuitType} circuit: ${error}`);
    }
  }

  /**
   * Get a loaded circuit by type
   */
  private async getCircuit(circuitType: string): Promise<any> {
    let circuit = this.circuits.get(circuitType);
    if (!circuit) {
      await this.loadCircuit(circuitType);
      circuit = this.circuits.get(circuitType);
    }
    
    if (!circuit) {
      throw new CircuitLoadError(`Failed to load ${circuitType} circuit`);
    }
    
    return circuit;
  }

  /**
   * Generate proof with timeout wrapper
   */
  private async generateProofWithTimeout(
    circuit: any,
    inputs: any,
    timeoutMs: number
  ): Promise<{ proof: any; publicSignals: string[] }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new ProofGenerationError(`Proof generation timed out after ${timeoutMs}ms`, 'timeout'));
      }, timeoutMs);

      // Mock proof generation for development
      this.mockGenerateProof(circuit, inputs)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Mock proof generation
   */
  private async mockGenerateProof(circuit: any, inputs: any): Promise<{ proof: any; publicSignals: string[] }> {
    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Return mock proof structure compatible with Groth16
    return {
      proof: {
        pi_a: ["0x1234567890abcdef", "0x0987654321fedcba"],
        pi_b: [["0x1111222233334444", "0x5555666677778888"], ["0x9999aaaabbbbcccc", "0xddddeeeeffffaaaa"]],
        pi_c: ["0xabcdef1234567890", "0xfedcba0987654321"],
        protocol: "groth16",
        curve: "bn128"
      },
      publicSignals: [
        generateNonce().substring(0, 32),
        Date.now().toString(),
        inputs.age_threshold || inputs.dao_id || generateNonce().substring(0, 16)
      ]
    };
  }

  /**
   * Get country code from Indian state
   */
  private getCountryCode(state: string): string {
    return 'IN';
  }

  /**
   * Convert country code to numeric index
   */
  private countryToIndex(countryCode: string): number {
    const index = SUPPORTED_COUNTRIES.indexOf(countryCode as any);
    return index >= 0 ? index : 0;
  }

  /**
   * Convert string to field element for circuits
   */
  private stringToFieldElement(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }
}
