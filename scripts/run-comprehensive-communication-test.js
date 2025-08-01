#!/usr/bin/env node

/**
 * Comprehensive Communication Test Runner
 * Executes the complete widget-dashboard communication test with detailed reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  TEST_FILE: 'e2e/tests/comprehensive/widget-dashboard-communication.spec.ts',
  REPORT_DIR: 'e2e/reports',
  TIMEOUT: 300000, // 5 minutes
  RETRIES: 1
};

class ComprehensiveTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      success: false,
      duration: 0,
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  async run() {
    console.log('🚀 Starting Comprehensive Widget-Dashboard Communication Test');
    console.log('='.repeat(80));
    console.log(`📁 Test File: ${TEST_CONFIG.TEST_FILE}`);
    console.log(`⏱️  Timeout: ${TEST_CONFIG.TIMEOUT / 1000}s`);
    console.log(`🔄 Retries: ${TEST_CONFIG.RETRIES}`);
    console.log('='.repeat(80));

    try {
      // Ensure report directory exists
      this.ensureReportDirectory();

      // Pre-flight checks
      await this.preflightChecks();

      // Run the test
      await this.executeTest();

      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      this.results.errors.push(error.message);
    } finally {
      this.results.duration = Date.now() - this.startTime;
      this.displaySummary();
    }
  }

  ensureReportDirectory() {
    const reportDir = path.join(process.cwd(), TEST_CONFIG.REPORT_DIR);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
      console.log(`📁 Created report directory: ${reportDir}`);
    }
  }

  async preflightChecks() {
    console.log('\n🔍 Running pre-flight checks...');

    // Check if test file exists
    const testFilePath = path.join(process.cwd(), TEST_CONFIG.TEST_FILE);
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${TEST_CONFIG.TEST_FILE}`);
    }
    console.log('✅ Test file exists');

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.results.warnings.push(`Missing environment variable: ${envVar}`);
        console.log(`⚠️  Missing environment variable: ${envVar}`);
      } else {
        console.log(`✅ Environment variable set: ${envVar}`);
      }
    }

    // Check if server is running
    const ports = [3001, 3000, 3005]; // Prioritize 3001
    let serverFound = false;

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/widget-demo`);
        if (response.ok) {
          console.log(`✅ Development server is running on port ${port}`);
          serverFound = true;
          break;
        }
      } catch (error) {
        // Continue to next port
      }
    }

    if (!serverFound) {
      this.results.warnings.push('Cannot connect to development server');
      console.log('⚠️  Cannot connect to development server on any common port');
    }

    console.log('✅ Pre-flight checks completed');
  }

  async executeTest() {
    console.log('\n🧪 Executing comprehensive communication test...');

    return new Promise((resolve, reject) => {
      const playwrightArgs = [
        'test',
        TEST_CONFIG.TEST_FILE,
        '--timeout', TEST_CONFIG.TIMEOUT.toString(),
        '--retries', TEST_CONFIG.RETRIES.toString(),
        '--reporter=list',
        '--output', path.join(TEST_CONFIG.REPORT_DIR, 'test-results')
      ];

      console.log(`📋 Command: npx playwright ${playwrightArgs.join(' ')}`);

      const testProcess = spawn('npx', ['playwright', ...playwrightArgs], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      testProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      testProcess.on('close', (code) => {
        this.results.success = code === 0;
        
        if (code === 0) {
          console.log('\n✅ Test execution completed successfully');
          this.parseTestOutput(stdout);
          resolve();
        } else {
          console.log(`\n❌ Test execution failed with code ${code}`);
          this.results.errors.push(`Test process exited with code ${code}`);
          if (stderr) {
            this.results.errors.push(`STDERR: ${stderr}`);
          }
          resolve(); // Don't reject, we want to generate a report anyway
        }
      });

      testProcess.on('error', (error) => {
        console.error('\n❌ Failed to start test process:', error);
        this.results.errors.push(`Failed to start test: ${error.message}`);
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        this.results.errors.push('Test execution timed out');
        reject(new Error('Test execution timed out'));
      }, TEST_CONFIG.TIMEOUT + 10000); // Extra 10s buffer
    });
  }

  parseTestOutput(output) {
    console.log('\n📊 Parsing test output...');

    // Extract test results
    const lines = output.split('\n');
    let inDiagnosticsReport = false;
    let diagnosticsReport = '';

    for (const line of lines) {
      if (line.includes('COMPREHENSIVE COMMUNICATION TEST DIAGNOSTICS REPORT')) {
        inDiagnosticsReport = true;
      }
      
      if (inDiagnosticsReport) {
        diagnosticsReport += line + '\n';
      }

      // Parse specific metrics
      if (line.includes('Total Test Duration:')) {
        const match = line.match(/(\d+)ms/);
        if (match) {
          this.results.summary.testDuration = parseInt(match[1]);
        }
      }

      if (line.includes('Errors Encountered:')) {
        const match = line.match(/(\d+)/);
        if (match) {
          this.results.summary.errorCount = parseInt(match[1]);
        }
      }

      if (line.includes('Successful Messages:')) {
        const match = line.match(/(\d+)/);
        if (match) {
          this.results.summary.successfulMessages = parseInt(match[1]);
        }
      }
    }

    // Save diagnostics report
    if (diagnosticsReport) {
      const reportPath = path.join(TEST_CONFIG.REPORT_DIR, 'diagnostics-report.txt');
      fs.writeFileSync(reportPath, diagnosticsReport);
      console.log(`📄 Diagnostics report saved: ${reportPath}`);
    }
  }

  async generateFinalReport() {
    console.log('\n📋 Generating final report...');

    const report = {
      timestamp: new Date().toISOString(),
      testFile: TEST_CONFIG.TEST_FILE,
      duration: this.results.duration,
      success: this.results.success,
      summary: this.results.summary,
      errors: this.results.errors,
      warnings: this.results.warnings,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    const reportPath = path.join(TEST_CONFIG.REPORT_DIR, 'comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Final report saved: ${reportPath}`);

    // Generate HTML report
    await this.generateHTMLReport(report);
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Communication Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #6c757d; }
        .section { margin: 20px 0; }
        .section h3 { border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        ul { list-style-type: none; padding: 0; }
        li { padding: 5px 0; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Communication Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="status ${report.success ? 'success' : 'error'}">
            <strong>${report.success ? '✅ Test Passed' : '❌ Test Failed'}</strong>
            <p>Duration: ${(report.duration / 1000).toFixed(2)} seconds</p>
        </div>

        <div class="section">
            <h3>📊 Test Metrics</h3>
            <div class="metric">
                <div class="metric-value">${report.summary.testDuration || 'N/A'}</div>
                <div class="metric-label">Test Duration (ms)</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.errorCount || 0}</div>
                <div class="metric-label">Errors</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.successfulMessages || 0}</div>
                <div class="metric-label">Successful Messages</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.warnings.length}</div>
                <div class="metric-label">Warnings</div>
            </div>
        </div>

        ${report.errors.length > 0 ? `
        <div class="section">
            <h3>❌ Errors</h3>
            <ul>
                ${report.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${report.warnings.length > 0 ? `
        <div class="section">
            <h3>⚠️ Warnings</h3>
            <ul>
                ${report.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="section">
            <h3>🔧 Environment</h3>
            <ul>
                <li><strong>Node Version:</strong> ${report.environment.nodeVersion}</li>
                <li><strong>Platform:</strong> ${report.environment.platform}</li>
                <li><strong>Test File:</strong> ${report.testFile}</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(TEST_CONFIG.REPORT_DIR, 'comprehensive-test-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📄 HTML report saved: ${htmlPath}`);
  }

  displaySummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
    console.log(`${this.results.success ? '✅' : '❌'} Overall Result: ${this.results.success ? 'PASSED' : 'FAILED'}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    
    if (this.results.summary.testDuration) {
      console.log(`🧪 Test Duration: ${this.results.summary.testDuration}ms`);
    }
    if (this.results.summary.successfulMessages) {
      console.log(`💬 Successful Messages: ${this.results.summary.successfulMessages}`);
    }

    console.log('\n📁 Reports Generated:');
    console.log(`   • ${path.join(TEST_CONFIG.REPORT_DIR, 'comprehensive-test-report.json')}`);
    console.log(`   • ${path.join(TEST_CONFIG.REPORT_DIR, 'comprehensive-test-report.html')}`);
    console.log(`   • ${path.join(TEST_CONFIG.REPORT_DIR, 'diagnostics-report.txt')}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n🔧 Next Steps:');
    if (this.results.success) {
      console.log('   • Review the diagnostics report for performance insights');
      console.log('   • Check for any warnings that might need attention');
      console.log('   • Consider running the test multiple times for consistency');
    } else {
      console.log('   • Review error messages and fix identified issues');
      console.log('   • Check server logs for additional context');
      console.log('   • Verify test environment setup and dependencies');
    }

    console.log('='.repeat(80));
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.run().catch(console.error);
}

module.exports = { ComprehensiveTestRunner };
