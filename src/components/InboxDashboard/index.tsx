// Main InboxDashboard component - orchestrates all sub-components

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useConversationStats } from "@/hooks/useConversationStats";
import { useRealtime } from "@/hooks/useRealtime";
import { Bot } from "lucide-react";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
// Import utilities
import { fallbackAISuggestions } from "./constants/messageTemplates";
// Import all the extracted components
import ChatHeader from "./sub-components/ChatHeader";
import Composer from "./sub-components/Composer";
import { ConversationList } from "./sub-components/ConversationList";
import CustomerSidebar from "./sub-components/CustomerSidebar";
import Header from "./sub-components/Header";
import MessageList from "./sub-components/MessageList";
import ShortcutsModal from "./sub-components/ShortcutsModal";
// Import types
import type { AISuggestion, Conversation, FileAttachment } from "./types";
import { debounce, mapConversation } from "./utils/channelUtils";
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

  // UI state - ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL LOGIC
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
  const { conversations: rawConversations, isLoading: conversationsLoading, error: conversationsError } = useConversations();

  // Process conversations with our name generation and other fixes
  const conversations = React.useMemo(() => {
    return (rawConversations || []).map(mapConversation);
  }, [rawConversations]);

  // Fetch conversation statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useConversationStats();

  // Use real messages hook instead of mock data
  const { messages, isLoading: messagesLoading, reload: reloadMessages, setMessages } = useMessages(
    selectedConversation?.id,
    organizationId
  );

  // Early return if auth is loading or missing required data - MOVED AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check for valid organizationId - reject empty strings and undefined
  if (!organizationId || organizationId.trim() === "") {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="text-center">
          <p className="mb-4 text-red-600">No organization context</p>
          <p className="text-foreground">Unable to determine organization ID. Please contact your administrator.</p>
          <p className="mt-2 text-sm text-gray-500">
            Debug: organizationId = "{organizationId || 'undefined'}"
          </p>
        </div>
      </div>
    );
  }


  const onlineUsers: unknown[] = []; // TODO: Implement presence  const loadConversations = () => { }; // TODO: Implement
  const loadMessages = () => { }; // TODO: Implement
  const reconnect = () => { }; // TODO: Implement

  // Performance metrics using real stats
  const performanceMetrics = {
    averageLatency: stats?.averageResponseTime || 0,
    messageCount: stats?.messagesToday || 0,
    reconnectionCount: 0
  };

  // Send message function using proper API endpoint for bidirectional communication
  // Send message function using proper API endpoint for bidirectional communication
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
          senderType: senderType,
          senderName: senderType === "agent" ? "Support Agent" : "Customer",
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

        // Use proper API endpoint for bidirectional communication
        const response = await fetch(`/api/dashboard/conversations/${convId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            content: content.trim(),
            senderType: senderType === "agent" ? "agent" : senderType,  // FIXED: Use 'agent' not 'operator'
            senderName: senderType === "agent" ? "Support Agent" : "Customer"
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const data = result.message;

        if (!data) {
          // Remove optimistic message on error
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          throw new Error('No message data returned from API');
        }

        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? { ...data, attachments: [], read_status: "sent" as const }
              : msg
          )
        );

        console.log('[InboxDashboard] ✅ Message sent successfully via API endpoint');
        console.log('[InboxDashboard] 📡 Server-side broadcast events will be handled by API layer');

        return data;
      } catch (error) {
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
    console.log('🚨🚨🚨 [HANDLE SEND MESSAGE] Function called!', {
      hasMessage: !!newMessage.trim(),
      hasConversation: !!selectedConversation,
      isSending,
      hasOrgId: !!organizationId
    });

    if (!newMessage.trim() || !selectedConversation || isSending || !organizationId) {
      console.log('🚨 [HANDLE SEND MESSAGE] ❌ Early return due to missing requirements');
      return;
    }

    setIsSending(true);

    try {
      // Use high-performance real-time sending for <30ms delivery
      await sendMessageHP(selectedConversation.id, newMessage.trim(), "agent");

      // Clear form immediately for better UX
      setNewMessage("");
      setAttachments([]);

      // CRITICAL FIX: Delay handleStopTyping to prevent race condition
      // This prevents channel unsubscription while sendMessageHP is still broadcasting
      setTimeout(() => {
        handleStopTyping();
      }, 150); // 150ms delay to ensure message broadcast completes

    } catch (error) {
      console.error('[HandleSendMessage] ❌ Error sending message:', error);
      // Still stop typing on error
      handleStopTyping();
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedConversation, isSending, organizationId, attachments, handleStopTyping, sendMessageHP]);

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
    <div className={`flex h-screen overflow-hidden bg-[var(--color-background-muted)] ${className}`} data-testid="inbox-dashboard">
      {/* Add wrapper with padding */}
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <Header
          conversations={conversations as unknown}
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
            conversations={conversations as unknown}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            isLoading={loadingConversations}
          />

          {/* Chat area */}
          <div className="bg-background relative flex flex-1" style={{ boxShadow: 'var(--shadow-card-hover)' }}>
            <div className="bg-background flex flex-1 flex-col">
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

            {/* Smart Reply Panel - AI-powered suggestions (DASHBOARD-SIDE ONLY) */}
            {showSmartReplies && selectedConversation && messages?.length > 0 && (
              <div className="flex w-80 flex-col border-l border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-200 bg-blue-50 p-4">
                  <h3 className="flex items-center text-lg font-semibold text-gray-900">
                    <Bot className="mr-2 h-5 w-5 text-blue-600" />
                    Smart Replies
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">AI-powered suggestions coming soon</p>
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
