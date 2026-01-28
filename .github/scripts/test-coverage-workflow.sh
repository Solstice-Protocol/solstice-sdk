#!/bin/bash

# Test script for code coverage workflow
# This simulates the enhanced coverage job from the CI workflow

set -e

echo "📊 Running comprehensive code coverage analysis..."
echo "Jest version: $(npx jest --version)"

# Validate Jest configuration exists and is valid
echo "🔧 Validating Jest configuration..."
if [ ! -f "jest.config.js" ]; then
  echo "❌ ERROR: jest.config.js not found - Jest configuration is required"
  exit 1
fi

# Verify Jest configuration is parseable
echo "🔧 Validating Jest configuration syntax..."
if ! node -e "require('./jest.config.js')" > /dev/null 2>&1; then
  echo "❌ ERROR: Invalid Jest configuration detected"
  node -e "require('./jest.config.js')" 2>&1 || true
  exit 1
fi
echo "✅ Jest configuration is valid"

# Show coverage configuration
echo "📋 Coverage configuration:"
echo "Threshold: $(node -e "console.log(JSON.stringify(require('./jest.config.js').coverageThreshold.global, null, 2))")"
echo "Coverage Directory: $(node -e "console.log(require('./jest.config.js').coverageDirectory)")"
echo "Coverage Reporters: $(node -e "console.log(JSON.stringify(require('./jest.config.js').coverageReporters, null, 2))")"
echo ""

# Count test and source files
TEST_FILE_COUNT=$(find tests -name '*.test.ts' -o -name '*.test.js' -o -name '*.spec.ts' -o -name '*.spec.js' 2>/dev/null | wc -l)
SOURCE_FILE_COUNT=$(find src -name '*.ts' -o -name '*.tsx' | grep -v '\.d\.ts$' | wc -l)
echo "📊 Found $TEST_FILE_COUNT test files covering $SOURCE_FILE_COUNT source files"

# Clear previous coverage data
echo "🧹 Clearing previous coverage data..."
rm -rf coverage/

# Run tests with coverage
echo "🧪 Running tests with comprehensive coverage analysis..."
echo "This will fail if coverage falls below the 80% threshold"

if npm run test:coverage-ci 2>&1; then
  echo ""
  echo "✅ SUCCESS: Tests completed successfully"
  
  # Parse and validate coverage results
  if [ -f "coverage/coverage-summary.json" ]; then
    echo ""
    echo "📊 Coverage Summary:"
    echo "=================================================="
    
    # Extract coverage percentages
    LINES_PCT=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
    FUNCTIONS_PCT=$(node -e "console.log(require('./coverage/coverage-summary.json').total.functions.pct)")
    BRANCHES_PCT=$(node -e "console.log(require('./coverage/coverage-summary.json').total.branches.pct)")
    STATEMENTS_PCT=$(node -e "console.log(require('./coverage/coverage-summary.json').total.statements.pct)")
    
    echo "Lines:      ${LINES_PCT}%"
    echo "Functions:  ${FUNCTIONS_PCT}%"
    echo "Branches:   ${BRANCHES_PCT}%"
    echo "Statements: ${STATEMENTS_PCT}%"
    echo "=================================================="
    
    # Check if coverage meets threshold (80%)
    THRESHOLD=80
    COVERAGE_FAILED=false
    
    if (( $(echo "$LINES_PCT < $THRESHOLD" | bc -l) )); then
      echo "❌ Lines coverage ($LINES_PCT%) is below threshold ($THRESHOLD%)"
      COVERAGE_FAILED=true
    fi
    
    if (( $(echo "$FUNCTIONS_PCT < $THRESHOLD" | bc -l) )); then
      echo "❌ Functions coverage ($FUNCTIONS_PCT%) is below threshold ($THRESHOLD%)"
      COVERAGE_FAILED=true
    fi
    
    if (( $(echo "$BRANCHES_PCT < $THRESHOLD" | bc -l) )); then
      echo "❌ Branches coverage ($BRANCHES_PCT%) is below threshold ($THRESHOLD%)"
      COVERAGE_FAILED=true
    fi
    
    if (( $(echo "$STATEMENTS_PCT < $THRESHOLD" | bc -l) )); then
      echo "❌ Statements coverage ($STATEMENTS_PCT%) is below threshold ($THRESHOLD%)"
      COVERAGE_FAILED=true
    fi
    
    if [ "$COVERAGE_FAILED" = true ]; then
      echo ""
      echo "❌ CRITICAL ERROR: Code coverage below required threshold!"
      echo "💡 To improve coverage locally:"
      echo "   npm run test:coverage          # Run tests with coverage"
      echo "   npm run test:watch             # Run in watch mode"
      echo "   open coverage/lcov-report/index.html  # View detailed HTML report"
      echo ""
      echo "📋 Coverage improvement suggestions:"
      echo "   - Add tests for uncovered functions and branches"
      echo "   - Remove unused code that cannot be tested"
      echo "   - Consider integration tests for complex workflows"
      echo ""
      echo "🔒 Code quality gate: FAILED - Coverage must be at least $THRESHOLD%"
      exit 1
    else
      echo ""
      echo "✅ All coverage metrics meet the $THRESHOLD% threshold"
      echo "✅ Code coverage validation passed"
    fi
    
    # Show coverage file information
    echo ""
    echo "📁 Coverage artifacts generated:"
    if [ -f "coverage/lcov.info" ]; then
      echo "   ✅ LCOV report: coverage/lcov.info"
    fi
    if [ -d "coverage/lcov-report" ]; then
      echo "   ✅ HTML report: coverage/lcov-report/index.html"
    fi
    if [ -f "coverage/coverage-final.json" ]; then
      echo "   ✅ JSON report: coverage/coverage-final.json"
    fi
    
  else
    echo "❌ ERROR: Coverage summary not found - this indicates test execution issues"
    echo "💡 Check that tests are running correctly and Jest is configured properly"
    exit 1
  fi
else
  echo ""
  echo "❌ CRITICAL ERROR: Tests failed during coverage analysis!"
  echo "Coverage validation cannot proceed with failing tests"
  echo ""
  echo "💡 To fix test failures locally:"
  echo "   npm test                    # Run tests without coverage"
  echo "   npm test -- --verbose       # Run with detailed output"
  echo "   npm run test:watch          # Run in watch mode"
  echo ""
  echo "🔒 Code quality gate: FAILED - Tests must pass for coverage validation"
  exit 1
fi

echo ""
echo "🎉 Code coverage validation completed successfully!"
echo "🔒 Code quality gate: PASSED - Coverage meets all thresholds"
echo ""
echo "📊 Summary:"
echo "   - $TEST_FILE_COUNT test files executed"
echo "   - $SOURCE_FILE_COUNT source files analyzed"
echo "   - All coverage metrics ≥ $THRESHOLD%"
echo "   - Coverage reports generated in coverage/ directory"