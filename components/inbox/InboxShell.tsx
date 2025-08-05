"use client";

import { useCallback, useMemo, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { ChatCircle as MessageSquare, X } from "@phosphor-icons/react";
import { CommandBar } from "@/components/inbox/CommandBar";
import { DetailsSidebar } from "@/components/inbox/DetailsSidebar";
import { InboxHeader } from "@/components/inbox/InboxHeader";
import { InboxMessagePanel } from "@/components/inbox/InboxMessagePanel";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/src/components/InboxDashboard/sub-components/ConversationList";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { useAuth } from "@/hooks/useAuth";
import { useHotkeys } from "@/lib/hooks/useHotkeys";
import { Icon } from "@/lib/ui/Icon";
import { transformMessageFromDb } from "@/lib/utils/naming-conventions";
import { cn } from "@/lib/utils";
import { useCampfireStore } from "@/store";
import type { Message } from "@/types/entities/message";

interface InboxShellProps {
  className?: string;
}

type ViewMode = "list" | "grid";
type PanelLayout = "default" | "focus" | "full";

export function InboxShell({ className }: InboxShellProps) {
  // Authentication
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [panelLayout, setPanelLayout] = useState<PanelLayout>("default");
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Store - Type-safe selectors
  const conversationsMap = useCampfireStore((state) => state.conversations || new Map());
  const conversations = useMemo(() => Array.from(conversationsMap.values()), [conversationsMap]);
  const selectedConversationId = useCampfireStore((state) => state.ui?.selectedConversationId || null);
  const setSelectedConversation = useCampfireStore((state) => state.setSelectedConversation || (() => {}));
  const messagesMap = useCampfireStore((state) => state.messages || {});
  const messages = useMemo(() => {
    const rawMessages = selectedConversationId ? messagesMap[selectedConversationId] || [] : [];
    // Use centralized transformation for consistency
    return rawMessages.map((msg: any): Message => {
      const transformed = transformMessageFromDb(msg);
      return {
        id: Number(transformed.id),
        conversationId: transformed.conversationId || selectedConversationId,
        content: transformed.content || "",
        senderType: transformed.senderType || "customer",
        senderId: transformed.senderId,
        senderName: transformed.senderName,
        senderEmail: transformed.senderEmail,
        createdAt: transformed.createdAt || new Date().toISOString(),
        updatedAt: transformed.updatedAt,
        status: transformed.status,
        deliveryStatus: transformed.deliveryStatus,
        metadata: transformed.metadata,
        attachments: transformed.attachments,
        // Keep snake_case for backward compatibility
        sender_type: transformed.senderType,
        sender_name: transformed.senderName,
        sender_email: transformed.senderEmail,
        conversation_id: transformed.conversationId || selectedConversationId,
        created_at: transformed.createdAt,
        updated_at: transformed.updatedAt,
        delivery_status: transformed.deliveryStatus,
      };
    });
  }, [messagesMap, selectedConversationId]);
  const messageText = useCampfireStore((state) => state.inbox?.messageText || "");
  const isSending = useCampfireStore((state) => state.inbox?.isSending || false);
  const isLoadingMessages = false; // Replace with real loading state if available
  const setMessageText = useCampfireStore((state) => state.setMessageText);
  const sendMessage = useCampfireStore((state) => state.sendMessage);
  const updateConversationStatus = useCampfireStore((state) => state.updateConversationStatus);

  // Keyboard shortcuts
  useHotkeys([
    {
      key: "k",
      meta: true,
      callback: () => setShowCommandBar(true),
    },
    {
      key: "Escape",
      callback: () => {
        if (showCommandBar) setShowCommandBar(false);
      },
    },
    {
      key: "d",
      meta: true,
      callback: () => setShowDetailsSidebar(!showDetailsSidebar),
    },
  ]);

  // Mobile menu handler
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <OptimizedMotion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Icon icon={MessageSquare} className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </OptimizedMotion.div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <OptimizedMotion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Icon icon={MessageSquare} className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="mb-2 text-lg font-semibold">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access your inbox</p>
        </OptimizedMotion.div>
      </div>
    );
  }

  return (
    <div className={cn("inbox-container flex flex-col bg-neutral-50", className)}>
      {/* Command Bar */}
      <CommandBar
        isOpen={showCommandBar}
        onClose={() => setShowCommandBar(false)}
        onSearch={(query) => {
          setSearchQuery(query);
          // Implement search functionality
        }}
      />

      {/* Premium Header */}
      <InboxHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleCommandBar={() => setShowCommandBar(true)}
        onToggleDetailsSidebar={() => setShowDetailsSidebar(!showDetailsSidebar)}
        onToggleMobileMenu={toggleMobileMenu}
        showDetailsSidebar={showDetailsSidebar}
        filterCount={0}
      />

      {/* Three-Panel Layout */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Conversation List Sidebar */}
        <OptimizedMotion.aside
          initial={false}
          animate={{
            width: panelLayout === "full" ? 0 : panelLayout === "focus" ? 280 : 360,
            opacity: panelLayout === "full" ? 0 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "flex flex-col overflow-hidden border-r bg-white",
            panelLayout === "full" && "hidden",
            isMobileMenuOpen ? "fixed inset-0 z-40 w-full bg-background lg:relative lg:w-auto" : "hidden lg:flex"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Mobile header */}
            <div className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
              <h2 className="font-semibold">Conversations</h2>
              <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                <Icon icon={X} className="h-5 w-5" />
              </Button>
            </div>

            {/* Conversation Stats */}
            <OptimizedMotion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b bg-gradient-to-br from-white to-gray-50 spacing-3"
            >
              <div className="grid grid-cols-4 gap-ds-2">
                {[
                  { label: "Active", value: 12, color: "text-green-600" },
                  { label: "Waiting", value: 3, color: "text-orange-600" },
                  { label: "Closed", value: 24, color: "text-gray-600" },
                  { label: "Total", value: 39, color: "text-blue-600" },
                ].map((stat: any) => (
                  <OptimizedMotion.div
                    key={stat.label}
                    whileHover={{ scale: 1.05 }}
                    className="hover:bg-background cursor-pointer rounded-ds-lg p-spacing-sm text-center transition-all hover:shadow-card-base"
                  >
                    <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
                    <div className="text-tiny text-muted-foreground">{stat.label}</div>
                  </OptimizedMotion.div>
                ))}
              </div>
            </OptimizedMotion.div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
              <OptimizedAnimatePresence mode="popLayout">
                <ConversationList
                  conversations={conversations.map((conv: any) => ({
                    id: conv.id,
                    name: conv.customer_email || "Unknown",
                    lastMessage: conv.last_message_preview || "No preview",
                    unreadCount: conv.unread_count || 0,
                    updatedAt: conv.last_message_at || conv.updated_at,
                  }))}
                  selectedId={selectedConversationId || null}
                  onSelect={(id: string) => {
                    setSelectedConversation(id);
                    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                  }}
                  searchQuery={searchQuery}
                />
              </OptimizedAnimatePresence>
            </ScrollArea>
          </div>
        </OptimizedMotion.aside>

        {/* Main Content Area */}
        <div className="bg-background flex flex-1">
          {/* Message Panel */}
          <div className="flex flex-1 flex-col">
            {selectedConversationId ? (
              <InboxMessagePanel
                conversation={{ id: selectedConversationId }}
                messages={messages}
                messageText={messageText}
                isSending={isSending}
                isLoadingMessages={isLoadingMessages}
                onMessageTextChange={setMessageText}
                onSendMessage={(content) => sendMessage?.(selectedConversationId, content, "agent")}
                onStatusChange={(status) => updateConversationStatus?.(selectedConversationId, status)}
              />
            ) : (
              <OptimizedMotion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 items-center justify-center"
              >
                <div className="text-center">
                  <OptimizedMotion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Icon icon={MessageSquare} className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
                  </OptimizedMotion.div>
                  <h3 className="mb-2 text-base font-medium text-muted-foreground">No conversation selected</h3>
                  <p className="text-sm text-muted-foreground/70">
                    Choose a conversation from the list to get started
                  </p>
                </div>
              </OptimizedMotion.div>
            )}
          </div>

          {/* Details Sidebar */}
          <DetailsSidebar
            isOpen={showDetailsSidebar && !!selectedConversationId}
            onClose={() => setShowDetailsSidebar(false)}
            conversationId={selectedConversationId || ""}
          />
        </div>
      </div>
    </div>
  );
}
