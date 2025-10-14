import { ERROR_CODES } from './constants';

/**
 * Base error class for Solstice SDK
 */
export class SolsticeError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'SolsticeError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

/**
 * Error thrown when proof generation fails
 */
export class ProofGenerationError extends SolsticeError {
  constructor(message: string, public readonly attributeType?: string) {
    super(message, ERROR_CODES.PROOF_GENERATION_FAILED);
    this.name = 'ProofGenerationError';
  }
}

/**
 * Error thrown when wallet is not connected
 */
export class WalletNotConnectedError extends SolsticeError {
  constructor(message: string = 'Wallet not connected. Please connect your wallet first.') {
    super(message, ERROR_CODES.WALLET_NOT_CONNECTED);
    this.name = 'WalletNotConnectedError';
  }
}

/**
 * Error thrown when verification fails
 */
export class VerificationError extends SolsticeError {
  constructor(message: string, public readonly proofType?: string) {
    super(message, ERROR_CODES.VERIFICATION_FAILED);
    this.name = 'VerificationError';
  }
}

/**
 * Error thrown when circuit loading fails
 */
export class CircuitLoadError extends SolsticeError {
  constructor(message: string, public readonly circuitType?: string) {
    super(message, ERROR_CODES.CIRCUIT_LOAD_FAILED);
    this.name = 'CircuitLoadError';
  }
}

/**
 * Error thrown when QR data is invalid
 */
export class InvalidQRDataError extends SolsticeError {
  constructor(message: string = 'Invalid QR code data') {
    super(message, ERROR_CODES.INVALID_QR_DATA);
    this.name = 'InvalidQRDataError';
  }
}

/**
 * Error thrown when parameters are invalid
 */
export class InvalidParametersError extends SolsticeError {
  constructor(message: string) {
    super(message, ERROR_CODES.INVALID_PARAMETERS);
    this.name = 'InvalidParametersError';
  }
}

/**
 * Error thrown when network operations fail
 */
export class NetworkError extends SolsticeError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, ERROR_CODES.NETWORK_ERROR);
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when identity is not found
 */
export class IdentityNotFoundError extends SolsticeError {
  constructor(message: string = 'Identity not found on blockchain') {
    super(message, ERROR_CODES.IDENTITY_NOT_FOUND);
    this.name = 'IdentityNotFoundError';
  }
}

/**
 * Error thrown when session has expired
 */
export class SessionExpiredError extends SolsticeError {
  constructor(message: string = 'Session has expired') {
    super(message, ERROR_CODES.SESSION_EXPIRED);
    this.name = 'SessionExpiredError';
  }
}