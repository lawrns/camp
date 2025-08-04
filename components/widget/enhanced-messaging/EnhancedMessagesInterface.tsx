"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { PixelPerfectChatInterface } from '../design-system/PixelPerfectChatInterface';
import { InlineThreadList } from '../thread-inbox/InlineThreadList';
import { InlineThreadConversation } from '../thread-inbox/InlineThreadConversation';
import { useThreadInbox } from '../../../hooks/useThreadInbox';
import { type MessageBubbleProps } from '../design-system/MessageBubble';

// ============================================================================
// TYPES
// ============================================================================
export interface EnhancedMessagesInterfaceProps {
  organizationId: string;
  conversationId?: string;
  messages: MessageBubbleProps[];
  isConnected: boolean;
  typingUsers: Array<{ id: string; name: string }>;
  organizationName: string;
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onViewThread?: (threadId: string) => void;
  onFileSelect?: (files: File[]) => void;
  onFileUpload?: (file: File) => Promise<string>;
  maxFileSize?: number;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  enableThreading?: boolean;
  className?: string;
}

type ViewMode = 'chat' | 'threads' | 'thread-detail';

// ============================================================================
// ENHANCED MESSAGES INTERFACE
// ============================================================================
export function EnhancedMessagesInterface({
  organizationId,
  conversationId,
  messages,
  isConnected,
  typingUsers,
  organizationName,
  onSendMessage,
  onTyping,
  onStopTyping,
  onReact,
  onReply,
  onViewThread,
  onFileSelect,
  onFileUpload,
  maxFileSize = 10,
  maxFiles = 5,
  acceptedFileTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt", "video/*", "audio/*"],
  enableThreading = true,
  className = "",
}: EnhancedMessagesInterfaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  
  const {
    threads,
    selectedThread,
    isLoading,
    error,
    loadThreads,
    selectThread,
    sendMessage: sendThreadMessage,
    createThread,
  } = useThreadInbox(organizationId);

  // Load threads on mount
  useEffect(() => {
    if (enableThreading) {
      loadThreads();
    }
  }, [loadThreads, enableThreading]);

  // Handle thread creation
  const handleCreateThread = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const newThread = await createThread(
        `Conversation Thread - ${new Date().toLocaleDateString()}`,
        'Thread created from main conversation',
        conversationId
      );
      
      if (newThread) {
        setSelectedThreadId(newThread.id);
        setViewMode('thread-detail');
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  }, [createThread, conversationId]);

  // Handle thread selection
  const handleThreadSelect = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    selectThread(threadId);
    setViewMode('thread-detail');
  }, [selectThread]);

  // Handle back navigation
  const handleBackToChat = useCallback(() => {
    setViewMode('chat');
    setSelectedThreadId(null);
  }, []);

  const handleBackToThreads = useCallback(() => {
    setViewMode('threads');
    setSelectedThreadId(null);
  }, []);

  // Handle thread message sending
  const handleThreadMessageSend = useCallback(async (content: string) => {
    if (!selectedThreadId) return;
    
    try {
      await sendThreadMessage(selectedThreadId, content);
    } catch (error) {
      console.error('Failed to send thread message:', error);
    }
  }, [selectedThreadId, sendThreadMessage]);

  // Render header based on view mode
  const renderHeader = () => {
    switch (viewMode) {
      case 'threads':
        return (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <button
              onClick={handleBackToChat}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Chat</span>
            </button>
            <h2 className="font-semibold text-gray-900">Message Threads</h2>
            <button
              onClick={handleCreateThread}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              New
            </button>
          </div>
        );
      
      case 'thread-detail':
        return (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <button
              onClick={handleBackToThreads}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Threads</span>
            </button>
            <h2 className="font-semibold text-gray-900 truncate">
              {selectedThread?.title || 'Thread'}
            </h2>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'threads':
        return (
          <InlineThreadList
            organizationId={organizationId}
            onThreadSelect={handleThreadSelect}
            onSendMessage={onSendMessage}
            className="h-full"
          />
        );
      
      case 'thread-detail':
        if (!selectedThread) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">Thread not found</div>
                <button
                  onClick={handleBackToThreads}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Back to Threads
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <InlineThreadConversation
            thread={selectedThread}
            onSendMessage={handleThreadMessageSend}
            className="h-full"
          />
        );
      
      default: // 'chat'
        return (
          <div className="h-full flex flex-col">
            {enableThreading && (
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Main Conversation</span>
                </div>
                <button
                  onClick={() => setViewMode('threads')}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                >
                  <MessageSquare size={14} />
                  Threads ({threads.length})
                </button>
              </div>
            )}
            
            <div className="flex-1">
              <PixelPerfectChatInterface
                messages={messages}
                isConnected={isConnected}
                typingUsers={typingUsers}
                organizationName={organizationName}
                onSendMessage={onSendMessage}
                onTyping={onTyping}
                onStopTyping={onStopTyping}
                onReact={onReact}
                onReply={onReply}
                onViewThread={onViewThread}
                onFileSelect={onFileSelect}
                onFileUpload={onFileUpload}
                maxFileSize={maxFileSize}
                maxFiles={maxFiles}
                acceptedFileTypes={acceptedFileTypes}
                showHeader={false}
                className="h-full"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, x: viewMode === 'chat' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: viewMode === 'chat' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          className="h-full flex flex-col"
        >
          {renderHeader()}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default EnhancedMessagesInterface;
