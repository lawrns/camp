#!/usr/bin/env tsx
/**
 * COMPREHENSIVE E2E TEST RUNNER
 * 
 * Orchestrates complete E2E testing with:
 * - Environment setup and validation
 * - Test execution with monitoring
 * - Bidirectional communication verification
 * - Performance analysis
 * - Report generation
 * - CI/CD integration
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { globalE2EMonitor } from '../e2e/test-monitoring';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface E2EConfig {
  environment: 'development' | 'staging' | 'production';
  baseUrl: string;
  supabaseUrl: string;
  testSuites: string[];
  browsers: string[];
  parallel: boolean;
  retries: number;
  timeout: number;
  generateReport: boolean;
  uploadResults: boolean;
}

const DEFAULT_CONFIG: E2EConfig = {
  environment: 'development',
  baseUrl: 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  testSuites: [
    'bidirectional-communication',
    'widget-agent-communication',
    'multi-user-scenarios',
    'performance-load-testing',
  ],
  browsers: ['chromium', 'firefox', 'webkit'],
  parallel: true,
  retries: 2,
  timeout: 60000,
  generateReport: true,
  uploadResults: false,
};

// ============================================================================
// E2E TEST RUNNER
// ============================================================================

class E2ETestRunner {
  private config: E2EConfig;
  private startTime: number = 0;
  private results: any = {};

  constructor(config: Partial<E2EConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run complete E2E test suite
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Comprehensive E2E Test Suite');
    console.log('=========================================');
    
    this.startTime = Date.now();

    try {
      // 1. Validate environment
      await this.validateEnvironment();
      
      // 2. Setup test environment
      await this.setupTestEnvironment();
      
      // 3. Run test suites
      await this.runTestSuites();
      
      // 4. Generate reports
      await this.generateReports();
      
      // 5. Cleanup
      await this.cleanup();
      
      console.log('✅ E2E Test Suite Completed Successfully!');
      
    } catch (error) {
      console.error('❌ E2E Test Suite Failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate environment setup
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating Environment...');

    // Check required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Check if application is running
    try {
      const response = await fetch(this.config.baseUrl);
      if (!response.ok) {
        throw new Error(`Application not responding at ${this.config.baseUrl}`);
      }
    } catch (error) {
      throw new Error(`Cannot reach application at ${this.config.baseUrl}. Make sure it's running.`);
    }

    // Check Supabase connection
    try {
      const supabaseResponse = await fetch(`${this.config.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });
      if (!supabaseResponse.ok) {
        throw new Error('Cannot connect to Supabase');
      }
    } catch (error) {
      throw new Error(`Supabase connection failed: ${error}`);
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('⚙️  Setting up test environment...');

    // Ensure test results directory exists
    const testResultsDir = 'test-results';
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    // Clean previous test results
    const files = fs.readdirSync(testResultsDir);
    files.forEach(file => {
      if (file.endsWith('.json') || file.endsWith('.html')) {
        fs.unlinkSync(path.join(testResultsDir, file));
      }
    });

    console.log('✅ Test environment setup complete');
  }

  /**
   * Run test suites
   */
  private async runTestSuites(): Promise<void> {
    console.log('🧪 Running E2E Test Suites...');

    for (const suite of this.config.testSuites) {
      console.log(`\n📋 Running test suite: ${suite}`);
      
      try {
        const result = await this.runTestSuite(suite);
        this.results[suite] = result;
        
        const status = result.exitCode === 0 ? '✅' : '❌';
        console.log(`${status} Test suite ${suite} completed (exit code: ${result.exitCode})`);
        
      } catch (error) {
        console.error(`❌ Test suite ${suite} failed:`, error);
        this.results[suite] = { exitCode: 1, error: error.toString() };
      }
    }
  }

  /**
   * Run individual test suite
   */
  private async runTestSuite(suiteName: string): Promise<{ exitCode: number; output: string }> {
    return new Promise((resolve, reject) => {
      const testFile = `e2e/${suiteName}.spec.ts`;
      
      if (!fs.existsSync(testFile)) {
        reject(new Error(`Test file not found: ${testFile}`));
        return;
      }

      const args = [
        'test',
        testFile,
        '--reporter=json',
        `--output-dir=test-results/${suiteName}`,
      ];

      // Add browser configuration
      if (this.config.browsers.length === 1) {
        args.push(`--project=${this.config.browsers[0]}`);
      }

      // Add parallel configuration
      if (!this.config.parallel) {
        args.push('--workers=1');
      }

      // Add retry configuration
      if (this.config.retries > 0) {
        args.push(`--retries=${this.config.retries}`);
      }

      const playwright = spawn('npx', ['playwright', ...args], {
        stdio: 'pipe',
        env: {
          ...process.env,
          E2E_BASE_URL: this.config.baseUrl,
          E2E_ENVIRONMENT: this.config.environment,
        },
      });

      let output = '';
      let errorOutput = '';

      playwright.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      playwright.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      playwright.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          output: output + errorOutput,
        });
      });

      playwright.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate comprehensive reports
   */
  private async generateReports(): Promise<void> {
    if (!this.config.generateReport) return;

    console.log('📊 Generating comprehensive reports...');

    // Generate E2E monitoring report
    const monitoringReport = globalE2EMonitor.generateReport();

    // Generate summary report
    const summaryReport = {
      testRun: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        environment: this.config.environment,
        baseUrl: this.config.baseUrl,
      },
      configuration: this.config,
      suiteResults: this.results,
      monitoring: monitoringReport,
      recommendations: this.generateRecommendations(monitoringReport),
    };

    // Save summary report
    fs.writeFileSync(
      'test-results/e2e-summary-report.json',
      JSON.stringify(summaryReport, null, 2)
    );

    // Generate CI/CD report
    this.generateCIReport(summaryReport);

    console.log('✅ Reports generated successfully');
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(report: any): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (report.performance.averageMessageLatency > 1000) {
      recommendations.push('Consider optimizing message delivery - latency is above 1 second');
    }

    if (report.performance.errorRate > 0.05) {
      recommendations.push('Error rate is above 5% - investigate failing tests');
    }

    // Bidirectional flow recommendations
    const flowSuccessRate = report.bidirectionalAnalysis.successfulFlows / report.bidirectionalAnalysis.totalFlows;
    if (flowSuccessRate < 0.95) {
      recommendations.push('Bidirectional flow success rate is below 95% - check real-time connectivity');
    }

    // Memory recommendations
    if (report.performance.maxMemoryUsage > 100) {
      recommendations.push('Memory usage is high - consider optimizing client-side code');
    }

    if (recommendations.length === 0) {
      recommendations.push('All metrics look good! 🎉');
    }

    return recommendations;
  }

  /**
   * Generate CI/CD compatible report
   */
  private generateCIReport(summaryReport: any): void {
    const ciReport = {
      success: Object.values(this.results).every((result: any) => result.exitCode === 0),
      totalTests: summaryReport.monitoring.summary.totalTests,
      passedTests: summaryReport.monitoring.summary.passed,
      failedTests: summaryReport.monitoring.summary.failed,
      duration: summaryReport.testRun.duration,
      errorRate: summaryReport.monitoring.performance.errorRate,
      averageLatency: summaryReport.monitoring.performance.averageMessageLatency,
      recommendations: summaryReport.recommendations,
    };

    fs.writeFileSync(
      'test-results/ci-report.json',
      JSON.stringify(ciReport, null, 2)
    );

    // Generate JUnit XML for CI systems
    this.generateJUnitReport(summaryReport);
  }

  /**
   * Generate JUnit XML report
   */
  private generateJUnitReport(summaryReport: any): void {
    const tests = summaryReport.monitoring.tests;
    const totalTests = tests.length;
    const failures = tests.filter((t: any) => t.status === 'failed').length;
    const duration = summaryReport.testRun.duration / 1000;

    const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="E2E Tests" tests="${totalTests}" failures="${failures}" time="${duration}">
${tests.map((test: any) => `
  <testcase name="${test.testName}" time="${test.duration / 1000}">
    ${test.status === 'failed' ? `<failure message="${test.error || 'Test failed'}">${test.error || 'Test failed'}</failure>` : ''}
  </testcase>`).join('')}
</testsuite>`;

    fs.writeFileSync('test-results/junit-report.xml', junitXml);
  }

  /**
   * Cleanup test environment
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    
    // Cleanup is handled by global teardown
    // Additional cleanup can be added here if needed
    
    console.log('✅ Cleanup completed');
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: Partial<E2EConfig> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--env':
        config.environment = value as any;
        break;
      case '--base-url':
        config.baseUrl = value;
        break;
      case '--browsers':
        config.browsers = value.split(',');
        break;
      case '--suites':
        config.testSuites = value.split(',');
        break;
      case '--no-parallel':
        config.parallel = false;
        i--; // No value for this flag
        break;
      case '--retries':
        config.retries = parseInt(value);
        break;
      case '--help':
        console.log(`
E2E Test Runner Usage:
  --env <environment>     Set environment (development|staging|production)
  --base-url <url>        Set base URL for testing
  --browsers <list>       Comma-separated list of browsers
  --suites <list>         Comma-separated list of test suites
  --no-parallel          Disable parallel execution
  --retries <number>      Number of retries for failed tests
  --help                  Show this help message
        `);
        process.exit(0);
    }
  }

  const runner = new E2ETestRunner(config);
  await runner.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { E2ETestRunner };
