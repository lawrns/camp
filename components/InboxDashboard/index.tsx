// Main InboxDashboard component - orchestrates all sub-components

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useConversationStats } from "@/hooks/useConversationStats";
import { useRealtime } from "@/hooks/useRealtime";
import { supabase } from "@/lib/supabase";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import { broadcastToChannel } from "@/lib/realtime/standardized-realtime";
import { realtimeMonitor, RealtimeLogger } from "@/lib/realtime/enhanced-monitoring";
import type { RealtimeMessagePayload } from "@/lib/realtime/constants";
import { Bot, X } from "lucide-react";
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
import { SidebarNav } from "./sub-components/SidebarNav";
import { ChatPane } from "./sub-components/ChatPane";
import { DetailsSheet } from "./sub-components/DetailsSheet";
import { BottomNav } from "./sub-components/BottomNav";
// Import types
import type { AISuggestion, Conversation, FileAttachment, Message } from "./types";
import { debounce, mapConversation } from "./utils/channelUtils";
import { handleFileDrop, handleFileInput } from "./utils/fileUtils";
// NEW: Import dialog components
import { AssignmentPanel } from "@/components/conversations/AssignmentPanel";
import { ConvertToTicketDialog } from "@/components/conversations/ConvertToTicketDialog";
import { useMessages } from "./hooks/useMessages";
import { useConversationFilters } from "./hooks/useConversationFilters";
import { useRealtimeSubscriptions } from "./hooks/useRealtimeSubscriptions";
import { useInboxState } from "./hooks/useInboxState";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

// Import AI components (DASHBOARD-SIDE ONLY)

interface InboxDashboardProps {
  className?: string;
  initialSearchQuery?: string;
  showAdvancedFilters?: boolean;
  setShowAdvancedFilters?: (show: boolean) => void;
  showShortcuts?: boolean;
  setShowShortcuts?: (show: boolean) => void;
}

/**
 * Main InboxDashboard component - now much smaller and focused on orchestration
 * Performance optimized with memoization and optimized state management
 */
export const InboxDashboard: React.FC<InboxDashboardProps> = memo(({
  className = "",
  initialSearchQuery = "",
  showAdvancedFilters: propShowAdvancedFilters,
  setShowAdvancedFilters: propSetShowAdvancedFilters,
  showShortcuts: propShowShortcuts,
  setShowShortcuts: propSetShowShortcuts
}) => {
  // User context - using real auth hook with validation
  const { user, isLoading: authLoading } = useAuth();
  const organizationId = user?.organizationId;
  const userId = user?.id;



  // Use extracted hooks for better separation of concerns
  const inboxState = useInboxState();
  const {
    selectedConversation,
    setSelectedConversation,
    showCustomerDetails,
    setShowCustomerDetails,
    showShortcuts,
    setShowShortcuts,
    showConvertDialog,
    setShowConvertDialog,
    showAssignmentPanel,
    setShowAssignmentPanel,
    showConversationManagement,
    setShowConversationManagement,
    showAdvancedFilters,
    setShowAdvancedFilters,
    newMessage,
    setNewMessage,
    attachments,
    setAttachments,
    isSending,
    setIsSending,
    isAIActive,
    setIsAIActive,
    showEmojiPicker,
    setShowEmojiPicker,
    showTemplates,
    setShowTemplates,
    showAISuggestions,
    setShowAISuggestions,
    aiSuggestions,
    setAISuggestions,
    selectedConversations,
    setSelectedConversations,
    isDragOver,
    setIsDragOver,
    handleSelectConversation,
    toggleAIHandover,
    handleAssignConversation,
    handleConvertToTicket,
    clearBulkSelection,
  } = inboxState;

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use extracted realtime subscriptions hook
  const realtimeSubscriptions = useRealtimeSubscriptions({
    organizationId,
    conversationId: selectedConversation?.id,
    userId,
  });
  const { isConnected, connectionStatus, error: realtimeError, onlineUsers } = realtimeSubscriptions;

  // Fetch conversations using the useConversations hook
  const { conversations } = useConversations();

  // Use extracted conversation filters hook
  const conversationFilters = useConversationFilters(conversations);
  const {
    searchQuery,
    statusFilter,
    priorityFilter,
    activeFilters,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setActiveFilters,
    clearAllFilters,
    applyFilters,
    filteredConversations,
  } = conversationFilters;

  // Fetch conversation statistics
  const { data: stats } = useConversationStats();

  // Use real messages hook instead of mock data
  const { messages, isLoading: messagesLoading, reload: reloadMessages, setMessages } = useMessages(
    selectedConversation?.id,
    organizationId
  );

  // Sync initial search query from props
  React.useEffect(() => {
    if (initialSearchQuery && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery, searchQuery, setSearchQuery]);

  // Override state setters with props when provided
  const finalSetShowAdvancedFilters = propSetShowAdvancedFilters || setShowAdvancedFilters;
  const finalSetShowShortcuts = propSetShowShortcuts || setShowShortcuts;

  // Debug logging in development only
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[InboxDashboard] State update:", {
        conversationsCount: conversations?.length || 0,
        selectedConversation: selectedConversation?.id,
        messagesCount: messages?.length || 0,
        messagesLoading,
        searchQuery,
        showAdvancedFilters,
        showShortcuts,
      });
    }
  }, [conversations, selectedConversation, messages, messagesLoading, searchQuery, showAdvancedFilters, showShortcuts]);

  // Performance metrics using real stats
  const performanceMetrics = useMemo(() => ({
    responseTime: stats?.averageResponseTime || 0,
    memoryUsage: 0, // Memory tracking not critical for MVP
    cpuUsage: 0, // CPU usage tracking requires Web Workers - not critical for MVP
  }), [stats?.averageResponseTime]);

  // PHASE 2: Improved error handling with proper cleanup
  const sendMessageHP = useCallback(
    async (convId: string, content: string, senderType: "customer" | "agent" = "agent"): Promise<Message | null> => {
      if (!organizationId || !content.trim()) return null;

      // 1. Create optimistic message for immediate UI update
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: convId,
        content: content.trim(),
        senderType: senderType as "agent" | "customer",
        senderName: senderType === "agent" ? "Support Agent" : "Customer",
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: "sent", // Use valid read_status value
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        // Create abort controller for request cancellation
        const controller = new AbortController();

        console.log('[InboxDashboard] 📤 Sending message via API:', {
          conversationId: convId,
          contentLength: content.trim().length,
          senderType: senderType
        });

        // Use proper API endpoint for bidirectional communication
        const response = await fetch(`/api/dashboard/conversations/${convId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            content: content.trim(),
            senderType: senderType === "agent" ? "agent" : senderType,
            senderName: senderType === "agent" ? "Support Agent" : "Customer"
          }),
        });

        console.log('[InboxDashboard] 📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          // Failure - cleanup optimistic update
          setMessages(prev => prev.filter(msg => msg.id !== tempId));

          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[InboxDashboard] ❌ API Error:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText
          });

          throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        const data = result.message;

        if (!data) {
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          throw new Error('No message data returned from API');
        }

        // Replace optimistic message with real one
        const realMessage: Message = {
          id: data.id,
          conversation_id: data.conversation_id,
          content: data.content,
          senderType: data.senderType as "agent" | "customer" | "visitor" | "ai",
          senderName: data.senderName || (senderType === "agent" ? "Support Agent" : "Customer"),
          created_at: data.created_at,
          attachments: [],
          read_status: "sent",
        };

        // 4. Success - replace optimistic with real message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? realMessage : msg
          )
        );
        // Real-time broadcast - Enhanced error handling
        let broadcastSuccess = false;

        try {
          const startTime = performance.now();

          const messagePayload: RealtimeMessagePayload = {
            id: data.id,
            conversation_id: convId,
            organization_id: organizationId,
            content: data.content,
            senderType: senderType,
            senderName: data.senderName || (senderType === "agent" ? "Support Agent" : "Customer"),
            created_at: data.created_at,
            metadata: data.metadata as Record<string, unknown> || {},
          };

          broadcastSuccess = await broadcastToChannel(
            UNIFIED_CHANNELS.conversation(organizationId, convId),
            UNIFIED_EVENTS.MESSAGE_CREATED,
            {
              message: { ...data, attachments: [], read_status: "sent" as const },
              conversation_id: convId,
              organization_id: organizationId,
              senderType: senderType,
            }
          );
          const latency = performance.now() - startTime;
          const channelName = UNIFIED_CHANNELS.conversation(organizationId, convId);

          if (broadcastSuccess) {
            RealtimeLogger.broadcast(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, true);
          } else {
            RealtimeLogger.broadcast(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, false, "Broadcast failed");
            // Don't throw - message was saved successfully
          }
        } catch (broadcastError) {
          RealtimeLogger.error("message broadcast", broadcastError);
          // Don't throw - message was saved successfully
        }

        // Update message status based on broadcast result
        if (!broadcastSuccess) {
          // Update the message in UI to show sync status
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.id ? { ...msg, read_status: "sent" as const } : msg
            )
          );
        }

        return data;
      } catch (error) {
        // Failure - cleanup optimistic update (if not already cleaned up)
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw error;
      }
    },
    [organizationId, setMessages]
  );

  // Derived loading states - memoized to prevent unnecessary re-renders
  const loadingConversations = useMemo(() => !isConnected, [isConnected]);
  const loadingMessages = useMemo(() => !isConnected, [isConnected]);

  // Typing handlers for standardized system
  const handleTyping = useCallback(() => {
    if (selectedConversation?.id && newMessage.trim()) {
      realtimeSubscriptions.broadcastTyping(true);
    }
  }, [selectedConversation?.id, realtimeSubscriptions, newMessage]);

  const handleStopTyping = useCallback(() => {
    if (selectedConversation?.id) {
      realtimeSubscriptions.disconnect();
    }
  }, [selectedConversation?.id, realtimeSubscriptions]);

  // Debounced search
  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => setSearchQuery(query), 300),
    [setSearchQuery]
  );

  // Bulk action handlers - memoized to prevent unnecessary re-renders
  const handleBulkUpdate = useCallback(async (conversationIds: string[], updates: Record<string, unknown>) => {
    try {
      const controller = new AbortController();
      const response = await fetch('/api/conversations/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ conversationIds, updates })
      });

      if (response.ok) {
        // Bulk update successful - could add toast notification here
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Handle non-abort errors
      }
    }
  }, []);

  const handleBulkDelete = useCallback(async (conversationIds: string[]) => {
    try {
      const controller = new AbortController();
      const response = await fetch('/api/conversations/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ conversationIds })
      });

      if (response.ok) {
        // Bulk delete successful - could add toast notification here
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Handle non-abort errors
      }
    }
  }, []);

  const handleBulkExport = useCallback(async (conversationIds: string[]) => {
    try {
      const controller = new AbortController();
      const response = await fetch('/api/conversations/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
      if (error instanceof Error && error.name !== 'AbortError') {
        // Handle non-abort errors
      }
    }
  }, []);

  const handleApplyFilters = useCallback((filters: unknown) => {
    applyFilters(filters);
    // Filters applied - could add analytics tracking here
  }, [applyFilters]);

  const handleClearFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  // Bulk selection handlers
  const handleToggleConversationSelection = useCallback((conversationId: string) => {
    setSelectedConversations(prev =>
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  }, [setSelectedConversations]);

  const handleSelectAllConversations = useCallback(() => {
    const allIds = filteredConversations.map(conv => conv.id);
    setSelectedConversations(allIds);
  }, [filteredConversations, setSelectedConversations]);

  // Memoized callback for clearing bulk selection
  const handleClearBulkSelection = useCallback(() => {
    clearBulkSelection();
  }, [clearBulkSelection]);

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
  // PHASE 3: Enhanced user feedback and error handling
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || isSending || !organizationId) {
      return;
    }

    setIsSending(true);
    const messageContent = newMessage.trim();

    try {
      // Use improved real-time sending with proper error handling
      await sendMessageHP(selectedConversation.id, messageContent, "agent");

      // Clear form only on success
      setNewMessage("");
      setAttachments([]);

      // CRITICAL FIX: Delay handleStopTyping to prevent race condition
      // This prevents channel unsubscription while sendMessageHP is still broadcasting
      setTimeout(() => {
        handleStopTyping();
      }, 150); // 150ms delay to ensure message broadcast completes

      // TODO: Add success toast notification
    } catch (error) {
      // Better user feedback
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // TODO: Replace alert with proper toast notification system
      alert(`Failed to send message: ${errorMessage}\n\nPlease try again.`);

      // Still stop typing on error
      handleStopTyping();

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

  // Early return conditions - MOVED AFTER ALL HOOKS to comply with Rules of Hooks
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

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-50 ${className}`} data-testid="inbox-dashboard">
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
          setShowShortcuts={finalSetShowShortcuts}
          setShowAdvancedFilters={finalSetShowAdvancedFilters}
          searchInputRef={searchInputRef}
          performanceMetrics={performanceMetrics}
          connectionStatus={connectionStatus as "error" | "connecting" | "connected" | "disconnected"}
        />

        {/* Bulk Actions */}
        <BulkActions
          selectedConversations={selectedConversations}
          conversations={conversations as unknown[]}
          onClearSelection={handleClearBulkSelection}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
        />

        {/* Main content with proper layout */}
        <div className="flex flex-1 overflow-hidden mobile-stack">
          {/* Sidebar Navigation */}
          <SidebarNav
            conversations={filteredConversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            isLoading={loadingConversations}
            selectedConversations={selectedConversations}
            onToggleConversationSelection={handleToggleConversationSelection}
            onSelectAllConversations={handleSelectAllConversations}
            onClearSelection={handleClearBulkSelection}
          />

          {/* Chat Pane */}
          <ChatPane
            selectedConversation={selectedConversation}
            messages={messages || []}
            isLoadingMessages={loadingMessages}
            isAIActive={isAIActive}
            toggleAIHandover={toggleAIHandover}
            showCustomerDetails={showCustomerDetails}
            setShowCustomerDetails={setShowCustomerDetails}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            attachments={attachments}
            setAttachments={setAttachments}
            isSending={isSending}
            sendMessage={handleSendMessage}
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
            onAssignConversation={handleAssignConversation}
            onConvertToTicket={handleConvertToTicket}
            onToggleConversationManagement={() => setShowConversationManagement(!showConversationManagement)}
            organizationId={organizationId}
            userId={userId}
          />

          {/* Details Sheet */}
          <DetailsSheet
            selectedConversation={selectedConversation}
            showCustomerDetails={showCustomerDetails}
            setShowCustomerDetails={setShowCustomerDetails}
            showConversationManagement={showConversationManagement}
            setShowConversationManagement={setShowConversationManagement}
            onConversationUpdate={(updates) => {
              if (selectedConversation) {
                const updatedConversation = { ...selectedConversation, ...updates };
                console.log('Conversation updated:', updatedConversation);
              }
            }}
          />
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
              setShowConvertDialog(false);
              console.log('Converting conversation to ticket:', ticketData);
              // Conversion logic will be implemented when ticket system is ready
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
