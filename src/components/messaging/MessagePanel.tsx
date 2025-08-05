"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle,
  Clock,
  MoreVertical,
  Send,
  User,
} from "lucide-react";
// ===== UNIFIED HOOKS IMPORT =====
import { AIReplySuggestions, type AISuggestion } from "@/components/ai/AIReplySuggestions";
import { VirtualizedMessageList } from "@/components/inbox/VirtualizedMessageList";
import { MessageComposerTags } from "@/components/shared/TagInput";
import { Avatar, AvatarFallback } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useConversationAI } from "@/hooks/unified-migration-hooks";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { useConversations } from "@/store/domains/conversations";
import { useMessagesStore } from "@/store/domains/messages";
import { useRealtimeStore, useTypingUsers } from "@/store/domains/realtime";
import { useAgentHandoff } from "../conversations/AgentHandoffProvider";

// ===== LEGACY IMPORTS (TO BE REMOVED) =====
// import { useSelectedConversation, useSelectedConversationMessages, useUILoading, useOrganization } from '@/store/selectors';
// import { useCampfireStore } from '@/lib/phoenix-store';

interface MessagePanelProps {
  conversationId: string;
  organizationId: string;
}

export default function MessagePanel({ conversationId, organizationId }: MessagePanelProps) {
  const [messageText, setMessageText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===== UNIFIED STATE MANAGEMENT =====
  const { user } = useAuth();
  const conversationState = useConversations();
  const messages = useMessagesStore((state) => state.messages.get(conversationId) || []);
  const loading = useMessagesStore((state) => state.loadingStates[conversationId] || false);
  const sendMessage = useMessagesStore((state) => state.sendMessage);
  const realtimeState = useRealtimeStore();
  const typingState = useTypingUsers(conversationId);
  const aiState = useConversationAI(conversationId);

  // Get selected conversation
  const selectedConversation = conversationState.find((conv) => conv.id === conversationId);

  const handoffContext = useAgentHandoff();
  const { requestHumanHandoff, requestAIHandoff } = handoffContext || {
    requestHumanHandoff: () => {},
    requestAIHandoff: () => {},
  };

  // ===== UNIFIED REAL-TIME CONNECTION =====
  // Real-time connection is automatically managed by the unified hooks
  const isConnected = useRealtimeStore((state) => state.connectionStatus === "connected");
  // Remove connectionStatus reference - not available in the hook return type

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages?.length]);

  // Real-time connection status
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "error">("connecting");

  useEffect(() => {
    if (!conversationId) return;

    // REMOVED: 30-second polling replaced with real-time connection monitoring
    // Real-time connection status is now managed by the unified hooks
    setConnectionStatus("connected");

    return () => {

    };
  }, [conversationId]);

  // Message status tracking
  const [messageStatuses, setMessageStatuses] = useState<
    Map<string, { status: "sending" | "sent" | "delivered" | "read" | "error"; timestamp: number | null }>
  >(new Map());

  // ===== UNIFIED TYPING FUNCTIONS =====
  const startTyping = useCallback(() => {
    if (!conversationId || !user) return;
    // typingState is now an array of typing users, we need to use store actions
    // TODO: Implement proper typing indicator with store actions
  }, [conversationId, user]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    // TODO: Implement proper typing indicator with store actions
  }, [conversationId]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessageText(e.target.value);

      if (!isComposing && e.target.value.trim()) {
        setIsComposing(true);
        startTyping();
      }

      // Clear existing timeout
      if (composingTimeoutRef.current) {
        clearTimeout(composingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      composingTimeoutRef.current = setTimeout(() => {
        setIsComposing(false);
        stopTyping();
      }, 1000);
    },
    [conversationId, isComposing]
  );

  // ===== UNIFIED MESSAGE SENDING =====
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText("");
    setIsComposing(false);
    setShowAiSuggestions(false);
    stopTyping();

    try {
      await sendMessage(conversationId, content, "agent");
    } catch (error) {}
  };

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch(`/api/ai?action=suggested-replies&conversationId=${conversationId}`);
      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        const formattedSuggestions: AISuggestion[] = data.suggestions.map((text: string, index: number) => ({
          id: `suggestion-${Date.now()}-${index}`,
          text,
          confidence: 0.85 + Math.random() * 0.15, // Mock confidence for now
        }));
        setAiSuggestions(formattedSuggestions);
        setShowAiSuggestions(true);
      }
    } catch (error) {
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case "ai_assistant":
        return <Icon icon={Bot} className="h-4 w-4" />;
      case "staff":
        return <Icon icon={User} className="h-4 w-4" />;
      case "user":
        return <Icon icon={User} className="h-4 w-4" />;
      default:
        return <Icon icon={Clock} className="h-4 w-4" />;
    }
  };

  const getMessageDeliveryStatus = (messageId: number | string) => {
    return messageStatuses.get(String(messageId)) || { status: "sent", timestamp: null };
  };

  const getDeliveryIcon = (messageId: number | string) => {
    const status = getMessageDeliveryStatus(messageId);
    if (!status) return null;

    switch (status.status) {
      case "sending":
        return <Icon icon={Clock} className="h-3 w-3 animate-spin text-campfire-neutral-400" />;
      case "sent":
        return <Icon icon={CheckCircle} className="h-3 w-3 text-campfire-neutral-400" />;
      case "delivered":
        return <Icon icon={CheckCircle} className="h-3 w-3 text-campfire-primary" />;
      case "read":
        return <Icon icon={CheckCircle} className="text-semantic-success-dark h-3 w-3" />;
      case "error":
        return <Icon icon={AlertCircle} className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const isTyping = typingState.size > 0;

  // Mock conversation data when selectedConversation is null
  const conversation = selectedConversation || {
    emailFrom: "Unknown Customer",
    subject: "No Subject",
    ragEnabled: false,
  };

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Conversation Header */}
      <div className="border-b border-campfire-neutral-200 spacing-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {("emailFrom" in conversation ? conversation.emailFrom?.charAt(0).toUpperCase() : null) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-campfire-neutral-900">
                {"emailFrom" in conversation ? conversation.emailFrom : "Unknown Customer"}
              </h3>
              <p className="text-sm text-campfire-neutral-600">{conversation.subject || "No Subject"}</p>
            </div>
          </div>

          <div className="flex items-center gap-ds-2">
            {/* Connection Status */}
            <Badge
              variant="outline"
              className={`text-xs ${
                connectionStatus === "connected"
                  ? "text-green-600-dark border-status-success-light bg-[var(--fl-color-success-subtle)]"
                  : "text-red-600-dark border-status-error-light bg-[var(--fl-color-danger-subtle)]"
              }`}
            >
              {connectionStatus}
            </Badge>

            {/* RAG Status - Placeholder for future implementation */}
            {/* TODO: Add RAG status when selectedConversation type is properly defined */}

            {/* Quick Actions */}
            <Button variant="ghost" size="sm">
              <Icon icon={MoreVertical} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <VirtualizedMessageList messages={messages || []} messageStatuses={messageStatuses} className="flex-1" />

      {/* Message Input */}
      <div className="bg-background flex-shrink-0 border-t border-[var(--fl-color-border)] spacing-3">
        {/* AI Suggestions */}
        {showAiSuggestions && (
          <AIReplySuggestions
            suggestions={aiSuggestions}
            isLoading={isGeneratingAI}
            onUseSuggestion={(suggestion) => {
              setMessageText(suggestion.text);
              setShowAiSuggestions(false);
              textareaRef.current?.focus();
            }}
            onEditSuggestion={(suggestion) => {
              setMessageText(suggestion.text);
              setShowAiSuggestions(false);
              textareaRef.current?.focus();
            }}
            onGenerateNew={generateAISuggestions}
            onDismiss={() => setShowAiSuggestions(false)}
          />
        )}

        <form onSubmit={handleSendMessage} className="space-y-spacing-sm">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="focus-campfire min-h-[80px] resize-none pr-12"
              disabled={connectionStatus !== "connected"}
            />

            {/* Quick Actions */}
            <div className="absolute right-2 top-2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-tiny"
                onClick={generateAISuggestions}
                disabled={isGeneratingAI}
              >
                <Icon icon={Bot} className="mr-1 h-3 w-3" />
                {isGeneratingAI ? "Generating..." : "AI Suggest"}
              </Button>
              {!("ragEnabled" in conversation ? conversation.ragEnabled : false) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-tiny"
                  onClick={() => requestAIHandoff?.(conversationId)}
                >
                  <Icon icon={Bot} className="mr-1 h-3 w-3" />
                  Enable AI
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-tiny"
                onClick={() => requestHumanHandoff?.(conversationId, "Transfer to human agent")}
              >
                <Icon icon={ArrowRight} className="mr-1 h-3 w-3" />
                Transfer
              </Button>
            </div>
          </div>

          {/* Tag System */}
          <MessageComposerTags className="mb-2" />

          <div className="flex gap-3">
            <Button
              type="submit"
              className="btn-campfire-primary self-end"
              disabled={!messageText.trim() || connectionStatus !== "connected"}
            >
              <Icon icon={Send} className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Status Bar */}
        <div className="mt-2 flex items-center justify-between text-tiny text-campfire-neutral-500">
          <div className="flex items-center gap-ds-2">
            {connectionStatus !== "connected" && <span className="text-red-600">Reconnecting...</span>}
            {isComposing && <span>You are typing...</span>}
          </div>
          <div>Press Enter to send, Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
}
