// Main InboxDashboard component - orchestrates all sub-components

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import { broadcastToChannel } from "@/lib/realtime/standardized-realtime";
import { RealtimeLogger } from "@/lib/realtime/enhanced-monitoring";
import { Bot, X, Menu, Star, Clock, MoreHorizontal, Send, Paperclip, Smile, Image as ImageIcon, Search, Filter, ChevronDown, Inbox, MessageSquare, Users, AtSign, UserMinus, Settings, Zap, User, Info } from "lucide-react";
import * as React from "react";
import { useCallback, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Import utilities
import { fallbackAISuggestions } from "./constants/messageTemplates";
// Import essential components for modals and dialogs
import ShortcutsModal from "./sub-components/ShortcutsModal";
import { AdvancedFilters } from "./sub-components/AdvancedFilters";
// Import types
import type { AISuggestion, Message } from "./types";
// import { debounce, mapConversation } from "./utils/channelUtils";
// import { handleFileDrop, handleFileInput } from "./utils/fileUtils";
// NEW: Import dialog components
import { ConvertToTicketDialog } from "@/components/conversations/ConvertToTicketDialog";
import { useMessages } from "./hooks/useMessages";
import { useConversationFilters } from "./hooks/useConversationFilters";
import { useRealtimeSubscriptions } from "./hooks/useRealtimeSubscriptions";
import { useInboxState } from "./hooks/useInboxState";
import { getAvatarPath } from "@/lib/utils/avatar";

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
  showAdvancedFilters: _propShowAdvancedFilters,
  setShowAdvancedFilters: _propSetShowAdvancedFilters,
  showShortcuts: _propShowShortcuts,
  setShowShortcuts: _propSetShowShortcuts
}) => {
  // User context - using real auth hook with validation
  const { user, isLoading: authLoading } = useAuth();
  const organizationId = user?.organizationId;
  const userId = user?.id;



  // Use extracted hooks for better separation of concerns
  const inboxState = useInboxState();
  const {
    selectedConversation,
    showCustomerDetails,
    setShowCustomerDetails,
    showShortcuts,
    setShowShortcuts,
    showConvertDialog,
    setShowConvertDialog,
    setShowAssignmentPanel,
    setShowConversationManagement,
    showAdvancedFilters,
    setShowAdvancedFilters,
    newMessage,
    setNewMessage,
    setAttachments,
    isSending,
    setIsSending,
    isAIActive,
    showEmojiPicker,
    setShowEmojiPicker,
    showTemplates,
    setShowTemplates,
    setShowAISuggestions,
    aiSuggestions,
    setAISuggestions,
    handleSelectConversation,
    toggleAIHandover,
  } = inboxState;

  // NEW: Enhanced layout state for modern UI
  const [activeSection, setActiveSection] = useState('inbox');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAITerminal, setShowAITerminal] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use extracted realtime subscriptions hook
  const realtimeConfig = {
    ...(organizationId ? { organizationId } : {}),
    ...(selectedConversation?.id ? { conversationId: selectedConversation.id } : {}),
    ...(userId ? { userId } : {}),
  };
  useRealtimeSubscriptions(realtimeConfig);

  // Fetch conversations using the useConversations hook
  const { conversations } = useConversations();

  // Use extracted conversation filters hook
  const conversationFilters = useConversationFilters(conversations);
  const {
    searchQuery,
    activeFilters,
    setSearchQuery,
    clearAllFilters,
    applyFilters,
    filteredConversations,
  } = conversationFilters;

  // Use real messages hook instead of mock data
  const { messages, isLoading: messagesLoading, reload: _reloadMessages, setMessages } = useMessages(
    selectedConversation?.id,
    organizationId
  );

  // Sync initial search query from props
  React.useEffect(() => {
    if (initialSearchQuery && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery, searchQuery, setSearchQuery]);

  // Override state setters with props when provided (unused in this view)

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

  // Performance metrics (placeholder)
  // const performanceMetrics = useMemo(() => ({ responseTime: 0, memoryUsage: 0, cpuUsage: 0 }), []);

  // PHASE 2: Improved error handling with proper cleanup
  const sendMessageHP = useCallback(
    async (convId: string, content: string, senderType: "customer" | "agent" = "agent"): Promise<Message | null> => {
      if (!organizationId || !content.trim()) return null;

      // 1. Create optimistic message for immediate UI update
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const optimisticMessage = {
        id: tempId,
        conversation_id: convId,
        content: content.trim(),
        senderType: senderType === "agent" ? "agent" : "visitor",
        senderName: senderType === "agent" ? "Support Agent" : "Customer",
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: "sent", // Use valid read_status value
      } as unknown as Message;

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
        const realMessage = {
          id: data.id,
          conversation_id: data.conversation_id,
          content: data.content,
          senderType: (data.senderType === "customer" ? "visitor" : data.senderType) as "agent" | "visitor" | "system" | "ai_assistant" | "tool",
          senderName: data.senderName || (senderType === "agent" ? "Support Agent" : "Customer"),
          created_at: data.created_at,
          attachments: [],
          read_status: "sent",
        } as unknown as Message;

        // 4. Success - replace optimistic with real message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? realMessage : msg
          )
        );
        // Real-time broadcast - Enhanced error handling
        let broadcastSuccess = false;

        try {
          broadcastSuccess = await broadcastToChannel(
            UNIFIED_CHANNELS.conversation(organizationId, convId),
            UNIFIED_EVENTS.MESSAGE_CREATED,
            {
              message: { ...data, attachments: [], read_status: "sent" as const },
              conversation_id: convId,
              organization_id: organizationId,
              sender_type: senderType === "agent" ? "agent" : "visitor",
              sender_name: data.senderName || (senderType === "agent" ? "Support Agent" : "Customer"),
            }
          );
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
  // const loadingConversations = useMemo(() => !isConnected, [isConnected]);
  // const loadingMessages = useMemo(() => !isConnected, [isConnected]);

  const handleStopTyping = useCallback(() => {
    // typing stop logic handled implicitly
  }, []);

  // Debounced search
  // Direct search update (debounce removed for type safety)

  // Bulk actions omitted in this view

  const handleApplyFilters = useCallback((filters: any) => {
    applyFilters(filters as any);
    // Filters applied - could add analytics tracking here
  }, [applyFilters]);

  const handleClearFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  // Bulk selection handlers
  // Bulk selection removed in this iteration (not used)

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

  // Smart reply selection handled elsewhere

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
      }, 150);
    } catch (error) {
      // Better user feedback
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      console.error('Failed to send message', errorMessage);

      // Still stop typing on error
      handleStopTyping();

      // Don't clear the message content so user can retry
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedConversation, isSending, organizationId, sendMessageHP, setNewMessage, setAttachments, handleStopTyping]);

  // File handling
  // File input/drop are handled in dedicated components elsewhere

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

  // NEW: Enhanced layout components with animations
  const EnhancedSidebar = () => {
    // Derived counts for sidebar sections
    const inboxCount = filteredConversations.filter((c) => c.status === 'open').length;
    const unassignedCount = filteredConversations.filter((c) => !c.assigneeId).length;
    const allCount = conversations?.length || 0;

    const menuItems = [
      { id: 'inbox', icon: Inbox, label: 'Inbox', count: inboxCount },
      { id: 'conversations', icon: MessageSquare, label: 'Conversations', count: filteredConversations.length },
      { id: 'mentions', icon: AtSign, label: 'Mentions', count: 0 },
      { id: 'unassigned', icon: UserMinus, label: 'Unassigned', count: unassignedCount },
      { id: 'all', icon: Users, label: 'All', count: allCount },
    ];

    const bottomItems = [
      { id: 'automation', icon: Zap, label: 'Automation' },
      { id: 'preferences', icon: Settings, label: 'Your preferences' },
      { id: 'about', icon: Info, label: 'About' },
    ];

    const sidebarVariants = {
      expanded: { width: 288 },
      collapsed: { width: 64 }
    };

    const contentVariants = {
      expanded: { opacity: 1, x: 0 },
      collapsed: { opacity: 0, x: -20 }
    };

    return (
      <motion.div
        className="bg-card border-r border-border flex flex-col relative"
        variants={sidebarVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Toggle Button */}
            <button type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-accent"
        >
          {sidebarCollapsed ? <Menu className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </button>

        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Inbox className="h-5 w-5 text-primary-foreground" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.h1
                  className="text-xl font-semibold text-foreground"
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.2 }}
                >
                  Inbox
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button type="button"
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center h-auto py-2.5 px-3 rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-muted text-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  } ${sidebarCollapsed ? 'px-2 justify-center' : 'justify-start'}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div
                        className="flex items-center justify-between w-full ml-3"
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        transition={{ duration: 0.2 }}
                      >
                        <span className="font-medium">{item.label}</span>
                        {item.count !== undefined && (
                          <span className="ml-auto bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                            {item.count}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-border">
            <nav className="space-y-2">
              {bottomItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button type="button"
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center h-auto py-2.5 px-3 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                      sidebarCollapsed ? 'px-2 justify-center' : 'justify-start'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          className="font-medium ml-3"
                          variants={contentVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          transition={{ duration: 0.2 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  className="font-medium text-foreground"
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.2 }}
                >
                  {user?.email?.split('@')[0] || 'You'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };

  // NEW: Enhanced Conversation List Component
  const EnhancedConversationList = () => {
    // status variant helper unused

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high':
          return 'border-l-red-500';
        case 'medium':
          return 'border-l-yellow-500';
        case 'low':
          return 'border-l-green-500';
        default:
          return 'border-l-border';
      }
    };

    const listVariants = {
      expanded: { width: 384 },
      collapsed: { width: 0, opacity: 0 }
    };

    if (sidebarCollapsed) {
      return (
        <motion.div
          className="overflow-hidden"
          variants={listVariants}
          animate="collapsed"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      );
    }

    // Apply active section filtering on top of existing filters/search
    const sectionFiltered = React.useMemo(() => {
      switch (activeSection) {
        case 'inbox':
          return filteredConversations.filter((c) => c.status === 'open');
        case 'unassigned':
          return filteredConversations.filter((c) => !c.assigneeId);
        case 'conversations':
          return filteredConversations;
        case 'all':
          return conversations || [];
        default:
          return filteredConversations;
      }
    }, [activeSection, filteredConversations, conversations]);

    return (
      <motion.div
        className="bg-card border-r border-border flex flex-col min-h-0"
        variants={listVariants}
        animate="expanded"
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-border sticky top-0 z-10 bg-card">
          <div className="flex items-center justify-between mb-4">
            <button className="p-0 h-auto font-semibold text-foreground flex items-center hover:text-accent-foreground" type="button">
              All
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            <div className="flex items-center space-x-2">
            <button type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="p-1 hover:bg-accent rounded"
              >
                <Filter className="h-4 w-4" />
              </button>
              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                {filteredConversations.length}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              ref={searchInputRef}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button type="button" className="p-0 h-auto text-sm font-medium flex items-center hover:text-accent-foreground">
              Newest
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {sectionFiltered.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectConversation(conversation)}
              className={`p-4 border-l-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                selectedConversation?.id === conversation.id
                  ? 'bg-accent border-l-primary'
                  : getPriorityColor(conversation.priority || 'low')
              } ${conversation.unreadCount > 0 ? 'bg-accent/30' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-white font-semibold text-sm">
                  <img
                    src={getAvatarPath(conversation.customerEmail || conversation.customerName || conversation.id, 'customer')}
                    alt={conversation.customerName || 'Customer'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-gray-700">
                    {conversation.customerName?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${
                      conversation.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {conversation.customerName || 'Anonymous User'}
                    </h3>
                    <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                      {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>

                  <p className={`text-sm truncate mb-2 ${
                    conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {conversation.lastMessagePreview || 'No messages yet'}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      conversation.status === 'open'
                        ? 'bg-green-100 text-green-800'
                         : conversation.status === 'resolved'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {conversation.status?.charAt(0).toUpperCase() + conversation.status?.slice(1) || 'Open'}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // NEW: Enhanced Conversation View Component
  const EnhancedConversationView = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No conversation selected</h3>
            <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-background">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-20 px-6 py-4 border-b border-border bg-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={getAvatarPath(selectedConversation.customerEmail || selectedConversation.customerName || selectedConversation.id, 'customer')}
                  alt={selectedConversation.customerName || 'Customer'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-gray-700 font-semibold">
                  {selectedConversation.customerName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedConversation.customerName || 'Anonymous User'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.customerEmail || 'No email provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button type="button" className="p-2 hover:bg-accent rounded-md">
                <Star className="h-4 w-4" />
              </button>
              <button type="button" className="p-2 hover:bg-accent rounded-md">
                <Clock className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                className="p-2 hover:bg-accent rounded-md"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
              >
                 <div className={`flex max-w-xl ${message.senderType === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">
                     <img
                       src={getAvatarPath(message.senderType === 'agent' ? (user?.email || 'agent') : (selectedConversation.customerEmail || selectedConversation.customerName || selectedConversation.id), message.senderType === 'agent' ? 'agent' : 'customer')}
                      alt={message.senderType === 'agent' ? 'Agent' : 'Customer'}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-gray-700 font-semibold">
                      {message.senderType === 'agent' ? (user?.email?.charAt(0)?.toUpperCase() || 'A') : (selectedConversation.customerName?.charAt(0)?.toUpperCase() || 'A')}
                    </span>
                  </div>

                  <div className={`mx-3 ${message.senderType === 'agent' ? 'text-right' : 'text-left'}`}>
                    <motion.div
                      className={`inline-block px-4 py-3 rounded-2xl ${
                        message.senderType === 'agent'
                           ? 'bg-primary text-primary-foreground rounded-br-md'
                           : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Reply Section */}
        <motion.div
          className="border-t border-border bg-muted/30 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex space-x-2 mb-3">
            <button type="button" className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">Reply</button>
            <button type="button" className="px-3 py-1 border border-input rounded-md text-sm hover:bg-accent">Note</button>
            <button type="button" className="px-3 py-1 border border-input rounded-md text-sm hover:bg-accent">Forward</button>
          </div>

          <div className="bg-card border border-input rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="w-full p-3 border-0 resize-none focus:outline-none rounded-t-lg bg-transparent"
              rows={3}
            />

            <div className="flex items-center justify-between p-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <button type="button" className="p-1 hover:bg-accent rounded">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:bg-accent rounded">
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:bg-accent rounded">
                  <Smile className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{isSending ? 'Sending...' : 'Send'}</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // NEW: Enhanced Customer Details Panel
  const EnhancedCustomerDetails = () => {
    const sidebarVariants = {
      open: { x: 0, opacity: 1 },
      closed: { x: '100%', opacity: 0 }
    };

    return (
      <AnimatePresence>
        {showCustomerDetails && selectedConversation && (
          <motion.div
            className="w-96 bg-card border-l border-border flex flex-col"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Customer Details</h3>
              <button
                type="button"
                onClick={() => setShowCustomerDetails(false)}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Customer Information */}
            <motion.div
              className="p-4 border-b border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Customer Information</span>
                </h4>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedConversation.customerName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <h5 className="font-semibold text-foreground">
                  {selectedConversation.customerName || 'Anonymous User'}
                </h5>

                <div className="w-full space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>📧</span>
                    <span>{selectedConversation.customerEmail || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>📅</span>
                    <span>Joined {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Assistant */}
            <motion.div
              className="p-4 border-b border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>AI Assistant</span>
                </h4>
              <button
                type="button"
                  onClick={() => setShowAITerminal(!showAITerminal)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showAITerminal ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AI Assistant Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isAIActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isAIActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <AnimatePresence>
                  {showAITerminal && (
                    <motion.div
                      className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h6 className="font-medium text-primary mb-1">AI Suggestions</h6>
                      <p className="text-sm text-muted-foreground mb-2">
                        AI-powered response suggestions and customer insights.
                      </p>
                      {aiSuggestions.length > 0 && (
                        <div className="space-y-2">
                          {aiSuggestions.slice(0, 2).map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => useSuggestion(suggestion)}
                              className="w-full text-left p-2 bg-background rounded border text-xs hover:bg-accent"
                            >
                              {suggestion.content.substring(0, 50)}...
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={generateAISuggestions}
                    className="flex-1 px-3 py-1 border border-input rounded text-sm hover:bg-accent"
                  >
                    Generate Response
                  </button>
                  <button
                    type="button"
                    onClick={toggleAIHandover}
                    className="flex-1 px-3 py-1 border border-input rounded text-sm hover:bg-accent"
                  >
                    {isAIActive ? 'Disable AI' : 'Enable AI'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Conversation Management */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="font-semibold text-foreground mb-4">Actions</h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowConvertDialog(true)}
                  className="w-full text-left p-2 hover:bg-accent rounded text-sm"
                >
                  Convert to Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignmentPanel(true)}
                  className="w-full text-left p-2 hover:bg-accent rounded text-sm"
                >
                  Assign Conversation
                </button>
                <button
                  type="button"
                  onClick={() => setShowConversationManagement(true)}
                  className="w-full text-left p-2 hover:bg-accent rounded text-sm"
                >
                  Manage Conversation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className={`h-screen bg-background flex ${className}`} data-testid="inbox-dashboard">
      <EnhancedSidebar />
      <EnhancedConversationList />
      <EnhancedConversationView />
      <EnhancedCustomerDetails />

      {/* Toggle Customer Details Button */}
      {!showCustomerDetails && selectedConversation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 z-50"
        >
          <button
            type="button"
            onClick={() => setShowCustomerDetails(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90"
          >
            Details
          </button>
        </motion.div>
      )}

      {/* Modals and Dialogs */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

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
            messages: [],
               priority: selectedConversation.priority || "",
            category: "",
          }}
          onConvert={async (ticketData) => {
            setShowConvertDialog(false);
            console.log('Converting conversation to ticket:', ticketData);
          }}
        />
      )}

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        currentFilters={activeFilters}
      />
    </div>
  );
});

InboxDashboard.displayName = "InboxDashboard";

export default InboxDashboard;
