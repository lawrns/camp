#!/usr/bin/env node

/**
 * Test script to verify message submission API is working
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const CONV_ID = '8ddf595b-b75d-42f2-98e5-9efd3513ea4b';

async function testMessageAPI() {
  console.log('🧪 Testing Message Submission API...\n');

  try {
    console.log('📡 Testing POST /api/widget/messages');
    console.log(`Organization ID: ${ORG_ID}`);
    console.log(`Conversation ID: ${CONV_ID}\n`);

    const response = await fetch(`${BASE_URL}/api/widget/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': ORG_ID,
      },
      body: JSON.stringify({
        conversationId: CONV_ID,
        content: `Test message from API test - ${new Date().toISOString()}`,
        senderType: 'visitor',
        senderName: 'Test User',
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Success Response:');
    console.log(JSON.stringify(result, null, 2));

    return true;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

async function testGetMessages() {
  console.log('\n📡 Testing GET /api/widget/messages');

  try {
    const response = await fetch(`${BASE_URL}/api/widget/messages?conversationId=${CONV_ID}&organizationId=${ORG_ID}`);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Success Response:');
    console.log(`Messages count: ${result.messages?.length || 0}`);
    
    if (result.messages && result.messages.length > 0) {
      console.log('Latest message:', result.messages[result.messages.length - 1]);
    }

    return true;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

async function testWidgetAuth() {
  console.log('\n📡 Testing POST /api/widget/auth');

  try {
    const response = await fetch(`${BASE_URL}/api/widget/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': ORG_ID,
      },
      body: JSON.stringify({
        organizationId: ORG_ID,
        sessionData: {
          userAgent: 'Test-Agent',
          timestamp: Date.now(),
          referrer: '',
          currentUrl: 'http://localhost:3001',
        },
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Success Response:');
    console.log(JSON.stringify(result, null, 2));

    return true;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Widget API Tests\n');
  console.log('=' .repeat(50));

  const results = [];

  // Test 1: Widget Auth
  console.log('\n1️⃣ Widget Authentication Test');
  console.log('-'.repeat(30));
  results.push(await testWidgetAuth());

  // Test 2: Message Submission
  console.log('\n2️⃣ Message Submission Test');
  console.log('-'.repeat(30));
  results.push(await testMessageAPI());

  // Test 3: Message Retrieval
  console.log('\n3️⃣ Message Retrieval Test');
  console.log('-'.repeat(30));
  results.push(await testGetMessages());

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Widget API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }

  return passed === total;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
