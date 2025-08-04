// Hook for fetching real customer data from Supabase

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface CustomerData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  joinDate: string;
  totalConversations: number;
  averageRating: number;
  notes: CustomerNote[];
  previousIssues: string[];
  avatar?: string;
  lifetimeValue?: string;
  lastSeenAt?: string;
  tags: string[];
}

export interface CustomerNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

interface UseCustomerDataReturn {
  customerData: CustomerData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch comprehensive customer data from multiple Supabase tables
 * @param organizationId - Organization ID for multi-tenant filtering
 * @param customerEmail - Customer email to fetch data for
 * @returns Customer data with loading and error states
 */
export const useCustomerData = (organizationId?: string, customerEmail?: string): UseCustomerDataReturn => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = useCallback(async () => {
    if (!organizationId || !customerEmail) {
      setCustomerData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = supabase.browser();
      if (!client) {
        throw new Error("Supabase client not initialized");
      }

      // Check if we have a valid session before making requests
      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();
      if (sessionError || !session) {

        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error("Authentication required - please login again");
        }
      }

      // Validate inputs
      if (typeof organizationId !== "string" || typeof customerEmail !== "string") {
        throw new Error("Invalid organizationId or customerEmail format");
      }

      // First, let's try to get the customer from conversations table since that's more reliable
      const { data: conversationData, error: conversationError } = await client
        .from("conversations")
        .select("customerEmail, customerDisplayName, phoneNumber, tags, created_at")
        .eq("organization_id", organizationId)
        .eq("customerEmail", customerEmail)
        .limit(1)
        .single();

      if (conversationError && conversationError.code !== "PGRST116") {

      }

      // Try to fetch customer profile from platform_customers (this might not exist)
      let customerProfile = null;
      try {
        const { data: profileData, error: profileError } = await client
          .from("mailboxes_platformcustomer")
          .select("*")
          .eq("email", customerEmail)
          .single();

        if (!profileError) {
          customerProfile = profileData;
        } else {

        }
      } catch (profileErr) {

      }

      // Fetch all conversation statistics for this customer
      const { data: conversationStats, error: statsError } = await client
        .from("conversations")
        .select("id, satisfactionRating, status, subject, created_at, tags, phoneNumber, customerDisplayName")
        .eq("organization_id", organizationId)
        .eq("customerEmail", customerEmail)
        .order("created_at", { ascending: false });

      if (statsError) {

        // Don't throw the error, just log it and continue with empty stats

      }

      // Ensure conversationStats is an array
      const safeConversationStats = Array.isArray(conversationStats) ? conversationStats : [];

      // Fetch customer notes (if notes table exists)
      let notes = null;
      try {
        const { data: notesData, error: notesError } = await client
          .from("notes")
          .select("id, content, created_at, createdBy")
          .eq("organization_id", organizationId)
          .eq("entityType", "customer")
          .eq("entityId", customerEmail)
          .order("created_at", { ascending: false });

        if (!notesError) {
          notes = notesData;
        }
      } catch (error) {

      }

      // Calculate statistics
      const totalConversations = safeConversationStats.length;
      const ratings = safeConversationStats
        .filter((c) => c.satisfaction_rating && c.satisfaction_rating > 0)
        .map((c) => c.satisfaction_rating);
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      // Get previous issues (resolved conversations)
      const previousIssues = safeConversationStats
        .filter((c) => c.status === "resolved" || c.status === "closed")
        .map((c) => c.subject || "Untitled conversation")
        .slice(0, 5);

      // Use conversation data as primary source, fallback to profile data
      const latestConversation = safeConversationStats[0] || conversationData;
      const customerName =
        customerProfile?.name ||
        latestConversation?.customer_display_name ||
        conversationData?.customer_display_name ||
        "Unknown Customer";
      const phoneNumber = latestConversation?.phone_number || conversationData?.phone_number;

      // Build customer data object with fallbacks
      const customer: CustomerData = {
        id: customerProfile?.id || customerEmail,
        email: customerEmail,
        name: customerName,
        phone: phoneNumber,
        location: customerProfile?.metadata?.location,
        joinDate:
          customerProfile?.created_at ||
          latestConversation?.created_at ||
          conversationData?.created_at ||
          new Date().toISOString(),
        totalConversations,
        averageRating,
        notes:
          notes?.map((note) => ({
            id: note.id,
            content: note.content,
            createdAt: note.created_at,
            createdBy: note.createdBy,
          })) || [],
        previousIssues,
        avatar: customerProfile?.avatar_url,
        lifetimeValue: customerProfile?.value ? `$${customerProfile.value}` : undefined,
        lastSeenAt: customerProfile?.lastSeenAt,
        tags: latestConversation?.tags || conversationData?.tags || [],
      };

      setCustomerData(customer);
    } catch (err) {

      let errorMessage = "Failed to fetch customer data";
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === "object" && err !== null) {
        try {
          errorMessage = JSON.stringify(err) || errorMessage;
        } catch {
          errorMessage = "Failed to fetch customer data (serialization error)";
        }
      } else if (typeof err === "string") {
        errorMessage = err || errorMessage;
      }

      setError(errorMessage);
      setCustomerData(null);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, customerEmail]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  return {
    customerData,
    isLoading,
    error,
    refetch: fetchCustomerData,
  };
};

/**
 * Hook to add a new customer note
 */
export const useAddCustomerNote = () => {
  const [isAdding, setIsAdding] = useState(false);

  const addNote = useCallback(
    async (organizationId: string, customerEmail: string, content: string, createdBy: string) => {
      setIsAdding(true);
      try {
        const client = supabase.browser();

        // Try to add note if notes table exists
        const { data, error } = await client
          .from("notes")
          .insert({
            organization_id: organizationId,
            entityType: "customer",
            entityId: customerEmail,
            content,
            createdBy: createdBy,
          })
          .select()
          .single();

        if (error) {
          // If notes table doesn't exist, create a fallback note in conversation metadata

          throw new Error("Notes feature not available");
        }

        return data;
      } catch (err) {

        throw err;
      } finally {
        setIsAdding(false);
      }
    },
    []
  );

  return { addNote, isAdding };
};
