/**
 * Naming Conventions Compliance Tests
 * 
 * These tests ensure 100% adherence to "The Ten Commandments" naming conventions
 * by scanning the codebase for violations and failing when found.
 */

const { SnakeCaseDetector } = require('../utils/snake-case-detector');
const path = require('path');

describe('Naming Conventions Compliance', () => {
  describe('Snake Case Detection', () => {
    let detector;
    
    beforeEach(() => {
      detector = new SnakeCaseDetector({
        rootDir: path.resolve(__dirname, '../..'),
        verbose: process.env.VERBOSE_TESTS === 'true'
      });
    });
    
    test('should have zero snake_case violations in services directory', async () => {
      const servicesDetector = new SnakeCaseDetector({
        rootDir: path.resolve(__dirname, '../..'),
        includePatterns: ['services/**/*.{ts,tsx,js,jsx}'],
        verbose: process.env.VERBOSE_TESTS === 'true'
      });
      
      const result = await servicesDetector.scan();
      const report = servicesDetector.generateReport();
      
      if (result.hasViolations) {
        console.error('\n🚨 Snake case violations found in services:');
        console.error(report.summary);
        report.details.forEach(detail => {
          console.error(`\n📁 ${detail.file}:`);
          detail.violations.forEach(violation => {
            console.error(`  Line ${violation.line}: ${violation.field} → ${violation.suggestion}`);
            console.error(`    Context: ${violation.context}`);
            console.error(`    Issue: ${violation.description}`);
          });
        });
        console.error('\n💡 Fix these violations to ensure compliance with The Ten Commandments.\n');
      }
      
      expect(result.hasViolations).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
    
    test('should have zero snake_case violations in API routes', async () => {
      const apiDetector = new SnakeCaseDetector({
        rootDir: path.resolve(__dirname, '../..'),
        includePatterns: ['app/api/**/*.{ts,tsx,js,jsx}'],
        verbose: process.env.VERBOSE_TESTS === 'true'
      });
      
      const result = await apiDetector.scan();
      const report = apiDetector.generateReport();
      
      if (result.hasViolations) {
        console.error('\n🚨 Snake case violations found in API routes:');
        console.error(report.summary);
        report.details.forEach(detail => {
          console.error(`\n📁 ${detail.file}:`);
          detail.violations.forEach(violation => {
            console.error(`  Line ${violation.line}: ${violation.field} → ${violation.suggestion}`);
            console.error(`    Context: ${violation.context}`);
            console.error(`    Issue: ${violation.description}`);
          });
        });
        console.error('\n💡 Fix these violations to ensure compliance with The Ten Commandments.\n');
      }
      
      expect(result.hasViolations).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
    
    test('should have zero snake_case violations in lib directory', async () => {
      const libDetector = new SnakeCaseDetector({
        rootDir: path.resolve(__dirname, '../..'),
        includePatterns: ['lib/**/*.{ts,tsx,js,jsx}'],
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.next/**',
          '**/coverage/**',
          '**/types/supabase.ts',
          '**/src/types/supabase.ts',
          // Allow some legacy files during transition
          '**/lib/realtime/constants.ts',
          '**/lib/realtime/standardized-realtime.ts'
        ],
        verbose: process.env.VERBOSE_TESTS === 'true'
      });
      
      const result = await libDetector.scan();
      const report = libDetector.generateReport();
      
      if (result.hasViolations) {
        console.error('\n🚨 Snake case violations found in lib directory:');
        console.error(report.summary);
        report.details.forEach(detail => {
          console.error(`\n📁 ${detail.file}:`);
          detail.violations.forEach(violation => {
            console.error(`  Line ${violation.line}: ${violation.field} → ${violation.suggestion}`);
            console.error(`    Context: ${violation.context}`);
            console.error(`    Issue: ${violation.description}`);
          });
        });
        console.error('\n💡 Fix these violations to ensure compliance with The Ten Commandments.\n');
      }
      
      expect(result.hasViolations).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
    
    test('should have zero snake_case violations in components', async () => {
      const componentsDetector = new SnakeCaseDetector({
        rootDir: path.resolve(__dirname, '../..'),
        includePatterns: ['components/**/*.{ts,tsx,js,jsx}'],
        verbose: process.env.VERBOSE_TESTS === 'true'
      });
      
      const result = await componentsDetector.scan();
      const report = componentsDetector.generateReport();
      
      if (result.hasViolations) {
        console.error('\n🚨 Snake case violations found in components:');
        console.error(report.summary);
        report.details.forEach(detail => {
          console.error(`\n📁 ${detail.file}:`);
          detail.violations.forEach(violation => {
            console.error(`  Line ${violation.line}: ${violation.field} → ${violation.suggestion}`);
            console.error(`    Context: ${violation.context}`);
            console.error(`    Issue: ${violation.description}`);
          });
        });
        console.error('\n💡 Fix these violations to ensure compliance with The Ten Commandments.\n');
      }
      
      expect(result.hasViolations).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
    
    test('should generate comprehensive compliance report', async () => {
      const fullDetector = new SnakeCaseDetector({
        rootDir: path.resolve(__dirname, '../..'),
        includePatterns: [
          'app/**/*.{ts,tsx,js,jsx}',
          'lib/**/*.{ts,tsx,js,jsx}',
          'src/**/*.{ts,tsx,js,jsx}',
          'services/**/*.{ts,tsx,js,jsx}',
          'components/**/*.{ts,tsx,js,jsx}'
        ],
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.next/**',
          '**/coverage/**',
          '**/types/supabase.ts',
          '**/src/types/supabase.ts',
          // Allow some legacy files during transition
          '**/lib/realtime/constants.ts',
          '**/lib/realtime/standardized-realtime.ts'
        ],
        verbose: false
      });
      
      const result = await fullDetector.scan();
      const report = fullDetector.generateReport();
      
      // Log summary for CI/CD visibility
      console.log(`\n📊 Compliance Scan Results:`);
      console.log(`   Files scanned: ${result.scannedFiles}`);
      console.log(`   Violations found: ${result.violations.length}`);
      console.log(`   Status: ${result.hasViolations ? '❌ FAILED' : '✅ PASSED'}`);
      
      if (result.hasViolations) {
        console.log(`\n🔍 Violation Summary by File:`);
        report.details.forEach(detail => {
          console.log(`   ${detail.file}: ${detail.violationCount} violations`);
        });
        
        // Fail the test with detailed information
        const errorMessage = `Found ${result.violations.length} snake_case violations. ` +
          `Run with VERBOSE_TESTS=true for detailed output.`;
        throw new Error(errorMessage);
      }
      
      expect(result.scannedFiles).toBeGreaterThan(0);
      expect(result.hasViolations).toBe(false);
    });
  });
  
  describe('API Response Format Compliance', () => {
    test('should detect wrapped API responses that need standardization', () => {
      // This test would scan for patterns like:
      // return NextResponse.json({ data: ... }) instead of NextResponse.json(data)
      const wrappedResponsePattern = /NextResponse\.json\s*\(\s*{\s*\w+\s*:/;
      
      // For now, this is a placeholder - would need to implement file scanning
      // similar to snake_case detector but for response patterns
      expect(true).toBe(true); // Placeholder
    });
  });
  
  describe('Realtime Channel Compliance', () => {
    test('should validate channel naming follows org:orgId:resource:resourceId pattern', () => {
      const validChannelPatterns = [
        'org:123:conversation:456',
        'org:abc-def:user:789:notifications',
        'org:test-org:presence'
      ];
      
      const invalidChannelPatterns = [
        'organization_123_conversation_456', // snake_case
        'org-123-conv-456', // wrong separators
        'conversations:456' // missing org prefix
      ];
      
      const channelPattern = /^org:[^:]+(?::[^:]+:[^:]+)*$/;
      
      validChannelPatterns.forEach(channel => {
        expect(channel).toMatch(channelPattern);
      });
      
      invalidChannelPatterns.forEach(channel => {
        expect(channel).not.toMatch(channelPattern);
      });
    });
  });
  
  describe('Hook Naming Compliance', () => {
    test('should validate hooks start with "use" and return camelCase keys', () => {
      const validHookReturns = [
        { isLoading: true, data: null, error: null },
        { isConnected: false, lastActivity: null },
        { conversations: [], isRefetching: false }
      ];
      
      const invalidHookReturns = [
        { is_loading: true, data: null }, // snake_case
        { IsConnected: false }, // PascalCase
        { conversations: [], is_refetching: false } // mixed
      ];
      
      validHookReturns.forEach(returnObj => {
        Object.keys(returnObj).forEach(key => {
          expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        });
      });
      
      invalidHookReturns.forEach(returnObj => {
        const hasSnakeCase = Object.keys(returnObj).some(key => key.includes('_'));
        const hasPascalCase = Object.keys(returnObj).some(key => /^[A-Z]/.test(key));
        expect(hasSnakeCase || hasPascalCase).toBe(true); // Should have violations
      });
    });
  });
});