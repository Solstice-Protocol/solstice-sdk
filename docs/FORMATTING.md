# Code Formatting Guide

This document describes the code formatting setup and guidelines for the Solstice Protocol SDK.

## Overview

The project uses [Prettier](https://prettier.io/) for consistent code formatting across all TypeScript, JavaScript, JSON, and Markdown files. Formatting is enforced through CI/CD pipeline checks that will fail if any files are not properly formatted.

## Configuration

### Prettier Configuration (`.prettierrc.js`)

```javascript
module.exports = {
  // Core formatting options
  semi: true,                    // Always use semicolons
  trailingComma: 'es5',         // Trailing commas where valid in ES5
  singleQuote: true,            // Use single quotes instead of double
  printWidth: 80,               // Line length limit
  tabWidth: 2,                  // 2 spaces per indentation level
  useTabs: false,               // Use spaces instead of tabs
  
  // TypeScript specific options
  parser: 'typescript',
  
  // File-specific overrides for different file types
  overrides: [
    // JSON files with wider print width
    {
      files: '*.json',
      options: {
        parser: 'json',
        printWidth: 120,
      },
    },
    // Markdown files with prose wrapping
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    // JavaScript files
    {
      files: '*.{js,jsx}',
      options: {
        parser: 'babel',
      },
    },
    // TypeScript files
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
      },
    },
  ],
};
```

### Ignored Files (`.prettierignore`)

The following files and directories are excluded from formatting:

- Build outputs (`dist/`, `build/`, `lib/`, `coverage/`)
- Dependencies (`node_modules/`)
- Generated files (`*.d.ts`, `*.min.js`, `*.bundle.js`)
- ZK Circuit files (`circuits/`, `*.zkey`, `*.r1cs`, `*.sym`, `*.wasm`)
- IDE and OS files (`.vscode/`, `.DS_Store`, etc.)
- Package manager lock files
- Documentation directories

## Available Scripts

### Format Code

```bash
# Format all source files
npm run format

# Check formatting without making changes
npm run format:check
```

### Script Details

- **`npm run format`**: Automatically formats all TypeScript, JavaScript, JSON, and Markdown files in the `src/` directory
- **`npm run format:check`**: Checks if files are properly formatted without making changes (used in CI)

## CI/CD Integration

### Formatting Verification Job

The CI pipeline includes a comprehensive formatting verification job that:

1. **Validates Configuration**: Ensures `.prettierrc.js` exists and is valid
2. **Checks All Files**: Verifies formatting for all source files
3. **Provides Detailed Reporting**: Shows exactly which files need formatting
4. **Fails on Inconsistencies**: Prevents builds from proceeding if formatting issues exist
5. **Additional Validations**: Checks for line ending consistency and trailing whitespace

### Workflow Integration

The formatting check runs as part of the quality gates in the CI pipeline:

```yaml
jobs:
  quality-gates:
    strategy:
      matrix:
        check: [typecheck, lint, format, audit]
```

### Error Reporting

When formatting issues are detected, the CI job provides:

- List of files that need formatting
- Exact commands to fix the issues
- File count summaries
- Clear instructions for local development

## Development Workflow

### Before Committing

1. **Check formatting**: `npm run format:check`
2. **Fix formatting**: `npm run format` (if needed)
3. **Commit formatted files**

### IDE Integration

#### VS Code

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

#### Other IDEs

Most modern IDEs support Prettier integration. Refer to the [Prettier documentation](https://prettier.io/docs/en/editors.html) for setup instructions.

## Formatting Rules

### TypeScript/JavaScript

- **Semicolons**: Always required
- **Quotes**: Single quotes preferred
- **Line Length**: 80 characters maximum
- **Indentation**: 2 spaces (no tabs)
- **Trailing Commas**: Used where valid in ES5

### JSON

- **Line Length**: 120 characters maximum
- **Indentation**: 2 spaces

### Markdown

- **Line Length**: 100 characters maximum
- **Prose Wrapping**: Always wrap prose

## Troubleshooting

### Common Issues

1. **"Prettier configuration not found"**
   - Ensure `.prettierrc.js` exists in the project root
   - Check that the file is valid JavaScript

2. **"Files not being formatted"**
   - Check if files are listed in `.prettierignore`
   - Verify file extensions are included in the format script pattern

3. **"CI formatting check fails"**
   - Run `npm run format:check` locally to see which files need formatting
   - Run `npm run format` to fix formatting issues
   - Commit the formatted files

### Manual Formatting

To format specific files or directories:

```bash
# Format specific file
npx prettier --write src/index.ts

# Format specific directory
npx prettier --write "src/utils/**/*.ts"

# Check specific files without formatting
npx prettier --check "src/**/*.ts"
```

## Best Practices

1. **Format Before Committing**: Always run formatting checks before committing code
2. **IDE Integration**: Set up your IDE to format on save
3. **Consistent Configuration**: Don't modify the Prettier configuration without team discussion
4. **Ignore Generated Files**: Add generated files to `.prettierignore`
5. **Review Formatted Changes**: Review formatting changes to ensure they don't affect logic

## Testing

The project includes tests to verify the formatting configuration:

```bash
# Run formatting configuration tests
npm test tests/formatting.test.js
```

These tests verify:
- Configuration files exist and are valid
- Required npm scripts are present
- Prettier can run without errors
- Source files exist for formatting

## Related Documentation

- [Prettier Official Documentation](https://prettier.io/docs/en/)
- [ESLint Integration](./LINTING.md)
- [CI/CD Pipeline](./CICD.md)
- [Development Setup](./DEVELOPMENT.md)