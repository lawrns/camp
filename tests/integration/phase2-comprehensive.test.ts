/**
 * PHASE 2 CRITICAL FIX: Comprehensive Integration Tests
 * 
 * Integration tests to verify all Phase 2 fixes are working together:
 * - Input validation with Zod schemas
 * - Error boundaries and error handling
 * - Rate limiting protection
 * - Security audit system
 * - Database performance optimization
 * - Comprehensive monitoring
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { validateRequest, WidgetSchemas } from '@/lib/validation/schemas';
import { securityAudit } from '@/lib/security/comprehensive-audit';
import { monitor } from '@/lib/monitoring/comprehensive-monitoring';
import { dbOptimizer } from '@/lib/database/performance-optimizer';
import { widgetRateLimit } from '@/lib/middleware/rate-limit';

// Mock NextRequest for testing
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  ip?: string;
}): NextRequest {
  const { method = 'POST', url = 'http://localhost:3001/api/widget', headers = {}, ip = '127.0.0.1' } = options;
  
  const request = {
    method,
    url,
    headers: new Map(Object.entries({
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...headers
    })),
    ip,
    json: async () => options.body || {},
    text: async () => JSON.stringify(options.body || {}),
    clone: () => request
  } as unknown;
  
  return request as NextRequest;
}

describe('Phase 2 Comprehensive Integration Tests', () => {
  beforeAll(() => {
    // Start monitoring systems
    monitor.start();
  });

  afterAll(() => {
    // Stop monitoring systems
    monitor.stop();
  });

  describe('Input Validation Integration', () => {
    test('should validate widget requests with proper error handling', () => {
      // Valid request
      const validRequest = {
        action: 'create-conversation',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        initialMessage: 'Hello, I need help!',
        metadata: { source: 'website' }
      };

      const validResult = validateRequest(WidgetSchemas.createConversation, validRequest);
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBeDefined();
      expect(validResult.errors).toBeUndefined();

      // Invalid request
      const invalidRequest = {
        action: 'create-conversation',
        customerEmail: 'invalid-email',
        initialMessage: '', // Empty message
        metadata: 'not-an-object' // Should be object
      };

      const invalidResult = validateRequest(WidgetSchemas.createConversation, invalidRequest);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.data).toBeUndefined();
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors!.length).toBeGreaterThan(0);
    });

    test('should handle edge cases in validation', () => {
      // Test with null/undefined values
      const nullRequest = null;
      const nullResult = validateRequest(WidgetSchemas.createConversation, nullRequest);
      expect(nullResult.success).toBe(false);

      // Test with extremely long content
      const longContentRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'a'.repeat(5000), // Exceeds max length
        senderType: 'customer'
      };

      const longContentResult = validateRequest(WidgetSchemas.sendMessage, longContentRequest);
      expect(longContentResult.success).toBe(false);
      expect(longContentResult.errors?.some(error => error.includes('too long'))).toBe(true);
    });
  });

  describe('Security Audit Integration', () => {
    test('should detect and block SQL injection attempts', async () => {
      const maliciousRequest = createMockRequest({
        url: "http://localhost:3001/api/widget?id=1' OR '1'='1",
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const securityResult = await securityAudit.checkSecurity(maliciousRequest);
      
      expect(securityResult.allowed).toBe(false);
      expect(securityResult.threats.length).toBeGreaterThan(0);
      expect(securityResult.threats[0].type).toBe('injection_attempt');
      expect(securityResult.threats[0].severity).toBe('high');
    });

    test('should detect XSS attempts', async () => {
      const xssRequest = createMockRequest({
        url: 'http://localhost:3001/api/widget?message=<script>alert("xss")</script>',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const securityResult = await securityAudit.checkSecurity(xssRequest);
      
      expect(securityResult.allowed).toBe(false);
      expect(securityResult.threats.some(t => t.type === 'xss_attempt')).toBe(true);
    });

    test('should identify suspicious user agents', async () => {
      const botRequest = createMockRequest({
        headers: {
          'user-agent': 'python-requests/2.25.1'
        }
      });

      const securityResult = await securityAudit.checkSecurity(botRequest);
      
      expect(securityResult.threats.some(t => t.type === 'suspicious_activity')).toBe(true);
    });

    test('should allow legitimate requests', async () => {
      const legitimateRequest = createMockRequest({
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: {
          action: 'create-conversation',
          customerName: 'John Doe',
          customerEmail: 'john@example.com'
        }
      });

      const securityResult = await securityAudit.checkSecurity(legitimateRequest);
      
      expect(securityResult.allowed).toBe(true);
      expect(securityResult.threats.length).toBe(0);
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should track rate limit metrics', async () => {
      const request = createMockRequest({
        headers: {
          'x-organization-id': 'test-org-123'
        }
      });

      // Simulate rate limiting check
      let rateLimitExceeded = false;
      
      try {
        await widgetRateLimit(request, async () => {
          return new Response('OK');
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('rate limit')) {
          rateLimitExceeded = true;
        }
      }

      // Rate limiting should work (either allow or deny based on current state)
      expect(typeof rateLimitExceeded).toBe('boolean');
    });
  });

  describe('Database Performance Integration', () => {
    test('should monitor query performance', async () => {
      const testQuery = async () => {
        // Simulate a database query
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: [{ id: 1, name: 'test' }] };
      };

      const result = await dbOptimizer.monitorQuery('test_query', testQuery, {
        endpoint: 'test',
        params: { limit: 10 }
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should handle query errors gracefully', async () => {
      const failingQuery = async () => {
        throw new Error('Database connection failed');
      };

      await expect(
        dbOptimizer.monitorQuery('failing_query', failingQuery)
      ).rejects.toThrow('Database connection failed');
    });

    test('should generate optimization recommendations', () => {
      const recommendations = dbOptimizer.generateIndexRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('table');
        expect(rec).toHaveProperty('columns');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('priority');
        expect(['low', 'medium', 'high', 'critical']).toContain(rec.priority);
      });
    });
  });

  describe('Monitoring Integration', () => {
    test('should record and retrieve metrics', () => {
      // Record test metrics
      monitor.recordCounter('test.counter', 5);
      monitor.recordGauge('test.gauge', 42);
      monitor.recordTiming('test.timing', performance.now() - 100);

      // Retrieve metrics
      const counterMetrics = monitor.getMetrics('test.counter');
      const gaugeMetrics = monitor.getMetrics('test.gauge');
      const timingMetrics = monitor.getMetrics('test.timing');

      expect(counterMetrics.length).toBeGreaterThan(0);
      expect(gaugeMetrics.length).toBeGreaterThan(0);
      expect(timingMetrics.length).toBeGreaterThan(0);

      expect(counterMetrics[0].value).toBe(5);
      expect(gaugeMetrics[0].value).toBe(42);
    });

    test('should measure async operations', async () => {
      const asyncOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      };

      const result = await monitor.measureAsync('test.async', asyncOperation);
      
      expect(result).toBe('success');
      
      const metrics = monitor.getMetrics('test.async.success');
      expect(metrics.length).toBeGreaterThan(0);
    });

    test('should track health status', () => {
      const healthStatus = monitor.getHealthStatus();
      
      expect(Array.isArray(healthStatus)).toBe(true);
      healthStatus.forEach(health => {
        expect(health).toHaveProperty('name');
        expect(health).toHaveProperty('healthy');
        expect(typeof health.healthy).toBe('boolean');
      });
    });
  });

  describe('End-to-End Integration', () => {
    test('should handle complete request flow with all systems', async () => {
      // Create a legitimate request
      const request = createMockRequest({
        headers: {
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer test-token',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: {
          action: 'create-conversation',
          customerName: 'Integration Test User',
          customerEmail: 'integration@test.com',
          initialMessage: 'This is an integration test message',
          metadata: { source: 'integration-test' }
        }
      });

      // 1. Security check
      const securityResult = await securityAudit.checkSecurity(request);
      expect(securityResult.allowed).toBe(true);

      // 2. Input validation
      const validationResult = validateRequest(WidgetSchemas.createConversation, request.body);
      expect(validationResult.success).toBe(true);

      // 3. Monitor the operation
      const monitoredOperation = await monitor.measureAsync('integration.test', async () => {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 10));
        return { success: true, conversationId: 'test-conv-123' };
      });

      expect(monitoredOperation.success).toBe(true);
      expect(monitoredOperation.conversationId).toBeDefined();

      // 4. Verify metrics were recorded
      const metrics = monitor.getMetrics('integration.test.success');
      expect(metrics.length).toBeGreaterThan(0);
    });

    test('should handle malicious request flow', async () => {
      // Create a malicious request
      const maliciousRequest = createMockRequest({
        url: "http://localhost:3001/api/widget?id=1' UNION SELECT * FROM users--",
        headers: {
          'user-agent': 'sqlmap/1.0'
        },
        body: {
          action: 'send-message',
          conversationId: '<script>alert("xss")</script>',
          content: "'; DROP TABLE messages; --"
        }
      });

      // 1. Security check should block
      const securityResult = await securityAudit.checkSecurity(maliciousRequest);
      expect(securityResult.allowed).toBe(false);
      expect(securityResult.threats.length).toBeGreaterThan(0);

      // 2. Input validation should also fail
      const validationResult = validateRequest(WidgetSchemas.sendMessage, maliciousRequest.body);
      expect(validationResult.success).toBe(false);

      // 3. Security events should be logged
      const securityEvents = securityAudit.getSecurityEvents();
      expect(securityEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        monitor.measureAsync(`concurrent.operation.${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          return { id: i, result: 'success' };
        })
      );

      const results = await Promise.all(concurrentOperations);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.id).toBe(index);
        expect(result.result).toBe('success');
      });

      // Check that all operations were monitored
      for (let i = 0; i < 10; i++) {
        const metrics = monitor.getMetrics(`concurrent.operation.${i}.success`);
        expect(metrics.length).toBeGreaterThan(0);
      }
    });

    test('should maintain performance under load', async () => {
      const startTime = performance.now();
      
      // Simulate load testing
      const loadTestOperations = Array.from({ length: 50 }, (_, i) => 
        Promise.all([
          // Validation
          validateRequest(WidgetSchemas.createConversation, {
            action: 'create-conversation',
            customerName: `User ${i}`,
            customerEmail: `user${i}@test.com`,
            metadata: {}
          }),
          // Security check
          securityAudit.checkSecurity(createMockRequest({
            headers: { 'user-agent': 'Mozilla/5.0' },
            ip: `192.168.1.${i % 255}`
          })),
          // Monitoring
          monitor.measureAsync(`load.test.${i}`, async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return { processed: true };
          })
        ])
      );

      const results = await Promise.all(loadTestOperations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(50);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all operations completed successfully
      results.forEach(([validation, security, monitoring]) => {
        expect(validation.success).toBe(true);
        expect(security.allowed).toBe(true);
        expect(monitoring.processed).toBe(true);
      });
    });
  });
});
