import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from "lucide-react";
import { cn } from '@/lib/utils';
import type { ThreadData, ThreadMessage } from '@/types/thread-inbox';

interface InlineThreadConversationProps {
  thread: ThreadData;
  onSendMessage?: (content: string) => Promise<void>;
  className?: string;
}

export function InlineThreadConversation({
  thread,
  onSendMessage,
  className
}: InlineThreadConversationProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for the thread
  const mockMessages: ThreadMessage[] = [
    {
      id: '1',
      content: thread.lastMessage?.content || 'Hello, I need help with this issue.',
      sender: thread.participants[0],
      timestamp: thread.lastMessage?.timestamp || new Date().toISOString(),
      isUnread: false
    },
    {
      id: '2',
      content: 'Hi! I\'d be happy to help you with that. Can you provide more details about the issue you\'re experiencing?',
      sender: {
        id: 'agent-1',
        name: 'Sarah',
        email: 'sarah@campfire.com',
        avatar: null,
        role: 'agent'
      },
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      isUnread: false
    }
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mockMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      if (onSendMessage) {
        await onSendMessage(messageContent);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(messageContent);
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('h-full flex flex-col bg-white', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex gap-3',
              msg.sender.role === 'customer' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.sender.role !== 'customer' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(msg.sender.name)}
                </div>
              </div>
            )}
            
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2',
              msg.sender.role === 'customer'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            )}>
              <p className="text-sm">{msg.content}</p>
              <div className={cn(
                'text-xs mt-1',
                msg.sender.role === 'customer' ? 'text-blue-100' : 'text-gray-500'
              )}>
                {formatTime(msg.timestamp)}
              </div>
            </div>

            {msg.sender.role === 'customer' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(msg.sender.name)}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isSending}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              message.trim() && !isSending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InlineThreadConversation;
