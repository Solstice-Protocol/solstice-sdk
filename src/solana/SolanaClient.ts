import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  Keypair
} from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-adapter-base';
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import {
  IdentityStatus,
  ProofData,
  SessionData,
  VerificationResult
} from '../types';
import {
  WalletNotConnectedError,
  VerificationError,
  IdentityNotFoundError,
  NetworkError
} from '../utils/errors';
import { ATTRIBUTE_TYPES } from '../utils/constants';
import { formatProofForVerification, retry } from '../utils/helpers';

/**
 * Handles all Solana blockchain interactions for identity verification
 */
export class SolanaClient {
  private connection: Connection;
  private programId: PublicKey;
  private wallet: WalletAdapter | null = null;
  private program: Program | null = null;

  constructor(endpoint: string, programId: PublicKey) {
    this.connection = new Connection(endpoint, 'confirmed');
    this.programId = programId;
  }

  /**
   * Connect wallet and initialize program
   */
  async connect(wallet: WalletAdapter): Promise<void> {
    if (!wallet.connected) {
      throw new WalletNotConnectedError();
    }

    this.wallet = wallet;
    
    // Initialize Anchor provider and program
    const provider = new AnchorProvider(
      this.connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
    
    // Load program IDL (in real implementation, this would be loaded from the blockchain)
    const idl = await this.loadProgramIDL();
    this.program = new Program(idl, this.programId, provider);

    console.log('🔗 Connected to Solana wallet and program');
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.wallet = null;
    this.program = null;
    console.log('🔌 Disconnected from Solana wallet');
  }

  /**
   * Register a new identity on the blockchain
   */
  async registerIdentity(
    identityCommitment: string,
    merkleRoot: string
  ): Promise<string> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      // Derive PDA for identity account
      const [identityPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('identity'),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );

      // Derive PDA for registry account
      const [registryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('registry')],
        this.programId
      );

      const tx = await this.program.methods
        .registerIdentity(
          Array.from(Buffer.from(identityCommitment, 'hex')),
          Array.from(Buffer.from(merkleRoot, 'hex'))
        )
        .accounts({
          identity: identityPda,
          registry: registryPda,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        })
        .rpc();

      console.log('✅ Identity registered:', tx);
      return tx;

    } catch (error) {
      throw new NetworkError(`Failed to register identity: ${error}`);
    }
  }

  /**
   * Verify identity with zero-knowledge proof
   */
  async verifyIdentity(proofData: ProofData): Promise<VerificationResult> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      // Format proof for blockchain verification
      const { proof, publicInputs } = formatProofForVerification(proofData.proof);

      // Derive PDA for identity account
      const [identityPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('identity'),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );

      // Get attribute type as bitmap
      const attributeType = this.getAttributeTypeBitmap(proofData.attributeType);

      const tx = await this.program.methods
        .verifyIdentity(
          Array.from(proof),
          Array.from(publicInputs),
          attributeType
        )
        .accounts({
          identity: identityPda,
          user: this.wallet.publicKey,
          clock: SYSVAR_CLOCK_PUBKEY
        })
        .rpc();

      console.log('✅ Identity verified:', tx);

      return {
        verified: true,
        signature: tx,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Verification failed:', error);
      return {
        verified: false,
        error: `Verification failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get identity status from blockchain
   */
  async getIdentityStatus(): Promise<IdentityStatus> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      // Derive PDA for identity account
      const [identityPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('identity'),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );

      const identityAccount = await this.program.account.identity.fetch(identityPda) as any;

      return {
        exists: true,
        isVerified: Boolean(identityAccount.isVerified),
        owner: identityAccount.owner as PublicKey,
        identityCommitment: Buffer.from(identityAccount.identityCommitment || []).toString('hex'),
        merkleRoot: Buffer.from(identityAccount.merkleRoot || []).toString('hex'),
        attributesVerified: Number(identityAccount.attributesVerified || 0),
        verificationTimestamp: identityAccount.verificationTimestamp?.toNumber?.() || 0
      };

    } catch (error) {
      if (error instanceof Error && error.message?.includes('Account does not exist')) {
        return {
          exists: false,
          isVerified: false,
          owner: this.wallet.publicKey,
          identityCommitment: '',
          merkleRoot: '',
          attributesVerified: 0,
          verificationTimestamp: 0
        };
      }
      throw new IdentityNotFoundError(`Failed to fetch identity: ${error}`);
    }
  }

  /**
   * Create authentication session
   */
  async createSession(sessionId: string, duration: number): Promise<SessionData> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      // Derive PDA for session account
      const [sessionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('session'),
          this.wallet.publicKey.toBuffer(),
          Buffer.from(sessionId, 'hex')
        ],
        this.programId
      );

      // Derive PDA for identity account
      const [identityPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('identity'),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );

      const expiryTimestamp = Math.floor(Date.now() / 1000) + duration;

      const tx = await this.program.methods
        .createSession(
          Array.from(Buffer.from(sessionId, 'hex')),
          new BN(expiryTimestamp)
        )
        .accounts({
          session: sessionPda,
          identity: identityPda,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY
        })
        .rpc();

      console.log('✅ Session created:', tx);

      return {
        sessionId,
        user: this.wallet.publicKey,
        createdAt: Math.floor(Date.now() / 1000),
        expiresAt: expiryTimestamp,
        isActive: true
      };

    } catch (error) {
      throw new NetworkError(`Failed to create session: ${error}`);
    }
  }

  /**
   * Close authentication session
   */
  async closeSession(sessionId: string): Promise<string> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      // Derive PDA for session account
      const [sessionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('session'),
          this.wallet.publicKey.toBuffer(),
          Buffer.from(sessionId, 'hex')
        ],
        this.programId
      );

      const tx = await this.program.methods
        .closeSession()
        .accounts({
          session: sessionPda,
          user: this.wallet.publicKey
        })
        .rpc();

      console.log('✅ Session closed:', tx);
      return tx;

    } catch (error) {
      throw new NetworkError(`Failed to close session: ${error}`);
    }
  }

  /**
   * Update identity commitment
   */
  async updateIdentity(
    newIdentityCommitment: string,
    newMerkleRoot: string
  ): Promise<string> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      // Derive PDA for identity account
      const [identityPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('identity'),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );

      const tx = await this.program.methods
        .updateIdentity(
          Array.from(Buffer.from(newIdentityCommitment, 'hex')),
          Array.from(Buffer.from(newMerkleRoot, 'hex'))
        )
        .accounts({
          identity: identityPda,
          user: this.wallet.publicKey
        })
        .rpc();

      console.log('✅ Identity updated:', tx);
      return tx;

    } catch (error) {
      throw new NetworkError(`Failed to update identity: ${error}`);
    }
  }

  /**
   * Batch verify multiple proofs in single transaction
   */
  async batchVerify(proofs: ProofData[]): Promise<string> {
    if (!this.wallet?.publicKey || !this.program) {
      throw new WalletNotConnectedError();
    }

    try {
      const tx = new Transaction();

      for (const proofData of proofs) {
        const { proof, publicInputs } = formatProofForVerification(proofData.proof);
        const attributeType = this.getAttributeTypeBitmap(proofData.attributeType);

        // Derive PDA for identity account
        const [identityPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('identity'),
            this.wallet.publicKey.toBuffer()
          ],
          this.programId
        );

        const instruction = await this.program.methods
          .verifyIdentity(
            Array.from(proof),
            Array.from(publicInputs),
            attributeType
          )
          .accounts({
            identity: identityPda,
            user: this.wallet.publicKey,
            clock: SYSVAR_CLOCK_PUBKEY
          })
          .instruction();

        tx.add(instruction);
      }

      const signature = await this.sendTransaction(tx);
      console.log('✅ Batch verification completed:', signature);
      return signature;

    } catch (error) {
      throw new VerificationError(`Batch verification failed: ${error}`);
    }
  }

  /**
   * Check if account exists on blockchain
   */
  async accountExists(publicKey: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      return accountInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    if (!this.wallet?.publicKey) {
      throw new WalletNotConnectedError();
    }

    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / web3.LAMPORTS_PER_SOL;
    } catch (error) {
      throw new NetworkError(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Send transaction with retry logic
   */
  private async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this.wallet?.publicKey) {
      throw new WalletNotConnectedError();
    }

    if (!this.wallet?.publicKey) {
      throw new WalletNotConnectedError();
    }

    return await retry(async () => {
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet!.publicKey!;

      // Use sendTransaction which is the standard method in modern wallet adapters
      return await this.wallet!.sendTransaction(transaction, this.connection);
    });
  }

  /**
   * Convert attribute type to bitmap flag
   */
  private getAttributeTypeBitmap(attributeType: string): number {
    switch (attributeType) {
      case 'age':
        return ATTRIBUTE_TYPES.AGE;
      case 'nationality':
        return ATTRIBUTE_TYPES.NATIONALITY;
      case 'uniqueness':
        return ATTRIBUTE_TYPES.UNIQUENESS;
      default:
        throw new Error(`Unknown attribute type: ${attributeType}`);
    }
  }

  /**
   * Load program IDL (placeholder - in real implementation, fetch from blockchain)
   */
  private async loadProgramIDL(): Promise<any> {
    // This is a simplified IDL structure
    // In real implementation, this would be fetched from the blockchain or bundled
    return {
      version: "0.1.0",
      name: "solstice_contracts",
      instructions: [
        {
          name: "initialize",
          accounts: [
            { name: "registry", isMut: true, isSigner: false },
            { name: "authority", isMut: true, isSigner: true },
            { name: "systemProgram", isMut: false, isSigner: false }
          ],
          args: []
        },
        {
          name: "registerIdentity",
          accounts: [
            { name: "identity", isMut: true, isSigner: false },
            { name: "registry", isMut: true, isSigner: false },
            { name: "user", isMut: true, isSigner: true },
            { name: "systemProgram", isMut: false, isSigner: false },
            { name: "rent", isMut: false, isSigner: false }
          ],
          args: [
            { name: "identityCommitment", type: { array: ["u8", 32] } },
            { name: "merkleRoot", type: { array: ["u8", 32] } }
          ]
        },
        {
          name: "verifyIdentity",
          accounts: [
            { name: "identity", isMut: true, isSigner: false },
            { name: "user", isMut: false, isSigner: true },
            { name: "clock", isMut: false, isSigner: false }
          ],
          args: [
            { name: "proof", type: { vec: "u8" } },
            { name: "publicInputs", type: { vec: "u8" } },
            { name: "attributeType", type: "u8" }
          ]
        }
      ],
      accounts: [
        {
          name: "identity",
          type: {
            kind: "struct",
            fields: [
              { name: "owner", type: "publicKey" },
              { name: "identityCommitment", type: { array: ["u8", 32] } },
              { name: "merkleRoot", type: { array: ["u8", 32] } },
              { name: "isVerified", type: "bool" },
              { name: "verificationTimestamp", type: "i64" },
              { name: "attributesVerified", type: "u8" },
              { name: "bump", type: "u8" }
            ]
          }
        }
      ]
    };
  }
}