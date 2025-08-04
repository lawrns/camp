import React from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import Composer from "./Composer";
import type { Conversation, Message, FileAttachment, AISuggestion } from "../types";

interface ChatPaneProps {
  selectedConversation: Conversation | null;
  messages: Message[];
  isLoadingMessages: boolean;
  
  // AI and handover
  isAIActive: boolean;
  toggleAIHandover: () => void;
  
  // UI state
  showCustomerDetails: boolean;
  setShowCustomerDetails: (show: boolean) => void;
  
  // Message composer
  newMessage: string;
  setNewMessage: (message: string) => void;
  attachments: FileAttachment[];
  setAttachments: (attachments: FileAttachment[]) => void;
  isSending: boolean;
  sendMessage: () => void;
  
  // AI features
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  showAISuggestions: boolean;
  setShowAISuggestions: (show: boolean) => void;
  aiSuggestions: AISuggestion[];
  generateAISuggestions: () => void;
  useSuggestion: (suggestion: AISuggestion) => void;
  
  // File handling
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  setIsDragOver: (dragOver: boolean) => void;
  
  // Typing and presence
  typingUsers: unknown[];
  onlineUsers: unknown[];
  handleTyping: () => void;
  stopTyping: () => void;
  
  // Actions
  onAssignConversation: () => void;
  onConvertToTicket: () => void;
  onToggleConversationManagement: () => void;

  // Auth context
  organizationId?: string;
  userId?: string;

  className?: string;
}

/**
 * Chat pane component containing the main chat interface
 * Extracted from main InboxDashboard for better separation of concerns
 */
export const ChatPane: React.FC<ChatPaneProps> = ({
  selectedConversation,
  messages,
  isLoadingMessages,
  isAIActive,
  toggleAIHandover,
  showCustomerDetails,
  setShowCustomerDetails,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  isSending,
  sendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  showTemplates,
  setShowTemplates,
  showAISuggestions,
  setShowAISuggestions,
  aiSuggestions,
  generateAISuggestions,
  useSuggestion,
  textareaRef,
  fileInputRef,
  handleFileInput,
  handleFileDrop,
  isDragOver,
  setIsDragOver,
  typingUsers,
  onlineUsers,
  handleTyping,
  stopTyping,
  onAssignConversation,
  onConvertToTicket,
  onToggleConversationManagement,
  organizationId,
  userId,
  className = "",
}) => {
  if (!selectedConversation) {
    return (
      <div className={`flex flex-1 items-center justify-center bg-[var(--ds-color-background-subtle)] ${className}`}>
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-neutral-300">Start the conversation</h3>
          <p className="text-sm text-neutral-300">
            Choose a conversation from the list to start messaging with your customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--ds-color-background)] relative flex flex-1 flex-col ${className}`} style={{ boxShadow: 'var(--shadow-card-hover)' }}>
      <div className="bg-[var(--ds-color-background)] flex flex-1 flex-col h-full">
        <ChatHeader
          conversation={selectedConversation}
          isAIActive={isAIActive}
          toggleAIHandover={toggleAIHandover}
          showCustomerDetails={showCustomerDetails}
          setShowCustomerDetails={setShowCustomerDetails}
          typingUsers={typingUsers}
          onlineUsers={onlineUsers}
          onAssignConversation={onAssignConversation}
          onConvertToTicket={onConvertToTicket}
          onToggleConversationManagement={onToggleConversationManagement}
          organizationId={organizationId}
          userId={userId}
        />
        
        {/* Message list with flex-1 to take remaining space */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            selectedConversation={selectedConversation}
            isLoading={isLoadingMessages}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
          />
        </div>
        
        {/* Composer fixed at bottom */}
        <div className="flex-shrink-0 border-t border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]">
          <Composer
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            attachments={attachments}
            setAttachments={setAttachments}
            isSending={isSending}
            sendMessage={sendMessage}
            isAIActive={isAIActive}
            toggleAIHandover={toggleAIHandover}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            showTemplates={showTemplates}
            setShowTemplates={setShowTemplates}
            showAISuggestions={showAISuggestions}
            setShowAISuggestions={setShowAISuggestions}
            aiSuggestions={aiSuggestions}
            generateAISuggestions={generateAISuggestions}
            useSuggestion={useSuggestion}
            textareaRef={textareaRef}
            fileInputRef={fileInputRef}
            handleFileInput={handleFileInput}
            handleFileDrop={handleFileDrop}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            handleTyping={handleTyping}
            stopTyping={stopTyping}
            selectedConversation={selectedConversation}
          />
        </div>
      </div>
    </div>
  );
};
