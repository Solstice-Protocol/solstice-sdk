#!/bin/bash

# Test script for ESLint workflow
# This simulates the enhanced ESLint job from the CI workflow

set -e

echo "🔍 Running ESLint code quality checks..."
echo "ESLint version: $(npx eslint --version)"

# Validate ESLint configuration exists and is valid
echo "🔧 Validating ESLint configuration..."
if [ ! -f ".eslintrc.js" ]; then
  echo "❌ ERROR: .eslintrc.js not found - ESLint configuration is required"
  exit 1
fi

# Verify ESLint configuration is parseable
echo "🔧 Validating ESLint configuration syntax..."
if ! npx eslint --print-config src/index.ts > /dev/null 2>&1; then
  echo "❌ ERROR: Invalid ESLint configuration detected"
  npx eslint --print-config src/index.ts
  exit 1
fi
echo "✅ ESLint configuration is valid"

# Show configuration summary for debugging
echo "📋 ESLint configuration summary:"
echo "Parser: $(npx eslint --print-config src/index.ts | grep -o '"parser":[^,]*' | head -1)"
echo "Extends: $(npx eslint --print-config src/index.ts | grep -o '"extends":\[[^\]]*\]' | head -1)"
echo ""

# Count TypeScript files to be linted
TS_FILE_COUNT=$(find src -name '*.ts' -o -name '*.tsx' | wc -l)
echo "📊 Found $TS_FILE_COUNT TypeScript files to lint"

# Run ESLint with detailed error reporting
echo "🔍 Running comprehensive ESLint checks on all TypeScript files..."
echo "This will fail the build if ANY linting errors are found"
echo "Warnings are allowed but will be reported"

# Create output file for detailed reporting
ESLINT_OUTPUT_FILE="eslint-results.txt"

# Run ESLint and capture output
if npm run lint -- --format=stylish --output-file="$ESLINT_OUTPUT_FILE" 2>&1; then
  echo ""
  echo "✅ SUCCESS: ESLint completed successfully"
  echo "✅ All $TS_FILE_COUNT TypeScript files passed linting checks"
  echo "✅ No linting errors found - build can proceed safely"
  
  # Show any warnings if they exist
  if [ -f "$ESLINT_OUTPUT_FILE" ] && [ -s "$ESLINT_OUTPUT_FILE" ]; then
    echo ""
    echo "⚠️  ESLint warnings (non-blocking):"
    echo "=================================================="
    cat "$ESLINT_OUTPUT_FILE"
    echo "=================================================="
    echo ""
    echo "💡 Consider fixing these warnings to improve code quality"
  fi
else
  echo ""
  echo "❌ CRITICAL ERROR: ESLint found linting errors!"
  echo "The following linting errors must be fixed before proceeding:"
  echo "=================================================="
  
  # Show detailed error output
  if [ -f "$ESLINT_OUTPUT_FILE" ]; then
    cat "$ESLINT_OUTPUT_FILE"
  else
    npm run lint -- --format=stylish 2>&1 || true
  fi
  
  echo "=================================================="
  echo ""
  echo "💡 To fix these errors locally, run: npm run lint"
  echo "💡 To auto-fix some errors, run: npm run lint:fix"
  echo "💡 Ensure all TypeScript files follow the project's linting rules"
  
  # Count errors and warnings for summary
  if [ -f "$ESLINT_OUTPUT_FILE" ]; then
    ERROR_COUNT=$(grep -c "error" "$ESLINT_OUTPUT_FILE" 2>/dev/null || echo "0")
    WARNING_COUNT=$(grep -c "warning" "$ESLINT_OUTPUT_FILE" 2>/dev/null || echo "0")
    echo ""
    echo "📊 Summary: $ERROR_COUNT errors, $WARNING_COUNT warnings found"
    echo "🔒 Code quality gate: FAILED - Linting errors must be resolved"
  fi
  
  exit 1
fi

# Clean up temporary files
rm -f "$ESLINT_OUTPUT_FILE"

echo ""
echo "🎉 ESLint workflow completed successfully!"
echo "🔒 Code quality gate: PASSED - No linting errors detected"