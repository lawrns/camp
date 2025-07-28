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
    full_name: string | null;
    email: string;
    avatar_url: string | null;
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
    if (!organizationId) return;

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
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", userIds);

        if (profilesError) {

          throw profilesError;
        }

        // Create a map of user_id to profile for easy lookup
        const profileMap = new Map(profiles?.map((profile) => [profile.user_id, profile]) || []);

        // Enhance with real-time data (simplified for now)
        const enhancedMembers = members.map((member: any) => {
          const profile = profileMap.get(member.user_id);

          // Generate mock workload data (replace with real data later)
          const activeConversations = Math.floor(Math.random() * 10);
          const responseTime = Math.floor(Math.random() * 60) + 1;

          return {
            ...member,
            profile: profile || {
              user_id: member.user_id,
              full_name: null,
              email: `user-${member.user_id}@example.com`,
              avatar_url: null,
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
        });

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
