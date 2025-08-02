#!/usr/bin/env node

/**
 * UltimateWidget Comprehensive Test Runner
 * 
 * This script runs all UltimateWidget tests in the correct order:
 * 1. Unit tests
 * 2. Integration tests  
 * 3. E2E tests
 * 4. Performance tests
 * 5. Accessibility tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 300000, // 5 minutes
  retries: 2,
  parallel: false,
  reports: true
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    files: ['components/widget/design-system/**/*.test.ts', 'components/widget/design-system/**/*.test.tsx']
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    files: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx']
  },
  {
    name: 'E2E Bidirectional Communication',
    command: 'npx playwright test e2e/tests/ultimate-widget-bidirectional.spec.ts',
    files: ['e2e/tests/ultimate-widget-bidirectional.spec.ts']
  },
  {
    name: 'E2E Performance Tests',
    command: 'npx playwright test e2e/tests/ultimate-widget-performance.spec.ts',
    files: ['e2e/tests/ultimate-widget-performance.spec.ts']
  },
  {
    name: 'E2E Accessibility Tests',
    command: 'npx playwright test e2e/tests/ultimate-widget-accessibility.spec.ts',
    files: ['e2e/tests/ultimate-widget-accessibility.spec.ts']
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: []
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuite(name, status, duration) {
  const statusColor = status === 'PASSED' ? 'green' : status === 'FAILED' ? 'red' : 'yellow';
  const statusIcon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
  
  log(`${statusIcon} ${name} (${duration}ms)`, statusColor);
}

// Check if test files exist
function checkTestFiles(suite) {
  const missingFiles = [];
  
  for (const pattern of suite.files) {
    const files = glob.sync(pattern);
    if (files.length === 0) {
      missingFiles.push(pattern);
    }
  }
  
  return missingFiles;
}

// Run a single test suite
async function runTestSuite(suite) {
  const startTime = Date.now();
  
  try {
    log(`\n🚀 Running ${suite.name}...`, 'blue');
    
    // Check if test files exist
    const missingFiles = checkTestFiles(suite);
    if (missingFiles.length > 0) {
      log(`⚠️  Warning: Some test files not found:`, 'yellow');
      missingFiles.forEach(file => log(`   - ${file}`, 'yellow'));
    }
    
    // Run the test command
    const result = execSync(suite.command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: TEST_CONFIG.timeout
    });
    
    const duration = Date.now() - startTime;
    const status = 'PASSED';
    
    logSuite(suite.name, status, duration);
    results.passed++;
    results.total++;
    
    results.suites.push({
      name: suite.name,
      status,
      duration,
      output: result
    });
    
    return { status, duration, output: result };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const status = 'FAILED';
    
    logSuite(suite.name, status, duration);
    log(`Error: ${error.message}`, 'red');
    
    results.failed++;
    results.total++;
    
    results.suites.push({
      name: suite.name,
      status,
      duration,
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
    
    return { status, duration, error: error.message };
  }
}

// Generate test report
function generateReport() {
  logHeader('UltimateWidget Test Report');
  
  // Summary
  log(`\n📊 Summary:`, 'bright');
  log(`   Total Tests: ${results.total}`, 'cyan');
  log(`   Passed: ${results.passed}`, 'green');
  log(`   Failed: ${results.failed}`, 'red');
  log(`   Skipped: ${results.skipped}`, 'yellow');
  
  // Detailed results
  log(`\n📋 Detailed Results:`, 'bright');
  results.suites.forEach(suite => {
    const statusColor = suite.status === 'PASSED' ? 'green' : 'red';
    const statusIcon = suite.status === 'PASSED' ? '✅' : '❌';
    
    log(`${statusIcon} ${suite.name}`, statusColor);
    log(`   Duration: ${suite.duration}ms`);
    
    if (suite.error) {
      log(`   Error: ${suite.error}`, 'red');
    }
  });
  
  // Save report to file
  const reportPath = 'test-results/ultimate-widget-test-report.json';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  log(`\n📄 Report saved to: ${reportPath}`, 'cyan');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log(`\n❌ Some tests failed!`, 'red');
    process.exit(1);
  } else {
    log(`\n✅ All tests passed!`, 'green');
    process.exit(0);
  }
}

// Main execution
async function main() {
  try {
    logHeader('UltimateWidget Comprehensive Test Suite');
    log(`Starting test execution at ${new Date().toISOString()}`);
    log(`Configuration: ${JSON.stringify(TEST_CONFIG, null, 2)}`);
    
    // Run all test suites
    for (const suite of TEST_SUITES) {
      await runTestSuite(suite);
      
      // Add delay between suites
      if (TEST_SUITES.indexOf(suite) < TEST_SUITES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    log(`\n💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log(`\n⚠️  Test execution interrupted`, 'yellow');
  generateReport();
});

process.on('SIGTERM', () => {
  log(`\n⚠️  Test execution terminated`, 'yellow');
  generateReport();
});

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  generateReport,
  TEST_CONFIG,
  TEST_SUITES
}; 