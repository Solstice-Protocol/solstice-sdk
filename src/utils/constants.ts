import { PublicKey } from '@solana/web3.js';

/**
 * Solstice SDK Program ID on Devnet
 */
export const SOLSTICE_PROGRAM_ID = new PublicKey(
  '8jrTVUyvHrL5WTWyDoa6PTJRhh3MwbvLZXeGT81YjJjz'
);

/**
 * Default RPC endpoints by network
 */
export const DEFAULT_RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
} as const;

/**
 * Circuit artifact paths (default configuration)
 */
export const DEFAULT_CIRCUIT_PATHS = {
  age: {
    wasmPath: '/circuits/age_proof_js/age_proof.wasm',
    zkeyPath: '/circuits/age_proof_final.zkey',
    vkeyPath: '/circuits/age_proof_verification_key.json',
  },
  nationality: {
    wasmPath: '/circuits/nationality_proof_js/nationality_proof.wasm',
    zkeyPath: '/circuits/nationality_proof_final.zkey',
    vkeyPath: '/circuits/nationality_proof_verification_key.json',
  },
  uniqueness: {
    wasmPath: '/circuits/uniqueness_proof_js/uniqueness_proof.wasm',
    zkeyPath: '/circuits/uniqueness_proof_final.zkey',
    vkeyPath: '/circuits/uniqueness_proof_verification_key.json',
  },
} as const;

/**
 * Attribute type constants (used as bitmap flags)
 */
export const ATTRIBUTE_TYPES = {
  AGE: 1, // 0001
  NATIONALITY: 2, // 0010
  UNIQUENESS: 4, // 0100
} as const;

/**
 * Proof generation timeouts (in milliseconds)
 */
export const PROOF_TIMEOUTS = {
  age: 30000, // 30 seconds
  nationality: 45000, // 45 seconds
  uniqueness: 20000, // 20 seconds
} as const;

/**
 * Session duration limits
 */
export const SESSION_LIMITS = {
  MIN_DURATION: 60, // 1 minute
  MAX_DURATION: 86400, // 24 hours
  DEFAULT_DURATION: 3600, // 1 hour
} as const;

/**
 * Supported country codes for nationality verification
 */
export const SUPPORTED_COUNTRIES = [
  'US',
  'IN',
  'UK',
  'CA',
  'AU',
  'DE',
  'FR',
  'JP',
  'KR',
  'SG',
  'BR',
  'MX',
  'AR',
  'CL',
  'PE',
  'CO',
  'VE',
  'UY',
  'PY',
  'BO',
  'EC',
  'GY',
  'SR',
  'FK',
  'GF',
  'PF',
  'NC',
  'VU',
  'FJ',
  'SB',
  'PG',
  'NR',
  'TV',
  'KI',
  'MH',
  'FM',
  'PW',
  'WS',
  'TO',
  'AS',
] as const;

/**
 * Proof cache settings
 */
export const CIRCUIT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const ERROR_CODES = {
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INVALID_QR_DATA: 'INVALID_QR_DATA',
  PROOF_GENERATION_FAILED: 'PROOF_GENERATION_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  CIRCUIT_LOAD_FAILED: 'CIRCUIT_LOAD_FAILED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  IDENTITY_NOT_FOUND: 'IDENTITY_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
} as const;
