/**
 * CRITICAL SECURITY: Tenant-Aware Supabase Hook
 *
 * This hook provides organization-scoped database access for React components.
 * ALL components MUST use this instead of direct Supabase client access.
 */

import { useCallback, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChannelFactory } from "@/lib/realtime/channels";
import { supabase } from "@/lib/supabase";
import { supabase } from "@/lib/supabase/consolidated-exports";
// DISABLED: import { getUnifiedRealtimeManager } from '@/lib/realtime';
import { useTenant } from "@/lib/tenant/useTenant";

// ⚠️ NOTE: This hook needs database schema updates to work properly
// Many tables referenced here don't exist in current schema

interface TenantSupabaseClient {
  // Scoped query builders
  conversations: () => any;
  messages: () => any;
  organizationMembers: () => any;
  aiSessions: () => any;
  campfireHandoffs: () => any;
  tickets: () => any;
  vectorDocuments: () => any;
  faqArticles: () => any;
  faqCategories: () => any;

  // Direct table access
  from: (table: string) => any;

  // Utility methods
  insertWithOrgId: <T>(table: string, data: Partial<T>) => Promise<any>;
  updateWithOrgFilter: <T>(table: string, data: Partial<T>, filter: Record<string, any>) => Promise<any>;
  deleteWithOrgFilter: (table: string, filter: Record<string, any>) => Promise<any>;

  // Context
  organizationId: string;
  userId?: string;
  client: SupabaseClient;
}

/**
 * Hook that provides tenant-scoped Supabase client
 * Automatically filters all queries by organization_id
 */
export function useTenantSupabase(): TenantSupabaseClient {
  const { organizationId, user } = useTenant();

  if (!organizationId) {
    throw new Error("useTenantSupabase requires valid organization context");
  }

  const client = useMemo(() => {
    return createSupabaseClient();
  }, []);

  // Scoped query builders
  const conversations = useCallback(() => {
    return client.from("conversations").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const messages = useCallback(() => {
    return client.from("messages").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const organizationMembers = useCallback(() => {
    return client.from("organization_members").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const aiSessions = useCallback(() => {
    return client.from("ai_sessions").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const campfireHandoffs = useCallback(() => {
    return client.from("campfire_handoffs").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const tickets = useCallback(() => {
    return client.from("tickets").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const vectorDocuments = useCallback(() => {
    return client.from("vector_documents").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const faqArticles = useCallback(() => {
    return client.from("faqs").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  const faqCategories = useCallback(() => {
    return client.from("knowledge_categories").select("*").eq("organization_id", organizationId);
  }, [client, organizationId]);

  // Utility methods
  const insertWithOrgId = useCallback(
    async <T>(table: string, data: Partial<T>) => {
      const dataWithOrgId = {
        ...data,
        organization_id: organizationId,
      };

      return (client as unknown).from(table).insert(dataWithOrgId);
    },
    [client, organizationId]
  );

  const updateWithOrgFilter = useCallback(
    async <T>(table: string, data: Partial<T>, filter: Record<string, any>) => {
      return (client as unknown).from(table).update(data).eq("organization_id", organizationId).match(filter);
    },
    [client, organizationId]
  );

  const deleteWithOrgFilter = useCallback(
    async (table: string, filter: Record<string, any>) => {
      return (client as unknown).from(table).delete().eq("organization_id", organizationId).match(filter);
    },
    [client, organizationId]
  );

  // Direct table access with organization scoping
  const from = useCallback(
    (table: string) => {
      // Cast to any to handle dynamic table names since TypeScript can't verify all possible table names
      return (client as unknown).from(table).select("*").eq("organization_id", organizationId);
    },
    [client, organizationId]
  );

  return {
    conversations,
    messages,
    organizationMembers,
    aiSessions,
    campfireHandoffs,
    tickets,
    vectorDocuments,
    faqArticles,
    faqCategories,
    from,
    insertWithOrgId,
    updateWithOrgFilter,
    deleteWithOrgFilter,
    organizationId,
    ...(user?.id ? { userId: user.id } : {}),
    client,
  };
}

/**
 * Hook for tenant-aware real-time subscriptions
 * 🔥 MIGRATED TO LEAN REALTIME SYSTEM
 */
export function useTenantRealtime() {
  const { organizationId } = useTenant();

  // Lean realtime migration stubs - encourage direct hook usage
  const subscribeToConversations = useCallback(
    async (
      callback: (payload: unknown) => void,
      options?: {
        conversationId?: string;
        event?: "INSERT" | "UPDATE" | "DELETE" | "*";
      }
    ) => {
      return () => {}; // Return unsubscribe function stub
    },
    [organizationId]
  );

  const subscribeToMessages = useCallback(
    async (
      callback: (payload: unknown) => void,
      options?: {
        conversationId?: string;
        event?: "INSERT" | "UPDATE" | "DELETE" | "*";
      }
    ) => {
      return () => {}; // Return unsubscribe function stub
    },
    [organizationId]
  );

  return {
    subscribeToConversations,
    subscribeToMessages,
    organizationId,
    unsubscribe: (subscriptionId: string) => {},
  };
}

/**
 * Hook for tenant-aware data fetching with SWR
 */
export function useTenantSWR() {
  const tenantClient = useTenantSupabase();

  const getConversations = useCallback(async () => {
    const query = tenantClient.conversations();
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, [tenantClient]);

  const getMessages = useCallback(
    async (conversationId?: string) => {
      let query = tenantClient.messages();
      if (conversationId) {
        query = query.eq("conversation_id", conversationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    [tenantClient]
  );

  return {
    getConversations,
    getMessages,
    organizationId: tenantClient.organizationId,
  };
}
