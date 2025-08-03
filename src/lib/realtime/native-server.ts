/**
 * Native Supabase Server-Side Broadcasting
 * Replaces lean-server with direct Supabase server-side broadcasting
 */

import { supabase } from "@/lib/supabase/consolidated-exports";

// Create a singleton server client for broadcasting
let serverClient: ReturnType<typeof createClient> | null = null;

function getServerClient() {
  if (!serverClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase configuration missing for server-side broadcasting");
    }

    serverClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serverClient;
}

/**
 * Server-side broadcasting to organization channel
 */
export async function nativeServerBroadcastToOrganization(organizationId: string, event: string, payload: any) {
  try {
    const client = getServerClient();
    const channelName = `bcast:org:${organizationId}`;

    const result = await client.channel(channelName).send({
      type: "broadcast",
      event,
      payload,
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Server-side broadcasting to conversation channel
 */
export async function nativeServerBroadcastToConversation(
  organizationId: string,
  conversationId: string,
  event: string,
  payload: any
) {
  try {
    const client = getServerClient();
    const channelName = `bcast:conv:${organizationId}:${conversationId}`;

    const result = await client.channel(channelName).send({
      type: "broadcast",
      event,
      payload,
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Server-side broadcasting to dashboard channel
 */
export async function nativeServerBroadcastToDashboard(organizationId: string, event: string, payload: any) {
  try {
    const client = getServerClient();
    const channelName = `bcast:dashboard:${organizationId}`;

    const result = await client.channel(channelName).send({
      type: "broadcast",
      event,
      payload,
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Generic server-side broadcasting function
 */
export async function nativeServerPublishToRealtime(options: { channel: string; event: string; data: any }) {
  try {
    const client = getServerClient();

    const result = await client.channel(options.channel).send({
      type: "broadcast",
      event: options.event,
      payload: options.data,
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Channel name generators (compatible with lean-server)
 */
export const nativeConversationChannel = (organizationId: string, conversationId: string) =>
  `org:${organizationId}:conversation:${conversationId}`;

export const nativeOrganizationChannel = (organizationId: string) => `bcast:org:${organizationId}`;

export const nativeDashboardChannel = (organizationId: string) => `bcast:dashboard:${organizationId}`;

export const nativeTypingChannel = (organizationId: string, conversationId: string) =>
  `org:${organizationId}:typing:${conversationId}`;

// Backward compatibility exports with same names as lean-server
export const broadcastToOrganization = nativeServerBroadcastToOrganization;
export const broadcastToConversation = nativeServerBroadcastToConversation;
export const broadcastToDashboard = nativeServerBroadcastToDashboard;
export const publishToRealtime = nativeServerPublishToRealtime;

// Channel generators with same names
export const conversationChannel = nativeConversationChannel;
export const organizationChannel = nativeOrganizationChannel;
export const dashboardChannel = nativeDashboardChannel;
export const typingChannel = nativeTypingChannel;
