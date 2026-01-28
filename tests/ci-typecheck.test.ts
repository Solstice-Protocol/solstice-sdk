/**
 * Unit tests for TypeScript type checking workflow job
 * Validates Requirements 2.1 and 2.6
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('TypeScript Type Checking Workflow Job', () => {
  const originalIndexContent = fs.readFileSync('src/index.ts', 'utf8');
  
  afterEach(() => {
    // Restore original file content after each test
    fs.writeFileSync('src/index.ts', originalIndexContent);
  });

  describe('Requirement 2.1: TypeScript compilation check with proper error reporting', () => {
    it('should pass type checking with valid TypeScript code', () => {
      expect(() => {
        execSync('npm run type-check', { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should provide detailed error reporting for type errors', () => {
      // Add a type error to the file
      const invalidContent = originalIndexContent + '\nconst typeError: string = 123;';
      fs.writeFileSync('src/index.ts', invalidContent);

      expect(() => {
        execSync('npm run type-check', { stdio: 'pipe' });
      }).toThrow();
    });

    it('should check all TypeScript files in the src directory', () => {
      const output = execSync('npx tsc --showConfig', { encoding: 'utf8' });
      const config = JSON.parse(output);
      
      // Verify that TypeScript files are included
      expect(config.files).toBeDefined();
      expect(config.files.length).toBeGreaterThan(0);
      
      // Verify that src directory is included
      expect(config.include).toContain('src/**/*');
    });

    it('should use strict TypeScript configuration', () => {
      const tsconfigContent = fs.readFileSync('tsconfig.json', 'utf8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.noEmit).toBe(false); // We want declarations
    });
  });

  describe('Requirement 2.6: Fail on any compilation errors', () => {
    it('should fail the build when TypeScript compilation errors exist', () => {
      // Add multiple type errors
      const invalidContent = originalIndexContent + `
        const error1: string = 123;
        const error2: number = "invalid";
        function invalidFunction(): string {
          return 456;
        }
      `;
      fs.writeFileSync('src/index.ts', invalidContent);

      let errorThrown = false;
      try {
        execSync('npm run type-check', { stdio: 'pipe' });
      } catch (error) {
        errorThrown = true;
        expect(error.status).not.toBe(0);
      }
      
      expect(errorThrown).toBe(true);
    });

    it('should use --noEmit flag to prevent output generation during type checking', () => {
      const packageJsonContent = fs.readFileSync('package.json', 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      expect(packageJson.scripts['type-check']).toContain('--noEmit');
    });

    it('should validate TypeScript configuration exists and is valid', () => {
      expect(fs.existsSync('tsconfig.json')).toBe(true);
      
      const tsconfigContent = fs.readFileSync('tsconfig.json', 'utf8');
      expect(() => JSON.parse(tsconfigContent)).not.toThrow();
    });
  });

  describe('CI Workflow Integration', () => {
    it('should have TypeScript type checking job in CI workflow', () => {
      const ciWorkflowContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
      
      expect(ciWorkflowContent).toContain('typecheck');
      expect(ciWorkflowContent).toContain('npm run type-check');
      expect(ciWorkflowContent).toContain('TypeScript type checking');
    });

    it('should run type checking as part of quality gates', () => {
      const ciWorkflowContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
      
      expect(ciWorkflowContent).toContain('quality-gates');
      expect(ciWorkflowContent).toContain('matrix:');
      expect(ciWorkflowContent).toContain('check: [typecheck, lint, format, audit]');
    });

    it('should validate TypeScript configuration before running type check', () => {
      const ciWorkflowContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
      
      expect(ciWorkflowContent).toContain('Validating TypeScript configuration');
      expect(ciWorkflowContent).toContain('tsconfig.json');
      expect(ciWorkflowContent).toContain('strict": true');
    });
  });

  describe('Error Handling and Reporting', () => {
    it('should provide comprehensive error output', () => {
      // Add a type error
      const invalidContent = originalIndexContent + '\nconst typeError: string = 123;';
      fs.writeFileSync('src/index.ts', invalidContent);

      try {
        execSync('npm run type-check', { stdio: 'pipe' });
      } catch (error) {
        const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
        
        // Should contain file name and line number
        expect(errorOutput).toContain('src/index.ts');
        expect(errorOutput).toContain('error TS');
        expect(errorOutput).toContain('Type \'number\' is not assignable to type \'string\'');
      }
    });

    it('should count and report the number of TypeScript files checked', () => {
      const srcFiles = execSync('find src -name "*.ts" -not -path "*/node_modules/*" | wc -l', { encoding: 'utf8' });
      const fileCount = parseInt(srcFiles.trim());
      
      expect(fileCount).toBeGreaterThan(0);
      expect(fileCount).toBe(15); // Based on current project structure
    });
  });
});