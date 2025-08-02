/**
 * Database Upgrades Test
 * 
 * Tests the database-related fixes from CAMPFIRE_V2_UPGRADE_PLAN.json
 */

const testOrganizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const baseUrl = 'http://localhost:3001';

async function testWidgetConfigAPI() {
  console.log('🧪 Testing Widget Configuration API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/widget/config/${testOrganizationId}`);
    
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Widget Config API Success:', {
        status: response.status,
        hasConfig: !!config,
        hasBranding: !!config.branding,
        hasFeatures: !!config.features,
        companyName: config.branding?.companyName
      });
      return true;
    } else {
      console.error('❌ Widget Config API Failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Widget Config API Error:', error.message);
    return false;
  }
}

async function testWidgetConversationCreation() {
  console.log('🧪 Testing Widget Conversation Creation...');
  
  try {
    const conversationData = {
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      subject: 'Database Upgrade Test',
      initialMessage: 'Testing the RLS policy fix for anonymous users',
      metadata: {
        source: 'database_upgrade_test',
        timestamp: new Date().toISOString()
      }
    };

    const response = await fetch(`${baseUrl}/api/widget/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': testOrganizationId,
      },
      body: JSON.stringify(conversationData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Widget Conversation Creation Success:', {
        status: response.status,
        hasConversation: !!result.conversation,
        conversationId: result.conversation?.id,
        success: result.success
      });
      return result.conversation?.id;
    } else {
      const errorText = await response.text();
      console.error('❌ Widget Conversation Creation Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Widget Conversation Creation Error:', error.message);
    return false;
  }
}

async function testWidgetMessageCreation(conversationId) {
  if (!conversationId) {
    console.log('⏭️ Skipping message test - no conversation ID');
    return false;
  }

  console.log('🧪 Testing Widget Message Creation...');
  
  try {
    const messageData = {
      conversationId: conversationId,
      content: 'This is a test message to verify the service client fix works',
      senderType: 'visitor',
      senderName: 'Test Customer'
    };

    const response = await fetch(`${baseUrl}/api/widget/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': testOrganizationId,
      },
      body: JSON.stringify(messageData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Widget Message Creation Success:', {
        status: response.status,
        hasMessage: !!result.message,
        messageId: result.message?.id,
        success: result.success
      });
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Widget Message Creation Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Widget Message Creation Error:', error.message);
    return false;
  }
}

async function runDatabaseUpgradeTests() {
  console.log('🚀 Starting Database Upgrade Tests...\n');
  
  const results = {
    configAPI: false,
    conversationCreation: false,
    messageCreation: false
  };

  // Test 1: Widget Configuration API
  results.configAPI = await testWidgetConfigAPI();
  console.log('');

  // Test 2: Widget Conversation Creation (RLS Policy Fix)
  const conversationId = await testWidgetConversationCreation();
  results.conversationCreation = !!conversationId;
  console.log('');

  // Test 3: Widget Message Creation (Service Client Fix)
  results.messageCreation = await testWidgetMessageCreation(conversationId);
  console.log('');

  // Summary
  console.log('📊 Database Upgrade Test Results:');
  console.log('  Widget Config API:', results.configAPI ? '✅ PASS' : '❌ FAIL');
  console.log('  Conversation Creation:', results.conversationCreation ? '✅ PASS' : '❌ FAIL');
  console.log('  Message Creation:', results.messageCreation ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🎉 Database upgrades from CAMPFIRE_V2_UPGRADE_PLAN.json are working correctly!');
    console.log('   - Widget configuration API is responding');
    console.log('   - Anonymous users can create conversations (RLS policy fixed)');
    console.log('   - Service client bypass is working for widget operations');
  }

  return allPassed;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runDatabaseUpgradeTests().catch(console.error);
}

// Export for browser testing
if (typeof window !== 'undefined') {
  window.runDatabaseUpgradeTests = runDatabaseUpgradeTests;
  console.log('🧪 Database upgrade tests available as window.runDatabaseUpgradeTests()');
}

module.exports = { runDatabaseUpgradeTests };
