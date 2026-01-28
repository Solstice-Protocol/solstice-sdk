/**
 * Example: Basic Age Verification for DeFi Platform
 * 
 * This example shows how to integrate Solstice SDK for age verification
 * in a DeFi application that requires users to be 18+ years old.
 */

import { SolsticeSDK } from '@solsticeprotocol/sdk';
import { PublicKey } from '@solana/web3.js';

// Initialize SDK
const sdk = new SolsticeSDK({
  endpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz'),
  network: 'devnet',
  debug: true
});

/**
 * Age verification flow for DeFi onboarding
 */
export async function verifyUserAgeForDeFi(
  walletAdapter: any,
  qrData: string,
  minimumAge: number = 18
): Promise<boolean> {
  try {
    console.log(' Starting DeFi age verification...');

    // Step 1: Initialize SDK
    await sdk.initialize();
    console.log(' SDK initialized');

    // Step 2: Connect wallet
    await sdk.connect(walletAdapter);
    console.log(' Wallet connected');

    // Step 3: Check if identity exists
    const identityStatus = await sdk.getIdentityStatus();

    if (!identityStatus.exists) {
      console.log('📝 Registering new identity...');
      await sdk.registerIdentity(qrData);
      console.log(' Identity registered');
    }

    // Step 4: Generate age proof
    console.log(` Generating age proof for ${minimumAge}+ verification...`);
    const ageProof = await sdk.generateAgeProofWithQR(qrData, {
      threshold: minimumAge,
      includeNationality: false
    });
    console.log(' Age proof generated');

    // Step 5: Verify proof on-chain
    console.log('⛓️ Verifying proof on Solana blockchain...');
    const verification = await sdk.verifyIdentity(ageProof);

    if (verification.verified) {
      console.log(' Age verification successful!');
      console.log(`📋 Transaction: ${verification.signature}`);
      return true;
    } else {
      console.log(' Age verification failed:', verification.error);
      return false;
    }

  } catch (error) {
    console.error(' DeFi age verification error:', error);
    return false;
  }
}

/**
 * Complete DeFi onboarding with age verification
 */
export async function onboardUserToDeFi(
  walletAdapter: any,
  qrData: string,
  userMetadata: {
    email?: string;
    username?: string;
  }
): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    // Verify age first
    const isAgeVerified = await verifyUserAgeForDeFi(walletAdapter, qrData, 18);

    if (!isAgeVerified) {
      return {
        success: false,
        error: 'Age verification failed. Users must be 18+ to access DeFi features.'
      };
    }

    // Create authenticated session
    console.log(' Creating user session...');
    const session = await sdk.createSession({
      duration: 3600, // 1 hour
      requiredAttributes: ['age'],
      metadata: userMetadata
    });

    console.log(' DeFi onboarding complete!');
    return {
      success: true,
      sessionId: session.sessionId
    };

  } catch (error) {
    return {
      success: false,
      error: `Onboarding failed: ${error}`
    };
  }
}

/**
 * Check if user session is still valid
 */
export async function checkDeFiAccess(sessionId: string): Promise<boolean> {
  try {
    // In real implementation, you would check session validity
    // This is a simplified version
    return true;
  } catch (error) {
    console.error('Session check failed:', error);
    return false;
  }
}

/**
 * Example usage in a React DeFi component
 */
export const DeFiAgeVerificationExample = {
  // Component would handle wallet connection and QR scanning
  handleAgeVerification: async (wallet: any, qrCode: string) => {
    const result = await onboardUserToDeFi(wallet, qrCode, {
      email: 'user@example.com',
      username: 'defi_user_123'
    });

    if (result.success) {
      // Grant access to DeFi features
      console.log(' User verified! Session ID:', result.sessionId);
      // Navigate to DeFi dashboard
    } else {
      // Show error message
      console.log('⛔ Access denied:', result.error);
      // Show age verification failure UI
    }
  }
};