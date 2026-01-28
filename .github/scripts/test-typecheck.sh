#!/bin/bash

# Test script for TypeScript type checking workflow
# This script validates that the type checking properly fails on compilation errors

set -e

echo "🧪 Testing TypeScript type checking workflow..."

# Save original index.ts
cp src/index.ts src/index.ts.backup

# Test 1: Verify type checking passes with valid code
echo "Test 1: Verifying type checking passes with valid code..."
npm run type-check
echo "✅ Test 1 passed: Type checking succeeds with valid code"

# Test 2: Verify type checking fails with type errors
echo "Test 2: Verifying type checking fails with type errors..."
echo "const typeError: string = 123;" >> src/index.ts

if npm run type-check 2>/dev/null; then
    echo "❌ Test 2 failed: Type checking should have failed but didn't"
    # Restore original file
    mv src/index.ts.backup src/index.ts
    exit 1
else
    echo "✅ Test 2 passed: Type checking correctly failed with type errors"
fi

# Restore original file
mv src/index.ts.backup src/index.ts

# Test 3: Verify type checking passes again after fixing errors
echo "Test 3: Verifying type checking passes after fixing errors..."
npm run type-check
echo "✅ Test 3 passed: Type checking succeeds after fixing errors"

echo "🎉 All TypeScript type checking tests passed!"