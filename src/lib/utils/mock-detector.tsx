/**
 * Mock Data Detection Utility
 *
 * Identifies and warns about remaining mock data in the codebase
 * Helps ensure production readiness by eliminating fake data
 */

export interface MockDataWarning {
  file: string;
  line: number;
  type: "mock_function" | "hardcoded_data" | "fake_api" | "test_data" | "placeholder";
  severity: "high" | "medium" | "low";
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
    type: "mock_function" as const,
    severity: "high" as const,
    description: "Mock data generator function detected",
    suggestion: "Replace with real API call or database query",
  },

  // Hardcoded test data
  {
    pattern: /const\s+\w*[Mm]ock\w*\s*=|let\s+\w*[Mm]ock\w*\s*=/gi,
    type: "hardcoded_data" as const,
    severity: "high" as const,
    description: "Hardcoded mock data variable detected",
    suggestion: "Replace with dynamic data from API or database",
  },

  // Fake API endpoints
  {
    pattern: /\/api\/mock|\/fake\/|jsonplaceholder|httpbin/gi,
    type: "fake_api" as const,
    severity: "high" as const,
    description: "Fake API endpoint detected",
    suggestion: "Replace with real API endpoint",
  },

  // Test/placeholder data
  {
    pattern: /test@example\.com|john\.doe|jane\.smith|lorem\s+ipsum/gi,
    type: "test_data" as const,
    severity: "medium" as const,
    description: "Test or placeholder data detected",
    suggestion: "Replace with real data or make it configurable",
  },

  // Common mock indicators
  {
    pattern: /TODO.*mock|FIXME.*mock|HACK.*mock/gi,
    type: "placeholder" as const,
    severity: "medium" as const,
    description: "Mock-related TODO/FIXME comment detected",
    suggestion: "Implement real functionality",
  },

  // Hardcoded arrays with fake data
  {
    pattern: /\[\s*{\s*id:\s*["']?(test|mock|fake|dummy)/gi,
    type: "hardcoded_data" as const,
    severity: "high" as const,
    description: "Hardcoded array with mock data detected",
    suggestion: "Replace with data from API or database",
  },
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
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return [];
  }

  const warnings: MockDataWarning[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    MOCK_PATTERNS.forEach(({ pattern, type, severity, description, suggestion }) => {
      if (pattern.test(line)) {
        warnings.push({
          file: filePath,
          line: index + 1,
          type,
          severity,
          description,
          suggestion,
        });
      }
    });
  });

  return warnings;
}

/**
 * Detect mock data in runtime (for React components)
 */
export function detectMockDataInRuntime(): MockDataWarning[] {
  const warnings: MockDataWarning[] = [];

  // Check for common runtime mock indicators
  if (typeof window !== 'undefined') {
    // Check for mock data in localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.toLowerCase().includes('mock') || key.toLowerCase().includes('fake')) {
          warnings.push({
            file: 'localStorage',
            line: 0,
            type: 'hardcoded_data',
            severity: 'medium',
            description: `Mock data found in localStorage: ${key}`,
            suggestion: 'Remove mock data from localStorage',
          });
        }
      });
    } catch (error) {
      // Ignore localStorage errors
    }

    // Check for mock data in sessionStorage
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.toLowerCase().includes('mock') || key.toLowerCase().includes('fake')) {
          warnings.push({
            file: 'sessionStorage',
            line: 0,
            type: 'hardcoded_data',
            severity: 'medium',
            description: `Mock data found in sessionStorage: ${key}`,
            suggestion: 'Remove mock data from sessionStorage',
          });
        }
      });
    } catch (error) {
      // Ignore sessionStorage errors
    }
  }

  return warnings;
}

/**
 * Generate a formatted report of mock data warnings
 */
export function generateMockDataReport(warnings: MockDataWarning[]): string {
  if (warnings.length === 0) {
    return "✅ No mock data issues detected!";
  }

  // Group warnings by severity
  const groupedWarnings = warnings.reduce(
    (acc, warning) => {
      if (!acc[warning.severity]) {
        acc[warning.severity] = [];
      }
      acc[warning.severity].push(warning);
      return acc;
    },
    {} as Record<string, MockDataWarning[]>
  );

  let report = `🚨 Mock Data Detection Report\n`;
  report += `Found ${warnings.length} potential mock data issues:\n\n`;

  // High severity issues
  if (groupedWarnings.high) {
    report += `🔴 HIGH PRIORITY (${groupedWarnings.high.length} issues):\n`;
    groupedWarnings.high.forEach((warning) => {
      report += `  • ${warning.file}:${warning.line} - ${warning.description}\n`;
      report += `    💡 ${warning.suggestion}\n\n`;
    });
  }

  // Medium severity issues
  if (groupedWarnings.medium) {
    report += `🟡 MEDIUM PRIORITY (${groupedWarnings.medium.length} issues):\n`;
    groupedWarnings.medium.forEach((warning) => {
      report += `  • ${warning.file}:${warning.line} - ${warning.description}\n`;
      report += `    💡 ${warning.suggestion}\n\n`;
    });
  }

  // Low severity issues
  if (groupedWarnings.low) {
    report += `🟢 LOW PRIORITY (${groupedWarnings.low.length} issues):\n`;
    groupedWarnings.low.forEach((warning) => {
      report += `  • ${warning.file}:${warning.line} - ${warning.description}\n`;
    });
  }

  return report;
}

/**
 * React hook for runtime mock detection
 */
export function useMockDataDetector() {
  if (typeof window === "undefined") {
    return { warnings: [], hasWarnings: false };
  }

  const warnings = detectMockDataInRuntime();

  // Log warnings in development
  if (process.env.NODE_ENV === "development" && warnings.length > 0) {
    console.warn('Mock data detected:', warnings);
  }

  return {
    warnings,
    hasWarnings: warnings.length > 0,
    report: generateMockDataReport(warnings),
  };
}

/**
 * Development-only mock data warning component
 */
export function MockDataWarning() {
  const { warnings, hasWarnings, report } = useMockDataDetector();

  // Only show in development
  if (process.env.NODE_ENV !== "development" || !hasWarnings) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: "4px",
        padding: "8px 12px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "300px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>🚨 Mock Data Detected</div>
      <div style={{ marginBottom: "4px" }}>
        {warnings.length} issue{warnings.length !== 1 ? "s" : ""} found
      </div>
      <button
        onClick={() => console.log(report)}
        style={{
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "2px",
          padding: "2px 6px",
          fontSize: "10px",
          cursor: "pointer",
        }}
      >
        View Report
      </button>
    </div>
  );
}
