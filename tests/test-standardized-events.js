#!/usr/bin/env node

/**
 * Direct API Test Script - Following Other AI's Approach
 * Tests the standardized event flow without browser complexity
 */

const BASE_URL = 'http://localhost:3001';
const ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const CONV_ID = '45d0d460-847b-439d-a830-11098fa0817d';

async function testAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': ORG_ID,
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Standardized Event Flow\n');

  // Test 1: Create Message (should broadcast "message_created")
  console.log('1️⃣ Testing Message Creation...');
  const messageResult = await testAPI('/api/widget/messages', {
    method: 'POST',
    body: JSON.stringify({
      conversationId: CONV_ID,
      content: '🧪 TEST: Standardized event flow test message',
      senderEmail: 'test@example.com',
      senderName: 'Test User',
      senderType: 'customer'
    })
  });
  
  console.log('Message Result:', messageResult);
  
  // Test 2: Get Messages (verify it was created)
  console.log('\n2️⃣ Testing Message Retrieval...');
  const getResult = await testAPI(`/api/widget/messages?conversationId=${CONV_ID}`);
  console.log('Get Result:', getResult.status, getResult.data?.length ? `${getResult.data.length} messages` : 'No messages');
  
  // Test 3: Test Widget Auth (should broadcast "conversation_created" if new)
  console.log('\n3️⃣ Testing Widget Auth...');
  const authResult = await testAPI('/api/widget/auth', {
    method: 'POST',
    body: JSON.stringify({
      customerEmail: 'test-standardized@example.com',
      customerName: 'Standardized Test User',
      organizationId: ORG_ID
    })
  });
  
  console.log('Auth Result:', authResult);
  
  console.log('\n✅ Test Complete! Check server logs for real-time broadcast messages.');
}

runTests().catch(console.error);
