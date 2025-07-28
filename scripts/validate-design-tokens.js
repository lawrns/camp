#!/usr/bin/env node

/**
 * Design Token Validation Script
 * Scans the codebase for invalid token usage and provides fixes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Invalid token patterns to detect
const INVALID_PATTERNS = [
  {
    pattern: /gap-spacing-(sm|md|lg|xl)/g,
    fix: (match) => {
      const sizeMap = { sm: '2', md: '4', lg: '6', xl: '8' };
      const size = match.split('-')[2];
      return `gap-ds-${sizeMap[size] || '4'}`;
    },
    description: 'Invalid spacing gap pattern'
  },
  {
    pattern: /px-ds-spacing-(\d+)/g,
    fix: (match) => {
      const num = match.split('-')[3];
      return `px-ds-${num}`;
    },
    description: 'Invalid padding-x pattern'
  },
  {
    pattern: /py-ds-spacing-(\d+)/g,
    fix: (match) => {
      const num = match.split('-')[3];
      return `py-ds-${num}`;
    },
    description: 'Invalid padding-y pattern'
  },
  {
    pattern: /p-ds-spacing-(\d+)/g,
    fix: (match) => {
      const num = match.split('-')[3];
      return `p-ds-${num}`;
    },
    description: 'Invalid padding pattern'
  },
  {
    pattern: /m-ds-spacing-(\d+)/g,
    fix: (match) => {
      const num = match.split('-')[3];
      return `m-ds-${num}`;
    },
    description: 'Invalid margin pattern'
  },
  {
    pattern: /radius-(sm|md|lg|xl|full)/g,
    fix: (match) => {
      const size = match.split('-')[1];
      return `rounded-ds-${size}`;
    },
    description: 'Invalid border radius pattern'
  },
  {
    pattern: /text-(small|h\d+)/g,
    fix: (match) => {
      const sizeMap = { 
        small: 'sm', 
        h1: '4xl', 
        h2: '3xl', 
        h3: 'lg', 
        h4: 'base', 
        h5: 'sm', 
        h6: 'xs' 
      };
      const size = match.split('-')[1];
      return `text-${sizeMap[size] || 'base'}`;
    },
    description: 'Invalid text size pattern'
  },
  {
    pattern: /text-ds-text/g,
    fix: () => 'text-foreground',
    description: 'Invalid text color pattern'
  },
  {
    pattern: /leading-typography-(relaxed|tight|normal)/g,
    fix: (match) => {
      const style = match.split('-')[2];
      return `leading-${style}`;
    },
    description: 'Invalid line height pattern'
  },
  {
    pattern: /bg-ds-(brand|surface|background)(-\w+)?/g,
    fix: (match) => {
      if (match.includes('brand')) return 'bg-primary';
      if (match.includes('surface')) return 'bg-background';
      if (match.includes('background')) return 'bg-background';
      return 'bg-background';
    },
    description: 'Invalid background color pattern'
  }
];

// Files to scan
const SCAN_PATTERNS = [
  'components/**/*.{tsx,ts,jsx,js}',
  'app/**/*.{tsx,ts,jsx,js}',
  'src/**/*.{tsx,ts,jsx,js}',
  'pages/**/*.{tsx,ts,jsx,js}',
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  '**/*.test.{ts,tsx,js,jsx}',
  '**/*.spec.{ts,tsx,js,jsx}',
];

class TokenValidator {
  constructor() {
    this.issues = [];
    this.fixedFiles = new Set();
  }

  async validate(options = {}) {
    const { fix = false, verbose = false } = options;
    
    console.log('🔍 Scanning for invalid design tokens...\n');
    
    const files = this.getFilesToScan();
    
    for (const file of files) {
      await this.validateFile(file, { fix, verbose });
    }
    
    this.printReport();
    
    if (fix && this.fixedFiles.size > 0) {
      console.log(`\n✅ Fixed ${this.fixedFiles.size} files`);
      console.log('🔧 Run your linter to ensure proper formatting');
    }
    
    return this.issues.length === 0;
  }

  getFilesToScan() {
    const allFiles = [];
    
    for (const pattern of SCAN_PATTERNS) {
      const files = glob.sync(pattern, {
        ignore: EXCLUDE_PATTERNS,
        cwd: process.cwd(),
      });
      allFiles.push(...files);
    }
    
    return [...new Set(allFiles)]; // Remove duplicates
  }

  async validateFile(filePath, options = {}) {
    const { fix = false, verbose = false } = options;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let hasChanges = false;
      
      for (const { pattern, fix: fixFn, description } of INVALID_PATTERNS) {
        const matches = [...content.matchAll(pattern)];
        
        if (matches.length > 0) {
          for (const match of matches) {
            const issue = {
              file: filePath,
              line: this.getLineNumber(content, match.index),
              column: this.getColumnNumber(content, match.index),
              token: match[0],
              description,
              fix: fixFn(match[0]),
            };
            
            this.issues.push(issue);
            
            if (verbose) {
              console.log(`❌ ${filePath}:${issue.line}:${issue.column} - ${issue.token} (${description})`);
            }
            
            if (fix) {
              updatedContent = updatedContent.replace(match[0], issue.fix);
              hasChanges = true;
            }
          }
        }
      }
      
      if (fix && hasChanges) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        this.fixedFiles.add(filePath);
      }
      
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getColumnNumber(content, index) {
    const lines = content.substring(0, index).split('\n');
    return lines[lines.length - 1].length + 1;
  }

  printReport() {
    if (this.issues.length === 0) {
      console.log('✅ No invalid design tokens found!');
      return;
    }
    
    console.log(`\n📊 Found ${this.issues.length} invalid token usage(s):\n`);
    
    // Group issues by file
    const issuesByFile = this.issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {});
    
    Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
      console.log(`📄 ${file}:`);
      fileIssues.forEach(issue => {
        console.log(`  ❌ Line ${issue.line}: "${issue.token}" → "${issue.fix}"`);
        console.log(`     ${issue.description}`);
      });
      console.log();
    });
    
    console.log('💡 Run with --fix to automatically fix these issues');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Design Token Validator

Usage:
  node scripts/validate-design-tokens.js [options]

Options:
  --fix       Automatically fix invalid tokens
  --verbose   Show detailed output
  --help      Show this help message

Examples:
  node scripts/validate-design-tokens.js
  node scripts/validate-design-tokens.js --fix
  node scripts/validate-design-tokens.js --verbose --fix
`);
    return;
  }
  
  const validator = new TokenValidator();
  const success = await validator.validate({ fix, verbose });
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { TokenValidator };
