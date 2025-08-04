"use client";

import { useState } from 'react';
import { realtimeConnectionTester } from '@/lib/testing/realtime-connection-test';
import { robustRealtimeConnectionTester } from '@/lib/testing/robust-realtime-test';
import { realtimeConnectionMonitor } from '@/lib/monitoring/realtime-connection-monitor';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: unknown;
  error?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  overallPassed: boolean;
  totalDuration: number;
}

export default function TestEnhancedRealtimePage() {
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [robustTestResults, setRobustTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningRobust, setIsRunningRobust] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const results = await realtimeConnectionTester.runTestSuite();
      setTestResults(results);

      // Get current metrics
      const currentMetrics = realtimeConnectionMonitor.getMetricsSummary();
      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runRobustTests = async () => {
    setIsRunningRobust(true);
    setRobustTestResults(null);

    try {
      const results = await robustRealtimeConnectionTester.runRobustTestSuite();
      setRobustTestResults(results);
    } catch (error) {
      console.error('Robust test suite failed:', error);
    } finally {
      setIsRunningRobust(false);
    }
  };

  const getStatusIcon = (passed: boolean) => passed ? '✅' : '❌';
  const getStatusColor = (passed: boolean) => passed ? 'text-green-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Enhanced Real-time Connection Test Suite
          </h1>
          
          <div className="mb-6 space-x-4">
            <button
              onClick={runTests}
              disabled={isRunning || isRunningRobust}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRunning || isRunningRobust
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run Standard Tests'}
            </button>

            <button
              onClick={runRobustTests}
              disabled={isRunning || isRunningRobust}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRunning || isRunningRobust
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunningRobust ? '🔄 Running Robust Tests...' : '🛡️ Run Robust Tests'}
            </button>
          </div>

          {(testResults || robustTestResults) && (
            <div className="space-y-6">
              {/* Standard Test Results */}
              {testResults && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Standard Test Results</h2>
                  <div className={`p-4 rounded-lg ${
                    testResults.overallPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className={`text-lg font-semibold ${getStatusColor(testResults.overallPassed)}`}>
                      {getStatusIcon(testResults.overallPassed)} Overall Result: {
                        testResults.overallPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
                      }
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Total Duration: {testResults.totalDuration}ms |
                      Tests Passed: {testResults.results.filter(r => r.passed).length}/{testResults.results.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Robust Test Results */}
              {robustTestResults && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">🛡️ Robust Test Results</h2>
                  <div className={`p-4 rounded-lg ${
                    robustTestResults.overallPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className={`text-lg font-semibold ${getStatusColor(robustTestResults.overallPassed)}`}>
                      {getStatusIcon(robustTestResults.overallPassed)} Robust Tests: {
                        robustTestResults.overallPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
                      }
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Total Duration: {robustTestResults.totalDuration}ms |
                      Tests Passed: {robustTestResults.results.filter((r: unknown) => r.passed).length}/{robustTestResults.results.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Individual Test Results */}
              <div className="space-y-4">
                {testResults && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Standard Individual Test Results</h3>
                    <div className="space-y-2 mt-2">
                      {testResults.results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${getStatusColor(result.passed)}`}>
                        {getStatusIcon(result.passed)} {result.testName}
                      </h4>
                      <span className="text-sm text-gray-500">{result.duration}ms</span>
                    </div>
                    
                    {result.error && (
                      <p className="text-red-600 text-sm mt-2">Error: {result.error}</p>
                    )}
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer">View Details</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                      </div>
                      ))}
                    </div>
                  </div>
                )}

                {robustTestResults && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Robust Individual Test Results</h3>
                    <div className="space-y-2 mt-2">
                      {robustTestResults.results.map((result: unknown, index: number) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${getStatusColor(result.passed)}`}>
                              {getStatusIcon(result.passed)} {result.testName}
                            </h4>
                            <span className="text-sm text-gray-500">{result.duration}ms</span>
                          </div>

                          {result.error && (
                            <p className="text-red-600 text-sm mt-2">Error: {result.error}</p>
                          )}

                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-600 cursor-pointer">View Details</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {metrics && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Real-time Connection Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Connection Metrics */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Connection</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Attempts: {metrics.connection.connectionAttempts}</p>
                    <p>Success Rate: {(metrics.connection.successRate * 100).toFixed(1)}%</p>
                    <p>Avg Time: {metrics.connection.averageConnectionTime}ms</p>
                  </div>
                </div>

                {/* Message Metrics */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Messages</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Sent: {metrics.messaging.messagesSent}</p>
                    <p>Delivered: {metrics.messaging.messagesDelivered}</p>
                    <p>Delivery Rate: {(metrics.messaging.deliveryRate * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {/* WebSocket Metrics */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">WebSocket</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>State: {metrics.webSocket.currentState}</p>
                    <p>Uptime: {(metrics.webSocket.uptimePercentage * 100).toFixed(1)}%</p>
                    <p>Transitions: {metrics.webSocket.stateTransitions.length}</p>
                  </div>
                </div>

                {/* Fallback Metrics */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Fallback</h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p>Activations: {metrics.fallback.fallbackActivations}</p>
                    <p>Polling Requests: {metrics.fallback.pollingRequests}</p>
                    <p>Polling Errors: {metrics.fallback.pollingErrors}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Instructions */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Coverage</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Message Creation Independence - Verifies database operations work without real-time</li>
              <li>✅ WebSocket Connection Timing - Ensures connections establish within 15 seconds</li>
              <li>✅ Retry Logic - Tests exponential backoff retry mechanism</li>
              <li>✅ Fallback Mechanism - Validates polling fallback when real-time fails</li>
              <li>✅ Monitoring Integration - Confirms metrics tracking works correctly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
