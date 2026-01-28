# CI/CD Pipeline Setup Guide

## 🚀 Production-Ready CI/CD Pipeline

This repository now includes a comprehensive CI/CD pipeline built with GitHub Actions. The pipeline enforces code quality, security, and automated deployment.

## 📋 Setup Checklist

### 1. Repository Secrets (Required)

Navigate to: **Repository Settings > Secrets and variables > Actions**

#### Required Secrets:
- `NPM_TOKEN` - NPM authentication token for package publishing
  - Get from: [npmjs.com](https://www.npmjs.com) > Account Settings > Access Tokens
  - Type: "Automation" token

#### Optional Secrets:
- `CODECOV_TOKEN` - For coverage reporting
- `SLACK_WEBHOOK_URL` - For Slack notifications
- `DISCORD_WEBHOOK_URL` - For Discord notifications

### 2. Repository Variables

Set these in: **Repository Settings > Secrets and variables > Actions > Variables**

```
COVERAGE_THRESHOLD=80
SECURITY_SEVERITY_THRESHOLD=high
NODE_VERSION_MATRIX=[16, 18, 20]
```

### 3. GitHub Pages Setup

1. Go to **Repository Settings > Pages**
2. Set source to **"GitHub Actions"**
3. Documentation will auto-deploy on main branch changes

### 4. Environment Protection (Production)

1. Go to **Repository Settings > Environments**
2. Create **"production"** environment
3. Add required reviewers for production deployments
4. Configure deployment protection rules

## 🔧 Pipeline Features

### Quality Gates
- ✅ TypeScript type checking (strict mode)
- ✅ ESLint code quality checks
- ✅ Prettier formatting verification
- ✅ Code coverage validation (80% threshold)
- ✅ Dependency vulnerability scanning

### Multi-Environment Testing
- ✅ Node.js versions: 16, 18, 20
- ✅ Platforms: Ubuntu, macOS, Windows
- ✅ ZK circuit validation
- ✅ Integration testing

### Security & Compliance
- ✅ Daily security scans
- ✅ License compliance checking
- ✅ CodeQL static analysis
- ✅ Dependency vulnerability monitoring

### Automated Deployment
- ✅ NPM package publishing on version tags
- ✅ GitHub releases with changelogs
- ✅ Documentation deployment
- ✅ Staging/production environments

## 🚦 Current Status

### ⚠️ Known Issues (Pre-Production)
1. **Test Coverage**: Currently 9.43% (needs 80%)
2. **ESLint Errors**: 519 linting errors need fixing
3. **Test Failures**: 19 failing tests need resolution

### 🔧 To Make Production Ready:

1. **Fix Linting Errors**:
   ```bash
   npm run lint:fix
   # Review and fix remaining errors manually
   ```

2. **Improve Test Coverage**:
   ```bash
   npm run test:coverage
   # Add tests for uncovered code
   ```

3. **Fix Failing Tests**:
   ```bash
   npm test
   # Debug and fix failing tests
   ```

## 🎯 Usage

### Development Workflow
```bash
# Before committing
npm run type-check    # Check TypeScript
npm run lint         # Check code quality
npm run format:check # Check formatting
npm run test         # Run tests
npm run build        # Verify build
```

### Release Process
```bash
# Create a new release
git tag v1.2.0
git push origin v1.2.0
# Pipeline automatically publishes to npm
```

### Local Testing
```bash
# Test individual pipeline components
./.github/scripts/test-eslint-workflow.sh
./.github/scripts/test-coverage-workflow.sh
./.github/scripts/setup-pipeline.sh validate
```

## 📊 Pipeline Workflows

1. **CI Pipeline** (`ci.yml`) - Runs on push/PR
2. **Release Pipeline** (`release.yml`) - Runs on version tags
3. **Security Pipeline** (`security.yml`) - Daily scans
4. **Documentation Pipeline** (`docs.yml`) - Updates docs
5. **Dependencies Pipeline** (`dependencies.yml`) - Weekly updates

## 🔍 Monitoring

- **GitHub Actions**: View pipeline status in Actions tab
- **Codecov**: Coverage reports and trends
- **Security Alerts**: Automated vulnerability notifications
- **Release Notes**: Auto-generated changelogs

## 🆘 Troubleshooting

### Pipeline Failures
1. Check the Actions tab for detailed logs
2. Review the specific job that failed
3. Run the equivalent command locally
4. Fix the issue and push again

### Common Issues
- **NPM Publish Fails**: Check NPM_TOKEN validity
- **Tests Fail**: Ensure all dependencies are installed
- **Security Scan Fails**: Review and fix vulnerabilities
- **Coverage Fails**: Add tests to meet 80% threshold

## 📚 Documentation

- **Pipeline Details**: `.github/README.md`
- **Setup Script**: `.github/scripts/setup-pipeline.sh`
- **Environment Template**: `.github/env-template.yml`
- **Formatting Guide**: `docs/FORMATTING.md`

---

**Status**: 🟡 **Pre-Production** (needs quality fixes)
**Next Steps**: Fix linting errors, improve test coverage, resolve test failures
**ETA to Production**: After quality gates pass