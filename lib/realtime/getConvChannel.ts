// lib/realtime/getConvChannel.ts
// Broadcast-only channel helper to prevent phantom CDC joins

import { createApiClient } from '@/lib/supabase/client';

/**
 * Creates a broadcast-only conversation channel that prevents automatic postgres_changes subscriptions
 * @param orgId Organization ID
 * @param convId Conversation ID
 * @returns Supabase channel configured for broadcast-only
 */
export function getConvChannel(orgId: string, convId: string) {
  const supabase = createApiClient();
  
  return supabase.channel(
    // Rename with bcast: prefix to avoid automatic CDC triggers
    `bcast:${orgId}:${convId}`,
    {
      config: {
        broadcast: { ack: false },
        presence: { ack: false },
        postgres_changes: [] // <-- disable automatic CDC
      }
    }
  );
}

/**
 * Creates a broadcast-only organization channel
 * @param orgId Organization ID
 * @returns Supabase channel configured for broadcast-only
 */
export function getOrgChannel(orgId: string) {
  const supabase = createApiClient();
  
  return supabase.channel(
    `bcast:org:${orgId}`,
    {
      config: {
        broadcast: { ack: false },
        presence: { ack: false },
        postgres_changes: [] // <-- disable automatic CDC
      }
    }
  );
}

/**
 * Creates a broadcast-only typing channel
 * @param orgId Organization ID
 * @param convId Conversation ID
 * @returns Supabase channel configured for broadcast-only
 */
export function getTypingChannel(orgId: string, convId: string) {
  const supabase = createApiClient();
  
  return supabase.channel(
    `bcast:typing:${orgId}:${convId}`,
    {
      config: {
        broadcast: { ack: false },
        presence: { ack: false },
        postgres_changes: [] // <-- disable automatic CDC
      }
    }
  );
}
