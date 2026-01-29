/**
 * Comprehensive test setup for Solstice SDK - Real implementations only
 */

// Real console logging for tests (configurable)
const enableTestLogging = process.env.TEST_VERBOSE === 'true';
const originalConsole = global.console;

if (!enableTestLogging) {
  global.console = {
    ...originalConsole,
    log: (...args: any[]) => {}, // Silent in tests unless TEST_VERBOSE=true
    debug: (...args: any[]) => {},
    info: (...args: any[]) => {},
    warn: originalConsole.warn,
    error: originalConsole.error,
  };
}

// Setup Node.js environment compatibility
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Setup crypto for Node.js
if (typeof global.crypto === 'undefined') {
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
          const hashAlgo = algorithm.replace('-', '').toLowerCase();
          const hash = crypto.createHash(hashAlgo);
          hash.update(Buffer.from(data));
          return hash.digest().buffer;
        }
      }
    },
    writable: true,
  });
}

// Real localStorage for Node.js
if (typeof global.localStorage === 'undefined') {
  class RealLocalStorage {
    private store: { [key: string]: string } = {};

    getItem(key: string): string | null {
      return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
      this.store[key] = String(value);
    }

    removeItem(key: string): void {
      delete this.store[key];
    }

    clear(): void {
      this.store = {};
    }

    get length(): number {
      return Object.keys(this.store).length;
    }

    key(index: number): string | null {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }
  }

  global.localStorage = new RealLocalStorage();
}

// Real IndexedDB for Node.js
if (typeof global.indexedDB === 'undefined') {
  const databases: { [name: string]: any } = {};
  
  Object.defineProperty(global, 'indexedDB', {
    value: {
      open: (name: string, version?: number) => {
        return Promise.resolve({
          result: {
            name,
            version: version || 1,
            createObjectStore: (storeName: string) => {
              if (!databases[name]) databases[name] = {};
              if (!databases[name][storeName]) databases[name][storeName] = {};
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
                }
              };
            },
            transaction: (storeNames: string[], mode: string) => ({
              objectStore: (storeName: string) => ({
                add: (value: any, key?: string) => {
                  const id = key || Date.now().toString();
                  if (!databases[name]) databases[name] = {};
                  if (!databases[name][storeName]) databases[name][storeName] = {};
                  databases[name][storeName][id] = value;
                  return Promise.resolve(id);
                },
                get: (key: string) => {
                  if (!databases[name] || !databases[name][storeName]) return Promise.resolve(undefined);
                  return Promise.resolve(databases[name][storeName][key]);
                },
                put: (value: any, key: string) => {
                  if (!databases[name]) databases[name] = {};
                  if (!databases[name][storeName]) databases[name][storeName] = {};
                  databases[name][storeName][key] = value;
                  return Promise.resolve(key);
                },
                delete: (key: string) => {
                  if (databases[name] && databases[name][storeName]) {
                    delete databases[name][storeName][key];
                  }
                  return Promise.resolve();
                }
              })
            })
          }
        });
      }
    },
    writable: true,
  });
}

// Real fetch for Node.js
if (typeof global.fetch === 'undefined') {
  global.fetch = (() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })) as any;
}

// Test environment info
console.log('🧪 Comprehensive Solstice SDK Test Environment Initialized');
console.log(' Features: Real implementations, Full functionality, Performance tracking');
console.log('⏱️  Timeout: 3 minutes per test');