import React from 'react';

/**
 * Mock Data Detection Utility
 * 
 * Identifies and warns about remaining mock data in the codebase
 * Helps ensure production readiness by eliminating fake data
 */

export interface MockDataWarning {
  file: string;
  line: number;
  type: 'mock_function' | 'hardcoded_data' | 'fake_api' | 'test_data' | 'placeholder';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}

/**
 * Mock data patterns to detect
 */
const MOCK_PATTERNS = [
  // Mock functions and generators
  {
    pattern: /generateMock|mockData|fakeDat|dummyData/gi,
    type: 'mock_function' as const,
    severity: 'high' as const,
    description: 'Mock data generator function detected',
    suggestion: 'Replace with real API call or database query'
  },

  // Hardcoded test data
  {
    pattern: /const\s+\w*[Mm]ock\w*\s*=|let\s+\w*[Mm]ock\w*\s*=/gi,
    type: 'hardcoded_data' as const,
    severity: 'high' as const,
    description: 'Hardcoded mock data variable detected',
    suggestion: 'Replace with dynamic data from API or database'
  },

  // Fake API endpoints
  {
    pattern: /\/api\/mock|\/fake\/|jsonplaceholder|httpbin/gi,
    type: 'fake_api' as const,
    severity: 'high' as const,
    description: 'Fake API endpoint detected',
    suggestion: 'Replace with real API endpoint'
  },

  // Test/placeholder data
  {
    pattern: /test@example\.com|john\.doe|jane\.smith|lorem\s+ipsum/gi,
    type: 'test_data' as const,
    severity: 'medium' as const,
    description: 'Test or placeholder data detected',
    suggestion: 'Replace with real data or make it configurable'
  },

  // Common mock indicators
  {
    pattern: /TODO.*mock|FIXME.*mock|HACK.*mock/gi,
    type: 'placeholder' as const,
    severity: 'medium' as const,
    description: 'Mock-related TODO/FIXME comment detected',
    suggestion: 'Implement real functionality'
  },

  // Hardcoded arrays with fake data
  {
    pattern: /\[\s*{\s*id:\s*["']?(test|mock|fake|dummy)/gi,
    type: 'hardcoded_data' as const,
    severity: 'high' as const,
    description: 'Hardcoded array with mock data detected',
    suggestion: 'Replace with data from API or database'
  }
];

/**
 * Files to exclude from mock detection (legitimate test files, etc.)
 */
const EXCLUDED_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /\/tests?\//,
  /\/test\//,
  /\/mocks?\//,
  /\/mock\//,
  /\/stories\//,
  /\.stories\.(ts|tsx|js|jsx)$/,
  /\/node_modules\//,
  /\/\.next\//,
  /\/dist\//,
  /\/build\//,
];

/**
 * Scan file content for mock data patterns
 */
export function scanFileForMockData(filePath: string, content: string): MockDataWarning[] {
  // Skip excluded files
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath))) {
    return [];
  }

  const warnings: MockDataWarning[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    MOCK_PATTERNS.forEach(({ pattern, type, severity, description, suggestion }) => {
      const matches = line.match(pattern);
      if (matches) {
        warnings.push({
          file: filePath,
          line: index + 1,
          type,
          severity,
          description: `${description}: "${matches[0]}"`,
          suggestion
        });
      }
    });
  });

  return warnings;
}

/**
 * Browser-safe mock detector for runtime warnings
 */
export function detectMockDataInRuntime(): MockDataWarning[] {
  const warnings: MockDataWarning[] = [];

  // Check for common mock data indicators in the DOM
  if (typeof window !== 'undefined') {
    // Check for test emails in forms
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach((input, index) => {
      const value = (input as HTMLInputElement).value;
      if (value && /test@example\.com|john\.doe|jane\.smith/i.test(value)) {
        warnings.push({
          file: 'DOM',
          line: index + 1,
          type: 'test_data',
          severity: 'medium',
          description: `Test email detected in form: "${value}"`,
          suggestion: 'Clear test data from forms in production'
        });
      }
    });

    // Check for mock data in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && /mock|test|fake|dummy/i.test(key)) {
          warnings.push({
            file: 'localStorage',
            line: i + 1,
            type: 'test_data',
            severity: 'low',
            description: `Mock data key in localStorage: "${key}"`,
            suggestion: 'Clear mock data from localStorage in production'
          });
        }
      }
    } catch (error) {
      // localStorage might not be available
    }
  }

  return warnings;
}

/**
 * Generate a mock data report
 */
export function generateMockDataReport(warnings: MockDataWarning[]): string {
  if (warnings.length === 0) {
    return '✅ No mock data detected! Your application appears to be using real data.';
  }

  const groupedWarnings = warnings.reduce((acc, warning) => {
    if (!acc[warning.severity]) {
      acc[warning.severity] = [];
    }
    acc[warning.severity].push(warning);
    return acc;
  }, {} as Record<string, MockDataWarning[]>);

  let report = `🚨 Mock Data Detection Report\n`;
  report += `Found ${warnings.length} potential mock data issues:\n\n`;

  // High severity issues
  if (groupedWarnings.high) {
    report += `🔴 HIGH PRIORITY (${groupedWarnings.high.length} issues):\n`;
    groupedWarnings.high.forEach(warning => {
      report += `  • ${warning.file}:${warning.line} - ${warning.description}\n`;
      report += `    💡 ${warning.suggestion}\n\n`;
    });
  }

  // Medium severity issues
  if (groupedWarnings.medium) {
    report += `🟡 MEDIUM PRIORITY (${groupedWarnings.medium.length} issues):\n`;
    groupedWarnings.medium.forEach(warning => {
      report += `  • ${warning.file}:${warning.line} - ${warning.description}\n`;
      report += `    💡 ${warning.suggestion}\n\n`;
    });
  }

  // Low severity issues
  if (groupedWarnings.low) {
    report += `🟢 LOW PRIORITY (${groupedWarnings.low.length} issues):\n`;
    groupedWarnings.low.forEach(warning => {
      report += `  • ${warning.file}:${warning.line} - ${warning.description}\n`;
    });
  }

  return report;
}

/**
 * React hook for runtime mock detection
 */
export function useMockDataDetector() {
  if (typeof window === 'undefined') {
    return { warnings: [], hasWarnings: false };
  }

  const warnings = detectMockDataInRuntime();

  // Log warnings in development
  if (process.env.NODE_ENV === 'development' && warnings.length > 0) {

  }

  return {
    warnings,
    hasWarnings: warnings.length > 0,
    report: generateMockDataReport(warnings)
  };
}

/**
 * Development-only mock data warning component
 */
export function MockDataWarning() {
  const { warnings, hasWarnings, report } = useMockDataDetector();

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !hasWarnings) {
    return null;
  }

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  }, [
    React.createElement('div', {
      key: 'title',
      style: { fontWeight: 'bold', marginBottom: '4px' }
    }, '🚨 Mock Data Detected'),
    React.createElement('div', {
      key: 'count',
      style: { marginBottom: '4px' }
    }, `${warnings.length} issue${warnings.length !== 1 ? 's' : ''} found`),
    React.createElement('button', {
      key: 'button',
      onClick: () => {
        console.log('Mock Data Report:', report);
      }
    }, 'View Details')
  ]);
}
