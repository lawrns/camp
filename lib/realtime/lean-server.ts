/**
 * Helper2-Style Lean Realtime System - Server Side
 * Server-only broadcast functions without React hooks
 */

import { supabase } from "@/lib/supabase";

// ============================================
// CHANNEL ID GENERATORS (Helper2 Style)
// ============================================

export const conversationChannel = (organizationId: string, conversationId: string) =>
  `org:${organizationId}:conv:${conversationId}`;

export const organizationChannel = (organizationId: string) => `org:${organizationId}:organization`;

export const dashboardChannel = (organizationId: string) => `org:${organizationId}:dashboard`;

export const typingChannel = (organizationId: string, conversationId: string) =>
  `org:${organizationId}:typing:${conversationId}`;

// ============================================
// SERVER-ONLY CLIENT FACTORY
// ============================================

function getAdminClient() {
  // Only allow on server-side
  if (typeof window !== "undefined") {
    throw new Error("getAdminClient() can only be called on the server side");
  }

  console.debug("🔥 [LeanRealtime] Admin client initialized");
  return supabase.admin();
}

// ============================================
// SIMPLE PUBLISH FUNCTION (Helper2 Style)
// ============================================

export async function publishToRealtime<Data>({
  channel,
  event,
  data,
}: {
  channel: string;
  event: string;
  data: Data;
}): Promise<void> {
  try {
    const client = getAdminClient();

    // Handle undefined/null data by providing a default empty object
    const safeData = data ?? {};
    const json = JSON.stringify(safeData);

    // Check payload size (Helper2 has 200KB limit)
    if (json.length > 200 * 1000) {
      throw new Error(`Payload too large for realtime: ${json.length} bytes`);
    }

    // 🔥 CRITICAL FIX: Send data directly as payload
    await client.channel(channel).send({
      type: "broadcast",
      event,
      payload: safeData, // Send data directly, not wrapped
    });

    console.debug("🔥 [LeanRealtime] Published event:", {
      channel,
      event,
      dataSize: json.length,
      preview: json.substring(0, 100) + (json.length > 100 ? "..." : ""),
    });
  } catch (error) {
    throw error;
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function broadcastToConversation(
  organizationId: string,
  conversationId: string,
  event: string,
  data: any
) {
  await publishToRealtime({
    channel: conversationChannel(organizationId, conversationId),
    event,
    data,
  });
}

export async function broadcastToOrganization(organizationId: string, event: string, data: any) {
  await publishToRealtime({
    channel: organizationChannel(organizationId),
    event,
    data,
  });
}

// ============================================
// DASHBOARD SPECIFIC
// ============================================

export async function broadcastToDashboard(organizationId: string, event: string, data: any) {
  await publishToRealtime({
    channel: dashboardChannel(organizationId),
    event,
    data,
  });
}
