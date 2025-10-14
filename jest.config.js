module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        moduleResolution: 'node',
        lib: ['ES2020', 'DOM'],
        types: ['jest', 'node'],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        resolveJsonModule: true
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(snarkjs|circomlibjs|uuid|@solana|jayson|crypto-js|bs58|buffer|bn\\.js)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/examples/**',
    '!src/testing/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': 'uuid',
    '^snarkjs$': 'snarkjs'
  },
  testTimeout: 180000, // 3 minutes for comprehensive tests
  maxWorkers: 1, // Run tests sequentially for stability
  verbose: true,
  bail: false // Continue running tests even if some fail
};