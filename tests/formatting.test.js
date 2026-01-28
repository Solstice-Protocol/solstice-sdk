/**
 * Tests for Prettier formatting configuration
 * Validates that the formatting setup works correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Code Formatting Configuration', () => {
  test('Prettier configuration file exists and is valid', () => {
    const prettierConfigPath = path.join(process.cwd(), '.prettierrc.js');
    expect(fs.existsSync(prettierConfigPath)).toBe(true);
    
    // Test that the configuration can be loaded without errors
    expect(() => {
      require(prettierConfigPath);
    }).not.toThrow();
  });

  test('Prettier ignore file exists', () => {
    const prettierIgnorePath = path.join(process.cwd(), '.prettierignore');
    expect(fs.existsSync(prettierIgnorePath)).toBe(true);
  });

  test('Package.json contains formatting scripts', () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.scripts).toHaveProperty('format');
    expect(packageJson.scripts).toHaveProperty('format:check');
    expect(packageJson.devDependencies).toHaveProperty('prettier');
  });

  test('Prettier configuration has expected settings', () => {
    const prettierConfig = require('../.prettierrc.js');
    
    expect(prettierConfig.semi).toBe(true);
    expect(prettierConfig.singleQuote).toBe(true);
    expect(prettierConfig.printWidth).toBe(80);
    expect(prettierConfig.tabWidth).toBe(2);
    expect(prettierConfig.useTabs).toBe(false);
    expect(prettierConfig.trailingComma).toBe('es5');
  });

  test('Prettier can check formatting without errors', () => {
    // This test verifies that the prettier check command runs without throwing
    // It doesn't test whether files are formatted, just that the command works
    expect(() => {
      execSync('npx prettier --check "src/**/*.{ts,tsx}" --no-error-on-unmatched-pattern', {
        stdio: 'pipe'
      });
    }).not.toThrow();
  });

  test('Source files exist for formatting', () => {
    const srcDir = path.join(process.cwd(), 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
    
    // Check that there are TypeScript files to format
    const tsFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', {
      encoding: 'utf8'
    }).trim();
    
    expect(parseInt(tsFiles)).toBeGreaterThan(0);
  });
});