// Main InboxDashboard component - orchestrates all sub-components

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useConversationStats } from "@/hooks/useConversationStats";
import { useRealtime } from "@/hooks/useRealtime";
import { supabase } from "@/lib/supabase";
import { Robot } from "@phosphor-icons/react";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
// Import utilities
import { fallbackAISuggestions } from "./constants/messageTemplates";
// Import all the extracted components
import ChatHeader from "./sub-components/ChatHeader";
import Composer from "./sub-components/Composer";
import ConversationList from "./sub-components/ConversationList";
import CustomerSidebar from "./sub-components/CustomerSidebar";
import Header from "./sub-components/Header";
import MessageList from "./sub-components/MessageList";
import ShortcutsModal from "./sub-components/ShortcutsModal";
// Import types
import type { AISuggestion, Conversation, FileAttachment } from "./types";
import { debounce } from "./utils/channelUtils";
import { handleFileDrop, handleFileInput } from "./utils/fileUtils";
// NEW: Import dialog components
import { AssignmentPanel } from "@/components/conversations/AssignmentPanel";
import { ConvertToTicketDialog } from "@/components/conversations/ConvertToTicketDialog";
import { useMessages } from "./hooks/useMessages";

// Import AI components (DASHBOARD-SIDE ONLY)

interface InboxDashboardProps {
  className?: string;
}

/**
 * Main InboxDashboard component - now much smaller and focused on orchestration
 */
export const InboxDashboard: React.FC<InboxDashboardProps> = ({ className = "" }) => {
  // User context - using real auth hook with validation
  const { user, isLoading: authLoading } = useAuth();
  const organizationId = user?.organizationId;
  const userId = user?.id;

  // Debug logging
  React.useEffect(() => {
    console.log("[InboxDashboard] Auth state:", { user, authLoading, organizationId, userId });
    console.log("[InboxDashboard] Using organizationId:", organizationId);
  }, [user, authLoading, organizationId, userId]);

  // UI state
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(true); // AI-powered smart replies

  // NEW: Add state for dialogs
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Message composer state
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);

  // AI and UI panels
  const [isAIActive, setIsAIActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);

  // Drag and drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time data using standardized hook
  const [realtimeState, realtimeActions] = useRealtime({
    type: "dashboard",
    organizationId,
    conversationId: selectedConversation?.id,
    userId,
  });
  // Extract values from realtime state
  const { isConnected, connectionStatus, error: realtimeError } = realtimeState;
  const { sendMessage, broadcastTyping: startTyping, disconnect: stopTyping } = realtimeActions;

  // Fetch conversations using the useConversations hook
  const { conversations, isLoading: conversationsLoading, error: conversationsError } = useConversations();

  // Fetch conversation statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useConversationStats();

  // Use real messages hook instead of mock data
  const { messages, isLoading: messagesLoading, reload: reloadMessages, setMessages } = useMessages(
    selectedConversation?.id,
    organizationId
  );

  React.useEffect(() => {
    console.log("[InboxDashboard] Conversations:", conversations);
    console.log("[InboxDashboard] Selected Conversation:", selectedConversation);
    console.log("[InboxDashboard] Messages:", messages);
    console.log("[InboxDashboard] Messages Loading:", messagesLoading);
  }, [conversations, selectedConversation, messages, messagesLoading]);
  const onlineUsers: any[] = []; // TODO: Implement presence  const loadConversations = () => { }; // TODO: Implement
  const loadMessages = () => { }; // TODO: Implement
  const reconnect = () => { }; // TODO: Implement

  // Performance metrics using real stats
  const performanceMetrics = {
    averageLatency: stats?.averageResponseTime || 0,
    messageCount: stats?.messagesToday || 0,
    reconnectionCount: 0
  };

  // Early return if auth is loading or missing required data
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--ds-color-primary-500)]"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !organizationId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="text-center">
          <p className="mb-4 text-red-600">Authentication required</p>
          <p className="text-foreground">Please log in to access the inbox</p>
        </div>
      </div>
    );
  }

  // Send message function with real-time broadcasting
  const sendMessageHP = useCallback(
    async (convId: string, content: string, senderType: "customer" | "agent" = "agent") => {
      if (!organizationId || !content.trim()) return;

      try {
        // Create optimistic message for immediate UI update
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMessage = {
          id: tempId,
          conversation_id: convId,
          organization_id: organizationId,
          content: content.trim(),
          sender_type: senderType,
          sender_name: senderType === "agent" ? "Support Agent" : "Customer",
          created_at: new Date().toISOString(),
          metadata: {
            source: "dashboard",
            timestamp: new Date().toISOString(),
          },
          attachments: [],
          read_status: "sending" as const,
        };

        // Add optimistic message to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);

        // Send to database
        const { data, error } = await supabase
          .browser()
          .from("messages")
          .insert({
            conversation_id: convId,
            organization_id: organizationId,
            content: content.trim(),
            sender_type: senderType,
            sender_name: senderType === "agent" ? "Support Agent" : "Customer",
            metadata: {
              source: "dashboard",
              timestamp: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (error) {
          // Remove optimistic message on error
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          throw error;
        }

        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? { ...data, attachments: [], read_status: "sent" as const }
              : msg
          )
        );

        // Broadcast real-time event using standardized system
        try {
          const channelName = `org:${organizationId}:conv:${convId}`;
          const channel = supabase.browser().channel(channelName);
          
          // Subscribe to channel first (required for broadcasts)
          await channel.subscribe();

          await channel.send({
            type: "broadcast",
            event: "message_created",
            payload: {
              message: { ...data, attachments: [], read_status: "sent" as const },
              conversation_id: convId,
              organization_id: organizationId,
              sender_type: senderType,
            },
          });
          
          // Clean up the channel after sending
          await channel.unsubscribe();
        } catch (broadcastError) {
          console.warn("Failed to broadcast message:", broadcastError);
          // Don't throw - message was saved successfully
        }

        return data;
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [organizationId, setMessages]
  );

  // Derived loading states
  const loadingConversations = !isConnected;
  const loadingMessages = !isConnected;

  // Typing handlers for standardized system
  const handleTyping = useCallback(() => {
    if (selectedConversation?.id && newMessage.trim()) {
      startTyping(true);
    }
  }, [selectedConversation?.id, startTyping, newMessage]);

  const handleStopTyping = useCallback(() => {
    if (selectedConversation?.id) {
      stopTyping();
    }
  }, [selectedConversation?.id, stopTyping]);

  // Debounced search
  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowCustomerDetails(false); // Close sidebar when switching conversations
  }, []);

  // AI handover toggle
  const toggleAIHandover = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      setIsAIActive(!isAIActive);
      // In a real app, this would update the conversation in the database

    } catch (error) {

    }
  }, [selectedConversation, isAIActive]);

  // NEW: Handle assign conversation
  const handleAssignConversation = useCallback(() => {
    setShowAssignmentPanel(true);
  }, []);

  // NEW: Handle convert to ticket
  const handleConvertToTicket = useCallback(() => {
    setShowConvertDialog(true);
  }, []);

  // Generate AI suggestions
  const generateAISuggestions = useCallback(async () => {
    if (!selectedConversation) return;

    setShowAISuggestions(true);

    try {
      // In a real app, this would call an AI API
      // For now, use fallback suggestions
      setTimeout(() => {
        setAISuggestions(
          fallbackAISuggestions.map((template) => ({
            id: template.id,
            content: template.content,
            confidence: Math.random() * 0.4 + 0.6, // Random confidence between 0.6-1.0
            type: "response" as const,
            reasoning: "Based on conversation context and common patterns",
          }))
        );
      }, 1000);
    } catch (error) {

    }
  }, [selectedConversation]);

  // Use AI suggestion
  const useSuggestion = useCallback((suggestion: AISuggestion) => {
    setNewMessage(suggestion.content);
    setShowAISuggestions(false);
    textareaRef.current?.focus();
  }, []);

  // Handle smart reply selection (AI-powered suggestions)
  const handleSmartReplySelect = useCallback((replyContent: string) => {
    setNewMessage(replyContent);
    textareaRef.current?.focus();
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || isSending || !organizationId) return;

    setIsSending(true);

    try {
      // Use high-performance real-time sending for <30ms delivery
      await sendMessageHP(selectedConversation.id, newMessage.trim(), "agent");

      // Clear form immediately for better UX
      setNewMessage("");
      setAttachments([]);
      handleStopTyping();
    } catch (error) {

    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedConversation, isSending, user, attachments, handleStopTyping]);

  // File handling
  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileInput(e, organizationId, setAttachments);
    },
    [organizationId]
  );

  const onFileDrop = useCallback(
    (e: React.DragEvent) => {
      handleFileDrop(e, organizationId, setAttachments, setIsDragOver);
    },
    [organizationId]
  );

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "k":
            e.preventDefault();
            if (e.shiftKey) {
              generateAISuggestions();
            } else {
              searchInputRef.current?.focus();
            }
            break;
          case "enter":
            if (e.target === textareaRef.current && newMessage.trim()) {
              e.preventDefault();
              handleSendMessage();
            }
            break;
          case "/":
            e.preventDefault();
            setShowShortcuts(!showShortcuts);
            break;
          case "e":
            e.preventDefault();
            setShowEmojiPicker(!showEmojiPicker);
            break;
          case "t":
            e.preventDefault();
            setShowTemplates(!showTemplates);
            break;
          case "u":
            e.preventDefault();
            fileInputRef.current?.click();
            break;
          case "h":
            e.preventDefault();
            toggleAIHandover();
            break;
          case "a":
            if (e.shiftKey) {
              e.preventDefault();
              toggleAIHandover();
            }
            break;
        }
      }

      if (e.key === "Escape") {
        setShowEmojiPicker(false);
        setShowTemplates(false);
        setShowShortcuts(false);
        setShowAISuggestions(false);
      }

      if (e.key === "?" && !(e.target as HTMLElement)?.closest("textarea, input")) {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    newMessage,
    showShortcuts,
    showEmojiPicker,
    showTemplates,
    generateAISuggestions,
    toggleAIHandover,
    handleSendMessage,
  ]);

  return (
    <div className={`flex h-screen overflow-hidden bg-[var(--ds-color-background-muted)] ${className}`} data-testid="inbox-dashboard">
      {/* Add wrapper with padding */}
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <Header
          conversations={conversations as any}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          setShowShortcuts={setShowShortcuts}
          searchInputRef={searchInputRef}
          performanceMetrics={performanceMetrics}
          connectionStatus={connectionStatus as "error" | "connecting" | "connected" | "disconnected"}
        />

        {/* Main content with proper layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation list */}
          <ConversationList
            conversations={conversations as any}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            isLoading={loadingConversations}
          />

          {/* Chat area */}
          <div className="bg-[var(--ds-color-background)] relative flex flex-1" style={{ boxShadow: 'var(--shadow-card-hover)' }}>
            <div className="bg-[var(--ds-color-background)] flex flex-1 flex-col">
              {selectedConversation ? (
                <>
                  <ChatHeader
                    conversation={selectedConversation}
                    isAIActive={isAIActive}
                    toggleAIHandover={toggleAIHandover}
                    showCustomerDetails={showCustomerDetails}
                    setShowCustomerDetails={setShowCustomerDetails}
                    typingUsers={[]}
                    onlineUsers={onlineUsers}
                    onAssignConversation={handleAssignConversation}
                    onConvertToTicket={handleConvertToTicket}
                  />
                  <MessageList
                    messages={messages || []}
                    selectedConversation={selectedConversation}
                    isLoading={loadingMessages}
                    typingUsers={[]}
                    onlineUsers={onlineUsers}
                  />
                  <Composer
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    isSending={isSending}
                    sendMessage={handleSendMessage}
                    isAIActive={isAIActive}
                    toggleAIHandover={toggleAIHandover}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    showTemplates={showTemplates}
                    setShowTemplates={setShowTemplates}
                    showAISuggestions={showAISuggestions}
                    setShowAISuggestions={setShowAISuggestions}
                    aiSuggestions={aiSuggestions}
                    generateAISuggestions={generateAISuggestions}
                    useSuggestion={useSuggestion}
                    textareaRef={textareaRef}
                    fileInputRef={fileInputRef}
                    handleFileInput={onFileInput}
                    handleFileDrop={onFileDrop}
                    isDragOver={isDragOver}
                    setIsDragOver={setIsDragOver}
                    typingUsers={[]}
                    onlineUsers={onlineUsers}
                    handleTyping={handleTyping}
                    stopTyping={handleStopTyping}
                    selectedConversation={selectedConversation}
                  />
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center bg-[var(--ds-color-background-subtle)]">
                  <div className="bg-[var(--ds-color-background)] rounded-ds-lg p-ds-6 text-center" style={{ boxShadow: 'var(--shadow-card-hover)' }}>
                    <div className="mx-auto mb-6 h-16 w-16 text-4xl text-[var(--ds-color-primary-400)]">💬</div>
                    <h3 className="section-header text-[var(--ds-color-text)]">Select a conversation</h3>
                    <p className="text-foreground max-w-sm">
                      Choose a conversation from the list to start messaging with your customers.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Reply Panel - AI-powered suggestions (DASHBOARD-SIDE ONLY) */}
            {showSmartReplies && selectedConversation && messages?.length > 0 && (
              <div className="flex w-80 flex-col border-l border-[var(--ds-color-border)] bg-white" style={{ boxShadow: 'var(--shadow-card-deep)' }}>
                <div className="border-b border-[var(--ds-color-border)] bg-[var(--ds-color-primary-50)]" style={{ padding: 'var(--ds-spacing-3)' }}>
                  <h3 className="flex items-center component-header text-[var(--ds-color-text)]">
                    <Robot className="mr-2 h-5 w-5 text-[var(--ds-color-primary-600)]" />
                    Smart Replies
                  </h3>
                  <p className="text-foreground mt-1 text-sm">AI-powered suggestions coming soon</p>
                </div>
              </div>
            )}

            {/* Customer sidebar */}
            {showCustomerDetails && selectedConversation && (
              <CustomerSidebar conversation={selectedConversation} onClose={() => setShowCustomerDetails(false)} />
            )}
          </div>
        </div>

        {/* Modals */}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

        {/* NEW: Convert to Ticket Dialog */}
        {showConvertDialog && selectedConversation && (
          <ConvertToTicketDialog
            open={showConvertDialog}
            onOpenChange={setShowConvertDialog}
            conversation={{
              id: selectedConversation.id,
              subject: selectedConversation.last_message_preview || "Conversation",
              customer: {
                name: selectedConversation.customer_name,
                email: selectedConversation.customer_email,
              },
              messages: [], // TODO: Add actual messages when available
              priority: selectedConversation.priority,
              category: "",
            }}
            onConvert={async (ticketData) => {
              console.log("Converting conversation to ticket:", ticketData);
              setShowConvertDialog(false);
              // TODO: Implement actual conversion logic
            }}
          />
        )}

        {/* NEW: Assignment Panel */}
        {showAssignmentPanel && selectedConversation && (
          <AssignmentPanel
            conversationId={selectedConversation.id}
            currentAgentId={undefined}
            organizationId={user?.organizationId || ""}
            onAssignmentChange={(agentId) => {
              console.log("Assigning conversation to agent:", agentId);
              setShowAssignmentPanel(false);
              // TODO: Implement actual assignment logic
            }}
          />
        )}
      </div>
    </div>
  );
};

export default InboxDashboard;
