/**
 * Test script to verify real-time connection for enhanced widget
 * Run this in browser console to test the connection
 */

import { createClient } from '@supabase/supabase-js';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';

export async function testWidgetRealtimeConnection() {
  console.log('🧪 Testing Widget Real-time Connection');
  console.log('=====================================');

  const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 1. Test conversation creation
    console.log('1️⃣ Testing conversation creation...');
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        organization_id: organizationId,
        status: 'active',
        created_at: new Date().toISOString(),
        metadata: {
          source: 'widget-test',
          visitor_id: 'test-visitor',
        },
      })
      .select()
      .single();

    if (convError) {
      console.error('❌ Conversation creation failed:', convError);
      return;
    }

    console.log('✅ Conversation created:', conversation.id);

    // 2. Test channel naming
    console.log('2️⃣ Testing channel naming...');
    const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversation.id);
    console.log('📡 Channel name:', channelName);
    
    // Verify format
    const expectedFormat = `org:${organizationId}:conv:${conversation.id}`;
    if (channelName === expectedFormat) {
      console.log('✅ Channel naming format correct');
    } else {
      console.error('❌ Channel naming format incorrect');
      console.log('Expected:', expectedFormat);
      console.log('Actual:', channelName);
      return;
    }

    // 3. Test real-time channel connection
    console.log('3️⃣ Testing real-time channel connection...');
    const channel = supabase.channel(channelName);
    
    let connectionResolved = false;
    const connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!connectionResolved) {
          connectionResolved = true;
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      channel.subscribe((status: string) => {
        if (!connectionResolved) {
          connectionResolved = true;
          clearTimeout(timeout);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time channel connected');
            resolve(status);
          } else {
            console.error('❌ Real-time channel connection failed:', status);
            reject(new Error(`Connection failed with status: ${status}`));
          }
        }
      });
    });

    await connectionPromise;

    // 4. Test message insertion
    console.log('4️⃣ Testing message insertion...');
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        content: 'Test message from widget',
        sender_type: 'user',
        sender_name: 'Test User',
        sender_id: 'test-user',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        status: 'sent',
        metadata: {
          source: 'widget-test',
        },
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Message insertion failed:', msgError);
      return;
    }

    console.log('✅ Message inserted:', message.id);

    // 5. Test broadcast
    console.log('5️⃣ Testing broadcast...');
    await channel.send({
      type: 'broadcast',
      event: UNIFIED_EVENTS.MESSAGE_CREATED,
      payload: {
        message,
        source: 'widget-test',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Broadcast sent');

    // 6. Cleanup
    console.log('6️⃣ Cleaning up...');
    await channel.unsubscribe();
    
    // Delete test data
    await supabase.from('messages').delete().eq('id', message.id);
    await supabase.from('conversations').delete().eq('id', conversation.id);
    
    console.log('✅ Cleanup completed');
    console.log('🎉 All tests passed! Widget real-time connection is working.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testWidgetRealtimeConnection = testWidgetRealtimeConnection;
}
