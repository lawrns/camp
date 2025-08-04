#!/usr/bin/env tsx
/**
 * REAL-TIME FLOW TESTING SCRIPT
 * 
 * Tests the complete flow from widget message submission to agent dashboard display:
 * 1. Creates a test conversation via widget auth API
 * 2. Sends a message via widget messages API
 * 3. Verifies real-time broadcasting is working
 * 4. Checks if agent dashboard would receive the events
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL = 'http://localhost:3001';

// Test organization ID (you can change this to match your test org)
const TEST_ORG_ID = 'e2e-test-org';

async function testRealtimeFlow() {
  console.log('🔄 TESTING REAL-TIME FLOW: Widget → Agent Dashboard');
  console.log('====================================================\n');

  // Initialize Supabase client for monitoring
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  let conversationId: string | null = null;
  let testResults: unknown[] = [];

  try {
    // ========================================
    // 1. TEST CONVERSATION CREATION
    // ========================================
    console.log('1️⃣ Testing conversation creation via widget auth...');
    
    const authResponse = await fetch(`${BASE_URL}/api/widget/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': TEST_ORG_ID,
      },
      body: JSON.stringify({
        organizationId: TEST_ORG_ID,
        customerEmail: 'test-customer@example.com',
        customerName: 'Test Customer',
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Auth API failed: ${authResponse.status} ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    conversationId = authData.conversationId;

    console.log(`✅ Conversation created: ${conversationId}`);
    testResults.push({
      test: 'Conversation Creation',
      success: true,
      conversationId,
      data: authData,
    });

    // ========================================
    // 2. SETUP REAL-TIME MONITORING
    // ========================================
    console.log('\n2️⃣ Setting up real-time monitoring...');

    const receivedEvents: unknown[] = [];
    
    // Monitor organization channel for new conversations
    const orgChannel = supabase.channel(`org:${TEST_ORG_ID}`);
    orgChannel
      .on('broadcast', { event: 'conversation:created' }, (payload) => {
        console.log('📡 Received conversation:created event:', payload);
        receivedEvents.push({ type: 'conversation:created', payload, timestamp: Date.now() });
      })
      .on('broadcast', { event: 'conversation:updated' }, (payload) => {
        console.log('📡 Received conversation:updated event:', payload);
        receivedEvents.push({ type: 'conversation:updated', payload, timestamp: Date.now() });
      })
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created event:', payload);
        receivedEvents.push({ type: 'message:created', payload, timestamp: Date.now() });
      })
      .subscribe();

    // Monitor conversation-specific channel for messages
    const convChannel = supabase.channel(`org:${TEST_ORG_ID}:conv:${conversationId}`);
    convChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received conversation-specific message:created event:', payload);
        receivedEvents.push({ type: 'conv-message:created', payload, timestamp: Date.now() });
      })
      .subscribe();

    console.log('✅ Real-time monitoring setup complete');

    // Wait a moment for subscriptions to be established
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========================================
    // 3. TEST MESSAGE SENDING
    // ========================================
    console.log('\n3️⃣ Testing message sending via widget API...');

    const testMessage = `Test message from widget at ${new Date().toISOString()}`;
    
    const messageResponse = await fetch(`${BASE_URL}/api/widget/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': TEST_ORG_ID,
      },
      body: JSON.stringify({
        conversationId,
        content: testMessage,
        senderEmail: 'test-customer@example.com',
        senderName: 'Test Customer',
        senderType: 'customer',
      }),
    });

    if (!messageResponse.ok) {
      throw new Error(`Message API failed: ${messageResponse.status} ${messageResponse.statusText}`);
    }

    const messageData = await messageResponse.json();
    console.log(`✅ Message sent: ${messageData.id}`);
    
    testResults.push({
      test: 'Message Creation',
      success: true,
      messageId: messageData.id,
      content: testMessage,
      data: messageData,
    });

    // ========================================
    // 4. WAIT FOR REAL-TIME EVENTS
    // ========================================
    console.log('\n4️⃣ Waiting for real-time events...');
    
    // Wait for real-time events to be received
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========================================
    // 5. VERIFY DATABASE STATE
    // ========================================
    console.log('\n5️⃣ Verifying database state...');

    // Check if conversation exists in database
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('organizationId', TEST_ORG_ID)
      .single();

    if (convError) {
      console.log('❌ Conversation not found in database:', convError);
      testResults.push({
        test: 'Database Conversation Verification',
        success: false,
        error: convError,
      });
    } else {
      console.log('✅ Conversation found in database:', conversation.id);
      testResults.push({
        test: 'Database Conversation Verification',
        success: true,
        data: conversation,
      });
    }

    // Check if message exists in database
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversationId', conversationId)
      .eq('organizationId', TEST_ORG_ID)
      .order('createdAt', { ascending: false });

    if (msgError) {
      console.log('❌ Messages not found in database:', msgError);
      testResults.push({
        test: 'Database Message Verification',
        success: false,
        error: msgError,
      });
    } else {
      console.log(`✅ Found ${messages.length} messages in database`);
      testResults.push({
        test: 'Database Message Verification',
        success: true,
        messageCount: messages.length,
        data: messages,
      });
    }

    // ========================================
    // 6. ANALYZE RESULTS
    // ========================================
    console.log('\n6️⃣ Analyzing test results...');

    const summary = {
      totalTests: testResults.length,
      passedTests: testResults.filter(r => r.success).length,
      failedTests: testResults.filter(r => !r.success).length,
      realtimeEvents: receivedEvents.length,
      conversationCreated: !!conversationId,
      messagesSent: testResults.filter(r => r.test === 'Message Creation' && r.success).length,
      databaseVerified: testResults.filter(r => r.test.includes('Database') && r.success).length,
    };

    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Real-time Events Received: ${summary.realtimeEvents}`);
    console.log(`Conversation Created: ${summary.conversationCreated ? 'Yes' : 'No'}`);
    console.log(`Messages Sent: ${summary.messagesSent}`);
    console.log(`Database Verified: ${summary.databaseVerified}/2`);

    console.log('\n📡 REAL-TIME EVENTS RECEIVED:');
    if (receivedEvents.length === 0) {
      console.log('❌ No real-time events received - this indicates a problem with broadcasting');
    } else {
      receivedEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type} at ${new Date(event.timestamp).toISOString()}`);
      });
    }

    console.log('\n🔍 DETAILED TEST RESULTS:');
    testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.test}`);
      if (result.error) {
        console.log(`      Error: ${result.error.message || result.error}`);
      }
    });

    // ========================================
    // 7. RECOMMENDATIONS
    // ========================================
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (summary.realtimeEvents === 0) {
      console.log('❌ No real-time events received:');
      console.log('   - Check if Supabase real-time is enabled');
      console.log('   - Verify channel naming consistency');
      console.log('   - Check if broadcast events are being sent from API');
    } else {
      console.log('✅ Real-time events are working correctly');
    }

    if (summary.databaseVerified < 2) {
      console.log('❌ Database verification failed:');
      console.log('   - Check database permissions');
      console.log('   - Verify organization ID is correct');
      console.log('   - Check if RLS policies are blocking access');
    } else {
      console.log('✅ Database operations are working correctly');
    }

    if (summary.passedTests === summary.totalTests && summary.realtimeEvents > 0) {
      console.log('🎉 ALL TESTS PASSED - Real-time flow is working correctly!');
    } else {
      console.log('⚠️  Some tests failed - check the issues above');
    }

    // Cleanup
    supabase.removeChannel(orgChannel);
    supabase.removeChannel(convChannel);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.push({
      test: 'Overall Test Execution',
      success: false,
      error: error.toString(),
    });
  }

  return testResults;
}

// Run the test
if (require.main === module) {
  testRealtimeFlow().catch(console.error);
}

export { testRealtimeFlow };
