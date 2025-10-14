/**
 * Example: Sybil Resistance for DAO Governance
 * 
 * This example shows how to use uniqueness proofs to prevent
 * Sybil attacks in DAO governance and voting systems.
 */

import { SolsticeSDK } from '@solsticeprotocol/sdk';
import { PublicKey } from '@solana/web3.js';

// Initialize SDK
const sdk = new SolsticeSDK({
  endpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz'),
  debug: true
});

/**
 * Verify unique participation in DAO governance
 */
export async function verifyUniqueVoter(
  walletAdapter: any,
  qrData: string,
  proposalId: string,
  daoId: string = 'solstice-dao'
): Promise<{
  canVote: boolean;
  nullifierHash?: string;
  error?: string;
}> {
  try {
    console.log('🗳️ Starting Sybil resistance verification...');

    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Ensure identity is registered
    const identityStatus = await sdk.getIdentityStatus();
    if (!identityStatus.exists) {
      console.log('📝 Registering identity for voting...');
      await sdk.registerIdentity(qrData);
    }

    // Generate uniqueness proof for this specific proposal
    console.log(' Generating uniqueness proof...');
    const uniquenessProof = await sdk.generateUniquenessProofWithQR(qrData, {
      daoId: daoId,
      epochId: `proposal-${proposalId}`,
      nonce: Date.now().toString()
    });

    // Verify proof on-chain
    const verification = await sdk.verifyIdentity(uniquenessProof);

    if (verification.verified) {
      console.log(' Unique voter verified');
      return {
        canVote: true,
        nullifierHash: uniquenessProof.publicSignals[0] // First public signal is nullifier hash
      };
    } else {
      return {
        canVote: false,
        error: 'Uniqueness verification failed - may have already voted'
      };
    }

  } catch (error) {
    console.error('Sybil resistance verification failed:', error);
    return {
      canVote: false,
      error: `Verification failed: ${error}`
    };
  }
}

/**
 * Complete governance participation flow
 */
export async function participateInGovernance(
  walletAdapter: any,
  qrData: string,
  proposal: {
    id: string;
    title: string;
    vote: 'yes' | 'no' | 'abstain';
  },
  daoConfig: {
    daoId: string;
    minimumAge?: number;
    allowedCountries?: string[];
  }
): Promise<{
  success: boolean;
  voteRecorded?: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Step 1: Register identity if needed
    const identityStatus = await sdk.getIdentityStatus();
    if (!identityStatus.exists) {
      await sdk.registerIdentity(qrData);
    }

    // Step 2: Generate comprehensive verification proofs
    const proofRequests = [
      {
        type: 'uniqueness' as const,
        params: {
          daoId: daoConfig.daoId,
          epochId: `proposal-${proposal.id}`
        }
      }
    ];

    // Add age verification if required
    if (daoConfig.minimumAge) {
      proofRequests.push({
        type: 'age' as const,
        params: {
          threshold: daoConfig.minimumAge,
          includeNationality: false
        }
      });
    }

    // Add nationality verification if required
    if (daoConfig.allowedCountries) {
      proofRequests.push({
        type: 'nationality' as const,
        params: {
          allowedCountries: daoConfig.allowedCountries,
          includeAge: false
        }
      });
    }

    // Generate all required proofs
    console.log(' Generating governance proofs...');
    const proofs = await sdk.batchGenerate(qrData, proofRequests);

    if (proofs.errors && proofs.errors.length > 0) {
      return {
        success: false,
        error: `Proof generation failed: ${proofs.errors.join(', ')}`
      };
    }

    // Verify all proofs on-chain
    console.log('⛓️ Verifying governance eligibility...');
    const txSignature = await sdk.batchVerify(proofs.proofs);

    // Create governance session
    const session = await sdk.createSession({
      duration: 3600, // 1 hour voting session
      requiredAttributes: ['uniqueness'],
      metadata: {
        daoId: daoConfig.daoId,
        proposalId: proposal.id,
        vote: proposal.vote
      }
    });

    console.log(' Governance participation verified');
    console.log(`📋 Verification TX: ${txSignature}`);
    console.log(`🗳️ Vote: ${proposal.vote} on proposal ${proposal.id}`);

    return {
      success: true,
      voteRecorded: true,
      sessionId: session.sessionId
    };

  } catch (error) {
    console.error('Governance participation failed:', error);
    return {
      success: false,
      error: `Participation failed: ${error}`
    };
  }
}

/**
 * Verify membership eligibility for exclusive DAO
 */
export async function verifyExclusiveMembership(
  walletAdapter: any,
  qrData: string,
  membershipTier: 'basic' | 'premium' | 'whale'
): Promise<{
  eligible: boolean;
  membershipId?: string;
  benefits?: string[];
  error?: string;
}> {
  const tierRequirements = {
    basic: { minAge: 18, countries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'JP', 'SG', 'IN'] },
    premium: { minAge: 21, countries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR'] },
    whale: { minAge: 25, countries: ['US', 'UK', 'DE'] }
  };

  const tierBenefits = {
    basic: ['Governance voting', 'Community access'],
    premium: ['Priority proposals', 'Early access', 'Premium support'],
    whale: ['VIP governance', 'Private channels', 'Direct team access', 'Revenue sharing']
  };

  try {
    const requirements = tierRequirements[membershipTier];
    
    const result = await participateInGovernance(
      walletAdapter,
      qrData,
      {
        id: `membership-${membershipTier}`,
        title: `${membershipTier.toUpperCase()} Membership Application`,
        vote: 'yes'
      },
      {
        daoId: `exclusive-dao-${membershipTier}`,
        minimumAge: requirements.minAge,
        allowedCountries: requirements.countries
      }
    );

    if (result.success) {
      return {
        eligible: true,
        membershipId: result.sessionId,
        benefits: tierBenefits[membershipTier]
      };
    } else {
      return {
        eligible: false,
        error: result.error
      };
    }

  } catch (error) {
    return {
      eligible: false,
      error: `Membership verification failed: ${error}`
    };
  }
}

/**
 * Anti-Sybil airdrop verification
 */
export async function verifyAirdropEligibility(
  walletAdapter: any,
  qrData: string,
  airdropConfig: {
    campaignId: string;
    maxClaim: number;
    eligibilityRequirements: {
      minAge?: number;
      allowedCountries?: string[];
      uniqueParticipation: boolean;
    };
  }
): Promise<{
  eligible: boolean;
  claimAmount?: number;
  alreadyClaimed?: boolean;
  error?: string;
}> {
  try {
    console.log('🪂 Starting airdrop eligibility verification...');

    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Register identity if needed
    const identityStatus = await sdk.getIdentityStatus();
    if (!identityStatus.exists) {
      await sdk.registerIdentity(qrData);
    }

    // Generate uniqueness proof for airdrop campaign
    const uniquenessProof = await sdk.generateUniquenessProofWithQR(qrData, {
      daoId: `airdrop-${airdropConfig.campaignId}`,
      epochId: 'claim-2024',
      nonce: airdropConfig.campaignId
    });

    // Additional verification if required
    const additionalProofs = [];

    if (airdropConfig.eligibilityRequirements.minAge) {
      const ageProof = await sdk.generateAgeProofWithQR(qrData, {
        threshold: airdropConfig.eligibilityRequirements.minAge,
        includeNationality: false
      });
      additionalProofs.push(ageProof);
    }

    if (airdropConfig.eligibilityRequirements.allowedCountries) {
      const nationalityProof = await sdk.generateNationalityProofWithQR(qrData, {
        allowedCountries: airdropConfig.eligibilityRequirements.allowedCountries,
        includeAge: false
      });
      additionalProofs.push(nationalityProof);
    }

    // Verify all proofs
    const allProofs = [uniquenessProof, ...additionalProofs];
    const txSignature = await sdk.batchVerify(allProofs);

    console.log(' Airdrop eligibility verified');
    console.log(`🎁 Eligible for ${airdropConfig.maxClaim} tokens`);

    return {
      eligible: true,
      claimAmount: airdropConfig.maxClaim,
      alreadyClaimed: false
    };

  } catch (error) {
    console.error('Airdrop verification failed:', error);
    
    // Check if error indicates already claimed
    if (error.toString().includes('nullifier')) {
      return {
        eligible: false,
        alreadyClaimed: true,
        error: 'Airdrop already claimed by this identity'
      };
    }

    return {
      eligible: false,
      error: `Verification failed: ${error}`
    };
  }
}

/**
 * React hook example for DAO governance
 */
export const useDAOGovernance = () => {
  const verifyAndVote = async (
    wallet: any,
    qrCode: string,
    proposalId: string,
    vote: 'yes' | 'no' | 'abstain'
  ) => {
    const result = await participateInGovernance(
      wallet,
      qrCode,
      { id: proposalId, title: `Proposal ${proposalId}`, vote },
      { daoId: 'solstice-governance', minimumAge: 18 }
    );

    return result;
  };

  const checkMembership = async (
    wallet: any,
    qrCode: string,
    tier: 'basic' | 'premium' | 'whale'
  ) => {
    return await verifyExclusiveMembership(wallet, qrCode, tier);
  };

  const claimAirdrop = async (
    wallet: any,
    qrCode: string,
    campaignId: string
  ) => {
    return await verifyAirdropEligibility(wallet, qrCode, {
      campaignId,
      maxClaim: 1000,
      eligibilityRequirements: {
        minAge: 18,
        allowedCountries: ['US', 'CA', 'UK', 'AU', 'IN'],
        uniqueParticipation: true
      }
    });
  };

  return {
    verifyAndVote,
    checkMembership,
    claimAirdrop
  };
};