#!/bin/bash

# Production Preparation Script
# Fixes critical issues to make the CI/CD pipeline production-ready

set -e

echo "🚀 Preparing CI/CD Pipeline for Production"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Fix auto-fixable linting errors
print_status "Step 1: Fixing auto-fixable ESLint errors..."
if npm run lint:fix; then
    print_success "Auto-fixable linting errors resolved"
else
    print_warning "Some linting errors require manual fixing"
fi

# Step 2: Format all code
print_status "Step 2: Formatting all source code..."
if npm run format; then
    print_success "Code formatting completed"
else
    print_error "Code formatting failed"
    exit 1
fi

# Step 3: Check remaining issues
print_status "Step 3: Checking remaining quality issues..."

echo ""
echo "📊 Quality Status Check:"
echo "========================"

# Check TypeScript
print_status "Checking TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
    print_success "TypeScript: PASSED"
else
    print_error "TypeScript: FAILED - compilation errors remain"
fi

# Check linting
print_status "Checking ESLint status..."
LINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || echo "0")
LINT_WARNINGS=$(npm run lint 2>&1 | grep -c "warning" || echo "0")

if [ "$LINT_ERRORS" -eq 0 ]; then
    print_success "ESLint: PASSED (0 errors, $LINT_WARNINGS warnings)"
else
    print_error "ESLint: FAILED ($LINT_ERRORS errors, $LINT_WARNINGS warnings)"
fi

# Check formatting
print_status "Checking code formatting..."
if npm run format:check > /dev/null 2>&1; then
    print_success "Formatting: PASSED"
else
    print_error "Formatting: FAILED - inconsistencies remain"
fi

# Check tests
print_status "Checking test status..."
TEST_RESULT=$(npm test 2>&1 || echo "FAILED")
if echo "$TEST_RESULT" | grep -q "Tests:.*failed"; then
    FAILED_TESTS=$(echo "$TEST_RESULT" | grep -o "[0-9]* failed" | grep -o "[0-9]*" || echo "unknown")
    print_error "Tests: FAILED ($FAILED_TESTS failing tests)"
else
    print_success "Tests: PASSED"
fi

# Check coverage
print_status "Checking code coverage..."
COVERAGE_RESULT=$(npm run test:coverage 2>&1 || echo "FAILED")
if echo "$COVERAGE_RESULT" | grep -q "Coverage threshold"; then
    print_error "Coverage: FAILED (below 80% threshold)"
else
    print_success "Coverage: PASSED (meets 80% threshold)"
fi

echo ""
echo "🎯 Production Readiness Summary:"
echo "================================"

# Determine overall status
READY=true

if [ "$LINT_ERRORS" -gt 0 ]; then
    print_error "❌ Linting errors must be fixed"
    READY=false
fi

if ! npm run type-check > /dev/null 2>&1; then
    print_error "❌ TypeScript compilation errors must be fixed"
    READY=false
fi

if ! npm run format:check > /dev/null 2>&1; then
    print_error "❌ Code formatting issues must be resolved"
    READY=false
fi

if echo "$TEST_RESULT" | grep -q "failed"; then
    print_error "❌ Failing tests must be fixed"
    READY=false
fi

if echo "$COVERAGE_RESULT" | grep -q "Coverage threshold"; then
    print_error "❌ Code coverage must reach 80%"
    READY=false
fi

echo ""
if [ "$READY" = true ]; then
    print_success "🎉 Pipeline is PRODUCTION READY!"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push changes"
    echo "2. Configure repository secrets (see CICD_SETUP.md)"
    echo "3. Test the pipeline with a commit"
    echo "4. Create a release tag to test publishing"
else
    print_warning "⚠️  Pipeline is NOT production ready"
    echo ""
    echo "Required fixes:"
    echo "1. Fix remaining linting errors: npm run lint"
    echo "2. Fix TypeScript errors: npm run type-check"
    echo "3. Fix failing tests: npm test"
    echo "4. Improve test coverage: npm run test:coverage"
    echo "5. Run this script again: ./.github/scripts/prepare-production.sh"
fi

echo ""
echo "📚 For detailed setup instructions, see: CICD_SETUP.md"