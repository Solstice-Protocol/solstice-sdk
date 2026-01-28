#!/usr/bin/env node

/**
 * GitHub Actions Workflow Validation Script
 * Validates workflow syntax and configuration
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Validate YAML syntax
 */
function validateYamlSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    yaml.load(content);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate workflow structure
 */
function validateWorkflowStructure(workflow, filename) {
  const issues = [];
  
  // Check required fields
  if (!workflow.name) {
    issues.push('Missing required field: name');
  }
  
  if (!workflow.on) {
    issues.push('Missing required field: on (triggers)');
  }
  
  if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
    issues.push('Missing or empty jobs section');
  }
  
  // Check job structure
  if (workflow.jobs) {
    Object.entries(workflow.jobs).forEach(([jobName, job]) => {
      // Skip validation for reusable workflow jobs
      if (job.uses) {
        return; // This is a reusable workflow call
      }
      
      if (!job['runs-on']) {
        issues.push(`Job '${jobName}' missing 'runs-on' field`);
      }
      
      if (!job.steps || !Array.isArray(job.steps) || job.steps.length === 0) {
        issues.push(`Job '${jobName}' missing or empty steps`);
      }
      
      // Check step structure
      if (job.steps) {
        job.steps.forEach((step, index) => {
          if (!step.name && !step.uses && !step.run) {
            issues.push(`Job '${jobName}' step ${index + 1} missing name, uses, or run`);
          }
        });
      }
    });
  }
  
  return issues;
}

/**
 * Validate workflow best practices
 */
function validateBestPractices(workflow, filename) {
  const suggestions = [];
  
  // Check for timeout settings
  if (workflow.jobs) {
    Object.entries(workflow.jobs).forEach(([jobName, job]) => {
      if (!job['timeout-minutes']) {
        suggestions.push(`Consider adding timeout-minutes to job '${jobName}'`);
      }
      
      // Check for proper checkout action
      if (job.steps) {
        const hasCheckout = job.steps.some(step => 
          step.uses && step.uses.includes('actions/checkout')
        );
        
        if (!hasCheckout && jobName !== 'ci-status' && jobName !== 'release-status') {
          suggestions.push(`Job '${jobName}' might need checkout action`);
        }
      }
    });
  }
  
  // Check for environment variables
  if (!workflow.env && filename.includes('ci.yml')) {
    suggestions.push('Consider defining common environment variables at workflow level');
  }
  
  return suggestions;
}

/**
 * Validate specific workflow requirements
 */
function validateWorkflowRequirements(workflow, filename) {
  const issues = [];
  
  if (filename.includes('ci.yml')) {
    // CI workflow specific validations
    if (!workflow.on.push && !workflow.on.pull_request) {
      issues.push('CI workflow should trigger on push and/or pull_request');
    }
    
    // Check for quality gates
    const hasQualityGates = workflow.jobs && Object.keys(workflow.jobs).some(job => 
      job.includes('quality') || job.includes('lint') || job.includes('test')
    );
    
    if (!hasQualityGates) {
      issues.push('CI workflow should include quality gates (linting, testing, etc.)');
    }
  }
  
  if (filename.includes('release.yml')) {
    // Release workflow specific validations
    if (!workflow.on.push || !workflow.on.push.tags) {
      issues.push('Release workflow should trigger on tag pushes');
    }
    
    const hasPublishJob = workflow.jobs && Object.keys(workflow.jobs).some(job => 
      job.includes('publish') || job.includes('release')
    );
    
    if (!hasPublishJob) {
      issues.push('Release workflow should include publishing/release job');
    }
  }
  
  if (filename.includes('security.yml')) {
    // Security workflow specific validations
    if (!workflow.on.schedule) {
      issues.push('Security workflow should include scheduled runs');
    }
  }
  
  return issues;
}

/**
 * Main validation function
 */
function validateWorkflows() {
  const workflowsDir = path.join(__dirname, '..', 'workflows');
  
  if (!fs.existsSync(workflowsDir)) {
    logError('Workflows directory not found');
    return false;
  }
  
  const workflowFiles = fs.readdirSync(workflowsDir)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
  
  if (workflowFiles.length === 0) {
    logError('No workflow files found');
    return false;
  }
  
  logInfo(`Found ${workflowFiles.length} workflow files`);
  console.log('');
  
  let allValid = true;
  
  workflowFiles.forEach(filename => {
    const filePath = path.join(workflowsDir, filename);
    
    log(`Validating ${filename}...`, 'cyan');
    
    // Validate YAML syntax
    const syntaxResult = validateYamlSyntax(filePath);
    if (!syntaxResult.valid) {
      logError(`YAML syntax error: ${syntaxResult.error}`);
      allValid = false;
      console.log('');
      return;
    }
    
    logSuccess('YAML syntax is valid');
    
    // Parse workflow
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = yaml.load(content);
    
    // Validate structure
    const structureIssues = validateWorkflowStructure(workflow, filename);
    if (structureIssues.length > 0) {
      logError('Structure issues found:');
      structureIssues.forEach(issue => console.log(`  - ${issue}`));
      allValid = false;
    } else {
      logSuccess('Workflow structure is valid');
    }
    
    // Validate requirements
    const requirementIssues = validateWorkflowRequirements(workflow, filename);
    if (requirementIssues.length > 0) {
      logError('Requirement issues found:');
      requirementIssues.forEach(issue => console.log(`  - ${issue}`));
      allValid = false;
    } else {
      logSuccess('Workflow requirements are met');
    }
    
    // Check best practices
    const suggestions = validateBestPractices(workflow, filename);
    if (suggestions.length > 0) {
      logWarning('Best practice suggestions:');
      suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
    }
    
    console.log('');
  });
  
  return allValid;
}

/**
 * Generate workflow summary
 */
function generateWorkflowSummary() {
  const workflowsDir = path.join(__dirname, '..', 'workflows');
  const workflowFiles = fs.readdirSync(workflowsDir)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
  
  logInfo('Workflow Summary:');
  console.log('================');
  
  workflowFiles.forEach(filename => {
    const filePath = path.join(workflowsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = yaml.load(content);
    
    console.log(`📄 ${filename}`);
    console.log(`   Name: ${workflow.name || 'Unnamed'}`);
    
    if (workflow.on) {
      const triggers = Object.keys(workflow.on).join(', ');
      console.log(`   Triggers: ${triggers}`);
    }
    
    if (workflow.jobs) {
      const jobCount = Object.keys(workflow.jobs).length;
      console.log(`   Jobs: ${jobCount}`);
    }
    
    console.log('');
  });
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'validate';
  
  switch (command) {
    case 'validate':
      log('🔍 Validating GitHub Actions workflows...', 'blue');
      console.log('');
      
      const isValid = validateWorkflows();
      
      if (isValid) {
        logSuccess('All workflows are valid! 🎉');
        process.exit(0);
      } else {
        logError('Workflow validation failed');
        process.exit(1);
      }
      break;
      
    case 'summary':
      generateWorkflowSummary();
      break;
      
    case 'help':
      console.log('Usage: node validate-workflows.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  validate  Validate all workflow files (default)');
      console.log('  summary   Show workflow summary');
      console.log('  help      Show this help message');
      break;
      
    default:
      logError(`Unknown command: ${command}`);
      console.log('Run "node validate-workflows.js help" for usage information');
      process.exit(1);
  }
}