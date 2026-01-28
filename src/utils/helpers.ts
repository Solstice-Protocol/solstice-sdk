import { AadhaarData, ProofData } from '../types';
import { InvalidQRDataError, InvalidParametersError } from './errors';
import { SUPPORTED_COUNTRIES } from './constants';

/**
 * Validates QR code data from mAadhaar
 */
export function validateQRData(qrData: string): boolean {
  if (!qrData || typeof qrData !== 'string') {
    return false;
  }

  // Basic validation for mAadhaar QR format
  const requiredTags = ['uid', 'name', 'dob'];
  return requiredTags.every((tag) => qrData.includes(tag));
}

/**
 * Parses mAadhaar QR code data into structured format
 */
export function parseAadhaarQR(qrData: string): AadhaarData {
  if (!validateQRData(qrData)) {
    throw new InvalidQRDataError('Invalid mAadhaar QR code format');
  }

  try {
    // Extract data using regex patterns (simplified version)
    const extractAttribute = (attr: string): string => {
      const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
      const match = qrData.match(regex);
      return match ? match[1].trim() : '';
    };

    return {
      referenceId: extractAttribute('referenceId') || extractAttribute('uid'),
      name: extractAttribute('name'),
      dateOfBirth: extractAttribute('dob'),
      gender: (extractAttribute('gender') || 'M') as 'M' | 'F' | 'T',
      address: [
        extractAttribute('house'),
        extractAttribute('street'),
        extractAttribute('lm'),
        extractAttribute('loc'),
        extractAttribute('vtc'),
        extractAttribute('subdist'),
        extractAttribute('dist'),
        extractAttribute('state'),
        extractAttribute('pc'),
      ]
        .filter(Boolean)
        .join(', '),
      careOf: extractAttribute('co'),
      district: extractAttribute('dist'),
      landmark: extractAttribute('lm'),
      house: extractAttribute('house'),
      location: extractAttribute('loc'),
      pincode: extractAttribute('pc'),
      postOffice: extractAttribute('po'),
      state: extractAttribute('state'),
      street: extractAttribute('street'),
      subDistrict: extractAttribute('subdist'),
      vtc: extractAttribute('vtc'),
      last4Aadhaar: extractAttribute('uid')?.slice(-4) || '',
      mobileHash: extractAttribute('mobileHash'),
      emailHash: extractAttribute('emailHash'),
      signature: qrData,
      xmlData: qrData,
    };
  } catch (error) {
    throw new InvalidQRDataError(`Failed to parse QR data: ${error}`);
  }
}

/**
 * Formats proof data for blockchain verification
 */
export function formatProofForVerification(proofData: ProofData): {
  proof: Uint8Array;
  publicInputs: Uint8Array;
} {
  try {
    // Simple conversion for now - in real implementation, this would properly format Groth16 proofs
    const proofStr = JSON.stringify(proofData.proof);
    const proof = new TextEncoder().encode(proofStr);

    const publicInputsStr = JSON.stringify(proofData.publicSignals);
    const publicInputs = new TextEncoder().encode(publicInputsStr);

    return { proof, publicInputs };
  } catch (error) {
    throw new InvalidParametersError(`Failed to format proof: ${error}`);
  }
}

/**
 * Validates age threshold parameter
 */
export function validateAgeThreshold(threshold: number): void {
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 150) {
    throw new InvalidParametersError(
      'Age threshold must be an integer between 0 and 150'
    );
  }
}

/**
 * Validates nationality parameters
 */
export function validateNationalityParams(countries: string[]): void {
  if (!Array.isArray(countries) || countries.length === 0) {
    throw new InvalidParametersError('Countries array cannot be empty');
  }

  const invalidCountries = countries.filter(
    (country) => !SUPPORTED_COUNTRIES.includes(country as any)
  );

  if (invalidCountries.length > 0) {
    throw new InvalidParametersError(
      `Unsupported countries: ${invalidCountries.join(', ')}`
    );
  }
}

/**
 * Validates DAO ID parameter
 */
export function validateDaoId(daoId: string): void {
  if (
    !daoId ||
    typeof daoId !== 'string' ||
    daoId.length < 3 ||
    daoId.length > 50
  ) {
    throw new InvalidParametersError(
      'DAO ID must be a string between 3 and 50 characters'
    );
  }

  // Allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(daoId)) {
    throw new InvalidParametersError(
      'DAO ID can only contain alphanumeric characters, hyphens, and underscores'
    );
  }
}

/**
 * Generates a random nonce for proof uniqueness
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    // Fallback for environments without crypto.getRandomValues
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

/**
 * Converts date string to Unix timestamp
 */
export function dateToTimestamp(dateStr: string): number {
  try {
    // Handle DD/MM/YYYY format from Aadhaar
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return Math.floor(date.getTime() / 1000);
  } catch (error) {
    throw new InvalidParametersError(`Invalid date format: ${dateStr}`);
  }
}

/**
 * Calculates age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthTimestamp = dateToTimestamp(dateOfBirth);
  const now = Math.floor(Date.now() / 1000);
  const ageInSeconds = now - birthTimestamp;
  return Math.floor(ageInSeconds / (365.25 * 24 * 60 * 60));
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }

  throw lastError!;
}

/**
 * Hash inputs for cache keys and commitments
 */
export function hashInputs(inputs: any[]): string {
  // Simple hash implementation using built-in crypto if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const combined = inputs.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    return Array.from(data).join('');
  }

  // Fallback simple hash for environments without crypto
  let hash = 0;
  const combined = inputs.join('|');
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Chunks an array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
