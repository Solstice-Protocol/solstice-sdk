/**
 * Complete DeFi Integration Example with Enhanced Solstice SDK
 * 
 * This example demonstrates a full implementation of the enhanced SDK
 * for a DeFi platform requiring age verification, nationality checks,
 * and Sybil resistance through uniqueness proofs.
 */

import { EnhancedSolsticeSDK, VerificationResult } from '../src/index';
import { PublicKey } from '@solana/web3.js';

// Initialize Enhanced SDK
const sdk = new EnhancedSolsticeSDK({
  endpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz'),
  network: 'devnet',
  debug: true
});

/**
 * Complete onboarding flow for DeFi platform
 */
export async function onboardUserToDeFi(
  walletAdapter: any,
  qrData: string,
  daoId: string = 'defi-protocol-v1'
): Promise<{
  success: boolean;
  userData?: {
    name: string;
    ageVerified: boolean;
    nationalityVerified: boolean;
    uniquenessVerified: boolean;
    sessionId: string;
  };
  error?: string;
  metrics?: {
    totalTime: number;
    proofGenerationTime: number;
    verificationTime: number;
  };
}> {
  console.log(' Starting enhanced DeFi onboarding...');
  const startTime = Date.now();

  try {
    // Step 1: Initialize SDK and connect wallet
    await sdk.initialize();
    await sdk.connect(walletAdapter);
    console.log(' SDK initialized and wallet connected');

    // Step 2: Complete verification workflow
    const requirements = {
      age: { threshold: 18 },
      nationality: { allowedCountries: ['IN', 'US', 'CA', 'UK', 'AU'] },
      uniqueness: { daoId, epochId: '2024-10' }
    };

    const proofStartTime = Date.now();
    const workflow = await sdk.completeVerificationWorkflow(qrData, requirements);
    const proofEndTime = Date.now();

    const verificationStartTime = Date.now();
    // Verifications are already done in the workflow
    const verificationEndTime = Date.now();

    // Step 3: Check if all verifications passed
    const allVerified = Object.values(workflow.verifications).every(v => v.verified);

    if (!allVerified) {
      const failed = Object.entries(workflow.verifications)
        .filter(([_, v]) => !v.verified)
        .map(([type, _]) => type);
      
      return {
        success: false,
        error: `Verification failed for: ${failed.join(', ')}`
      };
    }

    const totalTime = Date.now() - startTime;

    console.log(' DeFi onboarding completed successfully!');

    return {
      success: true,
      userData: {
        name: workflow.aadhaarData.name,
        ageVerified: !!workflow.verifications.age?.verified,
        nationalityVerified: !!workflow.verifications.nationality?.verified,
        uniquenessVerified: !!workflow.verifications.uniqueness?.verified,
        sessionId: workflow.session?.sessionId || ''
      },
      metrics: {
        totalTime,
        proofGenerationTime: proofEndTime - proofStartTime,
        verificationTime: verificationEndTime - verificationStartTime
      }
    };

  } catch (error) {
    console.error('❌ DeFi onboarding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Quick age verification for simple use cases
 */
export async function quickAgeVerification(
  walletAdapter: any,
  qrData: string,
  minAge: number = 18
): Promise<{
  verified: boolean;
  userAge?: number;
  transactionSignature?: string;
  error?: string;
}> {
  try {
    console.log(`🔍 Quick age verification for ${minAge}+ requirement...`);

    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Generate age proof
    const ageProof = await sdk.generateAgeProofFromQR(qrData, {
      threshold: minAge
    });

    // Verify on-chain
    const verification = await sdk.verifyIdentity(ageProof);

    return {
      verified: verification.verified,
      transactionSignature: verification.signature
    };

  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Age verification failed'
    };
  }
}

/**
 * Batch user onboarding for multiple users
 */
export async function batchOnboardUsers(
  walletAdapter: any,
  userQRCodes: { userId: string; qrData: string }[],
  requirements: {
    age?: { threshold: number };
    nationality?: { allowedCountries: string[] };
    uniqueness?: { daoId: string };
  }
): Promise<{
  successful: Array<{
    userId: string;
    name: string;
    verifications: string[];
    sessionId: string;
  }>;
  failed: Array<{
    userId: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTime: number;
  };
}> {
  console.log(`📦 Starting batch onboarding for ${userQRCodes.length} users...`);
  const startTime = Date.now();

  await sdk.initialize();
  await sdk.connect(walletAdapter);

  const successful: any[] = [];
  const failed: any[] = [];

  // Process users in chunks to avoid overwhelming the system
  const chunkSize = 5;
  for (let i = 0; i < userQRCodes.length; i += chunkSize) {
    const chunk = userQRCodes.slice(i, i + chunkSize);
    
    const chunkPromises = chunk.map(async ({ userId, qrData }) => {
      try {
        const workflow = await sdk.completeVerificationWorkflow(qrData, requirements);
        
        const allVerified = Object.values(workflow.verifications).every(v => v.verified);
        
        if (allVerified) {
          successful.push({
            userId,
            name: workflow.aadhaarData.name,
            verifications: Object.keys(workflow.verifications),
            sessionId: workflow.session?.sessionId || ''
          });
        } else {
          const failedVerifications = Object.entries(workflow.verifications)
            .filter(([_, v]) => !v.verified)
            .map(([type, _]) => type);
          
          failed.push({
            userId,
            error: `Verification failed for: ${failedVerifications.join(', ')}`
          });
        }
      } catch (error) {
        failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(chunkPromises);
    
    // Small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const totalTime = Date.now() - startTime;

  console.log(` Batch onboarding completed: ${successful.length}/${userQRCodes.length} successful`);

  return {
    successful,
    failed,
    summary: {
      total: userQRCodes.length,
      successful: successful.length,
      failed: failed.length,
      totalTime
    }
  };
}

/**
 * Gaming platform integration with Sybil resistance
 */
export async function onboardGamingUser(
  walletAdapter: any,
  qrData: string,
  gameId: string,
  tournamentId?: string
): Promise<{
  success: boolean;
  playerData?: {
    playerId: string;
    displayName: string;
    isUnique: boolean;
    eligibleForTournament: boolean;
  };
  error?: string;
}> {
  try {
    console.log('🎮 Gaming platform onboarding with Sybil resistance...');

    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // For gaming, we primarily need uniqueness + optional age verification
    const requirements = {
      uniqueness: { 
        daoId: `game-${gameId}`,
        epochId: tournamentId || 'general'
      },
      // Optional: age verification for mature content
      ...(tournamentId && { age: { threshold: 13 } })
    };

    const workflow = await sdk.completeVerificationWorkflow(qrData, requirements);
    
    const uniquenessVerified = workflow.verifications.uniqueness?.verified || false;
    const ageVerified = workflow.verifications.age?.verified || true; // Default true if not required

    if (!uniquenessVerified) {
      return {
        success: false,
        error: 'Uniqueness verification failed - possible Sybil account detected'
      };
    }

    // Generate player ID from nullifier for privacy
    const playerId = workflow.proofs.uniqueness?.metadata?.nullifier?.slice(0, 16) || 
                    workflow.aadhaarData.referenceId.slice(0, 8);

    return {
      success: true,
      playerData: {
        playerId,
        displayName: `Player_${playerId}`,
        isUnique: uniquenessVerified,
        eligibleForTournament: ageVerified
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gaming onboarding failed'
    };
  }
}

/**
 * DAO governance participation verification
 */
export async function verifyDAOEligibility(
  walletAdapter: any,
  qrData: string,
  daoId: string,
  proposalId: string
): Promise<{
  eligible: boolean;
  votingPower: number;
  uniqueVoter: boolean;
  citizenshipVerified: boolean;
  error?: string;
}> {
  try {
    console.log('🗳️ DAO governance eligibility verification...');

    await sdk.initialize();
    await sdk.connect(walletAdapter);

    const requirements = {
      nationality: { allowedCountries: ['IN'] }, // DAO specific requirements
      uniqueness: { 
        daoId,
        epochId: `proposal-${proposalId}`
      }
    };

    const workflow = await sdk.completeVerificationWorkflow(qrData, requirements);
    
    const citizenshipVerified = workflow.verifications.nationality?.verified || false;
    const uniqueVoter = workflow.verifications.uniqueness?.verified || false;
    
    // Calculate voting power based on verifications
    let votingPower = 0;
    if (citizenshipVerified) votingPower += 1;
    if (uniqueVoter) votingPower += 1;

    return {
      eligible: citizenshipVerified && uniqueVoter,
      votingPower,
      uniqueVoter,
      citizenshipVerified
    };

  } catch (error) {
    return {
      eligible: false,
      votingPower: 0,
      uniqueVoter: false,
      citizenshipVerified: false,
      error: error instanceof Error ? error.message : 'DAO verification failed'
    };
  }
}

/**
 * Social media platform verification with anti-bot measures
 */
export async function verifySocialMediaUser(
  walletAdapter: any,
  qrData: string,
  platformId: string
): Promise<{
  verified: boolean;
  isHuman: boolean;
  trustScore: number;
  displayName: string;
  error?: string;
}> {
  try {
    console.log('📱 Social media verification with anti-bot measures...');

    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // For social media, uniqueness is key to prevent bot accounts
    const requirements = {
      uniqueness: { 
        daoId: `social-${platformId}`,
        epochId: 'global'
      }
    };

    const workflow = await sdk.completeVerificationWorkflow(qrData, requirements);

    const isHuman = workflow.verifications.uniqueness?.verified || false;

    // Calculate trust score based on verifications (simplified without private access)
    const trustScore = isHuman ? 100 : 0;

    // Generate privacy-preserving display name
    const nameHash = workflow.aadhaarData.name.split(' ')[0]; // First name only
    const displayName = `${nameHash}_verified`;

    return {
      verified: isHuman,
      isHuman,
      trustScore,
      displayName
    };

  } catch (error) {
    return {
      verified: false,
      isHuman: false,
      trustScore: 0,
      displayName: 'Unknown',
      error: error instanceof Error ? error.message : 'Social verification failed'
    };
  }
}

// Export SDK instance for direct use
export { sdk as enhancedSDK };