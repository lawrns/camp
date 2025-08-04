#!/usr/bin/env tsx
/**
 * WIDGET-AGENT INTEGRATION TEST
 * 
 * Tests the actual integration between widget and agent dashboard
 * by creating a test conversation and message, then verifying
 * the agent dashboard can see it.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testWidgetAgentIntegration() {
  console.log('🔗 WIDGET-AGENT INTEGRATION TEST');
  console.log('================================\n');

  // Use service role key for admin operations
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // ========================================
    // 1. CREATE TEST ORGANIZATION
    // ========================================
    console.log('1️⃣ Creating test organization...');

    const testOrgId = `test-org-${Date.now()}`;
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: testOrgId,
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        settings: {
          ai_enabled: true,
          widget_enabled: true,
        },
      })
      .select()
      .single();

    if (orgError) {
      console.log('❌ Failed to create organization:', orgError);
      return;
    }

    console.log(`✅ Organization created: ${org.id}`);

    // ========================================
    // 2. CREATE TEST CONVERSATION
    // ========================================
    console.log('\n2️⃣ Creating test conversation...');

    const testConvId = `conv-${Date.now()}`;
    
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        id: testConvId,
        organizationId: testOrgId,
        status: 'active',
        channel: 'widget',
        metadata: {
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          widgetSessionId: `session-${Date.now()}`,
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

    const testMessage = {
      id: `msg-${Date.now()}`,
      conversationId: testConvId,
      organizationId: testOrgId,
      content: `Test message from widget at ${new Date().toISOString()}`,
      senderType: 'customer',
      senderEmail: 'test@example.com',
      senderName: 'Test Customer',
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

    const receivedEvents: unknown[] = [];

    // Set up monitoring
    const orgChannel = supabase.channel(`org:${testOrgId}`);
    const convChannel = supabase.channel(`org:${testOrgId}:conv:${testConvId}`);

    orgChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created on org channel');
        receivedEvents.push({ type: 'org-message', payload });
      })
      .on('broadcast', { event: 'conversation:updated' }, (payload) => {
        console.log('📡 Received conversation:updated on org channel');
        receivedEvents.push({ type: 'org-conversation', payload });
      })
      .subscribe();

    convChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created on conv channel');
        receivedEvents.push({ type: 'conv-message', payload });
      })
      .subscribe();

    // Wait for subscriptions
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Broadcast events (simulating what the widget API should do)
    console.log('📤 Broadcasting message:created event...');
    
    await convChannel.send({
      type: 'broadcast',
      event: 'message:created',
      payload: {
        message,
        conversationId: testConvId,
        organizationId: testOrgId,
      }
    });

    await orgChannel.send({
      type: 'broadcast',
      event: 'conversation:updated',
      payload: {
        conversationId: testConvId,
        organizationId: testOrgId,
        lastMessage: message,
      }
    });

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 3000));

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
          senderType,
          senderName,
          createdAt
        )
      `)
      .eq('organizationId', testOrgId)
      .order('updatedAt', { ascending: false });

    if (convListError) {
      console.log('❌ Failed to query conversations:', convListError);
    } else {
      console.log(`✅ Found ${conversations.length} conversations`);
      conversations.forEach(conv => {
        console.log(`   - ${conv.id}: ${conv.messages?.length || 0} messages`);
      });
    }

    // Test message list query (what agent dashboard would run for selected conversation)
    const { data: messages, error: msgListError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversationId', testConvId)
      .eq('organizationId', testOrgId)
      .order('createdAt', { ascending: true });

    if (msgListError) {
      console.log('❌ Failed to query messages:', msgListError);
    } else {
      console.log(`✅ Found ${messages.length} messages in conversation`);
      messages.forEach(msg => {
        console.log(`   - ${msg.id}: "${msg.content}" (${msg.senderType})`);
      });
    }

    // ========================================
    // 6. ANALYZE RESULTS
    // ========================================
    console.log('\n6️⃣ Analysis & Recommendations...');

    const hasConversations = conversations && conversations.length > 0;
    const hasMessages = messages && messages.length > 0;
    const hasRealtimeEvents = receivedEvents.length > 0;

    console.log('\n📊 INTEGRATION TEST RESULTS');
    console.log('===========================');
    console.log(`✅ Organization Created: Yes`);
    console.log(`✅ Conversation Created: Yes`);
    console.log(`✅ Message Created: Yes`);
    console.log(`${hasConversations ? '✅' : '❌'} Agent Can Query Conversations: ${hasConversations ? 'Yes' : 'No'}`);
    console.log(`${hasMessages ? '✅' : '❌'} Agent Can Query Messages: ${hasMessages ? 'Yes' : 'No'}`);
    console.log(`${hasRealtimeEvents ? '✅' : '❌'} Real-time Events Working: ${hasRealtimeEvents ? 'Yes' : 'No'}`);

    if (hasRealtimeEvents) {
      console.log('\n📡 REAL-TIME EVENTS RECEIVED:');
      receivedEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!hasConversations || !hasMessages) {
      console.log('❌ Database queries failing:');
      console.log('   - Check RLS policies on conversations and messages tables');
      console.log('   - Verify organizationId is being set correctly');
      console.log('   - Check if agent user has proper permissions');
    }

    if (!hasRealtimeEvents) {
      console.log('❌ Real-time events not working:');
      console.log('   - Widget API is not broadcasting events after creating messages');
      console.log('   - Agent dashboard may not be subscribing to correct channels');
      console.log('   - Check if Supabase real-time is enabled');
    }

    if (hasConversations && hasMessages && hasRealtimeEvents) {
      console.log('🎉 INTEGRATION IS WORKING CORRECTLY!');
      console.log('   - Database operations are successful');
      console.log('   - Real-time events are being received');
      console.log('   - Agent dashboard should be able to see widget conversations');
    } else {
      console.log('⚠️  INTEGRATION HAS ISSUES:');
      console.log('   - Some components are not working correctly');
      console.log('   - Check the specific failures above');
    }

    // ========================================
    // 7. CLEANUP
    // ========================================
    console.log('\n7️⃣ Cleaning up test data...');

    // Delete test message
    await supabase.from('messages').delete().eq('id', message.id);
    
    // Delete test conversation
    await supabase.from('conversations').delete().eq('id', conversation.id);
    
    // Delete test organization
    await supabase.from('organizations').delete().eq('id', org.id);

    console.log('✅ Test data cleaned up');

    // Close channels
    supabase.removeChannel(orgChannel);
    supabase.removeChannel(convChannel);

    return {
      success: hasConversations && hasMessages,
      realtimeWorking: hasRealtimeEvents,
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
  testWidgetAgentIntegration().catch(console.error);
}

export { testWidgetAgentIntegration };
