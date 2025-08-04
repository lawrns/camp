import React, { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";

interface Message {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  isAI?: boolean;
  readBy?: string[];
  isCurrentUser?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="phoenix-message-list">
      {messages.map((message: unknown) => (
        <div
          key={message.id}
          className={`phoenix-message ${message.isAI ? "phoenix-message-ai" : ""} ${message.isCurrentUser ? "phoenix-message-own" : ""}`}
        >
          <Avatar name={message.senderName} size="sm" />
          <div className="phoenix-message-content">
            <div className="phoenix-message-header">
              <span className="phoenix-message-name">{message.senderName}</span>
              <span className="phoenix-message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="phoenix-message-text">{message.content}</p>
            {message.attachment && (
              <div className="phoenix-message-attachment">
                {message.attachment.type.startsWith("image/") ? (
                  <img src={message.attachment.url} alt={message.attachment.name} className="phoenix-message-image" />
                ) : (
                  <a href={message.attachment.url} download={message.attachment.name} className="phoenix-message-file">
                    📎 {message.attachment.name}
                  </a>
                )}
              </div>
            )}
            {message.isCurrentUser && message.readBy && message.readBy.length > 0 && (
              <div className="phoenix-read-receipt">✓✓ Read by {message.readBy.length}</div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
