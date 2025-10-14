/**
 * Example: Geographic Restrictions for Global Platform
 * 
 * This example demonstrates nationality verification for applications
 * that need to comply with geographic restrictions.
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
 * Verify user nationality for geographic compliance
 */
export async function verifyGeographicCompliance(
  walletAdapter: any,
  qrData: string,
  allowedCountries: string[],
  restrictedCountries?: string[]
): Promise<{
  allowed: boolean;
  userCountry?: string;
  error?: string;
}> {
  try {
    console.log('🌍 Starting geographic compliance verification...');

    // Initialize and connect
    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Ensure identity is registered
    const identityStatus = await sdk.getIdentityStatus();
    if (!identityStatus.exists) {
      await sdk.registerIdentity(qrData);
    }

    // Generate nationality proof
    console.log(' Generating nationality proof...');
    const nationalityProof = await sdk.generateNationalityProofWithQR(qrData, {
      allowedCountries,
      includeAge: false
    });

    // Verify proof on-chain
    const verification = await sdk.verifyIdentity(nationalityProof);

    if (verification.verified) {
      console.log(' Geographic compliance verified');
      return {
        allowed: true,
        userCountry: 'IN' // In real implementation, extract from proof
      };
    } else {
      return {
        allowed: false,
        error: 'Geographic verification failed'
      };
    }

  } catch (error) {
    console.error('Geographic compliance error:', error);
    return {
      allowed: false,
      error: `Verification failed: ${error}`
    };
  }
}

/**
 * Example: Crypto exchange with country restrictions
 */
export async function verifyCryptoExchangeAccess(
  walletAdapter: any,
  qrData: string
): Promise<boolean> {
  // Countries where the exchange operates
  const allowedCountries = [
    'US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP', 'SG', 'IN'
  ];

  // Countries with regulatory restrictions
  const restrictedCountries = [
    'CN', 'KP', 'IR', 'SY'
  ];

  const result = await verifyGeographicCompliance(
    walletAdapter,
    qrData,
    allowedCountries,
    restrictedCountries
  );

  return result.allowed;
}

/**
 * Example: Gaming platform with region-specific content
 */
export async function verifyGamingRegion(
  walletAdapter: any,
  qrData: string,
  gameRegion: 'APAC' | 'EMEA' | 'AMERICAS'
): Promise<{
  accessGranted: boolean;
  region?: string;
  ageVerified?: boolean;
}> {
  const regionCountries = {
    APAC: ['IN', 'JP', 'KR', 'SG', 'AU', 'NZ', 'TH', 'MY'],
    EMEA: ['UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO'],
    AMERICAS: ['US', 'CA', 'BR', 'MX', 'AR', 'CL']
  };

  try {
    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Ensure identity exists
    const identityStatus = await sdk.getIdentityStatus();
    if (!identityStatus.exists) {
      await sdk.registerIdentity(qrData);
    }

    // Generate combined nationality + age proof
    const proof = await sdk.generateNationalityProofWithQR(qrData, {
      allowedCountries: regionCountries[gameRegion],
      includeAge: true,
      ageThreshold: 13 // COPPA compliance
    });

    const verification = await sdk.verifyIdentity(proof);

    return {
      accessGranted: verification.verified,
      region: gameRegion,
      ageVerified: verification.verified
    };

  } catch (error) {
    console.error('Gaming region verification failed:', error);
    return {
      accessGranted: false
    };
  }
}

/**
 * Example: DAO with citizenship requirements
 */
export async function verifyDAOCitizenship(
  walletAdapter: any,
  qrData: string,
  daoConfig: {
    allowedCountries: string[];
    minimumAge: number;
    daoId: string;
  }
): Promise<{
  canParticipate: boolean;
  isUnique: boolean;
  sessionId?: string;
}> {
  try {
    await sdk.initialize();
    await sdk.connect(walletAdapter);

    // Ensure identity exists
    const identityStatus = await sdk.getIdentityStatus();
    if (!identityStatus.exists) {
      await sdk.registerIdentity(qrData);
    }

    // Generate multiple proofs in batch
    const proofs = await sdk.batchGenerate(qrData, [
      {
        type: 'nationality',
        params: {
          allowedCountries: daoConfig.allowedCountries,
          includeAge: true,
          ageThreshold: daoConfig.minimumAge
        }
      },
      {
        type: 'uniqueness',
        params: {
          daoId: daoConfig.daoId,
          epochId: 'membership-2024'
        }
      }
    ]);

    if (proofs.errors && proofs.errors.length > 0) {
      console.error('Proof generation errors:', proofs.errors);
      return { canParticipate: false, isUnique: false };
    }

    // Verify all proofs on-chain
    const txSignature = await sdk.batchVerify(proofs.proofs);
    console.log(' DAO verification complete:', txSignature);

    // Create DAO session
    const session = await sdk.createSession({
      duration: 86400, // 24 hours
      requiredAttributes: ['nationality', 'age', 'uniqueness'],
      metadata: { daoId: daoConfig.daoId }
    });

    return {
      canParticipate: true,
      isUnique: true,
      sessionId: session.sessionId
    };

  } catch (error) {
    console.error('DAO citizenship verification failed:', error);
    return { canParticipate: false, isUnique: false };
  }
}

/**
 * React component example for geographic verification
 */
export const GeographicVerificationComponent = {
  handleRegionCheck: async (
    wallet: any, 
    qrCode: string, 
    serviceType: 'exchange' | 'gaming' | 'dao'
  ) => {
    let result;

    switch (serviceType) {
      case 'exchange':
        result = await verifyCryptoExchangeAccess(wallet, qrCode);
        break;
      case 'gaming':
        result = await verifyGamingRegion(wallet, qrCode, 'APAC');
        break;
      case 'dao':
        result = await verifyDAOCitizenship(wallet, qrCode, {
          allowedCountries: ['US', 'CA', 'UK', 'AU'],
          minimumAge: 18,
          daoId: 'governance-dao-v1'
        });
        break;
    }

    return result;
  }
};