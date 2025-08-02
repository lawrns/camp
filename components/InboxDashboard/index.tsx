// Main InboxDashboard component - orchestrates all sub-components

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useConversationStats } from "@/hooks/useConversationStats";
import { useRealtime } from "@/hooks/useRealtime";
import { supabase } from "@/lib/supabase";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import { realtimeMonitor, RealtimeLogger } from "@/lib/realtime/enhanced-monitoring";
import type { RealtimeMessagePayload } from "@/lib/realtime/constants";
import { Robot, X } from "@phosphor-icons/react";
import * as React from "react";
import { useCallback, useRef, useState, memo, useMemo } from "react";
// Import utilities
import { fallbackAISuggestions } from "./constants/messageTemplates";
// Import all the extracted components
import ChatHeader from "./sub-components/ChatHeader";
import Composer from "./sub-components/Composer";
import ConversationList from "./sub-components/ConversationList";
import { ConversationManagement } from "./sub-components/ConversationManagement";
import { BulkActions } from "./sub-components/BulkActions";
import { AdvancedFilters } from "./sub-components/AdvancedFilters";
import CustomerSidebar from "./sub-components/CustomerSidebar";
import Header from "./sub-components/Header";
import MessageList from "./sub-components/MessageList";
import ShortcutsModal from "./sub-components/ShortcutsModal";
// Import types
import type { AISuggestion, Conversation, FileAttachment, Message } from "./types";
import { debounce, mapConversation } from "./utils/channelUtils";
import { handleFileDrop, handleFileInput } from "./utils/fileUtils";
// NEW: Import dialog components
import { AssignmentPanel } from "@/components/conversations/AssignmentPanel";
import { ConvertToTicketDialog } from "@/components/conversations/ConvertToTicketDialog";
import { useMessages } from "./hooks/useMessages";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

// Import AI components (DASHBOARD-SIDE ONLY)

interface InboxDashboardProps {
  className?: string;
}

/**
 * Main InboxDashboard component - now much smaller and focused on orchestration
 * Performance optimized with memoization and optimized state management
 */
export const InboxDashboard: React.FC<InboxDashboardProps> = memo(({ className = "" }) => {
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
  const [showConversationManagement, setShowConversationManagement] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

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
  const performanceMetrics = useMemo(() => ({
    responseTime: stats?.averageResponseTime || 0,
    memoryUsage: 0, // TODO: Implement memory usage tracking
    cpuUsage: 0, // TODO: Implement CPU usage tracking
  }), [stats?.averageResponseTime]);

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
    async (convId: string, content: string, senderType: "customer" | "agent" = "agent"): Promise<any> => {
      if (!organizationId || !content.trim()) return null;

      // Create optimistic message for immediate UI update
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: convId,
        content: content.trim(),
        sender_type: senderType as "agent" | "customer",
        sender_name: senderType === "agent" ? "Support Agent" : "Customer",
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: "sent", // Use valid read_status value
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);

      try {

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
        const realMessage: Message = {
          id: data.id,
          conversation_id: data.conversation_id,
          content: data.content,
          sender_type: data.sender_type as "agent" | "customer" | "visitor" | "ai",
          sender_name: data.sender_name || (senderType === "agent" ? "Support Agent" : "Customer"),
          created_at: data.created_at,
          attachments: [],
          read_status: "sent",
        };

        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? realMessage : msg
          )
        );

        // Broadcast real-time event using persistent channels for bidirectional communication
        try {
          const startTime = performance.now();

          // Use existing persistent channel from real-time system instead of creating temporary ones
          const messagePayload: RealtimeMessagePayload = {
            id: data.id,
            conversation_id: convId,
            organization_id: organizationId,
            content: data.content,
            sender_type: senderType,
            sender_name: data.sender_name || (senderType === "agent" ? "Support Agent" : "Customer"),
            created_at: data.created_at,
            metadata: data.metadata as Record<string, any> || {},
          };

          const success = await realtimeActions.sendMessage(messagePayload);

          const latency = performance.now() - startTime;
          const channelName = UNIFIED_CHANNELS.conversation(organizationId, convId);

          if (success) {
            RealtimeLogger.broadcast(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, true);
            console.log(`📡 [Realtime] ✅ Message broadcast successful on ${channelName} (${latency.toFixed(1)}ms)`);
          } else {
            RealtimeLogger.broadcast(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, false, "Broadcast failed");
            console.warn(`📡 [Realtime] ❌ Message broadcast failed on ${channelName}`);
            console.warn("⚠️  Real-time broadcast failed, but message was saved to database successfully");
            // Continue execution - message was saved successfully even if broadcast failed
          }
        } catch (broadcastError) {
          RealtimeLogger.error("message broadcast", broadcastError);
          console.warn("Failed to broadcast message:", broadcastError);
          console.warn("⚠️  Real-time broadcast error, but message was saved to database successfully");
          // Don't throw - message was saved successfully even if broadcast failed
        }

        return data;
      } catch (error) {
        console.error("Failed to send message:", error);

        // Clean up optimistic message on database error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));

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

  // Bulk action handlers
  const handleBulkUpdate = async (conversationIds: string[], updates: Partial<any>) => {
    try {
      const response = await fetch('/api/conversations/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationIds, updates })
      });

      if (response.ok) {
        console.log('Bulk update successful');
      }
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const handleBulkDelete = async (conversationIds: string[]) => {
    try {
      const response = await fetch('/api/conversations/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationIds })
      });

      if (response.ok) {
        console.log('Bulk delete successful');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkExport = async (conversationIds: string[]) => {
    try {
      const response = await fetch('/api/conversations/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationIds })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversations-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
    }
  };

  const handleApplyFilters = (filters: any) => {
    setActiveFilters(filters);
    console.log('Applying filters:', filters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

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
    const messageContent = newMessage.trim();

    try {
      // Use high-performance real-time sending for <30ms delivery
      await sendMessageHP(selectedConversation.id, messageContent, "agent");

      // Clear form only on success
      setNewMessage("");
      setAttachments([]);
      handleStopTyping();

      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Failed to send message:", error);

      // Show user-friendly error message
      // TODO: Add toast notification or error state
      alert("Failed to send message. Please try again.");

      // Don't clear the message content so user can retry
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedConversation, isSending, organizationId, sendMessageHP, setNewMessage, setAttachments, handleStopTyping]);

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
      <div className="flex h-full w-full flex-col mobile-stack">
        {/* Header */}
        <Header
          conversations={conversations}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          setShowShortcuts={setShowShortcuts}
          setShowAdvancedFilters={setShowAdvancedFilters}
          searchInputRef={searchInputRef}
          performanceMetrics={performanceMetrics}
          connectionStatus={connectionStatus as "error" | "connecting" | "connected" | "disconnected"}
        />

        {/* Bulk Actions */}
        <BulkActions
          selectedConversations={selectedConversations}
          conversations={conversations as any[]}
          onClearSelection={() => setSelectedConversations([])}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
        />

        {/* Main content with proper layout */}
        <div className="flex flex-1 overflow-hidden mobile-stack">
          {/* Conversation list */}
          <ConversationList
            conversations={conversations}
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
                    onToggleConversationManagement={() => setShowConversationManagement(!showConversationManagement)}
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
                  <div className="text-center">
                    <div className="mb-4">
                      <svg className="mx-auto h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-neutral-300">Start the conversation</h3>
                    <p className="text-sm text-neutral-300">
                      Choose a conversation from the list to start messaging with your customers.
                    </p>
                  </div>
                </div>
              )}
            </div>



            {/* Conversation Management Panel */}
            {selectedConversation && showConversationManagement && (
              <div className="w-80 border-l border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] overflow-y-auto">
                <div className="p-4 border-b border-[var(--ds-color-border)]">
                  <div className="flex items-center justify-between">
                    <h3 className="typography-section-title">Conversation Management</h3>
                    <button
                      onClick={() => setShowConversationManagement(false)}
                      className="btn-ghost p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <ConversationManagement
                    conversation={selectedConversation}
                    onUpdate={(updates) => {
                      // Update the conversation in the local state
                      if (selectedConversation) {
                        const updatedConversation = { ...selectedConversation, ...updates };
                        console.log('Conversation updated:', updatedConversation);
                      }
                    }}
                  />
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
              subject: selectedConversation.lastMessagePreview || "Conversation",
              customer: {
                name: selectedConversation.customerName,
                email: selectedConversation.customerEmail,
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

        {/* Advanced Filters */}
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          currentFilters={activeFilters}
        />

      </div>
    </div>
  );
});

InboxDashboard.displayName = "InboxDashboard";

export default InboxDashboard;
