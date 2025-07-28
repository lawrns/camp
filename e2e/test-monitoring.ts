/**
 * E2E TEST MONITORING & REPORTING SYSTEM
 * 
 * Comprehensive monitoring and reporting for E2E test results:
 * - Real-time test execution monitoring
 * - Bidirectional flow analysis
 * - Performance metrics collection
 * - Error tracking and analysis
 * - Visual test reports
 * - CI/CD integration metrics
 */

import { TestResult, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface E2ETestMetrics {
  testName: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped' | 'timedout';
  error?: string;
  screenshots: string[];
  videos: string[];
  traces: string[];
  performance: {
    messageLatency: number[];
    connectionTime: number;
    memoryUsage: number[];
    networkRequests: number;
  };
  bidirectionalFlows: {
    customerToAgent: BidirectionalFlow[];
    agentToCustomer: BidirectionalFlow[];
    typingIndicators: BidirectionalFlow[];
    presenceUpdates: BidirectionalFlow[];
  };
  timestamp: string;
}

export interface BidirectionalFlow {
  id: string;
  type: 'message' | 'typing' | 'presence' | 'file' | 'status';
  source: 'customer' | 'agent' | 'ai' | 'system';
  target: 'customer' | 'agent' | 'ai' | 'system';
  payload: any;
  sentAt: number;
  receivedAt?: number;
  latency?: number;
  success: boolean;
  error?: string;
}

export interface E2ETestReport {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    startTime: string;
    endTime: string;
  };
  performance: {
    averageMessageLatency: number;
    averageConnectionTime: number;
    maxMemoryUsage: number;
    totalNetworkRequests: number;
    errorRate: number;
  };
  bidirectionalAnalysis: {
    totalFlows: number;
    successfulFlows: number;
    averageLatency: number;
    flowsByType: Record<string, number>;
    failedFlows: BidirectionalFlow[];
  };
  tests: E2ETestMetrics[];
  errors: Array<{
    testName: string;
    error: string;
    stack?: string;
    timestamp: string;
  }>;
}

// ============================================================================
// TEST MONITOR CLASS
// ============================================================================

export class E2ETestMonitor {
  private metrics: E2ETestMetrics[] = [];
  private bidirectionalFlows: BidirectionalFlow[] = [];
  private startTime: number = Date.now();
  private reportDir: string;

  constructor(reportDir: string = 'test-results') {
    this.reportDir = reportDir;
    this.ensureReportDirectory();
  }

  /**
   * Record test start
   */
  onTestStart(testInfo: TestInfo): void {
    console.log(`🧪 Starting test: ${testInfo.title}`);
    
    // Initialize test metrics
    const metrics: E2ETestMetrics = {
      testName: testInfo.title,
      duration: 0,
      status: 'passed',
      screenshots: [],
      videos: [],
      traces: [],
      performance: {
        messageLatency: [],
        connectionTime: 0,
        memoryUsage: [],
        networkRequests: 0,
      },
      bidirectionalFlows: {
        customerToAgent: [],
        agentToCustomer: [],
        typingIndicators: [],
        presenceUpdates: [],
      },
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metrics);
  }

  /**
   * Record test completion
   */
  onTestEnd(testInfo: TestInfo, result: TestResult): void {
    const metrics = this.metrics.find(m => m.testName === testInfo.title);
    if (!metrics) return;

    metrics.duration = result.duration;
    metrics.status = result.status;
    metrics.error = result.error?.message;

    // Collect artifacts
    if (result.attachments) {
      result.attachments.forEach(attachment => {
        if (attachment.name === 'screenshot') {
          metrics.screenshots.push(attachment.path || '');
        } else if (attachment.name === 'video') {
          metrics.videos.push(attachment.path || '');
        } else if (attachment.name === 'trace') {
          metrics.traces.push(attachment.path || '');
        }
      });
    }

    const status = result.status === 'passed' ? '✅' : 
                  result.status === 'failed' ? '❌' : 
                  result.status === 'skipped' ? '⏭️' : '⏰';
    
    console.log(`${status} Test completed: ${testInfo.title} (${result.duration}ms)`);
    
    if (result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
  }

  /**
   * Record bidirectional flow
   */
  recordBidirectionalFlow(flow: Omit<BidirectionalFlow, 'id'>): string {
    const flowWithId: BidirectionalFlow = {
      ...flow,
      id: `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.bidirectionalFlows.push(flowWithId);

    // Add to current test metrics if available
    const currentTest = this.metrics[this.metrics.length - 1];
    if (currentTest) {
      const flowType = this.getFlowCategory(flow.type, flow.source, flow.target);
      currentTest.bidirectionalFlows[flowType].push(flowWithId);
    }

    return flowWithId.id;
  }

  /**
   * Update flow with received timestamp
   */
  updateFlowReceived(flowId: string, receivedAt: number, success: boolean = true, error?: string): void {
    const flow = this.bidirectionalFlows.find(f => f.id === flowId);
    if (flow) {
      flow.receivedAt = receivedAt;
      flow.latency = receivedAt - flow.sentAt;
      flow.success = success;
      flow.error = error;
    }
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetric(testName: string, type: keyof E2ETestMetrics['performance'], value: number | number[]): void {
    const metrics = this.metrics.find(m => m.testName === testName);
    if (!metrics) return;

    if (type === 'messageLatency' || type === 'memoryUsage') {
      if (Array.isArray(value)) {
        (metrics.performance[type] as number[]).push(...value);
      } else {
        (metrics.performance[type] as number[]).push(value);
      }
    } else {
      metrics.performance[type] = value as number;
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(): E2ETestReport {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Calculate summary
    const summary = {
      totalTests: this.metrics.length,
      passed: this.metrics.filter(m => m.status === 'passed').length,
      failed: this.metrics.filter(m => m.status === 'failed').length,
      skipped: this.metrics.filter(m => m.status === 'skipped').length,
      duration,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    };

    // Calculate performance metrics
    const allLatencies = this.metrics.flatMap(m => m.performance.messageLatency);
    const allMemoryUsage = this.metrics.flatMap(m => m.performance.memoryUsage);
    const allConnectionTimes = this.metrics.map(m => m.performance.connectionTime).filter(t => t > 0);

    const performance = {
      averageMessageLatency: allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0,
      averageConnectionTime: allConnectionTimes.length > 0 ? allConnectionTimes.reduce((a, b) => a + b, 0) / allConnectionTimes.length : 0,
      maxMemoryUsage: allMemoryUsage.length > 0 ? Math.max(...allMemoryUsage) : 0,
      totalNetworkRequests: this.metrics.reduce((sum, m) => sum + m.performance.networkRequests, 0),
      errorRate: summary.totalTests > 0 ? summary.failed / summary.totalTests : 0,
    };

    // Analyze bidirectional flows
    const successfulFlows = this.bidirectionalFlows.filter(f => f.success);
    const flowLatencies = this.bidirectionalFlows.filter(f => f.latency !== undefined).map(f => f.latency!);
    const flowsByType = this.bidirectionalFlows.reduce((acc, flow) => {
      acc[flow.type] = (acc[flow.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bidirectionalAnalysis = {
      totalFlows: this.bidirectionalFlows.length,
      successfulFlows: successfulFlows.length,
      averageLatency: flowLatencies.length > 0 ? flowLatencies.reduce((a, b) => a + b, 0) / flowLatencies.length : 0,
      flowsByType,
      failedFlows: this.bidirectionalFlows.filter(f => !f.success),
    };

    // Collect errors
    const errors = this.metrics
      .filter(m => m.error)
      .map(m => ({
        testName: m.testName,
        error: m.error!,
        timestamp: m.timestamp,
      }));

    const report: E2ETestReport = {
      summary,
      performance,
      bidirectionalAnalysis,
      tests: this.metrics,
      errors,
    };

    // Save report to file
    this.saveReport(report);

    return report;
  }

  /**
   * Save report to file
   */
  private saveReport(report: E2ETestReport): void {
    const reportPath = path.join(this.reportDir, 'e2e-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    console.log(`📊 E2E Test Report saved to: ${reportPath}`);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: E2ETestReport): void {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Report - Campfire</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .test-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .test-card.failed { border-left-color: #dc3545; }
        .test-card.skipped { border-left-color: #ffc107; }
        .flow-analysis { background: #e9ecef; padding: 20px; border-radius: 8px; }
        .error-list { background: #f8d7da; padding: 15px; border-radius: 8px; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 E2E Test Report - Campfire</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>📊 Test Summary</h2>
            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value">${report.summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: #28a745;">${report.summary.passed}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: #dc3545;">${report.summary.failed}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(report.summary.duration / 1000).toFixed(2)}s</div>
                    <div class="metric-label">Duration</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value">${report.performance.averageMessageLatency.toFixed(2)}ms</div>
                    <div class="metric-label">Avg Message Latency</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.performance.averageConnectionTime.toFixed(2)}ms</div>
                    <div class="metric-label">Avg Connection Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.performance.maxMemoryUsage.toFixed(2)}MB</div>
                    <div class="metric-label">Max Memory Usage</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(report.performance.errorRate * 100).toFixed(1)}%</div>
                    <div class="metric-label">Error Rate</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔄 Bidirectional Flow Analysis</h2>
            <div class="flow-analysis">
                <p><strong>Total Flows:</strong> ${report.bidirectionalAnalysis.totalFlows}</p>
                <p><strong>Successful Flows:</strong> ${report.bidirectionalAnalysis.successfulFlows}</p>
                <p><strong>Average Latency:</strong> ${report.bidirectionalAnalysis.averageLatency.toFixed(2)}ms</p>
                <p><strong>Success Rate:</strong> ${((report.bidirectionalAnalysis.successfulFlows / report.bidirectionalAnalysis.totalFlows) * 100).toFixed(1)}%</p>
            </div>
        </div>

        <div class="section">
            <h2>🧪 Test Results</h2>
            <div class="test-grid">
                ${report.tests.map(test => `
                    <div class="test-card ${test.status}">
                        <h3>${test.testName}</h3>
                        <p><strong>Status:</strong> ${test.status}</p>
                        <p><strong>Duration:</strong> ${test.duration}ms</p>
                        ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        ${report.errors.length > 0 ? `
        <div class="section">
            <h2>❌ Errors</h2>
            <div class="error-list">
                ${report.errors.map(error => `
                    <div>
                        <strong>${error.testName}:</strong> ${error.error}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, 'e2e-test-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📄 HTML Report saved to: ${htmlPath}`);
  }

  /**
   * Ensure report directory exists
   */
  private ensureReportDirectory(): void {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Get flow category for organization
   */
  private getFlowCategory(type: string, source: string, target: string): keyof E2ETestMetrics['bidirectionalFlows'] {
    if (type === 'typing') return 'typingIndicators';
    if (type === 'presence') return 'presenceUpdates';
    if (source === 'customer' && target === 'agent') return 'customerToAgent';
    if (source === 'agent' && target === 'customer') return 'agentToCustomer';
    return 'customerToAgent'; // default
  }
}

// ============================================================================
// GLOBAL MONITOR INSTANCE
// ============================================================================

export const globalE2EMonitor = new E2ETestMonitor();

/**
 * Helper function to record bidirectional flow
 */
export function recordFlow(
  type: BidirectionalFlow['type'],
  source: BidirectionalFlow['source'],
  target: BidirectionalFlow['target'],
  payload: any
): string {
  return globalE2EMonitor.recordBidirectionalFlow({
    type,
    source,
    target,
    payload,
    sentAt: Date.now(),
    success: false, // Will be updated when received
  });
}

/**
 * Helper function to mark flow as received
 */
export function markFlowReceived(flowId: string, success: boolean = true, error?: string): void {
  globalE2EMonitor.updateFlowReceived(flowId, Date.now(), success, error);
}

/**
 * Helper function to record performance metric
 */
export function recordPerformance(testName: string, type: keyof E2ETestMetrics['performance'], value: number | number[]): void {
  globalE2EMonitor.recordPerformanceMetric(testName, type, value);
}
