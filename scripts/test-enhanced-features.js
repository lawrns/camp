#!/usr/bin/env node

/**
 * Test script for enhanced AI features
 * Tests all the new functionality we've implemented
 */

const BASE_URL = 'http://localhost:3003';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      if (options.showData) {
        console.log(`   Data:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`   Keys:`, Object.keys(data));
      }
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error:`, data.error || data.message);
    }
  } catch (error) {
    console.log(`💥 ${name} - ERROR`);
    console.log(`   Error:`, error.message);
  }
}

async function testPostEndpoint(name, url, body, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      if (options.showData) {
        console.log(`   Data:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`   Keys:`, Object.keys(data));
      }
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error:`, data.error || data.message);
    }
  } catch (error) {
    console.log(`💥 ${name} - ERROR`);
    console.log(`   Error:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Enhanced Features Test Suite');
  console.log('==========================================');

  // Test basic health
  await testEndpoint('Health Check', '/api/health', { showData: true });

  // Test performance metrics
  await testEndpoint('Performance Metrics - Summary', '/api/performance/metrics?type=summary');
  await testEndpoint('Performance Metrics - Cache', '/api/performance/metrics?type=cache');
  await testEndpoint('Performance Metrics - Database', '/api/performance/metrics?type=database');

  // Test AI reply suggestions
  await testPostEndpoint('AI Reply Suggestions', '/api/ai/reply-suggestions', {
    conversationId: 'test-conv-123',
    organizationId: 'test-org-456',
    messageContent: 'I need help with billing',
    conversationHistory: [
      {
        id: 'msg-1',
        content: 'Hello',
        senderType: 'customer',
        timestamp: new Date().toISOString(),
      }
    ]
  });

  // Test enhanced AI analytics
  await testEndpoint(
    'Enhanced AI Analytics - Performance',
    '/api/analytics/ai-enhanced?organizationId=test-org&type=performance&startDate=2025-07-22&endDate=2025-07-29'
  );

  await testEndpoint(
    'Enhanced AI Analytics - Real-time',
    '/api/analytics/ai-enhanced?organizationId=test-org&type=realtime'
  );

  // Test Slack integration status
  await testEndpoint('Slack Integration Status', '/api/integrations/slack?action=status');

  // Test analytics tracking
  await testPostEndpoint('Track AI Interaction', '/api/analytics/ai-enhanced', {
    conversationId: 'test-conv-123',
    organizationId: 'test-org-456',
    messageId: 'msg-789',
    aiResponseTime: 1200,
    confidence: 0.85,
    sentiment: 'neutral',
    handoverTriggered: false,
    sourcesUsed: 3,
    empathyScore: 0.8,
    responseCategory: 'detailed_response'
  });

  console.log('\n🏁 Test Suite Complete');
  console.log('======================');
}

// Run the tests
runTests().catch(console.error);
