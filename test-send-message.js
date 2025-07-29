#!/usr/bin/env node

/**
 * Test script to verify the sendMessage functionality and API response structure
 */

const BASE_URL = 'http://localhost:3000';

async function testSendMessage() {
  console.log('🧪 Testing Send Message API');
  console.log('============================');

  // Test data
  const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const conversationId = '48eedfba-2568-4231-bb38-2ce20420900d';

  try {
    console.log('\n1. Testing POST /api/widget/messages...');
    console.log(`   Organization ID: ${organizationId}`);
    console.log(`   Conversation ID: ${conversationId}`);

    const response = await fetch(`${BASE_URL}/api/widget/messages`, {
      method: 'POST',
      headers: {
        'X-Organization-ID': organizationId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        content: 'Test message from API test script',
        senderEmail: 'test@example.com',
        senderName: 'Test User',
        senderType: 'customer',
      }),
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
    console.log(`   ✅ Success! Message created`);
    console.log(`   Response Structure:`, JSON.stringify(data, null, 2));
    
    // Validate the response structure
    console.log('\n2. Validating Response Structure...');
    const requiredFields = ['id', 'content', 'createdAt', 'conversationId'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
    } else {
      console.log(`   ✅ All required fields present`);
    }
    
    // Test the specific fields that were causing the error
    console.log('\n3. Testing Field Access...');
    try {
      console.log(`   data.id: ${data.id}`);
      console.log(`   data.content: ${data.content}`);
      console.log(`   data.createdAt: ${data.createdAt}`);
      console.log(`   ✅ All field access successful`);
    } catch (error) {
      console.log(`   ❌ Field access error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Test different scenarios
async function testErrorScenarios() {
  console.log('\n\n🔄 Testing Error Scenarios');
  console.log('===========================');

  const scenarios = [
    {
      name: 'Missing conversationId',
      body: {
        content: 'Test message',
        senderEmail: 'test@example.com',
        senderName: 'Test User',
        senderType: 'customer',
      }
    },
    {
      name: 'Missing content',
      body: {
        conversationId: '48eedfba-2568-4231-bb38-2ce20420900d',
        senderEmail: 'test@example.com',
        senderName: 'Test User',
        senderType: 'customer',
      }
    },
    {
      name: 'Missing organization header',
      body: {
        conversationId: '48eedfba-2568-4231-bb38-2ce20420900d',
        content: 'Test message',
        senderEmail: 'test@example.com',
        senderName: 'Test User',
        senderType: 'customer',
      },
      skipOrgHeader: true
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (!scenario.skipOrgHeader) {
        headers['X-Organization-ID'] = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
      }

      const response = await fetch(`${BASE_URL}/api/widget/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(scenario.body),
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 400) {
        const errorData = await response.json();
        console.log(`   Expected 400 error:`, errorData);
      } else if (response.ok) {
        const data = await response.json();
        console.log(`   Unexpected success: ${JSON.stringify(data)}`);
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
  await testSendMessage();
  await testErrorScenarios();
  
  console.log('\n✅ Test suite completed');
}

runAllTests().catch(console.error);
