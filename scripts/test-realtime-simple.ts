#!/usr/bin/env tsx
/**
 * SIMPLE REAL-TIME TESTING SCRIPT
 * 
 * Tests real-time broadcasting using existing data to verify
 * that the agent dashboard can receive widget events.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testRealtimeSimple() {
  console.log('🔄 SIMPLE REAL-TIME BROADCASTING TEST');
  console.log('====================================\n');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // ========================================
    // 1. SETUP REAL-TIME MONITORING
    // ========================================
    console.log('1️⃣ Setting up real-time monitoring...');

    const receivedEvents: any[] = [];
    
    // Test organization ID
    const testOrgId = 'test-org-123';
    const testConvId = 'test-conv-456';
    
    // Monitor organization channel
    const orgChannel = supabase.channel(`org:${testOrgId}`);
    orgChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created on org channel:', payload);
        receivedEvents.push({ type: 'org-message:created', payload, timestamp: Date.now() });
      })
      .on('broadcast', { event: 'conversation:created' }, (payload) => {
        console.log('📡 Received conversation:created on org channel:', payload);
        receivedEvents.push({ type: 'org-conversation:created', payload, timestamp: Date.now() });
      })
      .on('broadcast', { event: 'conversation:updated' }, (payload) => {
        console.log('📡 Received conversation:updated on org channel:', payload);
        receivedEvents.push({ type: 'org-conversation:updated', payload, timestamp: Date.now() });
      })
      .subscribe((status) => {
        console.log(`📡 Organization channel status: ${status}`);
      });

    // Monitor conversation-specific channel
    const convChannel = supabase.channel(`org:${testOrgId}:conv:${testConvId}`);
    convChannel
      .on('broadcast', { event: 'message:created' }, (payload) => {
        console.log('📡 Received message:created on conv channel:', payload);
        receivedEvents.push({ type: 'conv-message:created', payload, timestamp: Date.now() });
      })
      .subscribe((status) => {
        console.log(`📡 Conversation channel status: ${status}`);
      });

    console.log('✅ Real-time monitoring setup complete');

    // Wait for subscriptions to be established
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========================================
    // 2. TEST BROADCASTING
    // ========================================
    console.log('\n2️⃣ Testing real-time broadcasting...');

    // Test 1: Broadcast message created event
    console.log('📤 Broadcasting message:created event...');
    await orgChannel.send({
      type: 'broadcast',
      event: 'message:created',
      payload: {
        message: {
          id: 'test-msg-123',
          content: 'Test message from script',
          conversationId: testConvId,
          organizationId: testOrgId,
          senderType: 'customer',
          timestamp: new Date().toISOString(),
        },
        conversationId: testConvId,
        organizationId: testOrgId,
      }
    });

    // Test 2: Broadcast conversation updated event
    console.log('📤 Broadcasting conversation:updated event...');
    await orgChannel.send({
      type: 'broadcast',
      event: 'conversation:updated',
      payload: {
        conversationId: testConvId,
        organizationId: testOrgId,
        lastMessage: {
          content: 'Test message from script',
          timestamp: new Date().toISOString(),
        },
      }
    });

    // Test 3: Broadcast on conversation channel
    console.log('📤 Broadcasting on conversation-specific channel...');
    await convChannel.send({
      type: 'broadcast',
      event: 'message:created',
      payload: {
        message: {
          id: 'test-msg-456',
          content: 'Test message on conversation channel',
          conversationId: testConvId,
          organizationId: testOrgId,
          senderType: 'customer',
          timestamp: new Date().toISOString(),
        },
      }
    });

    console.log('✅ Broadcasting tests completed');

    // ========================================
    // 3. WAIT FOR EVENTS
    // ========================================
    console.log('\n3️⃣ Waiting for real-time events...');
    
    // Wait for events to be received
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========================================
    // 4. ANALYZE RESULTS
    // ========================================
    console.log('\n4️⃣ Analyzing results...');

    console.log('\n📊 TEST RESULTS');
    console.log('===============');
    console.log(`Events Sent: 3`);
    console.log(`Events Received: ${receivedEvents.length}`);

    if (receivedEvents.length === 0) {
      console.log('❌ No events received - real-time is not working');
    } else {
      console.log('✅ Real-time events are working!');
      
      console.log('\n📡 RECEIVED EVENTS:');
      receivedEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type} at ${new Date(event.timestamp).toISOString()}`);
        console.log(`      Payload:`, JSON.stringify(event.payload, null, 2));
      });
    }

    // ========================================
    // 5. TEST CHANNEL NAMING PATTERNS
    // ========================================
    console.log('\n5️⃣ Testing channel naming patterns...');

    // Import unified channel standards
    try {
      const { UNIFIED_CHANNELS, UNIFIED_EVENTS } = await import('../lib/realtime/unified-channel-standards');
      
      const unifiedOrgChannel = UNIFIED_CHANNELS.organization(testOrgId);
      const unifiedConvChannel = UNIFIED_CHANNELS.conversation(testOrgId, testConvId);
      
      console.log(`📋 Unified org channel: ${unifiedOrgChannel}`);
      console.log(`📋 Unified conv channel: ${unifiedConvChannel}`);
      console.log(`📋 Current org channel: org:${testOrgId}`);
      console.log(`📋 Current conv channel: org:${testOrgId}:conv:${testConvId}`);
      
      const orgMatch = unifiedOrgChannel === `org:${testOrgId}`;
      const convMatch = unifiedConvChannel === `org:${testOrgId}:conv:${testConvId}`;
      
      console.log(`✅ Org channel naming: ${orgMatch ? 'MATCH' : 'MISMATCH'}`);
      console.log(`✅ Conv channel naming: ${convMatch ? 'MATCH' : 'MISMATCH'}`);
      
      if (!orgMatch || !convMatch) {
        console.log('⚠️  Channel naming mismatch detected!');
        console.log('   This could cause real-time events to be missed.');
      }
      
      // Test unified events
      console.log(`📋 Unified MESSAGE_CREATED: ${UNIFIED_EVENTS.MESSAGE_CREATED}`);
      console.log(`📋 Unified CONVERSATION_CREATED: ${UNIFIED_EVENTS.CONVERSATION_CREATED}`);
      console.log(`📋 Unified CONVERSATION_UPDATED: ${UNIFIED_EVENTS.CONVERSATION_UPDATED}`);
      
    } catch (error) {
      console.log('❌ Could not load unified channel standards:', error);
    }

    // ========================================
    // 6. RECOMMENDATIONS
    // ========================================
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');

    if (receivedEvents.length === 0) {
      console.log('❌ Real-time not working:');
      console.log('   1. Check if Supabase real-time is enabled in your project');
      console.log('   2. Verify your Supabase URL and anon key are correct');
      console.log('   3. Check browser console for WebSocket connection errors');
      console.log('   4. Ensure you\'re not behind a firewall blocking WebSocket connections');
    } else if (receivedEvents.length < 3) {
      console.log('⚠️  Partial real-time functionality:');
      console.log('   - Some events were received but not all');
      console.log('   - Check for channel naming inconsistencies');
      console.log('   - Verify event name matching between sender and receiver');
    } else {
      console.log('✅ Real-time is working correctly!');
      console.log('   - All test events were received');
      console.log('   - Channel subscriptions are functioning');
      console.log('   - Broadcasting is working properly');
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Ensure widget API uses the same channel names');
    console.log('2. Verify agent dashboard subscribes to the same channels');
    console.log('3. Check that event names match between widget and dashboard');
    console.log('4. Test with actual widget and dashboard components');

    // Cleanup
    supabase.removeChannel(orgChannel);
    supabase.removeChannel(convChannel);

    return {
      success: receivedEvents.length > 0,
      eventsReceived: receivedEvents.length,
      eventsSent: 3,
      events: receivedEvents,
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

// Run the test
if (require.main === module) {
  testRealtimeSimple().catch(console.error);
}

export { testRealtimeSimple };
