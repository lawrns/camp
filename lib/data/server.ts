/**
 * Server-side Data Service
 * Contains functions that require server-side Supabase client with cookies
 */

import { getServerClient } from "@/lib/supabase/server";
import type { ConversationFilters, DataQueryOptions, MessageFilters } from "./index";

/**
 * Get conversations for an organization with proper filtering and pagination
 */
export async function getConversations(
  organizationId: string,
  filters: ConversationFilters = {},
  options: DataQueryOptions = {}
) {
  const supabase = await getServerClient();

  let query = supabase
    .from("conversations_conversation")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.mailboxId) {
    query = query.eq("mailboxId", filters.mailboxId);
  }
  if (filters.assignedToId) {
    query = query.eq("assignedToId", filters.assignedToId);
  }
  if (filters.assignedToUserId) {
    query = query.eq("assignedToUserId", filters.assignedToUserId);
  }

  // Apply sorting
  const orderBy = options.orderBy || "created_at";
  const orderDirection = options.orderDirection || "desc";
  query = query.order(orderBy, { ascending: orderDirection === "asc" });

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  return { data: data || [], error: null };
}

/**
 * Get messages for an organization with proper filtering and pagination
 */
export async function getMessages(
  organizationId: string,
  filters: MessageFilters = {},
  options: DataQueryOptions = {}
) {
  const supabase = await getServerClient();

  let query = supabase.from("messages").select("*").eq("organization_id", organizationId);

  // Apply filters
  if (filters.conversationId) {
    query = query.eq("conversationId", filters.conversationId);
  }
  if (filters.senderType) {
    query = query.eq("senderType", filters.senderType);
  }

  // Apply sorting
  const orderBy = options.orderBy || "created_at";
  const orderDirection = options.orderDirection || "desc";
  query = query.order(orderBy, { ascending: orderDirection === "asc" });

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return { data: data || [], error: null };
}

/**
 * Get conversation by ID with organization scope verification
 */
export async function getConversationById(organizationId: string, conversationId: string) {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from("conversations_conversation")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get messages for a specific conversation with organization scope verification
 */
export async function getConversationMessages(
  organizationId: string,
  conversationId: string,
  options: DataQueryOptions = {}
) {
  const supabase = await getServerClient();

  // First verify the conversation belongs to the organization
  const conversationCheck = await getConversationById(organizationId, conversationId);
  if (!conversationCheck.data) {
    return { data: [], error: new Error("Conversation not found or access denied") };
  }

  return getMessages(organizationId, { conversationId }, options);
}

/**
 * Get dashboard statistics for an organization
 */
export async function getDashboardStats(organizationId: string) {
  const supabase = await getServerClient();

  // Get conversation counts by status
  const { data: statusCounts, error: statusError } = await supabase
    .from("conversations_conversation")
    .select("status")
    .eq("organization_id", organizationId);

  if (statusError) {
    return { data: null, error: statusError };
  }

  // Get message counts
  const { count: messageCount, error: messageError } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (messageError) {
    return { data: null, error: messageError };
  }

  // Process status counts
  const stats = {
    totalConversations: statusCounts.length,
    openConversations: statusCounts.filter((c: unknown) => c.status === "open").length,
    closedConversations: statusCounts.filter((c: unknown) => c.status === "closed").length,
    spamConversations: statusCounts.filter((c: unknown) => c.status === "spam").length,
    totalMessages: messageCount || 0,
  };

  return { data: stats, error: null };
}

/**
 * Create a new conversation with proper organization scoping
 */
export async function createConversation(
  organizationId: string,
  conversationData: {
    subject?: string;
    status?: "open" | "closed" | "spam";
    mailboxId: number;
    emailFrom?: string;
    emailFromName?: string;
    source?: "email" | "chat" | "chat#prompt";
  }
) {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from("conversations_conversation")
    .insert({
      ...conversationData,
      organization_id: organizationId,
      status: conversationData.status || "open",
    })
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create a new message with proper organization scoping
 */
export async function createMessage(
  organizationId: string,
  messageData: {
    conversationId: string;
    content: string;
    senderType: "customer" | "agent" | "system";
    senderName?: string;
    senderEmail?: string;
  }
) {
  const supabase = await getServerClient();

  // Verify conversation belongs to organization
  const conversationCheck = await getConversationById(organizationId, messageData.conversationId);
  if (!conversationCheck.data) {
    return { data: null, error: new Error("Conversation not found or access denied") };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      ...messageData,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update conversation status with organization scope verification
 */
export async function updateConversationStatus(
  organizationId: string,
  conversationId: string,
  status: "open" | "closed" | "spam"
) {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from("conversations_conversation")
    .update({ status })
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get conversations for a specific mailbox with organization scope verification
 */
export async function getMailboxConversations(
  organizationId: string,
  mailboxId: number,
  options: DataQueryOptions = {}
) {
  return getConversations(organizationId, { mailboxId }, options);
}

/**
 * Search conversations by content with organization scoping
 */
export async function searchConversations(organizationId: string, searchTerm: string, options: DataQueryOptions = {}) {
  const supabase = await getServerClient();

  let query = supabase
    .from("conversations_conversation")
    .select("*")
    .eq("organization_id", organizationId)
    .or(`subject.ilike.%${searchTerm}%,emailFrom.ilike.%${searchTerm}%,emailFromName.ilike.%${searchTerm}%`);

  // Apply sorting
  const orderBy = options.orderBy || "created_at";
  const orderDirection = options.orderDirection || "desc";
  query = query.order(orderBy, { ascending: orderDirection === "asc" });

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search conversations: ${error.message}`);
  }

  return { data: data || [], error: null };
}
