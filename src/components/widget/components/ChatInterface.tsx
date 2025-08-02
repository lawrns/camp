/**
 * Chat Interface Component - PIXEL PERFECT VERSION
 *
 * Completely rewritten using the new design system for pixel-perfect alignment,
 * consistent spacing, and Intercom-quality user experience
 */

import React, { useMemo } from "react";
import { PixelPerfectChatInterface, type MessageBubbleProps } from "../../../../components/widget/design-system";

// Legacy interface for backward compatibility
interface Message {
  id: string;
  content: string;
  senderType: "visitor" | "agent" | "ai";
  senderName?: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isConnected: boolean;
  isTyping?: boolean;
  onSendMessage: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isConnected,
  isTyping = false,
  onSendMessage,
  onTyping,
  onStopTyping,
  className = "",
}) => {

  // Convert legacy messages to pixel-perfect format
  const pixelPerfectMessages: MessageBubbleProps[] = useMemo(() => {
    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderType: message.senderType,
      senderName: message.senderName,
      timestamp: message.timestamp,
      isOwn: message.senderType === "visitor",
      showAvatar: true,
      showTimestamp: true,
      showStatus: message.senderType === "visitor",
    }));
  }, [messages]);

  // Convert typing indicator to new format
  const typingUsers = isTyping ? [{ id: 'agent', name: 'Agent' }] : [];

  return (
    <PixelPerfectChatInterface
      messages={pixelPerfectMessages}
      isConnected={isConnected}
      typingUsers={typingUsers}
      organizationName="Campfire"
      onSendMessage={onSendMessage}
      onTyping={onTyping}
      onStopTyping={onStopTyping}
      className={className}
    />
  );
};

export default ChatInterface;
