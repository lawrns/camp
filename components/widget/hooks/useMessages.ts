import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";

export interface Message {
    id: string;
    content: string;
    senderType: "visitor" | "agent" | "ai" | "system"; // Fixed: use senderType to match frontend
    senderName?: string;
    timestamp: string;
    conversation_id?: string;
    organization_id?: string;
    read_status?: "sending" | "sent" | "delivered" | "read";
    attachments?: any[];
    metadata?: Record<string, any>;
    isTyping?: boolean; // For AI typing animation
    confidence?: number; // For AI confidence display
}

export interface UseMessagesReturn {
    messages: Message[];
    sendMessage: (content: string, attachments?: any[]) => Promise<Message | null>;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    markAsRead: (messageId: string) => Promise<void>;
}

export function useMessages(
    conversationId?: string,
    organizationId?: string
): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Load messages from API endpoint (consistent with InboxDashboard)
    const loadMessages = useCallback(async () => {
        console.log("[useMessages] loadMessages called with:", { conversationId, organizationId });
        if (!conversationId || !organizationId) {
            console.log("[useMessages] Missing required params, clearing messages");
            setMessages([]);
            return;
        }

        // Validate conversation ID format (should be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(conversationId)) {
            console.log("[useMessages] Invalid conversation ID format:", conversationId);
            setMessages([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/widget/messages?conversationId=${conversationId}`, {
                method: "GET",
                headers: {
                    "X-Organization-ID": organizationId,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load messages: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("[useMessages] Raw API response:", data);

            // The API returns the messages array directly, not wrapped in a messages property
            const messagesArray = Array.isArray(data) ? data : [];
            console.log("[useMessages] Messages array:", messagesArray);
            console.log("[useMessages] Messages count:", messagesArray.length);

            const transformedMessages = messagesArray.map((message: any) => ({
                id: message.id,
                content: message.content,
                senderType: message.senderType || (message.sender_type === "visitor" ? "visitor" :
                    message.sender_type === "ai_assistant" ? "ai" : "agent"), // Handle both formats
                senderName: message.senderName || message.sender_name,
                timestamp: message.timestamp || message.created_at,
                read_status: message.read_status || "sent",
                attachments: message.attachments || [],
            }));

            console.log("[useMessages] Transformed messages:", transformedMessages);

            // Deduplicate messages by ID to prevent React key conflicts
            const uniqueMessages = transformedMessages.filter((message, index, array) =>
                array.findIndex(m => m.id === message.id) === index
            );

            console.log("[useMessages] Deduplicated messages:", uniqueMessages);
            console.log("[useMessages] Setting messages state with", uniqueMessages.length, "messages");
            setMessages(uniqueMessages);
        } catch (err) {
            console.error("[useMessages] Error loading messages:", err);
            console.error("[useMessages] Error details:", {
                conversationId,
                organizationId,
                error: err instanceof Error ? err.message : err
            });
            setError(err instanceof Error ? err.message : "Failed to load messages");
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, organizationId]);

    // Send a new message using API endpoint with optimistic UI updates
    const sendMessage = useCallback(
        async (content: string, attachments?: any[]): Promise<Message | null> => {
            console.log("[useMessages] sendMessage called with:", { content, conversationId, organizationId });
            if (!conversationId || !organizationId || !content.trim()) {
                console.log("[useMessages] Missing required params:", { conversationId, organizationId, content: content.trim() });
                return null;
            }

            // Create optimistic message for immediate UI feedback
            const optimisticMessage: Message = {
                id: `optimistic-${Date.now()}`,
                content: content.trim(),
                senderType: "visitor",
                senderName: "You",
                timestamp: new Date().toISOString(),
                read_status: "sending",
                attachments: attachments || [],
                conversation_id: conversationId,
                organization_id: organizationId,
            };

            // Add optimistic message immediately for instant feedback
            setMessages((prev) => [...prev, optimisticMessage]);
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/widget/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Organization-ID": organizationId,
                    },
                    body: JSON.stringify({
                        conversationId,
                        content: content.trim(),
                        senderEmail: user?.email || `visitor-${Date.now()}@example.com`,
                        senderName: user?.name || "Visitor",
                        senderType: "customer",
                    }),
                });

                if (!response.ok) {
                    // Remove optimistic message on error
                    setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
                    throw new Error(`Failed to send message: ${response.statusText}`);
                }

                const result = await response.json();
                console.log("[useMessages] API response:", result);

                // Validate the API response structure
                if (!result || !result.id) {
                    console.error("[useMessages] Invalid API response structure:", result);
                    throw new Error("Invalid response from server - missing message ID");
                }

                // The API returns the message directly, not wrapped in a message property
                const confirmedMessage: Message = {
                    id: result.id,
                    content: result.content || content.trim(),
                    senderType: "visitor", // We know this is a visitor message
                    senderName: "You",
                    timestamp: result.createdAt || new Date().toISOString(),
                    read_status: "sent",
                    attachments: [],
                    conversation_id: conversationId,
                    organization_id: organizationId,
                };

                // Replace optimistic message with confirmed message
                setMessages((prev) => {
                    const filtered = prev.filter(msg => msg.id !== optimisticMessage.id && msg.id !== confirmedMessage.id);
                    return [...filtered, confirmedMessage];
                });

                console.log("[useMessages] Message sent successfully:", confirmedMessage);

                // Get AI response using enhanced AI service
                try {
                    const aiResponse = await fetch('/api/ai/enhanced-response', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId,
                            organizationId,
                            messageContent: content.trim(),
                            messageId: confirmedMessage.id,
                            conversationHistory: messages.map(msg => ({
                                id: msg.id,
                                content: msg.content,
                                senderType: msg.senderType === 'visitor' ? 'customer' : msg.senderType,
                                timestamp: msg.timestamp,
                            })),
                        }),
                    });

                    if (aiResponse.ok) {
                        const aiResult = await aiResponse.json();

                        // Add AI response to messages
                        const aiMessage: Message = {
                            id: `ai_${Date.now()}`,
                            content: aiResult.response.content,
                            senderType: 'ai',
                            senderName: aiResult.response.metadata?.aiPersonality || 'Assistant',
                            timestamp: new Date().toISOString(),
                            conversation_id: conversationId,
                            organization_id: organizationId,
                            confidence: aiResult.response.confidence,
                            metadata: {
                                confidence: aiResult.response.confidence,
                                shouldHandover: aiResult.response.shouldHandover,
                                sentiment: aiResult.response.sentiment,
                                sources: aiResult.response.sources,
                                empathyScore: aiResult.response.metadata?.empathyScore,
                            },
                        };

                        setMessages(prev => [...prev, aiMessage]);

                        // If handover is needed, log it for now (UI notification can be added later)
                        if (aiResult.response.shouldHandover) {
                            console.log('[useMessages] AI handover triggered:', aiResult.response.handoverReason);
                        }
                    }
                } catch (aiError) {
                    console.error('[useMessages] Error getting AI response:', aiError);
                    // Add fallback AI message
                    const fallbackMessage: Message = {
                        id: `ai_fallback_${Date.now()}`,
                        content: "Thank you for your message. A team member will respond shortly.",
                        senderType: 'ai',
                        senderName: 'Assistant',
                        timestamp: new Date().toISOString(),
                        conversation_id: conversationId,
                        organization_id: organizationId,
                    };
                    setMessages(prev => [...prev, fallbackMessage]);
                }

                // Reload messages to ensure they appear (fallback if real-time doesn't work)
                setTimeout(() => {
                    loadMessages();
                }, 500);

                return confirmedMessage;
            } catch (err) {
                console.error("[useMessages] Error sending message:", err);
                console.error("[useMessages] Error details:", {
                    conversationId,
                    organizationId,
                    error: err instanceof Error ? err.message : err,
                    stack: err instanceof Error ? err.stack : undefined
                });
                // Remove optimistic message on error
                setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
                setError(err instanceof Error ? err.message : "Failed to send message");
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [conversationId, organizationId, user?.email]
    );

    // Mark message as read - temporarily disabled until proper endpoint is available
    const markAsRead = useCallback(
        async (messageId: string) => {
            if (!conversationId || !organizationId) return;

            try {
                // TODO: Implement proper mark-read endpoint
                console.log("[useMessages] Mark as read requested for message:", messageId);

                // For now, just update local state
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, read_status: "read" }
                        : msg
                ));

                /* Disabled until proper endpoint exists
                const response = await fetch("/api/widget/messages/mark-read", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Organization-ID": organizationId,
                    },
                    body: JSON.stringify({
                        messageId,
                        conversationId,
                        readAt: new Date().toISOString(),
                    }),
                });

                if (response.ok) {
                    // Update local state
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === messageId ? { ...msg, read_status: "read" } : msg
                        )
                    );
                }
                */
            } catch (err) {
                console.error("Error marking message as read:", err);
            }
        },
        [conversationId, organizationId]
    );

    // Reload messages
    const reload = useCallback(async () => {
        await loadMessages();
    }, [conversationId, organizationId]); // Use stable dependencies instead of loadMessages

    // Subscribe to real-time message updates with Supabase realtime
    useEffect(() => {
        if (!conversationId || !organizationId) return;

        // Load initial messages
        loadMessages();

        // Set up Supabase realtime subscription using STANDARDIZED channel naming
        const channelName = `org:${organizationId}:conv:${conversationId}`;

        // Import supabase dynamically to avoid build issues
        console.log("[useMessages] Setting up real-time subscription for conversation:", conversationId);
        import("@/lib/supabase/consolidated-exports").then(({ supabase }) => {
            const client = supabase.browser();
            const channel = client
                .channel(channelName)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    (payload) => {
                        console.log("[useMessages] Real-time message received:", payload);

                        // Transform the new message to match our interface
                        const newMessage: Message = {
                            id: payload.new.id,
                            content: payload.new.content,
                            senderType: payload.new.sender_type === "visitor" ? "visitor" :
                                payload.new.sender_type === "ai_assistant" ? "ai" : "agent",
                            senderName: payload.new.sender_name,
                            timestamp: payload.new.created_at,
                            read_status: "sent",
                            attachments: payload.new.attachments || [],
                            conversation_id: payload.new.conversation_id,
                            organization_id: payload.new.organization_id,
                            // AI-specific properties
                            confidence: payload.new.metadata?.confidence,
                            isTyping: payload.new.sender_type === "ai_assistant" ? true : false, // Start with typing for AI
                        };

                        // Add message to state with deduplication
                        setMessages((prev) => {
                            const filtered = prev.filter(msg => msg.id !== newMessage.id);
                            return [...filtered, newMessage];
                        });

                        // If it's an AI message, simulate typing animation
                        if (newMessage.senderType === "ai" && newMessage.isTyping) {
                            // Calculate typing duration based on message length (50 WPM)
                            const words = newMessage.content.split(' ').length;
                            const typingDuration = Math.max(2000, (words / 50) * 60 * 1000); // Min 2 seconds

                            setTimeout(() => {
                                setMessages((prev) =>
                                    prev.map(msg =>
                                        msg.id === newMessage.id
                                            ? { ...msg, isTyping: false }
                                            : msg
                                    )
                                );
                            }, typingDuration);
                        }
                    }
                )
                .subscribe();

            // Cleanup function
            return () => {
                client.removeChannel(channel);
            };
        }).catch((error) => {
            console.error("[useMessages] Failed to set up realtime:", error);
            // Fallback to polling if realtime fails
            const pollInterval = setInterval(() => {
                if (!isLoading) {
                    loadMessages();
                }
            }, 5000);

            return () => clearInterval(pollInterval);
        });

    }, [conversationId, organizationId]); // Remove loadMessages and isLoading to prevent infinite loop

    return {
        messages,
        sendMessage,
        isLoading,
        error,
        reload,
        markAsRead,
    };
} 