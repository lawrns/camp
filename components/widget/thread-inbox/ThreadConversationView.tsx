import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PaperPlaneRight } from "lucide-react";
import { cn } from '@/lib/utils';
import type { ThreadData, ThreadMessage } from '@/types/thread-inbox';

interface ThreadConversationViewProps {
  thread: ThreadData;
  onBack: () => void;
  onSendMessage: (content: string) => Promise<void>;
  className?: string;
}

export function ThreadConversationView({
  thread,
  onBack,
  onSendMessage,
  className
}: ThreadConversationViewProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);

  // Mock messages for now - will be replaced with real API calls
  useEffect(() => {
    // Simulate loading thread messages
    const mockMessages: ThreadMessage[] = [
      {
        id: '1',
        threadId: thread.id,
        content: thread.lastMessage.content,
        sender: thread.lastMessage.sender,
        timestamp: thread.lastMessage.timestamp,
        attachments: [],
        reactions: [],
        status: 'read'
      }
    ];
    setMessages(mockMessages);
  }, [thread]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      data-testid="thread-conversation"
      className={cn('flex flex-col h-full', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white" data-testid="conversation-header">
        <button
          onClick={onBack}
          data-testid="back-button"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">
            {thread.participants[0]?.name || 'Thread'}
          </h2>
          <p className="text-sm text-gray-500">
            {thread.status} • {thread.participants.length} participants
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="message-list">
        {messages.map((msg) => (
                      <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid="message-bubble"
              className={cn(
                'flex',
                msg.sender.role === 'customer' ? 'justify-end' : 'justify-start'
              )}
            >
            <div
              className={cn(
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                msg.sender.role === 'customer'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {msg.sender.name}
                </span>
                <span className="text-xs opacity-70">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white" data-testid="message-input-container">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            data-testid="message-input"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            data-testid="send-button"
            className={cn(
              'px-4 py-2 rounded-lg transition-colors',
              message.trim() && !isSending
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <PaperPlaneRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
} 