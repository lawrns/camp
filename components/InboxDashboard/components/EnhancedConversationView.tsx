/**
 * Enhanced Conversation View Component - Extracted from InboxDashboard for performance
 * Handles message display and composition with optimized animations
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date | string;
  type: 'user' | 'agent';
}

interface EnhancedConversationViewProps {
  selectedConversation: any;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

const EnhancedConversationView = React.memo(({ 
  selectedConversation, 
  messages, 
  onSendMessage,
  isLoading = false
}: EnhancedConversationViewProps) => {
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(messageContent.trim());
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background" data-testid="conversation-view">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No conversation selected</h3>
          <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background" data-testid="conversation-view">
      {/* Conversation Header */}
      <motion.div
        className="sticky top-0 z-20 px-6 py-4 border-b border-border bg-card"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-medium text-primary">
                {selectedConversation.customerName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {selectedConversation.customerName || 'Unknown Customer'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedConversation.customerEmail}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedConversation.isOnline && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Online
              </span>
            )}
            <Button variant="ghost" size="sm" data-testid="more-actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="message-list">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start the conversation below</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                layout
                className={`flex ${message.type === 'agent' ? 'justify-end' : 'justify-start'}`}
                data-testid="message"
              >
                <div className={`
                  max-w-[70%] rounded-lg px-4 py-2
                  ${message.type === 'agent' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                  }
                `}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'agent' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Composition */}
      <motion.div
        className="border-t border-border bg-muted/30 p-4"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[60px] max-h-[120px] resize-none"
              data-testid="message-input"
              disabled={isSending}
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" data-testid="attachment-button">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="emoji-button">
              <Smile className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
              size="sm"
              data-testid="send-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{messageContent.length}/1000</span>
        </div>
      </motion.div>
    </div>
  );
});

EnhancedConversationView.displayName = 'EnhancedConversationView';

export { EnhancedConversationView };
