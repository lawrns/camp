#!/usr/bin/env node

/**
 * Test script to verify the messages API endpoint
 */

const BASE_URL = 'http://localhost:3000';

async function testMessagesAPI() {
  console.log('🧪 Testing Messages API Endpoint');
  console.log('================================');

  // Test data
  const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const conversationId = '48eedfba-2568-4231-bb38-2ce20420900d';

  try {
    console.log('\n1. Testing GET /api/widget/messages...');
    console.log(`   Organization ID: ${organizationId}`);
    console.log(`   Conversation ID: ${conversationId}`);

    const response = await fetch(`${BASE_URL}/api/widget/messages?conversationId=${conversationId}`, {
      method: 'GET',
      headers: {
        'X-Organization-ID': organizationId,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Error Response: ${errorText}`);
      
      // Try to parse as JSON for better error details
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`   Error Details:`, errorJson);
      } catch (e) {
        console.log(`   Raw Error: ${errorText}`);
      }
      return;
    }

    const data = await response.json();
    console.log(`   Success! Received ${Array.isArray(data) ? data.length : 'unknown'} messages`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Test different organization/conversation combinations
async function testMultipleScenarios() {
  console.log('\n\n🔄 Testing Multiple Scenarios');
  console.log('==============================');

  const scenarios = [
    {
      name: 'Valid IDs from error log',
      orgId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
      convId: '48eedfba-2568-4231-bb38-2ce20420900d'
    },
    {
      name: 'Second valid ID from error log',
      orgId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
      convId: '8f62d72b-d13e-46cf-b89e-1f50e46cdf52'
    },
    {
      name: 'Missing organization ID',
      orgId: null,
      convId: '48eedfba-2568-4231-bb38-2ce20420900d'
    },
    {
      name: 'Missing conversation ID',
      orgId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
      convId: null
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    
    try {
      const url = `${BASE_URL}/api/widget/messages${scenario.convId ? `?conversationId=${scenario.convId}` : ''}`;
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (scenario.orgId) {
        headers['X-Organization-ID'] = scenario.orgId;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 400) {
        const errorData = await response.json();
        console.log(`   Expected 400 error:`, errorData);
      } else if (response.ok) {
        const data = await response.json();
        console.log(`   Success: ${Array.isArray(data) ? data.length : 'unknown'} messages`);
      } else {
        const errorText = await response.text();
        console.log(`   Unexpected error: ${errorText}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testMessagesAPI();
  await testMultipleScenarios();
  
  console.log('\n✅ Test suite completed');
}

runAllTests().catch(console.error);
