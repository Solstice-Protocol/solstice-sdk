#!/bin/bash

# Validate TypeScript configuration for comprehensive type checking
# This script ensures the TypeScript configuration is set up to catch all compilation errors

set -e

echo "🔧 Validating TypeScript configuration..."

# Check if tsconfig.json exists
if [ ! -f "tsconfig.json" ]; then
    echo "❌ tsconfig.json not found"
    exit 1
fi

# Check for strict mode
if ! grep -q '"strict": true' tsconfig.json; then
    echo "❌ TypeScript strict mode is not enabled"
    exit 1
fi

echo "✅ TypeScript strict mode is enabled"

# Check for noEmit in type-check script
if ! grep -q 'tsc --noEmit' package.json; then
    echo "❌ type-check script should use --noEmit flag"
    exit 1
fi

echo "✅ type-check script uses --noEmit flag"

# Validate that all TypeScript files are included
echo "📁 TypeScript files found:"
find src -name '*.ts' -not -path '*/node_modules/*' | sort

# Check TypeScript compiler options
echo ""
echo "🔍 Key TypeScript compiler options:"
npx tsc --showConfig | grep -E '"(strict|noImplicitAny|strictNullChecks|noImplicitReturns|noFallthroughCasesInSwitch)"'

echo ""
echo "✅ TypeScript configuration validation completed successfully"