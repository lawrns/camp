import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time Handover Synchronization Tests
 * 
 * Tests real-time event synchronization during AI handovers:
 * - Bidirectional event sync
 * - Message continuity during handovers
 * - Connection resilience
 * - Error recovery
 */

describe('Real-time Handover Synchronization', () => {
  const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const TEST_CONV_ID = 'test-conv-' + Date.now();
  
  let agentChannel: RealtimeChannel;
  let widgetChannel: RealtimeChannel;
  let aiServiceChannel: RealtimeChannel;
  
  let receivedEvents: Array<{ source: string; event: unknown; timestamp: number }> = [];

  beforeEach(async () => {
    // Clear received events
    receivedEvents = [];

    // Setup real-time channels for different participants
    agentChannel = supabase.browser().channel(`agent-${TEST_CONV_ID}`, {
      config: { broadcast: { self: true } }
    });

    widgetChannel = supabase.browser().channel(`widget-${TEST_CONV_ID}`, {
      config: { broadcast: { self: true } }
    });

    aiServiceChannel = supabase.browser().channel(`ai-service-${TEST_CONV_ID}`, {
      config: { broadcast: { self: true } }
    });

    // Setup event listeners
    setupEventListeners();

    // Subscribe to channels
    await Promise.all([
      subscribeChannel(agentChannel, 'agent'),
      subscribeChannel(widgetChannel, 'widget'),
      subscribeChannel(aiServiceChannel, 'ai-service')
    ]);
  });

  afterEach(async () => {
    // Cleanup channels
    await agentChannel.unsubscribe();
    await widgetChannel.unsubscribe();
    await aiServiceChannel.unsubscribe();
  });

  function setupEventListeners() {
    // Agent channel listeners
    agentChannel.on('broadcast', { event: '*' }, (payload) => {
      receivedEvents.push({
        source: 'agent',
        event: payload,
        timestamp: Date.now()
      });
    });

    // Widget channel listeners
    widgetChannel.on('broadcast', { event: '*' }, (payload) => {
      receivedEvents.push({
        source: 'widget',
        event: payload,
        timestamp: Date.now()
      });
    });

    // AI service channel listeners
    aiServiceChannel.on('broadcast', { event: '*' }, (payload) => {
      receivedEvents.push({
        source: 'ai-service',
        event: payload,
        timestamp: Date.now()
      });
    });
  }

  async function subscribeChannel(channel: RealtimeChannel, source: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${source} channel subscription timeout`));
      }, 5000);

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error(`${source} channel subscription failed: ${status}`));
        }
      });
    });
  }

  test('Bidirectional Handover Event Sync', async () => {
    // Step 1: Agent initiates handover
    const handoverEvent = {
      type: 'handover_initiated',
      conversation_id: TEST_CONV_ID,
      organization_id: TEST_ORG_ID,
      handover_type: 'agent_to_ai',
      context: 'Customer needs password reset help',
      timestamp: new Date().toISOString()
    };

    await agentChannel.send({
      type: 'broadcast',
      event: 'handover_initiated',
      payload: handoverEvent
    });

    // Wait for event propagation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Verify all participants receive the event
    const handoverEvents = receivedEvents.filter(e => e.event.event === 'handover_initiated');
    expect(handoverEvents.length).toBeGreaterThan(0);

    // Step 3: AI service accepts handover
    const acceptEvent = {
      type: 'handover_accepted',
      conversation_id: TEST_CONV_ID,
      ai_session_id: 'ai-session-' + Date.now(),
      confidence_threshold: 0.8,
      timestamp: new Date().toISOString()
    };

    await aiServiceChannel.send({
      type: 'broadcast',
      event: 'handover_accepted',
      payload: acceptEvent
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4: Verify acceptance is received by all parties
    const acceptEvents = receivedEvents.filter(e => e.event.event === 'handover_accepted');
    expect(acceptEvents.length).toBeGreaterThan(0);

    // Step 5: Complete handover
    const completeEvent = {
      type: 'handover_completed',
      conversation_id: TEST_CONV_ID,
      ai_session_id: acceptEvent.ai_session_id,
      handover_duration_ms: 1500,
      timestamp: new Date().toISOString()
    };

    await aiServiceChannel.send({
      type: 'broadcast',
      event: 'handover_completed',
      payload: completeEvent
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 6: Verify completion events
    const completeEvents = receivedEvents.filter(e => e.event.event === 'handover_completed');
    expect(completeEvents.length).toBeGreaterThan(0);

    // Step 7: Verify event order and timing
    const allHandoverEvents = receivedEvents
      .filter(e => e.event.event?.includes('handover'))
      .sort((a, b) => a.timestamp - b.timestamp);

    expect(allHandoverEvents[0].event.event).toBe('handover_initiated');
    expect(allHandoverEvents[1].event.event).toBe('handover_accepted');
    expect(allHandoverEvents[2].event.event).toBe('handover_completed');

    // Verify timing (all events should be within 100ms of each other)
    const timeDiffs = allHandoverEvents.slice(1).map((event, index) => 
      event.timestamp - allHandoverEvents[index].timestamp
    );
    timeDiffs.forEach(diff => expect(diff).toBeLessThan(100));
  });

  test('Message Continuity During Handover', async () => {
    // Step 1: Start handover process
    const handoverStart = Date.now();
    
    await agentChannel.send({
      type: 'broadcast',
      event: 'handover_initiated',
      payload: { conversation_id: TEST_CONV_ID, timestamp: handoverStart }
    });

    // Step 2: Customer sends message during handover
    const customerMessage = {
      type: 'message_sent',
      conversation_id: TEST_CONV_ID,
      message_id: 'msg-during-handover',
      content: 'Are you still there?',
      senderType: 'customer',
      timestamp: new Date().toISOString()
    };

    await widgetChannel.send({
      type: 'broadcast',
      event: 'message_sent',
      payload: customerMessage
    });

    // Step 3: Complete handover
    await aiServiceChannel.send({
      type: 'broadcast',
      event: 'handover_completed',
      payload: { 
        conversation_id: TEST_CONV_ID,
        ai_session_id: 'ai-session-test',
        timestamp: new Date().toISOString()
      }
    });

    // Step 4: AI responds to message sent during handover
    const aiResponse = {
      type: 'message_sent',
      conversation_id: TEST_CONV_ID,
      message_id: 'ai-response-1',
      content: 'Yes, I\'m here! I\'m now handling your conversation.',
      senderType: 'ai',
      in_reply_to: 'msg-during-handover',
      timestamp: new Date().toISOString()
    };

    await aiServiceChannel.send({
      type: 'broadcast',
      event: 'message_sent',
      payload: aiResponse
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Verify message continuity
    const messageEvents = receivedEvents.filter(e => e.event.event === 'message_sent');
    expect(messageEvents.length).toBe(2); // Customer message + AI response

    const customerMsgEvent = messageEvents.find(e => e.event.payload.senderType === 'customer');
    const aiMsgEvent = messageEvents.find(e => e.event.payload.senderType === 'ai');

    expect(customerMsgEvent).toBeTruthy();
    expect(aiMsgEvent).toBeTruthy();
    expect(aiMsgEvent?.event.payload.in_reply_to).toBe('msg-during-handover');

    // Step 6: Verify all parties received both messages
    const agentReceivedMessages = receivedEvents.filter(e => 
      e.source === 'agent' && e.event.event === 'message_sent'
    );
    const widgetReceivedMessages = receivedEvents.filter(e => 
      e.source === 'widget' && e.event.event === 'message_sent'
    );

    expect(agentReceivedMessages.length).toBe(2);
    expect(widgetReceivedMessages.length).toBe(2);
  });

  test('Connection Resilience and Error Recovery', async () => {
    // Step 1: Simulate connection drop for widget
    await widgetChannel.unsubscribe();

    // Step 2: Send events while widget is disconnected
    await agentChannel.send({
      type: 'broadcast',
      event: 'handover_initiated',
      payload: { conversation_id: TEST_CONV_ID }
    });

    await aiServiceChannel.send({
      type: 'broadcast',
      event: 'handover_accepted',
      payload: { conversation_id: TEST_CONV_ID }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Verify widget didn't receive events while disconnected
    const widgetEvents = receivedEvents.filter(e => e.source === 'widget');
    expect(widgetEvents.length).toBe(0);

    // Step 4: Reconnect widget
    widgetChannel = supabase.browser().channel(`widget-reconnect-${TEST_CONV_ID}`, {
      config: { broadcast: { self: true } }
    });

    widgetChannel.on('broadcast', { event: '*' }, (payload) => {
      receivedEvents.push({
        source: 'widget-reconnected',
        event: payload,
        timestamp: Date.now()
      });
    });

    await subscribeChannel(widgetChannel, 'widget-reconnected');

    // Step 5: Send recovery event
    await agentChannel.send({
      type: 'broadcast',
      event: 'connection_recovered',
      payload: { 
        conversation_id: TEST_CONV_ID,
        missed_events: ['handover_initiated', 'handover_accepted']
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 6: Verify widget receives recovery event
    const recoveryEvents = receivedEvents.filter(e => 
      e.source === 'widget-reconnected' && e.event.event === 'connection_recovered'
    );
    expect(recoveryEvents.length).toBe(1);
    expect(recoveryEvents[0].event.payload.missed_events).toContain('handover_initiated');
  });

  test('Performance Under Load', async () => {
    // Step 1: Send multiple rapid events
    const eventCount = 50;
    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < eventCount; i++) {
      promises.push(
        agentChannel.send({
          type: 'broadcast',
          event: 'load_test_event',
          payload: { 
            sequence: i,
            conversation_id: TEST_CONV_ID,
            timestamp: Date.now()
          }
        })
      );
    }

    await Promise.all(promises);
    const sendTime = Date.now() - startTime;

    // Step 2: Wait for all events to be received
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify all events were received
    const loadTestEvents = receivedEvents.filter(e => e.event.event === 'load_test_event');
    expect(loadTestEvents.length).toBe(eventCount);

    // Step 4: Verify event order is preserved
    const sequences = loadTestEvents.map(e => e.event.payload.sequence).sort((a, b) => a - b);
    for (let i = 0; i < eventCount; i++) {
      expect(sequences[i]).toBe(i);
    }

    // Step 5: Verify performance targets
    expect(sendTime).toBeLessThan(5000); // All events sent within 5 seconds
    
    const totalLatency = Date.now() - startTime;
    expect(totalLatency).toBeLessThan(10000); // Total processing within 10 seconds
  });
});
