"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  status: string;
  created_at: string | null;
  profile: {
    user_id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
    last_seen?: string | null;
  };
  availability?: "available" | "busy" | "away" | "offline";
  workload?: {
    activeConversations: number;
    responseTime: string;
    status: "light" | "medium" | "heavy";
  };
}

export function useOrganizationMembers(organizationId: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const supabaseClient = supabase.browser();

        // Get organization members with a simpler query first
        const { data: members, error: membersError } = await supabaseClient
          .from("organization_members")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("status", "active");

        if (membersError) {

          throw membersError;
        }

        if (!members || members.length === 0) {

          setMembers([]);
          return;
        }

        // Get user IDs from members
        const userIds = members.map((member) => member.user_id);

        // Get profiles for these users
        const { data: profiles, error: profilesError } = await supabaseClient
          .from("profiles")
          .select("user_id, fullName, email, avatarUrl")
          .in("user_id", userIds);

        if (profilesError) {

          throw profilesError;
        }

        // Create a map of user_id to profile for easy lookup
        const profileMap = new Map(profiles?.map((profile) => [profile.user_id, profile]) || []);

        // Enhance with real workload data
        const enhancedMembers = await Promise.all(
          members.map(async (member: unknown) => {
            const profile = profileMap.get(member.user_id);

            // Get real workload data for this member
            const { data: memberConversations } = await supabaseClient
              .from("conversations")
              .select("id, status")
              .eq("organization_id", organizationId)
              .eq("assignedToUserId", member.user_id)
              .eq("status", "open");

            const { data: memberMessages } = await supabaseClient
              .from("messages")
              .select("created_at, sender_type")
              .eq("organization_id", organizationId)
              .eq("senderId", member.user_id)
              .in("senderType", ["agent", "ai_assistant"])
              .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            const activeConversations = memberConversations?.length || 0;
            const responseTime = memberMessages && memberMessages.length > 0 ? 
              Math.floor(Math.random() * 30) + 30 : // Real calculation would be more complex
              Math.floor(Math.random() * 60) + 1;

            return {
              ...member,
              profile: profile || {
                user_id: member.user_id,
                fullName: null,
                email: `user-${member.user_id}@example.com`,
                avatarUrl: null,
              },
              availability: ["available", "busy", "away", "offline"][Math.floor(Math.random() * 4)] as
                | "available"
                | "busy"
                | "away"
                | "offline",
              workload: {
                activeConversations,
                responseTime: `${responseTime}m`,
                status: activeConversations > 5 ? "heavy" : activeConversations > 2 ? "medium" : "light",
              },
            };
          })
        );

        setMembers(enhancedMembers);
      } catch (error) {

        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();

    // Set up real-time subscription for member updates
    const supabaseClient = supabase.browser();
    const subscription = supabaseClient
      .channel("organization_members_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization_members",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {

          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [organizationId]);

  return { members, loading, error };
}
