import { EnhancedSolsticeSDK, Testing } from '../src/index';

const {
  generateMockQRData,
  generateMockAadhaarData,
  createMockWallet,
  testValidators,
  PerformanceTester,
  setupTests
} = Testing;

// Setup test environment
setupTests();

describe('Enhanced Solstice SDK', () => {
  let sdk: EnhancedSolsticeSDK;
  let performanceTester: PerformanceTester;

  beforeAll(() => {
    sdk = new EnhancedSolsticeSDK({
      network: 'devnet',
      debug: false
    });
    performanceTester = new PerformanceTester();
  });

  beforeEach(() => {
    performanceTester.reset();
  });

  describe('QR Code Processing', () => {
    test('should process mock QR data successfully', async () => {
      const mockQR = generateMockQRData({
        name: 'Test User',
        age: 25,
        gender: 'M',
        state: 'Karnataka'
      });

      await sdk.initialize();
      
      performanceTester.startTimer('qr_processing');
      const aadhaarData = await sdk.processQRCode(mockQR);
      const duration = performanceTester.endTimer('qr_processing');

      expect(testValidators.isValidAadhaarData(aadhaarData)).toBe(true);
      expect(aadhaarData.name).toBe('Test User');
      expect(aadhaarData.gender).toBe('M');
      expect(aadhaarData.state).toBe('Karnataka');
      expect(duration).toBeLessThan(1000); // Should process in under 1 second
    });

    test('should validate age calculation correctly', async () => {
      const testAge = 30;
      const mockQR = generateMockQRData({ age: testAge });
      
      await sdk.initialize();
      const aadhaarData = await sdk.processQRCode(mockQR);
      
      expect(testValidators.validateAgeCalculation(
        aadhaarData.dateOfBirth, 
        testAge
      )).toBe(true);
    });

    test('should handle invalid QR data gracefully', async () => {
      await sdk.initialize();
      
      await expect(sdk.processQRCode('invalid_qr_data')).rejects.toThrow();
    });
  });

  describe('Proof Generation', () => {
    test('should generate age proof from QR data', async () => {
      const mockQR = generateMockQRData({ age: 25 });
      
      await sdk.initialize();
      
      performanceTester.startTimer('age_proof_generation');
      const ageProof = await sdk.generateAgeProofFromQR(mockQR, {
        threshold: 18
      });
      const duration = performanceTester.endTimer('age_proof_generation');

      expect(testValidators.isValidProof(ageProof.proof)).toBe(true);
      expect(testValidators.isValidPublicSignals(ageProof.publicSignals)).toBe(true);
      expect(ageProof.attributeType).toBe('age');
      expect(ageProof.metadata?.threshold).toBe(18);
      expect(duration).toBeLessThan(10000); // Should generate in under 10 seconds
    });

    test('should generate nationality proof from QR data', async () => {
      const mockQR = generateMockQRData({ nationality: 'IN' });
      
      await sdk.initialize();
      
      performanceTester.startTimer('nationality_proof_generation');
      const nationalityProof = await sdk.generateNationalityProofFromQR(mockQR, {
        allowedCountries: ['IN', 'US']
      });
      const duration = performanceTester.endTimer('nationality_proof_generation');

      expect(testValidators.isValidProof(nationalityProof.proof)).toBe(true);
      expect(nationalityProof.attributeType).toBe('nationality');
      expect(nationalityProof.metadata?.countries).toContain('IN');
      expect(duration).toBeLessThan(10000);
    });

    test('should generate uniqueness proof from QR data', async () => {
      const mockQR = generateMockQRData({});
      
      await sdk.initialize();
      
      performanceTester.startTimer('uniqueness_proof_generation');
      const uniquenessProof = await sdk.generateUniquenessProofFromQR(mockQR, {
        daoId: 'test-dao',
        epochId: 'test-epoch'
      });
      const duration = performanceTester.endTimer('uniqueness_proof_generation');

      expect(testValidators.isValidProof(uniquenessProof.proof)).toBe(true);
      expect(uniquenessProof.attributeType).toBe('uniqueness');
      expect(uniquenessProof.metadata?.daoId).toBe('test-dao');
      expect(duration).toBeLessThan(8000);
    });

    test('should generate all proofs efficiently in batch', async () => {
      const mockQR = generateMockQRData({ age: 25 });
      
      await sdk.initialize();
      
      performanceTester.startTimer('batch_proof_generation');
      const batchResult = await sdk.generateAllProofsFromQR(mockQR, {
        age: { threshold: 18 },
        nationality: { allowedCountries: ['IN'] },
        uniqueness: { daoId: 'test-dao' }
      });
      const duration = performanceTester.endTimer('batch_proof_generation');

      expect(batchResult.proofs.age).toBeDefined();
      expect(batchResult.proofs.nationality).toBeDefined();
      expect(batchResult.proofs.uniqueness).toBeDefined();
      expect(batchResult.totalTime).toBeLessThan(15000); // All proofs in under 15 seconds
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Performance and Caching', () => {
    test('should cache proofs for faster subsequent generation', async () => {
      const mockQR = generateMockQRData({ age: 25 });
      
      await sdk.initialize();
      
      // First generation (should be slower)
      performanceTester.startTimer('first_proof_generation');
      await sdk.generateAgeProofFromQR(mockQR, { threshold: 18 });
      const firstDuration = performanceTester.endTimer('first_proof_generation');

      // Second generation (should use cache and be faster)
      performanceTester.startTimer('cached_proof_generation');
      await sdk.generateAgeProofFromQR(mockQR, { threshold: 18 });
      const cachedDuration = performanceTester.endTimer('cached_proof_generation');

      // Cached version should be significantly faster
      expect(cachedDuration).toBeLessThan(firstDuration * 0.5);
    });

    test('should provide performance metrics', async () => {
      await sdk.initialize();
      
      const metrics = sdk.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('cacheStats');
      expect(metrics).toHaveProperty('isInitialized');
      expect(metrics).toHaveProperty('version');
      expect(metrics.isInitialized).toBe(true);
    });

    test('should clear cache when requested', async () => {
      await sdk.initialize();
      
      // Generate a proof to populate cache
      const mockQR = generateMockQRData({ age: 25 });
      await sdk.generateAgeProofFromQR(mockQR, { threshold: 18 });
      
      // Clear cache
      sdk.clearCache();
      
      // Verify cache is cleared (implementation specific)
      const metrics = sdk.getPerformanceMetrics();
      expect(metrics.cacheStats).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle proof generation failure gracefully', async () => {
      const invalidQR = 'definitely_invalid_qr_data';
      
      await sdk.initialize();
      
      await expect(sdk.generateAgeProofFromQR(invalidQR, {
        threshold: 18
      })).rejects.toThrow();
    });

    test('should validate age threshold parameters', async () => {
      const mockQR = generateMockQRData({ age: 16 });
      
      await sdk.initialize();
      
      // Should fail for underage user
      await expect(sdk.generateAgeProofFromQR(mockQR, {
        threshold: 18
      })).rejects.toThrow();
    });

    test('should validate nationality parameters', async () => {
      const mockQR = generateMockQRData({});
      
      await sdk.initialize();
      
      // Should fail with empty country list
      await expect(sdk.generateNationalityProofFromQR(mockQR, {
        allowedCountries: []
      })).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should complete DeFi onboarding workflow', async () => {
      const mockQR = generateMockQRData({ age: 25 });
      const mockWallet = createMockWallet();
      
      await sdk.initialize();
      await sdk.connect(mockWallet);
      
      const workflow = await sdk.completeVerificationWorkflow(mockQR, {
        age: { threshold: 18 },
        nationality: { allowedCountries: ['IN'] }
      });
      
      expect(workflow.aadhaarData).toBeDefined();
      expect(workflow.proofs.age).toBeDefined();
      expect(workflow.proofs.nationality).toBeDefined();
      expect(workflow.totalTime).toBeGreaterThan(0);
    });

    test('should handle gaming platform onboarding', async () => {
      const mockQR = generateMockQRData({ age: 20 });
      const mockWallet = createMockWallet();
      
      await sdk.initialize();
      await sdk.connect(mockWallet);
      
      const uniquenessProof = await sdk.generateUniquenessProofFromQR(mockQR, {
        daoId: 'game-fps-shooter',
        epochId: 'tournament-2024'
      });
      
      expect(uniquenessProof.attributeType).toBe('uniqueness');
      expect(uniquenessProof.metadata?.daoId).toBe('game-fps-shooter');
    });
  });

  afterAll(() => {
    // Print performance report
    const report = performanceTester.getReport();
    console.log('Performance Test Report:', JSON.stringify(report, null, 2));
  });
});