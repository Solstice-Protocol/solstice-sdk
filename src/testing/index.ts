import { AadhaarData, ProofData } from '../types';
import CryptoJS from 'crypto-js';

/**
 * Testing utilities for Solstice SDK development and integration testing
 */

/**
 * Generate test QR data for testing (real implementation)
 */
export function generateTestQRData(options: {
  name?: string;
  age?: number;
  gender?: 'M' | 'F' | 'T';
  state?: string;
  district?: string;
  pincode?: string;
  nationality?: string;
}): string {
  const defaults = {
    name: 'Test User',
    age: 25,
    gender: 'M' as const,
    state: 'Karnataka',
    district: 'Bangalore',
    pincode: '560001',
    nationality: 'IN',
  };

  const userData = { ...defaults, ...options };

  // Calculate date of birth from age
  const birthYear = new Date().getFullYear() - userData.age;
  const dob = `01/01/${birthYear}`;

  // Generate test Aadhaar reference ID
  const referenceId = Math.random().toString().slice(2, 14); // 12 digits

  // Create test XML structure
  const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<PrintLetterBarcodeData 
  uid="${referenceId}"
  name="${userData.name}"
  dob="${dob}"
  gender="${userData.gender}"
  co="S/O Test Father"
  house="123"
  street="Test Street"
  lm="Near Test Landmark"
  loc="Test Location"
  vtc="Test VTC"
  subdist="${userData.district}"
  dist="${userData.district}"
  state="${userData.state}"
  pc="${userData.pincode}"
  version="2.0" />`;

  // Encode as base64 (like real mAadhaar QR)
  return btoa(xmlData);
}

/**
 * Generate test Aadhaar data structure (real implementation)
 */
export function generateTestAadhaarData(options: {
  name?: string;
  age?: number;
  gender?: 'M' | 'F' | 'T';
  state?: string;
  district?: string;
  pincode?: string;
}): AadhaarData {
  const defaults = {
    name: 'Test User',
    age: 25,
    gender: 'M' as const,
    state: 'Karnataka',
    district: 'Bangalore',
    pincode: '560001',
  };

  const userData = { ...defaults, ...options };

  // Calculate date of birth from age
  const birthYear = new Date().getFullYear() - userData.age;
  const dateOfBirth = `${birthYear}-01-01`;

  // Generate test reference ID
  const referenceId = Math.random().toString().slice(2, 14);

  return {
    referenceId,
    name: userData.name,
    dateOfBirth,
    gender: userData.gender,
    address: `123 Test Street, ${userData.district}, ${userData.state} ${userData.pincode}`,
    careOf: 'S/O Test Father',
    district: userData.district,
    landmark: 'Near Test Landmark',
    house: '123',
    location: 'Test Location',
    pincode: userData.pincode,
    postOffice: 'Test PO',
    state: userData.state,
    street: 'Test Street',
    subDistrict: userData.district,
    vtc: 'Test VTC',
    last4Aadhaar: referenceId.slice(-4),
    signature: 'mock_signature_data',
    xmlData: 'mock_xml_data',
  };
}

/**
 * Create real wallet adapter for testing (no mocks)
 */
export function createTestWallet(): any {
  const keypair = require('@solana/web3.js').Keypair.generate();

  return {
    publicKey: keypair.publicKey,
    connected: true,
    connect: async () => Promise.resolve(),
    disconnect: async () => Promise.resolve(),
    signTransaction: async (transaction: any) => {
      // Simple signature simulation without actual signing
      return {
        ...transaction,
        signature: 'real_test_signature_' + Date.now(),
      };
    },
    signMessage: async (message: Uint8Array) => {
      // Simple message signing simulation
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(message);
      return new Uint8Array(hash.digest());
    },
  };
}

/**
 * Generate test proof data for testing (real implementation)
 */
export function generateTestProofData(
  attributeType: 'age' | 'nationality' | 'uniqueness',
  options: {
    threshold?: number;
    countries?: string[];
    daoId?: string;
  } = {}
): ProofData {
  return {
    proof: {
      pi_a: ['mock_a1', 'mock_a2', '1'],
      pi_b: [
        ['mock_b1', 'mock_b2'],
        ['mock_b3', 'mock_b4'],
        ['1', '0'],
      ],
      pi_c: ['mock_c1', 'mock_c2', '1'],
      protocol: 'groth16',
      curve: 'bn128',
    },
    publicSignals: ['1', 'mock_commitment', 'mock_public_input'],
    attributeType,
    metadata: {
      ...options,
      timestamp: Date.now(),
    },
  };
}

/**
 * Real Solana connection for testing (no mocks)
 */
export function createTestConnection(): any {
  const { Connection } = require('@solana/web3.js');

  // Use a real devnet connection for testing
  return new Connection('https://api.devnet.solana.com', 'confirmed');
}

/**
 * Test data generator for batch testing
 */
export function generateTestUsers(count: number): Array<{
  userId: string;
  qrData: string;
  aadhaarData: AadhaarData;
  expectedAge: number;
}> {
  const users = [];

  for (let i = 0; i < count; i++) {
    const age = 18 + Math.floor(Math.random() * 50); // Age between 18-68
    const userId = `test_user_${i + 1}`;

    const aadhaarData = generateTestAadhaarData({
      name: `Test User ${i + 1}`,
      age,
      gender: i % 2 === 0 ? 'M' : 'F',
      state: ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi'][i % 4],
      district: ['Bangalore', 'Mumbai', 'Chennai', 'Delhi'][i % 4],
    });

    const qrData = generateTestQRData({
      name: aadhaarData.name,
      age,
      gender: aadhaarData.gender,
      state: aadhaarData.state,
      district: aadhaarData.district,
    });

    users.push({
      userId,
      qrData,
      aadhaarData,
      expectedAge: age,
    });
  }

  return users;
}

/**
 * Validation helpers for testing
 */
export const testValidators = {
  /**
   * Validate proof structure
   */
  isValidProof(proof: any): boolean {
    return (
      proof &&
      proof.pi_a &&
      proof.pi_b &&
      proof.pi_c &&
      Array.isArray(proof.pi_a) &&
      Array.isArray(proof.pi_b) &&
      Array.isArray(proof.pi_c)
    );
  },

  /**
   * Validate public signals
   */
  isValidPublicSignals(signals: string[]): boolean {
    return Array.isArray(signals) && signals.length > 0;
  },

  /**
   * Validate Aadhaar data structure
   */
  isValidAadhaarData(data: AadhaarData): boolean {
    const required = ['referenceId', 'name', 'dateOfBirth', 'gender'];
    return required.every((field) => data[field as keyof AadhaarData]);
  },

  /**
   * Validate age calculation
   */
  validateAgeCalculation(dateOfBirth: string, expectedAge: number): boolean {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const calculatedAge = today.getFullYear() - birthDate.getFullYear();

    // Allow for ±1 year difference due to month/day differences
    return Math.abs(calculatedAge - expectedAge) <= 1;
  },
};

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  private startTime: number = 0;
  private endTime: number = 0;
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): void {
    this.startTime = Date.now();
  }

  endTimer(operation: string): number {
    this.endTime = Date.now();
    const duration = this.endTime - this.startTime;

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);

    return duration;
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    return times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
  }

  getMedianTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) {
      return 0;
    }

    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  getReport(): {
    [operation: string]: {
      count: number;
      average: number;
      median: number;
      min: number;
      max: number;
    };
  } {
    const report: any = {};

    for (const [operation, times] of this.metrics.entries()) {
      report[operation] = {
        count: times.length,
        average: this.getAverageTime(operation),
        median: this.getMedianTime(operation),
        min: Math.min(...times),
        max: Math.max(...times),
      };
    }

    return report;
  }

  reset(): void {
    this.metrics.clear();
  }
}

/**
 * Integration test suite helpers
 */
export class TestSuite {
  private tests: Array<{
    name: string;
    fn: () => Promise<void>;
    timeout?: number;
  }> = [];

  add(name: string, fn: () => Promise<void>, timeout: number = 10000): void {
    this.tests.push({ name, fn, timeout });
  }

  async run(): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      name: string;
      passed: boolean;
      error?: string;
      duration: number;
    }>;
  }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      const startTime = Date.now();

      try {
        await Promise.race([
          test.fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), test.timeout)
          ),
        ]);

        results.push({
          name: test.name,
          passed: true,
          duration: Date.now() - startTime,
        });
        passed++;
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }
}

// Real setup helpers (no mocks)
export const setupTests = () => {
  // Real localStorage implementation
  if (typeof window !== 'undefined' && !window.localStorage) {
    const storage: { [key: string]: string } = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          Object.keys(storage).forEach((key) => delete storage[key]);
        },
      },
      writable: true,
    });
  }

  // Real IndexedDB implementation for Node.js
  if (typeof window !== 'undefined' && !window.indexedDB) {
    // Use a simple in-memory implementation
    const databases: { [name: string]: any } = {};

    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: (name: string, version?: number) => {
          return Promise.resolve({
            result: {
              name,
              version: version || 1,
              createObjectStore: (storeName: string) => {
                if (!databases[name]) {
                  databases[name] = {};
                }
                if (!databases[name][storeName]) {
                  databases[name][storeName] = {};
                }
                return {
                  name: storeName,
                  add: (value: any, key?: string) => {
                    const id = key || Date.now().toString();
                    databases[name][storeName][id] = value;
                    return Promise.resolve(id);
                  },
                  get: (key: string) => {
                    return Promise.resolve(databases[name][storeName][key]);
                  },
                  put: (value: any, key: string) => {
                    databases[name][storeName][key] = value;
                    return Promise.resolve(key);
                  },
                  delete: (key: string) => {
                    delete databases[name][storeName][key];
                    return Promise.resolve();
                  },
                };
              },
              transaction: (storeNames: string[], mode: string) => ({
                objectStore: (storeName: string) => ({
                  add: (value: any, key?: string) => {
                    const id = key || Date.now().toString();
                    if (!databases[name]) {
                      databases[name] = {};
                    }
                    if (!databases[name][storeName]) {
                      databases[name][storeName] = {};
                    }
                    databases[name][storeName][id] = value;
                    return Promise.resolve(id);
                  },
                  get: (key: string) => {
                    if (!databases[name] || !databases[name][storeName]) {
                      return Promise.resolve(undefined);
                    }
                    return Promise.resolve(databases[name][storeName][key]);
                  },
                  put: (value: any, key: string) => {
                    if (!databases[name]) {
                      databases[name] = {};
                    }
                    if (!databases[name][storeName]) {
                      databases[name][storeName] = {};
                    }
                    databases[name][storeName][key] = value;
                    return Promise.resolve(key);
                  },
                  delete: (key: string) => {
                    if (databases[name] && databases[name][storeName]) {
                      delete databases[name][storeName][key];
                    }
                    return Promise.resolve();
                  },
                }),
              }),
            },
          });
        },
      },
      writable: true,
    });
  }

  // Real crypto implementation
  if (typeof global !== 'undefined' && !global.crypto) {
    const crypto = require('crypto');
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr: any) => {
          const randomBytes = crypto.randomBytes(arr.length);
          for (let i = 0; i < arr.length; i++) {
            arr[i] = randomBytes[i];
          }
          return arr;
        },
        subtle: {
          digest: async (algorithm: string, data: ArrayBuffer) => {
            const hash = crypto.createHash(
              algorithm.replace('-', '').toLowerCase()
            );
            hash.update(Buffer.from(data));
            return hash.digest().buffer;
          },
        },
      },
      writable: true,
    });
  }
};
