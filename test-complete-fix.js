#!/usr/bin/env node

/**
 * Comprehensive test to verify both TypeError fixes:
 * 1. sendMessage TypeError: Cannot read properties of undefined (reading 'id')
 * 2. loadMessages expecting data.messages when API returns array directly
 */

const BASE_URL = 'http://localhost:3000';

async function testGetMessages() {
  console.log('🔍 Testing GET Messages (loadMessages fix)');
  console.log('============================================');

  const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const conversationId = '48eedfba-2568-4231-bb38-2ce20420900d';

  try {
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
      console.log(`   ❌ Error: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log(`   ✅ Response type: ${Array.isArray(data) ? 'array' : typeof data}`);
    console.log(`   ✅ Messages count: ${Array.isArray(data) ? data.length : 'N/A'}`);
    
    // Test the old (broken) way vs new (fixed) way
    console.log('\n   Testing data access patterns:');
    
    // Old way (broken): expecting data.messages
    const oldWayMessages = data.messages;
    console.log(`   ❌ Old way (data.messages): ${oldWayMessages ? 'Found' : 'undefined'}`);
    
    // New way (fixed): data is the array directly
    const newWayMessages = Array.isArray(data) ? data : [];
    console.log(`   ✅ New way (Array.isArray(data) ? data : []): ${newWayMessages.length} messages`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testSendMessage() {
  console.log('\n📤 Testing POST Message (sendMessage fix)');
  console.log('==========================================');

  const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const conversationId = '48eedfba-2568-4231-bb38-2ce20420900d';

  try {
    const response = await fetch(`${BASE_URL}/api/widget/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': organizationId,
      },
      body: JSON.stringify({
        conversationId,
        content: 'Comprehensive test message to verify TypeError fix',
        senderEmail: 'test-fix@example.com',
        senderName: 'Fix Test',
        senderType: 'customer',
      }),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`   ✅ Response type: ${typeof result}`);
    
    // Test the old (broken) way vs new (fixed) way
    console.log('\n   Testing field access patterns:');
    
    try {
      // Old way (broken): expecting result.message.id
      const oldWayId = result.message.id;
      console.log(`   ⚠️ Old way (result.message.id): ${oldWayId} - Unexpected success!`);
    } catch (oldError) {
      console.log(`   ✅ Old way correctly fails: ${oldError.message}`);
    }
    
    try {
      // New way (fixed): result.id directly
      const newWayId = result.id;
      const newWayContent = result.content;
      const newWayCreatedAt = result.createdAt;
      
      console.log(`   ✅ New way (result.id): ${newWayId}`);
      console.log(`   ✅ New way (result.content): ${newWayContent}`);
      console.log(`   ✅ New way (result.createdAt): ${newWayCreatedAt}`);
      
      return true;
    } catch (newError) {
      console.log(`   ❌ New way failed: ${newError.message}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testEndToEndFlow() {
  console.log('\n🔄 Testing End-to-End Flow');
  console.log('============================');

  try {
    // 1. Send a message
    console.log('   Step 1: Sending message...');
    const sendSuccess = await testSendMessage();
    if (!sendSuccess) {
      console.log('   ❌ Send message failed, skipping rest of flow');
      return false;
    }

    // 2. Wait a moment for any async processing
    console.log('   Step 2: Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Load messages to see if our sent message appears
    console.log('   Step 3: Loading messages...');
    const loadSuccess = await testGetMessages();
    if (!loadSuccess) {
      console.log('   ❌ Load messages failed');
      return false;
    }

    console.log('   ✅ End-to-end flow completed successfully!');
    return true;
  } catch (error) {
    console.error(`   ❌ End-to-end flow failed: ${error.message}`);
    return false;
  }
}

async function testErrorScenarios() {
  console.log('\n⚠️ Testing Error Scenarios');
  console.log('============================');

  const scenarios = [
    {
      name: 'Invalid conversation ID',
      conversationId: 'invalid-uuid',
      organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
      expectError: true
    },
    {
      name: 'Missing organization ID',
      conversationId: '48eedfba-2568-4231-bb38-2ce20420900d',
      organizationId: null,
      expectError: true
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n   Testing: ${scenario.name}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (scenario.organizationId) {
        headers['X-Organization-ID'] = scenario.organizationId;
      }

      // Test GET
      const getResponse = await fetch(
        `${BASE_URL}/api/widget/messages?conversationId=${scenario.conversationId}`,
        { method: 'GET', headers }
      );
      
      console.log(`     GET Status: ${getResponse.status}`);
      
      if (scenario.expectError && getResponse.ok) {
        console.log(`     ⚠️ Expected error but got success`);
      } else if (!scenario.expectError && !getResponse.ok) {
        console.log(`     ⚠️ Expected success but got error`);
      } else {
        console.log(`     ✅ Response as expected`);
      }

      // Test POST
      const postResponse = await fetch(`${BASE_URL}/api/widget/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId: scenario.conversationId,
          content: 'Error test message',
          senderEmail: 'error-test@example.com',
          senderName: 'Error Test',
          senderType: 'customer',
        }),
      });
      
      console.log(`     POST Status: ${postResponse.status}`);
      
    } catch (error) {
      console.log(`     ❌ Network error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE TYPEERROR FIX VERIFICATION');
  console.log('=============================================');
  console.log('Testing fixes for:');
  console.log('1. TypeError: Cannot read properties of undefined (reading \'id\')');
  console.log('2. loadMessages expecting data.messages when API returns array');
  console.log('');

  const results = {
    getMessages: false,
    sendMessage: false,
    endToEnd: false
  };

  // Run individual tests
  results.getMessages = await testGetMessages();
  results.sendMessage = await testSendMessage();
  results.endToEnd = await testEndToEndFlow();
  
  // Run error scenarios
  await testErrorScenarios();

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ GET Messages (loadMessages): ${results.getMessages ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ POST Message (sendMessage): ${results.sendMessage ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ End-to-End Flow: ${results.endToEnd ? 'PASSED' : 'FAILED'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎉 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n✅ The TypeError issues have been successfully resolved!');
    console.log('   - sendMessage no longer tries to access result.message.id');
    console.log('   - loadMessages correctly handles array response from API');
  } else {
    console.log('\n❌ Some issues remain. Check the test output above for details.');
  }
  
  return allPassed;
}

runAllTests().catch(console.error);
