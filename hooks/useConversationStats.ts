import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export interface ConversationStats {
    total: number;
    unassigned: number;
    assigned: number;
    resolved: number;
    averageResponseTime: number;
    messagesToday: number;
    activeAgents: number;
}

export function useConversationStats() {
    const { user } = useAuth();
    const organizationId = user?.organizationId;

    // Check if we're in widget context and disable the hook
    const isWidgetContext = typeof window !== 'undefined' && (
        window.location.pathname.includes('/widget') ||
        window.location.search.includes('widget=true') ||
        (window as any).CampfireWidgetConfig ||
        user?.isWidget
    );

    return useQuery({
        queryKey: ["conversation-stats", organizationId],
        enabled: !!organizationId && !isWidgetContext, // Disable in widget context
        queryFn: async (): Promise<ConversationStats> => {
            if (!organizationId) {
                throw new Error("Organization ID is required to fetch conversation stats");
            }

            console.log("[ConversationStats] Fetching stats for organization:", organizationId);

            try {
                // Fetch basic conversation counts
                const { data: conversations, error: convError } = await supabase
                    .browser()
                    .from("conversations")
                    .select("id, status, assigned_to_user_id, created_at, updated_at")
                    .eq("organization_id", organizationId);

                console.log("[ConversationStats] Query result:", {
                    conversationCount: conversations?.length,
                    hasError: !!convError,
                    errorCode: convError?.code,
                    errorMessage: convError?.message
                });

                if (convError) {
                    console.error("Error fetching conversations for stats:", {
                        error: convError,
                        code: convError.code,
                        message: convError.message,
                        details: convError.details,
                        hint: convError.hint,
                        organizationId
                    });

                    // Return default stats instead of throwing error for empty results or permission issues
                    if (convError.code === 'PGRST116' ||
                        convError.message?.includes('no rows') ||
                        convError.message?.includes('permission denied') ||
                        convError.code === '42501') {
                        console.log("[ConversationStats] No conversations found or permission denied, returning default stats");
                        return {
                            total: 0,
                            unassigned: 0,
                            assigned: 0,
                            resolved: 0,
                            messagesToday: 0,
                            averageResponseTime: 0,
                            activeAgents: 0
                        };
                    }
                    throw new Error(`Failed to fetch conversations: ${convError.message || convError.code || 'Unknown error'}`);
                }

                // Fetch message count for today
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: todayMessages, error: msgError } = await supabase
                    .browser()
                    .from("messages")
                    .select("id")
                    .eq("organization_id", organizationId)
                    .gte("created_at", today.toISOString());

                if (msgError) {
                    console.error("Error fetching today's messages:", {
                        error: msgError,
                        code: msgError.code,
                        message: msgError.message,
                        organizationId
                    });
                    // Don't throw, just use 0 as fallback
                }

                // Calculate stats
                const total = conversations?.length || 0;
                const unassigned = conversations?.filter(c => !c.assigned_to_user_id).length || 0;
                const assigned = conversations?.filter(c => c.assigned_to_user_id && c.status !== 'closed').length || 0;
                const resolved = conversations?.filter(c => c.status === 'closed').length || 0;
                const messagesToday = todayMessages?.length || 0;

                // Calculate average response time (simplified - first message to first response)
                let totalResponseTime = 0;
                let responseCount = 0;

                if (conversations) {
                    for (const conv of conversations) {
                        if (conv.created_at && conv.updated_at && conv.created_at !== conv.updated_at) {
                            const created = new Date(conv.created_at);
                            const updated = new Date(conv.updated_at);
                            const responseTime = updated.getTime() - created.getTime();
                            if (responseTime > 0) {
                                totalResponseTime += responseTime;
                                responseCount++;
                            }
                        }
                    }
                }

                const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

                // Count active agents (users with assigned conversations) - Fixed column name
                const activeAgents = new Set(
                    conversations
                        ?.filter(c => c.assigned_to_user_id)
                        .map(c => c.assigned_to_user_id)
                ).size;

                return {
                    total,
                    unassigned,
                    assigned,
                    resolved,
                    averageResponseTime,
                    messagesToday,
                    activeAgents,
                };
            } catch (error) {
                console.error("Error fetching conversation stats:", {
                    error,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    errorStack: error instanceof Error ? error.stack : undefined,
                    organizationId
                });
                // Return fallback stats on error
                return {
                    total: 0,
                    unassigned: 0,
                    assigned: 0,
                    resolved: 0,
                    averageResponseTime: 0,
                    messagesToday: 0,
                    activeAgents: 0,
                };
            }
        },
        enabled: !!organizationId,
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: 2,
    });
} 