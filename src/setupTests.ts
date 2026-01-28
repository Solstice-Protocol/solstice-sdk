// Jest setup file for Solstice SDK tests
import 'jest-environment-jsdom';

// Real browser APIs for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Real crypto implementation
if (typeof window !== 'undefined') {
  const crypto = require('crypto');
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        const randomBytes = crypto.randomBytes(arr.length);
        for (let i = 0; i < arr.length; i++) {
          arr[i] = randomBytes[i];
        }
        return arr;
      },
      subtle: crypto.webcrypto?.subtle || {
        digest: async (algorithm: string, data: ArrayBuffer) => {
          const hash = crypto.createHash(
            algorithm.replace('-', '').toLowerCase()
          );
          hash.update(Buffer.from(data));
          return hash.digest().buffer;
        },
      },
    },
  });
}

// Real localStorage implementation for testing
if (typeof window !== 'undefined') {
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
  });
}

// Set test timeout for all tests
jest.setTimeout(60000);
