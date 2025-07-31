"use client";

import { DetailsSidebar } from "@/components/inbox/DetailsSidebar";
import { Button } from "@/components/ui/Button-unified";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import { Icon } from "@/lib/ui/Icon";
import { getAvatarUrl, getOnlineStatus } from "@/lib/utils/avatar";
import {
  At,
  DotsThreeVertical,
  Hash,
  Info,
  ChatCircle as MessageCircle,
  NotePencil,
  Paperclip,
  MagnifyingGlass as Search,
  PaperPlaneTilt as Send,
  Smiley,
  Tag,
  Ticket,
  UserPlus,
} from "@phosphor-icons/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface Conversation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_ip?: string;
  status: "open" | "closed" | "pending";
  priority: "low" | "medium" | "high" | "urgent";
  last_message_at: string;
  created_at: string;
  unread_count: number;
  assigned_to?: string;
  tags?: string[];
  last_message_preview?: string;
  organization_id: string;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: "customer" | "agent" | "system" | "visitor";
  sender_name: string;
  created_at: string;
  metadata?: any;
}

interface UnifiedInboxDashboardProps {
  className?: string;
}

const UnifiedInboxDashboard: React.FC<UnifiedInboxDashboardProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Add states for actions
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState(["Hello!", "How can I help?", "Thank you!"]);

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  const scrollToBottom = useCallback(() => {
    if (!userScrolledUpRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      userScrolledUpRef.current = !isAtBottom;
    }
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.organizationId) return;

    try {
      setError(null);
      const supabaseClient = supabase.browser();

      let query = supabaseClient
        .from("conversations")
        .select(
          `
          id,
          customer_name,
          customer_email,
          customer_ip,
          status,
          priority,
          last_message_at,
          created_at,
          assigned_to,
          tags,
          organization_id,
          visitor_name,
          metadata,
          messages!inner(content, created_at)
        `
        )
        .eq("organization_id", user.organizationId!)
        .order("last_message_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(`customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        throw error;
      }

      const processedConversations = (data || []).map((conv: any) => ({
        ...conv,
        unread_count: 0,
        last_message_preview: conv.messages?.[0]?.content?.substring(0, 100) || "No messages",
      }));

      setConversations(processedConversations);
    } catch (error) {
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, [user?.organizationId, searchQuery, statusFilter]);

  // Load messages for selected conversation
  const loadMessages = useCallback(
    async (conversationId: string) => {
      setIsLoadingMessages(true);
      userScrolledUpRef.current = false; // Reset scroll tracking

      try {
        const supabaseClient = supabase.browser();

        const { data, error } = await supabaseClient
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        const mappedMessages = (data || []).map((msg: any) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          content: msg.content,
          sender_type: msg.sender_type as "customer" | "agent" | "system" | "visitor",
          sender_name: msg.sender_name || msg.sender_id || "Unknown",
          created_at: msg.created_at,
          metadata: msg.metadata,
        }));

        setMessages(mappedMessages);

        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        setError("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [scrollToBottom]
  );

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    (conversation: Conversation) => {
      setSelectedConversation(conversation);
      loadMessages(conversation.id);
    },
    [loadMessages]
  );

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const supabaseClient = supabase.browser();

      const messageData = {
        conversation_id: selectedConversation.id,
        content: newMessage.trim(),
        sender_type: "agent",
        sender_name: user?.email || "Agent",
        organization_id: user.organizationId!,
      };

      const { data, error } = await supabaseClient.from("messages").insert([messageData]).select().single();

      if (error) {
        throw error;
      }

      // Broadcast real-time event using unified standards
      try {
        const channelName = UNIFIED_CHANNELS.conversation(user.organizationId!, selectedConversation.id.toString());
        const channel = supabaseClient.channel(channelName);

        // Subscribe to channel first (required for broadcasts)
        await channel.subscribe();

        await channel.send({
          type: "broadcast",
          event: UNIFIED_EVENTS.MESSAGE_CREATED,
          payload: {
            message: data,
            conversation_id: selectedConversation.id,
            organization_id: user.organizationId!,
            sender_type: "agent",
          },
        });

        // Clean up the channel after sending
        await channel.unsubscribe();
      } catch (broadcastError) {
        console.warn("Failed to broadcast message:", broadcastError);
        // Don't throw - message was saved successfully
      }

      setNewMessage("");
      // Reload messages to show the new one
      loadMessages(selectedConversation.id);
    } catch (error) {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedConversation, isSending, user, loadMessages]);

  // Handle Enter key for sending messages
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Handlers
  const handleAssign = useCallback(() => {
    // TODO: Implement assignment logic

  }, []);

  const handleConvertToTicket = useCallback(() => {
    setShowConvertDialog(true);
  }, []);

  const updateStatus = useCallback(
    async (newStatus: "open" | "pending" | "closed") => {
      if (!selectedConversation) return;
      try {
        const { error } = await supabase
          .browser()
          .from("conversations")
          .update({ status: newStatus })
          .eq("id", selectedConversation.id);
        if (error) throw error;
        // Refresh conversations
        loadConversations();
      } catch (error) {
        setError("Failed to update status");
      }
    },
    [selectedConversation, loadConversations]
  );

  const handleMoreAction = useCallback((action: string) => {
    // TODO: Implement more actions like snooze, add note, etc.

  }, []);

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-[var(--fl-color-warning-muted)]";
      case "closed":
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
      default:
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]";
      case "low":
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
      default:
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
    }
  };

  // Load conversations on mount and when filters change
  useEffect(() => {
    if (user?.organizationId) {
      loadConversations();
    }
  }, [user?.organizationId, loadConversations]);

  // Real-time subscriptions for new messages and conversations
  useEffect(() => {
    if (!user?.organizationId) return;

    const supabaseClient = supabase.browser();

    // Subscribe to new messages in the selected conversation
    // Use unified channel naming to match widget broadcast pattern
    const channelName = selectedConversation
      ? UNIFIED_CHANNELS.conversation(user.organizationId, selectedConversation.id.toString())
      : UNIFIED_CHANNELS.organization(user.organizationId);

    const messagesChannel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${user.organizationId}`,
        },
        (payload: any) => {
          const newMessage = payload.new as any;

          // Only add message if it's for the currently selected conversation
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            const mappedMessage: Message = {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              content: newMessage.content,
              sender_type: newMessage.sender_type as "customer" | "agent" | "system" | "visitor",
              sender_name: newMessage.sender_name || newMessage.sender_id || "Unknown",
              created_at: newMessage.created_at,
              metadata: newMessage.metadata,
            };

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((msg) => msg.id === mappedMessage.id)) {
                return prev;
              }
              return [...prev, mappedMessage];
            });
          }

          // Refresh conversations list to update last message preview
          loadConversations();
        }
      )
      // Listen for widget broadcast messages using unified events
      .on("broadcast", { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
        const messageData = payload.payload;

        // Only add message if it's for the currently selected conversation
        if (selectedConversation && messageData.conversation_id === selectedConversation.id) {
          const mappedMessage: Message = {
            id: messageData.id,
            conversation_id: messageData.conversation_id,
            content: messageData.content,
            sender_type: messageData.sender_type as "customer" | "agent" | "system" | "visitor",
            sender_name: messageData.sender_name || messageData.sender_id || "Unknown",
            created_at: messageData.created_at,
            metadata: messageData.metadata,
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === mappedMessage.id)) {
              return prev;
            }
            return [...prev, mappedMessage];
          });
        }

        // Refresh conversations list
        loadConversations();
      })
      .subscribe();

    // Subscribe to new conversations
    const conversationsChannel = supabaseClient
      .channel(`org:${user.organizationId}:conversations`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${user.organizationId}`,
        },
        () => {
          // Refresh conversations when new ones are created
          loadConversations();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabaseClient.removeChannel(messagesChannel);
      supabaseClient.removeChannel(conversationsChannel);
    };
  }, [user?.organizationId, selectedConversation?.id, loadConversations]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  if (!user?.organizationId) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center">
          <Icon icon={MessageCircle} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-base font-medium text-gray-900">No Organization</h3>
          <p className="text-foreground">Please complete your organization setup to access the inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="inbox-container" className={`flex h-full flex-col bg-[var(--fl-color-background-subtle)] ${className}`}>
      {/* Header */}
      <div data-testid="inbox-header" className="bg-[var(--fl-color-surface)] flex-shrink-0 border-b border-[var(--fl-color-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--fl-color-text)]">Inbox</h1>
            <p className="text-[var(--fl-color-text-muted)] mt-1 text-sm">{conversations.length} conversations</p>
          </div>
          <div data-testid="header-controls" className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Icon
                data-testid="search-icon"
                icon={Search}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-[var(--fl-color-text-muted)]"
              />
              <input
                data-testid="search-input"
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-[var(--fl-color-border-strong)] rounded-ds-lg border py-2 pl-10 pr-4 text-sm focus:border-[var(--fl-color-focus)] focus:ring-2 focus:ring-[var(--fl-color-focus-ring)]"
              />
            </div>

            {/* Status Filter */}
            <select
              data-testid="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-[var(--fl-color-border-strong)] rounded-ds-lg border px-3 py-2 text-sm focus:border-[var(--fl-color-focus)] focus:ring-2 focus:ring-[var(--fl-color-focus-ring)]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div data-testid="conversation-list" className="bg-[var(--fl-color-surface)] w-80 flex-shrink-0 overflow-y-auto border-r border-[var(--fl-color-border)]">
          {isLoading ? (
            <div className="space-y-3 spacing-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 spacing-3">
                  <div className="h-10 w-10 rounded-ds-full bg-[var(--fl-color-border)]"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-3/4 rounded bg-[var(--fl-color-border)]"></div>
                    <div className="h-3 w-1/2 rounded bg-[var(--fl-color-border)]"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="spacing-3 text-center text-[var(--fl-color-error)]">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="spacing-3 text-center text-[var(--fl-color-text-muted)]">No conversations found</div>
          ) : (
            <div className="divide-y divide-[var(--fl-color-border)]">
              {conversations.map((conversation) => (
                <div
                  data-testid="conversation-item"
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`flex cursor-pointer items-center gap-3 spacing-4 transition-colors hover:bg-[var(--fl-color-background-subtle)] ${selectedConversation?.id === conversation.id
                    ? "border-r-2 border-[var(--fl-color-brand)] bg-[var(--fl-color-info-subtle)]"
                    : ""
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      data-testid="customer-avatar"
                      src={getAvatarUrl(conversation.customer_email)}
                      alt={conversation.customer_name}
                      className="h-10 w-10 rounded-ds-full object-cover"
                    />
                    <div
                      data-testid="status-indicator"
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-ds-full border-2 border-white ${getOnlineStatus() === "online"
                        ? "bg-[var(--fl-color-success)]"
                        : getOnlineStatus() === "away"
                          ? "bg-[var(--fl-color-warning)]"
                          : "bg-[var(--fl-color-text-muted)]"
                        }`}
                    ></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between">
                      <h3 data-testid="customer-name" className="truncate font-medium text-[var(--fl-color-text)]">
                        {conversation.customer_name || conversation.customer_email}
                      </h3>
                      <span data-testid="message-time" className="flex-shrink-0 text-tiny text-[var(--fl-color-text-muted)]">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-foreground mb-1 truncate text-sm">{conversation.last_message_preview}</p>
                    <div className="flex items-center gap-ds-2">
                      <span
                        className={`inline-flex items-center rounded-ds-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(conversation.status)}`}
                      >
                        {conversation.status}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-ds-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(conversation.priority)}`}
                      >
                        {conversation.priority}
                      </span>
                      {conversation.unread_count > 0 && (
                        <span className="bg-brand-mahogany-500 inline-flex h-5 w-5 items-center justify-center rounded-ds-full text-tiny font-medium text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat View */}
        <div className="flex flex-1">
          <div className="flex flex-1 flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-background flex-shrink-0 border-b border-[var(--fl-color-border)] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarUrl(selectedConversation.customer_email)}
                        alt={selectedConversation.customer_name}
                        className="h-10 w-10 rounded-ds-full object-cover"
                      />
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {selectedConversation.customer_name || selectedConversation.customer_email}
                        </h2>
                        <p className="text-foreground text-sm">{selectedConversation.customer_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-ds-2">
                      <button
                        onClick={handleAssign}
                        title="Assign"
                        className="hover:bg-background hover:text-foreground rounded-ds-lg p-spacing-sm text-[var(--fl-color-text-muted)] transition-colors"
                      >
                        <Icon icon={UserPlus} className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleConvertToTicket}
                        title="Convert to Ticket"
                        className="hover:bg-background hover:text-foreground rounded-ds-lg p-spacing-sm text-[var(--fl-color-text-muted)] transition-colors"
                      >
                        <Icon icon={Ticket} className="h-5 w-5" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            title="Change Status"
                            className="hover:bg-background hover:text-foreground rounded-ds-lg p-spacing-sm text-[var(--fl-color-text-muted)] transition-colors"
                          >
                            <Icon icon={Tag} className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateStatus("open")}>Open</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus("pending")}>Pending</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus("closed")}>Closed</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            title="More Actions"
                            className="hover:bg-background hover:text-foreground rounded-ds-lg p-spacing-sm text-[var(--fl-color-text-muted)] transition-colors"
                          >
                            <Icon icon={DotsThreeVertical} className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleMoreAction("snooze")}>Snooze</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoreAction("add-note")}>Add Note</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoreAction("archive")}>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <button
                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                        title="Toggle Details"
                        className="hover:bg-background hover:text-foreground rounded-ds-lg p-spacing-sm text-[var(--fl-color-text-muted)] transition-colors"
                      >
                        <Icon icon={Info} className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 space-y-3 overflow-y-auto p-spacing-md"
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
                      >
                        {message.sender_type === "customer" && (
                          <img
                            src={getAvatarUrl(selectedConversation.customer_email)}
                            alt={message.sender_name}
                            className="h-8 w-8 flex-shrink-0 rounded-ds-full object-cover"
                          />
                        )}
                        <div
                          className={`max-w-xs radius-2xl px-4 py-2 lg:max-w-md ${message.sender_type === "agent"
                            ? "bg-brand-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                            }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`mt-1 text-xs ${message.sender_type === "agent" ? "text-blue-100" : "text-[var(--fl-color-text-muted)]"
                              }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                        {message.sender_type === "agent" && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ds-full bg-brand-blue-500 text-tiny font-medium text-white">
                            {user?.email?.[0]?.toUpperCase() ?? "A"}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <div className="bg-background flex-shrink-0 border-t border-[var(--fl-color-border)] spacing-3">
                  <div className="flex flex-col gap-ds-2 rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-3">
                    {/* Suggested replies */}
                    <div className="flex gap-ds-2 overflow-x-auto pb-2">
                      {suggestedReplies.map((reply, idx) => (
                        <Button key={idx} variant="secondary" size="sm" onClick={() => setNewMessage(reply)}>
                          {reply}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-end gap-ds-2">
                      <Button
                        variant={isInternalNote ? "default" : "ghost"}
                        onClick={() => setIsInternalNote(!isInternalNote)}
                        aria-label="Internal note"
                      >
                        <Icon icon={NotePencil} className="h-5 w-5" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost">
                            <Icon icon={Smiley} className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>Emoji picker here</PopoverContent>
                      </Popover>
                      <Button variant="ghost">
                        <Icon icon={At} className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost">
                        <Icon icon={Hash} className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost">
                        <Icon icon={Paperclip} className="h-5 w-5" />
                      </Button>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isInternalNote ? "Internal note..." : "Type your message..."}
                        className="max-h-32 min-h-[44px] flex-1 resize-none border-none bg-transparent py-2 text-sm outline-none"
                        rows={1}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className={`rounded-ds-full spacing-2 transition-colors ${newMessage.trim() && !isSending ? "bg-brand-blue-500 text-white hover:bg-blue-600" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}
                      >
                        <Icon icon={Send} className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <Icon icon={MessageCircle} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-base font-medium text-gray-900">Select a conversation</h3>
                  <p className="text-foreground">Choose a conversation from the list to start messaging.</p>
                </div>
              </div>
            )}
          </div>
          <DetailsSidebar
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            conversationId={selectedConversation?.id ?? ""}
          />
        </div>
      </div>
      {showConvertDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background w-full max-w-md rounded-ds-lg p-spacing-md">
            <h3 className="mb-4 text-base font-medium">Convert to Ticket</h3>
            <p className="text-foreground mb-4 text-sm">Convert this conversation to a support ticket?</p>
            <div className="flex justify-end gap-ds-2">
              <button
                onClick={() => setShowConvertDialog(false)}
                className="text-foreground hover:bg-background rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  /* implement convert */ setShowConvertDialog(false);
                }}
                className="hover:bg-primary rounded bg-brand-blue-500 px-4 py-2 text-white"
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedInboxDashboard;
