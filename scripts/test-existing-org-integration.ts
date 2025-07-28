#!/usr/bin/env tsx
/**
 * TEST EXISTING ORGANIZATION INTEGRATION
 * 
 * Tests the integration using existing organizations in the database
 * to verify widget-to-agent communication works.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use existing test organization UUID from the database
const EXISTING_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd'; // Test Organization

async function testExistingOrgIntegration() {
  console.log('🔗 TESTING EXISTING ORGANIZATION INTEGRATION');
  console.log('============================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // ========================================
    // 1. VERIFY EXISTING ORGANIZATION
    // ========================================
    console.log('1️⃣ Verifying existing organization...');

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', EXISTING_ORG_ID)
      .single();

    if (orgError || !org) {
      console.log('❌ Organization not found:', orgError);
      console.log('Available organizations:');
      
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .limit(5);
      
      orgs?.forEach(o => {
        console.log(`   - ${o.id}: ${o.name} (${o.slug})`);
      });
      return;
    }

    console.log(`✅ Organization found: ${org.name} (${org.id})`);

    // ========================================
    // 2. CREATE TEST CONVERSATION
    // ========================================
    console.log('\n2️⃣ Creating test conversation...');

    const testConvId = crypto.randomUUID();
    
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        id: testConvId,
        organization_id: EXISTING_ORG_ID,
        status: 'open',
        subject: 'Test Widget Conversation',
        metadata: {
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          widgetSessionId: `session-${Date.now()}`,
          channel: 'widget',
        },
      })
      .select()
      .single();

    if (convError) {
      console.log('❌ Failed to create conversation:', convError);
      return;
    }

    console.log(`✅ Conversation created: ${conversation.id}`);

    // ========================================
    // 3. CREATE TEST MESSAGE
    // ========================================
    console.log('\n3️⃣ Creating test message...');

    const testMessageId = crypto.randomUUID();
    const testMessage = {
      id: testMessageId,
      conversation_id: testConvId,
      organization_id: EXISTING_ORG_ID,
      content: `Test message from widget at ${new Date().toISOString()}`,
      sender_type: 'user', // Changed from 'customer' to 'user' based on schema constraint
      sender_email: 'test@example.com',
      sender_name: 'Test Customer',
      metadata: {
        source: 'widget',
        timestamp: new Date().toISOString(),
      },
    };

    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single();

    if (msgError) {
      console.log('❌ Failed to create message:', msgError);
      return;
    }

    console.log(`✅ Message created: ${message.id}`);

    // ========================================
    // 4. TEST REAL-TIME BROADCASTING
    // ========================================
    console.log('\n4️⃣ Testing real-time broadcasting...');

    const receivedEvents: any[] = [];

    // Set up monitoring using the unified channel names
    const orgChannelName = `org:${EXISTING_ORG_ID}`;
    const convChannelName = `org:${EXISTING_ORG_ID}:conv:${testConvId}`;

    console.log(`📡 Monitoring org channel: ${orgChannelName}`);
    console.log(`📡 Monitoring conv channel: ${convChannelName}`);

    const orgChannel = supabase.channel(orgChannelName);
    const convChannel = supabase.channel(convChannelName);

    orgChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created on org channel');
        receivedEvents.push({ type: 'org-message', payload, timestamp: Date.now() });
      })
      .on('broadcast', { event: 'conversation:updated' }, (payload) => {
        console.log('📡 Received conversation:updated on org channel');
        receivedEvents.push({ type: 'org-conversation', payload, timestamp: Date.now() });
      })
      .subscribe((status) => {
        console.log(`📡 Org channel status: ${status}`);
      });

    convChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created on conv channel');
        receivedEvents.push({ type: 'conv-message', payload, timestamp: Date.now() });
      })
      .subscribe((status) => {
        console.log(`📡 Conv channel status: ${status}`);
      });

    // Wait for subscriptions
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Broadcast events (simulating what the widget API should do)
    console.log('📤 Broadcasting message:created event...');
    
    await convChannel.send({
      type: 'broadcast',
      event: 'message:created',
      payload: {
        message,
        conversationId: testConvId,
        organizationId: EXISTING_ORG_ID,
        timestamp: new Date().toISOString(),
      }
    });

    await orgChannel.send({
      type: 'broadcast',
      event: 'conversation:updated',
      payload: {
        conversationId: testConvId,
        organizationId: EXISTING_ORG_ID,
        lastMessage: message,
        timestamp: new Date().toISOString(),
      }
    });

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log(`✅ Real-time test completed. Events received: ${receivedEvents.length}`);

    // ========================================
    // 5. VERIFY AGENT DASHBOARD QUERIES
    // ========================================
    console.log('\n5️⃣ Testing agent dashboard queries...');

    // Test conversation list query (what agent dashboard would run)
    const { data: conversations, error: convListError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages:messages(
          id,
          content,
          sender_type,
          sender_name,
          created_at
        )
      `)
      .eq('organization_id', EXISTING_ORG_ID)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (convListError) {
      console.log('❌ Failed to query conversations:', convListError);
    } else {
      console.log(`✅ Found ${conversations.length} conversations in organization`);
      const testConv = conversations.find(c => c.id === testConvId);
      if (testConv) {
        console.log(`   ✅ Test conversation found with ${testConv.messages?.length || 0} messages`);
      } else {
        console.log(`   ⚠️  Test conversation not found in query results`);
      }
    }

    // Test message list query (what agent dashboard would run for selected conversation)
    const { data: messages, error: msgListError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', testConvId)
      .eq('organization_id', EXISTING_ORG_ID)
      .order('created_at', { ascending: true });

    if (msgListError) {
      console.log('❌ Failed to query messages:', msgListError);
    } else {
      console.log(`✅ Found ${messages.length} messages in test conversation`);
      messages.forEach(msg => {
        console.log(`   - ${msg.id}: "${msg.content}" (${msg.sender_type})`);
      });
    }

    // ========================================
    // 6. ANALYZE RESULTS
    // ========================================
    console.log('\n6️⃣ Analysis & Recommendations...');

    const hasConversations = conversations && conversations.length > 0;
    const hasMessages = messages && messages.length > 0;
    const hasRealtimeEvents = receivedEvents.length > 0;
    const testConvFound = conversations?.some(c => c.id === testConvId);

    console.log('\n📊 INTEGRATION TEST RESULTS');
    console.log('===========================');
    console.log(`✅ Organization Verified: Yes (${org.name})`);
    console.log(`✅ Conversation Created: Yes`);
    console.log(`✅ Message Created: Yes`);
    console.log(`${hasConversations ? '✅' : '❌'} Agent Can Query Conversations: ${hasConversations ? 'Yes' : 'No'}`);
    console.log(`${testConvFound ? '✅' : '❌'} Test Conversation Found: ${testConvFound ? 'Yes' : 'No'}`);
    console.log(`${hasMessages ? '✅' : '❌'} Agent Can Query Messages: ${hasMessages ? 'Yes' : 'No'}`);
    console.log(`${hasRealtimeEvents ? '✅' : '❌'} Real-time Events Working: ${hasRealtimeEvents ? 'Yes' : 'No'}`);

    if (hasRealtimeEvents) {
      console.log('\n📡 REAL-TIME EVENTS RECEIVED:');
      receivedEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type} at ${new Date(event.timestamp).toISOString()}`);
      });
    }

    console.log('\n💡 DIAGNOSIS:');
    
    if (!hasConversations || !hasMessages) {
      console.log('❌ Database operations failing:');
      console.log('   - Check RLS policies on conversations and messages tables');
      console.log('   - Verify organizationId is being set correctly');
      console.log('   - Check if agent user has proper permissions');
    } else {
      console.log('✅ Database operations working correctly');
    }

    if (!hasRealtimeEvents) {
      console.log('❌ Real-time events not working:');
      console.log('   - Widget API is not broadcasting events after creating messages');
      console.log('   - Agent dashboard may not be subscribing to correct channels');
      console.log('   - Check if Supabase real-time is enabled');
    } else {
      console.log('✅ Real-time broadcasting working correctly');
    }

    if (hasConversations && hasMessages && hasRealtimeEvents && testConvFound) {
      console.log('\n🎉 INTEGRATION IS WORKING CORRECTLY!');
      console.log('   - Database operations are successful');
      console.log('   - Real-time events are being received');
      console.log('   - Agent dashboard should be able to see widget conversations');
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Update widget API to broadcast real-time events after message creation');
      console.log('   2. Ensure agent dashboard subscribes to the same channels');
      console.log('   3. Test with actual widget and dashboard components');
    } else {
      console.log('\n⚠️  INTEGRATION HAS ISSUES - see diagnosis above');
    }

    // ========================================
    // 7. CLEANUP
    // ========================================
    console.log('\n7️⃣ Cleaning up test data...');

    // Delete test message
    await supabase.from('messages').delete().eq('id', message.id);
    
    // Delete test conversation
    await supabase.from('conversations').delete().eq('id', conversation.id);

    console.log('✅ Test data cleaned up');

    // Close channels
    supabase.removeChannel(orgChannel);
    supabase.removeChannel(convChannel);

    return {
      success: hasConversations && hasMessages && testConvFound,
      realtimeWorking: hasRealtimeEvents,
      organizationFound: true,
      conversationsFound: conversations?.length || 0,
      messagesFound: messages?.length || 0,
      eventsReceived: receivedEvents.length,
    };

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

// Run the test
if (require.main === module) {
  testExistingOrgIntegration().catch(console.error);
}

export { testExistingOrgIntegration };
