#!/bin/bash

# Pipeline Setup and Validation Script
# This script helps set up and validate the CI/CD pipeline configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GITHUB_DIR="$REPO_ROOT/.github"

echo -e "${BLUE}🚀 Solstice Protocol SDK - Pipeline Setup Script${NC}"
echo "=================================================="
echo ""

# Function to print status messages
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate workflow syntax
validate_workflows() {
    print_status "Validating GitHub Actions workflow syntax..."
    
    local workflows_dir="$GITHUB_DIR/workflows"
    local validation_failed=false
    
    if ! command_exists yamllint; then
        print_warning "yamllint not found. Installing via pip..."
        pip install yamllint || {
            print_warning "Could not install yamllint. Skipping YAML validation."
            return 0
        }
    fi
    
    for workflow in "$workflows_dir"/*.yml; do
        if [ -f "$workflow" ]; then
            local filename=$(basename "$workflow")
            print_status "Validating $filename..."
            
            if yamllint "$workflow" >/dev/null 2>&1; then
                print_success "$filename syntax is valid"
            else
                print_error "$filename has syntax errors:"
                yamllint "$workflow"
                validation_failed=true
            fi
        fi
    done
    
    if [ "$validation_failed" = true ]; then
        print_error "Workflow validation failed. Please fix syntax errors."
        return 1
    else
        print_success "All workflows have valid syntax"
        return 0
    fi
}

# Function to check required files
check_required_files() {
    print_status "Checking required pipeline files..."
    
    local required_files=(
        ".github/workflows/ci.yml"
        ".github/workflows/release.yml"
        ".github/workflows/security.yml"
        ".github/workflows/docs.yml"
        ".github/workflows/dependencies.yml"
        ".github/pipeline-config.yml"
        ".github/env-template.yml"
        ".github/README.md"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$REPO_ROOT/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "All required pipeline files are present"
        return 0
    else
        print_error "Missing required files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
}

# Function to validate package.json configuration
validate_package_json() {
    print_status "Validating package.json configuration..."
    
    local package_json="$REPO_ROOT/package.json"
    
    if [ ! -f "$package_json" ]; then
        print_error "package.json not found"
        return 1
    fi
    
    # Check required scripts
    local required_scripts=("build" "test" "lint" "type-check")
    local missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if ! jq -e ".scripts.\"$script\"" "$package_json" >/dev/null 2>&1; then
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -eq 0 ]; then
        print_success "All required npm scripts are present"
    else
        print_warning "Missing recommended npm scripts:"
        for script in "${missing_scripts[@]}"; do
            echo "  - $script"
        done
    fi
    
    # Check package name format
    local package_name=$(jq -r '.name' "$package_json")
    if [[ "$package_name" =~ ^@[a-z0-9-]+/[a-z0-9-]+$ ]]; then
        print_success "Package name format is valid: $package_name"
    else
        print_warning "Package name should follow scoped format: @scope/package-name"
    fi
    
    return 0
}

# Function to check Node.js and npm versions
check_node_environment() {
    print_status "Checking Node.js environment..."
    
    if command_exists node; then
        local node_version=$(node --version)
        print_success "Node.js version: $node_version"
        
        # Check if Node.js version is supported
        local major_version=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
        if [ "$major_version" -ge 16 ]; then
            print_success "Node.js version is supported (>= 16)"
        else
            print_warning "Node.js version should be >= 16 for best compatibility"
        fi
    else
        print_error "Node.js not found. Please install Node.js >= 16"
        return 1
    fi
    
    if command_exists npm; then
        local npm_version=$(npm --version)
        print_success "npm version: $npm_version"
    else
        print_error "npm not found"
        return 1
    fi
    
    return 0
}

# Function to validate TypeScript configuration
validate_typescript_config() {
    print_status "Validating TypeScript configuration..."
    
    local tsconfig="$REPO_ROOT/tsconfig.json"
    
    if [ ! -f "$tsconfig" ]; then
        print_error "tsconfig.json not found"
        return 1
    fi
    
    # Check if TypeScript is installed
    if ! command_exists tsc && ! npm list typescript >/dev/null 2>&1; then
        print_warning "TypeScript not found in dependencies"
        return 1
    fi
    
    # Validate TypeScript configuration
    if cd "$REPO_ROOT" && npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
        print_success "TypeScript configuration is valid"
    else
        print_warning "TypeScript configuration may have issues"
        print_status "Run 'npm run type-check' to see detailed errors"
    fi
    
    return 0
}

# Function to check for ZK circuit files
check_circuit_files() {
    print_status "Checking for ZK circuit files..."
    
    local circuits_dir="$REPO_ROOT/circuits"
    
    if [ -d "$circuits_dir" ]; then
        local circuit_files=$(find "$circuits_dir" -name "*.zkey" -o -name "*.r1cs" -o -name "*.sym" 2>/dev/null | wc -l)
        
        if [ "$circuit_files" -gt 0 ]; then
            print_success "Found $circuit_files ZK circuit files"
            print_status "Circuit validation will be enabled in the pipeline"
        else
            print_warning "Circuits directory exists but no circuit files found"
            print_status "Circuit validation will be skipped"
        fi
    else
        print_status "No circuits directory found - circuit validation will be skipped"
    fi
    
    return 0
}

# Function to generate setup checklist
generate_setup_checklist() {
    print_status "Generating setup checklist..."
    
    cat > "$REPO_ROOT/PIPELINE_SETUP_CHECKLIST.md" << 'EOF'
# CI/CD Pipeline Setup Checklist

## ✅ Pre-Setup Validation
- [ ] All required pipeline files are present
- [ ] GitHub Actions workflow syntax is valid
- [ ] package.json has required scripts
- [ ] TypeScript configuration is valid
- [ ] Node.js environment is properly set up

## 🔐 Repository Secrets Configuration
Navigate to: Repository Settings > Secrets and variables > Actions

### Required Secrets
- [ ] `NPM_TOKEN` - NPM authentication token for package publishing
- [ ] `GITHUB_TOKEN` - Automatically provided by GitHub Actions

### Optional Secrets
- [ ] `SLACK_WEBHOOK_URL` - For Slack notifications
- [ ] `DISCORD_WEBHOOK_URL` - For Discord notifications
- [ ] `CODECOV_TOKEN` - For code coverage reporting

## ⚙️ Repository Variables Configuration
Navigate to: Repository Settings > Secrets and variables > Actions > Variables

### Recommended Variables
- [ ] `COVERAGE_THRESHOLD` - Set to `80` or desired percentage
- [ ] `SECURITY_SEVERITY_THRESHOLD` - Set to `high`
- [ ] `NODE_VERSION_MATRIX` - Set to `[16, 18, 20]`

## 🌍 Environment Configuration
Navigate to: Repository Settings > Environments

### Production Environment
- [ ] Create "production" environment
- [ ] Add required reviewers
- [ ] Configure deployment protection rules
- [ ] Add production-specific variables

### Staging Environment (Optional)
- [ ] Create "staging" environment
- [ ] Configure staging-specific variables

## 📄 GitHub Pages Setup
Navigate to: Repository Settings > Pages

- [ ] Enable GitHub Pages
- [ ] Set source to "GitHub Actions"
- [ ] Configure custom domain (if applicable)

## 🧪 Pipeline Testing
- [ ] Push a commit to trigger CI pipeline
- [ ] Verify all workflow jobs complete successfully
- [ ] Test security scanning workflow
- [ ] Test documentation generation
- [ ] Create a test release tag to verify release pipeline

## 📊 Monitoring Setup
- [ ] Enable repository vulnerability alerts
- [ ] Configure notification preferences
- [ ] Set up branch protection rules
- [ ] Enable required status checks

## 🔄 Maintenance Configuration
- [ ] Review dependency update schedule
- [ ] Configure automated security updates
- [ ] Set up monitoring and alerting
- [ ] Document custom procedures

## ✅ Final Verification
- [ ] All tests pass in CI
- [ ] Documentation builds and deploys correctly
- [ ] Security scans complete without critical issues
- [ ] Package can be built and published (test with dry-run)
- [ ] All team members have appropriate access

---

*Generated by pipeline setup script*
*Date: $(date)*
EOF

    print_success "Setup checklist generated: PIPELINE_SETUP_CHECKLIST.md"
}

# Function to run all validations
run_all_validations() {
    print_status "Running comprehensive pipeline validation..."
    echo ""
    
    local validation_results=()
    
    # Run all validation functions
    if check_required_files; then
        validation_results+=("✅ Required files check")
    else
        validation_results+=("❌ Required files check")
    fi
    
    if validate_workflows; then
        validation_results+=("✅ Workflow syntax validation")
    else
        validation_results+=("❌ Workflow syntax validation")
    fi
    
    if check_node_environment; then
        validation_results+=("✅ Node.js environment check")
    else
        validation_results+=("❌ Node.js environment check")
    fi
    
    if validate_package_json; then
        validation_results+=("✅ Package.json validation")
    else
        validation_results+=("❌ Package.json validation")
    fi
    
    if validate_typescript_config; then
        validation_results+=("✅ TypeScript configuration")
    else
        validation_results+=("❌ TypeScript configuration")
    fi
    
    if check_circuit_files; then
        validation_results+=("✅ ZK circuit files check")
    else
        validation_results+=("❌ ZK circuit files check")
    fi
    
    # Print results summary
    echo ""
    print_status "Validation Results Summary:"
    echo "=========================="
    for result in "${validation_results[@]}"; do
        echo "$result"
    done
    
    # Generate setup checklist
    generate_setup_checklist
    
    echo ""
    print_success "Pipeline validation completed!"
    print_status "Next steps:"
    echo "1. Review PIPELINE_SETUP_CHECKLIST.md"
    echo "2. Configure repository secrets and variables"
    echo "3. Test the pipeline with a commit or PR"
    echo "4. Review .github/README.md for detailed documentation"
}

# Main script execution
main() {
    case "${1:-validate}" in
        "validate"|"")
            run_all_validations
            ;;
        "workflows")
            validate_workflows
            ;;
        "files")
            check_required_files
            ;;
        "node")
            check_node_environment
            ;;
        "package")
            validate_package_json
            ;;
        "typescript")
            validate_typescript_config
            ;;
        "circuits")
            check_circuit_files
            ;;
        "checklist")
            generate_setup_checklist
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  validate    Run all validations (default)"
            echo "  workflows   Validate workflow syntax"
            echo "  files       Check required files"
            echo "  node        Check Node.js environment"
            echo "  package     Validate package.json"
            echo "  typescript  Validate TypeScript config"
            echo "  circuits    Check ZK circuit files"
            echo "  checklist   Generate setup checklist"
            echo "  help        Show this help message"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"