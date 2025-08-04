"use client";

// Critical overrides are handled in globals.css
import { MessageComposer } from "@/components/unified-ui/components/Composer";
import { useAuth } from "@/hooks/useAuth";
import { useInboxStore } from "@/hooks/useInboxStore";
import { useTypingPreview } from "@/lib/realtime/useTypingPreview";
import { Icon } from "@/lib/ui/Icon";
import { ChatCircle as MessageCircle } from "@phosphor-icons/react";
import React, { useMemo } from "react";
import { MessagePanelErrorBoundary } from "./ErrorBoundary";
import { MessageList } from "./MessageList";
import type { MessagePanelProps } from "./types";

// Create a context for passing props down
const MessagePanelPropsContext = React.createContext<MessagePanelProps | null>(null);

function MessagePanelContent() {
  const props = React.useContext(MessagePanelPropsContext);
  const { user } = useAuth();

  if (!props) {
    return <div>Error: MessagePanel props not found</div>;
  }

  const { conversation, messages, isLoadingMessages, customerData } = props;

  // ENHANCED: Use unified typing preview system with live content
  const { typingUsers, broadcastTyping, stopTyping, isTyping, updateTypingContent } = useTypingPreview(
    conversation?.id
  );

  // Use Zustand store instead of MessagePanelContext
  const inboxStore = useInboxStore();

  if (!conversation) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="text-center">
          <Icon icon={MessageCircle} className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
          <p className="text-[var(--fl-color-text-muted)]">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Debug message data to understand why messages aren't showing

  // Transform Customer to CustomerData format for MessageList compatibility
  const transformedCustomerData = useMemo(() => {
    if (!customerData) return null;

    return {
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      avatar_url: customerData.avatar_url || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization_id: "",
      metadata: customerData.metadata || {},
      verification_status: "unverified" as const,
    };
  }, [customerData]);

  // Transform messages to be compatible with MessageList Message interface
  const transformedMessages = useMemo(() => {
    return messages.map((message: unknown) => ({
      ...message,
      senderType: message.senderType as "agent" | "customer" | "visitor" | "system",
      status: message.status === "failed" ? "sent" : message.status || "sent",
    }));
  }, [messages]);

  return (
    <div
      className="messages-area-with-sticky relative flex h-full min-w-0 flex-col overflow-hidden bg-[var(--fl-color-background-subtle)]"
      data-component="MessagePanel"
    >
      {/* CRITICAL FIX: Ensure proper height and centering for message area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <MessageList
          messages={transformedMessages}
          isLoading={isLoadingMessages}
          customerData={transformedCustomerData}
          onRetryMessage={(tempId) => {
            // Handle retry logic here if needed
          }}
        />

        {/* Enhanced Typing Indicators with Live Preview */}
        {typingUsers.length > 0 && (
          <div className="space-y-spacing-sm px-4 pb-2">
            {typingUsers.map((user) => (
              <div key={user.userId} className="flex justify-start">
                <div className="bg-background max-w-xs rounded-ds-lg border-l-2 border-[var(--fl-color-border-interactive)] px-4 py-3 lg:max-w-md">
                  <div className="mb-1 flex items-center gap-ds-2">
                    <div className="h-2 w-2 animate-pulse rounded-ds-full bg-brand-blue-500"></div>
                    <span className="text-foreground text-tiny font-medium">{user.userName} is typing...</span>
                  </div>
                  {user.content && user.content.trim() ? (
                    <div className="text-sm italic text-gray-800">
                      "{user.content}"<span className="animate-pulse">|</span>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <div
                        className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Message Composer with Typing Preview Integration */}
      <div className="flex-shrink-0" data-testid="message-composer-container">
        <MessageComposer
          onSend={(content) => {
            // TODO: Implement actual message sending

            stopTyping(conversation?.id || "");
          }}
          onTyping={() => {
            if (conversation?.id) {
              broadcastTyping(conversation.id);
            }
          }}
          onStopTyping={() => {
            if (conversation?.id) {
              stopTyping(conversation.id);
            }
          }}
          onContentChange={(content) => {
            if (conversation?.id) {
              updateTypingContent(conversation.id, content);
            }
          }}
          placeholder="Type your message..."
          enableAISuggestions={true}
          enableQuickReplies={true}
        />
      </div>
    </div>
  );
}

export function MessagePanel(props: MessagePanelProps) {
  return (
    <MessagePanelErrorBoundary>
      <MessagePanelPropsContext.Provider value={props}>
        <MessagePanelContent />
      </MessagePanelPropsContext.Provider>
    </MessagePanelErrorBoundary>
  );
}
