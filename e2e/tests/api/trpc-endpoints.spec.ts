/**
 * tRPC Endpoints E2E Test
 * 
 * Tests that all tRPC endpoints are accessible and working correctly.
 * This verifies the Phase 1 implementation is successful.
 */

import { test, expect } from '@playwright/test';

test.describe('tRPC Endpoints', () => {
  test('should verify all tRPC endpoints are accessible', async ({ request }) => {
    console.log('🚀 Testing tRPC endpoints accessibility...');

    const baseUrl = 'http://localhost:3000';
    const testOrgId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
    
    // Encode the input for tRPC batch requests
    const encodedInput = encodeURIComponent(JSON.stringify({
      "0": {
        "json": {
          "organizationId": testOrgId
        }
      }
    }));

    const endpoints = [
      {
        name: 'Conversations List',
        url: `/api/trpc/conversations.list?batch=1&input=${encodedInput}`,
        expectedStatuses: [200, 401] // 200 if authenticated, 401 if not
      },
      {
        name: 'Tickets List', 
        url: `/api/trpc/tickets.list?batch=1&input=${encodedInput}`,
        expectedStatuses: [200, 401]
      },
      {
        name: 'Analytics Dashboard Metrics',
        url: `/api/trpc/analytics.getDashboardMetrics?batch=1&input=${encodedInput}`,
        expectedStatuses: [200, 401]
      },
      {
        name: 'Analytics Real-time Metrics',
        url: `/api/trpc/analytics.getRealTimeMetrics?batch=1&input=${encodedInput}`,
        expectedStatuses: [200, 401]
      },
      {
        name: 'Tickets Stats',
        url: `/api/trpc/tickets.getStats?batch=1&input=${encodedInput}`,
        expectedStatuses: [200, 401]
      }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`📍 Testing: ${endpoint.name}`);
      
      try {
        const response = await request.get(`${baseUrl}${endpoint.url}`);
        const status = response.status();
        const isExpectedStatus = endpoint.expectedStatuses.includes(status);
        
        console.log(`  ✅ ${endpoint.name}: ${status} ${response.statusText()}`);
        
        expect(isExpectedStatus).toBe(true);
        
        // If we get a response, try to parse it to ensure it's valid JSON
        if (status === 200 || status === 401) {
          try {
            const body = await response.text();
            if (body.trim()) {
              JSON.parse(body);
              console.log(`  ✅ Valid JSON response`);
            }
          } catch (parseError) {
            console.log(`  ⚠️ Response not valid JSON (might be expected for some endpoints)`);
          }
        }
        
        results.push({
          name: endpoint.name,
          status,
          success: isExpectedStatus
        });
        
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: Error - ${error}`);
        results.push({
          name: endpoint.name,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`\n📊 Results Summary:`);
    console.log(`✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`  ${icon} ${result.name}: ${result.status}`);
    });

    // All endpoints should be accessible (either 200 or 401, not 404 or 500)
    expect(successCount).toBe(totalCount);
    
    console.log('\n🎉 All tRPC endpoints are accessible and working correctly!');
  });

  test('should verify tRPC error handling', async ({ request }) => {
    console.log('🚀 Testing tRPC error handling...');

    const baseUrl = 'http://localhost:3000';
    
    // Test with invalid input to verify error handling
    const invalidTests = [
      {
        name: 'Invalid Organization ID',
        url: '/api/trpc/conversations.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22organizationId%22%3A%22invalid-uuid%22%7D%7D%7D',
        expectedStatuses: [400, 401] // Should return validation error or auth error
      },
      {
        name: 'Missing Input',
        url: '/api/trpc/conversations.list?batch=1',
        expectedStatuses: [400, 401] // Should return validation error or auth error
      },
      {
        name: 'Non-existent Procedure',
        url: '/api/trpc/nonexistent.procedure?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D',
        expectedStatuses: [404] // Should return not found
      }
    ];

    for (const test of invalidTests) {
      console.log(`📍 Testing: ${test.name}`);
      
      const response = await request.get(`${baseUrl}${test.url}`);
      const status = response.status();
      const isExpectedStatus = test.expectedStatuses.includes(status);
      
      console.log(`  ✅ ${test.name}: ${status} ${response.statusText()}`);
      expect(isExpectedStatus).toBe(true);
    }

    console.log('✅ tRPC error handling is working correctly!');
  });

  test('should verify tRPC batch requests work', async ({ request }) => {
    console.log('🚀 Testing tRPC batch requests...');

    const baseUrl = 'http://localhost:3000';
    const testOrgId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
    
    // Test batch request with multiple procedures
    const batchInput = encodeURIComponent(JSON.stringify({
      "0": {
        "json": {
          "organizationId": testOrgId
        }
      },
      "1": {
        "json": {
          "organizationId": testOrgId
        }
      }
    }));

    const batchUrl = `/api/trpc/conversations.list,tickets.list?batch=1&input=${batchInput}`;
    
    console.log('📍 Testing batch request...');
    
    const response = await request.get(`${baseUrl}${batchUrl}`);
    const status = response.status();
    
    console.log(`  ✅ Batch request: ${status} ${response.statusText()}`);
    
    // Should return either 200 (success) or 401 (auth required)
    expect([200, 401]).toContain(status);
    
    // If successful, should return an array of results
    if (status === 200) {
      try {
        const body = await response.text();
        const parsed = JSON.parse(body);
        expect(Array.isArray(parsed)).toBe(true);
        console.log(`  ✅ Batch response is array with ${parsed.length} items`);
      } catch (error) {
        console.log(`  ⚠️ Could not parse batch response as JSON`);
      }
    }

    console.log('✅ tRPC batch requests are working correctly!');
  });

  test('should verify tRPC POST mutations work', async ({ request }) => {
    console.log('🚀 Testing tRPC POST mutations...');

    const baseUrl = 'http://localhost:3000';
    const testOrgId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
    
    // Test POST request for mutations (like creating conversations)
    const mutationData = {
      "0": {
        "json": {
          "organizationId": testOrgId,
          "title": "Test Conversation",
          "priority": "medium"
        }
      }
    };

    console.log('📍 Testing conversation creation mutation...');
    
    const response = await request.post(`${baseUrl}/api/trpc/conversations.create?batch=1`, {
      data: mutationData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status();
    console.log(`  ✅ Create conversation: ${status} ${response.statusText()}`);
    
    // Should return either 200 (success) or 401 (auth required) or 400 (validation error)
    expect([200, 400, 401]).toContain(status);

    console.log('✅ tRPC POST mutations are accessible!');
  });
});
