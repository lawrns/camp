/**
 * Statistics data operations
 * Provides functions for retrieving and calculating various statistics
 */

import { createApiClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type TeamMemberStats = {
  userId: string;
  name: string;
  email: string;
  role: "CORE" | "NON_CORE";
  conversationsHandled: number;
  avgResponseTime: number; // in minutes
  customerRating: number;
  resolutionRate: number;
  lastActiveAt: Date | null;
};

export type OrganizationStats = {
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  avgResolutionTime: number; // in hours
  avgResponseTime: number; // in minutes
  customerSatisfaction: number;
  teamMembers: number;
  activeTeamMembers: number;
};

export const UserRoles = {
  CORE: "CORE",
  NON_CORE: "NON_CORE",
} as const;

/**
 * Get team member statistics for an organization
 */
export async function getTeamMemberStats(
  organizationId: string,
  timeRange: "24h" | "7d" | "30d" = "7d"
): Promise<TeamMemberStats[]> {
  const supabase = createApiClient();

  // Calculate start date based on time range
  const startDate = new Date();
  switch (timeRange) {
    case "24h":
      startDate.setHours(startDate.getHours() - 24);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  // Get organization members
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select(
      `
      user_id,
      role,
      profiles!inner(
        full_name,
        email
      )
    `
    )
    .eq("organization_id", organizationId);

  if (membersError) {

    return [];
  }

  // Get conversation statistics for each member
  const stats = await Promise.all(
    (members || []).map(async (member) => {
      // Get conversations handled
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, status, created_at, resolved_at")
        .eq("organization_id", organizationId)
        .eq("assigned_to", member.user_id)
        .gte("created_at", startDate.toISOString());

      const conversationsHandled = conversations?.length || 0;

      // Calculate average response time
      const { data: messages } = await supabase
        .from("messages")
        .select("created_at, conversation_id")
        .eq("sender_id", member.user_id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      let totalResponseTime = 0;
      let responseCount = 0;

      if (messages && messages.length > 0) {
        // Group messages by conversation
        const messagesByConversation = messages.reduce(
          (acc, msg) => {
            if (!acc[msg.conversation_id]) {
              acc[msg.conversation_id] = [];
            }
            acc[msg.conversation_id].push(msg);
            return acc;
          },
          {} as Record<string, typeof messages>
        );

        // Calculate response times
        for (const conversationMessages of Object.values(messagesByConversation)) {
          if (conversationMessages.length > 0) {
            const firstMessage = conversationMessages[0]!;
            const { data: previousMessage } = await supabase
              .from("messages")
              .select("created_at")
              .eq("conversation_id", firstMessage.conversation_id)
              .lt("created_at", firstMessage.created_at)
              .neq("sender_id", member.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (previousMessage) {
              const responseTime =
                new Date(firstMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime();
              totalResponseTime += responseTime;
              responseCount++;
            }
          }
        }
      }

      const avgResponseTime =
        responseCount > 0
          ? Math.round(totalResponseTime / responseCount / 1000 / 60) // Convert to minutes
          : 0;

      // Calculate resolution rate
      const resolvedConversations = conversations?.filter((c) => c.status === "resolved") || [];
      const resolutionRate =
        conversationsHandled > 0 ? Math.round((resolvedConversations.length / conversationsHandled) * 100) : 0;

      // Get last activity
      const { data: lastActivity } = await supabase
        .from("messages")
        .select("created_at")
        .eq("sender_id", member.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        userId: member.user_id,
        name: member.profiles?.full_name || "Unknown",
        email: member.profiles?.email || "",
        role: member.role === "admin" || member.role === "owner" ? "CORE" : "NON_CORE",
        conversationsHandled,
        avgResponseTime,
        customerRating: 4.5 + Math.random() * 0.5, // Placeholder - would come from ratings table
        resolutionRate,
        lastActiveAt: lastActivity ? new Date(lastActivity.created_at) : null,
      } as TeamMemberStats;
    })
  );

  return stats;
}

/**
 * Get organization-wide statistics
 */
export async function getOrganizationStats(
  organizationId: string,
  timeRange: "24h" | "7d" | "30d" = "7d"
): Promise<OrganizationStats> {
  const supabase = createApiClient();

  // Calculate start date based on time range
  const startDate = new Date();
  switch (timeRange) {
    case "24h":
      startDate.setHours(startDate.getHours() - 24);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  // Get conversation statistics
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, status, created_at, resolved_at")
    .eq("organization_id", organizationId)
    .gte("created_at", startDate.toISOString());

  const totalConversations = conversations?.length || 0;
  const activeConversations = conversations?.filter((c) => c.status === "open" || c.status === "pending").length || 0;
  const resolvedConversations = conversations?.filter((c) => c.status === "resolved").length || 0;

  // Calculate average resolution time
  let totalResolutionTime = 0;
  let resolutionCount = 0;

  conversations?.forEach((conv) => {
    if (conv.status === "resolved" && conv.resolved_at) {
      const resolutionTime = new Date(conv.resolved_at).getTime() - new Date(conv.created_at).getTime();
      totalResolutionTime += resolutionTime;
      resolutionCount++;
    }
  });

  const avgResolutionTime =
    resolutionCount > 0
      ? Math.round(totalResolutionTime / resolutionCount / 1000 / 60 / 60) // Convert to hours
      : 0;

  // Get team member count
  const { count: totalMembers } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Get active team members (active in last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data: activeMembers } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("organization_id", organizationId)
    .gte("created_at", oneDayAgo.toISOString())
    .not("sender_id", "is", null);

  const uniqueActiveMembers = new Set(activeMembers?.map((m) => m.sender_id) || []);

  return {
    totalConversations,
    activeConversations,
    resolvedConversations,
    avgResolutionTime,
    avgResponseTime: 5, // Placeholder - would be calculated from message response times
    customerSatisfaction: 4.5, // Placeholder - would come from ratings
    teamMembers: totalMembers || 0,
    activeTeamMembers: uniqueActiveMembers.size,
  };
}

/**
 * Get conversation volume statistics over time
 */
export async function getConversationVolumeStats(
  organizationId: string,
  timeRange: "24h" | "7d" | "30d" = "7d",
  interval: "hour" | "day" = "day"
): Promise<Array<{ timestamp: string; count: number }>> {
  const supabase = createApiClient();

  // Calculate start date based on time range
  const startDate = new Date();
  switch (timeRange) {
    case "24h":
      startDate.setHours(startDate.getHours() - 24);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (!conversations || conversations.length === 0) {
    return [];
  }

  // Group conversations by interval
  const volumeMap = new Map<string, number>();

  conversations.forEach((conv) => {
    const date = new Date(conv.created_at);
    let key: string;

    if (interval === "hour") {
      key = `${date.toISOString().slice(0, 13)}:00:00`;
    } else {
      key = date.toISOString().slice(0, 10);
    }

    volumeMap.set(key, (volumeMap.get(key) || 0) + 1);
  });

  return Array.from(volumeMap.entries())
    .map(([timestamp, count]) => ({ timestamp, count }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
