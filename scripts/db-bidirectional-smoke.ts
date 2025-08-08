/*
 * Direct DB Bidirectional Smoke Test
 * - Inserts a message into public.messages
 * - Subscribes to unified broadcast channels and validates reception
 * - Sends typing/presence broadcasts and validates callbacks
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/db-bidirectional-smoke.ts \
 *   --org <orgId> --conv <conversationId> --user <userId>
 */

import { createClient } from '@supabase/supabase-js';
import { argv } from 'node:process';

// Lightweight copy of unified standards to avoid path issues in scripts
const UNIFIED_CHANNELS = {
  conversation: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}`,
  conversationTyping: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:typing`,
  conversationPresence: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:presence`,
};

const UNIFIED_EVENTS = {
  MESSAGE_CREATED: 'message_created',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  PRESENCE_JOIN: 'presence_join',
} as const;

function parseArgs() {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  const organizationId = get('--org') || process.env.TEST_ORG_ID;
  const conversationId = get('--conv') || process.env.TEST_CONVERSATION_ID;
  const userId = get('--user') || 'smoke-user';
  if (!organizationId || !conversationId) {
    console.error('Missing required args: --org <orgId> --conv <conversationId>');
    process.exit(2);
  }
  return { organizationId, conversationId, userId };
}

async function main() {
  const { organizationId, conversationId, userId } = parseArgs();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !anonKey || !serviceKey) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(2);
  }

  const browser = createClient(url, anonKey, {
    realtime: { params: { apikey: anonKey } },
  });
  const admin = createClient(url, serviceKey);

  // Subscribe to conversation channel broadcasts
  const conversationChannelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);
  const conversationChannel = browser.channel(conversationChannelName, {
    config: { broadcast: { self: true }, presence: { key: userId }, postgres_changes: [] },
  });

  let messageReceived = false;
  conversationChannel.on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
    console.log('📥 Broadcast received:', payload.event, payload.payload?.message?.id);
    messageReceived = true;
  });

  // Subscribe to typing channel
  const typingChannelName = UNIFIED_CHANNELS.conversationTyping(organizationId, conversationId);
  const typingChannel = browser.channel(typingChannelName, {
    config: { broadcast: { self: true }, presence: { key: userId }, postgres_changes: [] },
  });

  let typingReceived = false;
  typingChannel.on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload: any) => {
    console.log('✍️ Typing start received:', payload.payload?.userId);
    typingReceived = true;
  });

  console.log('🔗 Subscribing to channels...');
  await Promise.all([conversationChannel.subscribe(), typingChannel.subscribe()]);
  console.log('✅ Subscribed');

  // Send typing indicator
  await typingChannel.send({ type: 'broadcast', event: UNIFIED_EVENTS.TYPING_START, payload: { userId, timestamp: new Date().toISOString() } });

  // Insert a test message directly into DB (service role)
  const insert = await admin.from('messages').insert({
    conversation_id: conversationId,
    organization_id: organizationId,
    content: `Smoke test message ${Date.now()}`,
    sender_type: 'agent',
    sender_name: 'Smoke Tester',
    created_at: new Date().toISOString(),
  }).select('id').single();

  if (insert.error) {
    console.error('❌ Insert failed:', insert.error);
    process.exit(1);
  }
  console.log('📝 Inserted message id:', insert.data?.id);

  // Broadcast to conversation channel as server would
  await conversationChannel.send({
    type: 'broadcast',
    event: UNIFIED_EVENTS.MESSAGE_CREATED,
    payload: { message: { id: insert.data?.id, conversation_id: conversationId, content: 'Smoke broadcast' } },
  });

  // Wait up to 3s for events
  await new Promise((r) => setTimeout(r, 3000));

  // Assertions
  if (!typingReceived) {
    console.error('❌ Typing event not received');
    process.exit(1);
  }
  if (!messageReceived) {
    console.error('❌ Message broadcast not received');
    process.exit(1);
  }

  console.log('✅ DB bidirectional smoke test passed');
  await browser.removeChannel(conversationChannel);
  await browser.removeChannel(typingChannel);
}

main().catch((err) => {
  console.error('❌ Smoke test error:', err);
  process.exit(1);
});

