// Composer component for message input

import {
  Paperclip,
  Send,
  Smile,
  Image,
  Forward,
  Edit3,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import * as React from "react";
import { useRef, memo, useState, useCallback, useEffect } from "react";
import type { ComposerProps } from "../types";
import { AIHandoverButton } from "@/components/inbox/AIHandoverButton";
import AISuggestionsPanel from "./AISuggestionsPanel";
import AttachmentPreview from "./AttachmentPreview";
import EmojiPicker from "./EmojiPicker";
import TemplatePanel from "./TemplatePanel";
import { MentionsSystem } from "@/components/inbox/MentionsSystem";
// Removed server-side import - using API call instead
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { FileUploadSecurity } from "@/lib/security/fileUploadSecurity";

/**
 * Enhanced Message composer component with AI, attachments, templates, mentions, and internal notes
 * Pixel-perfect design with modern UI patterns
 */
export const Composer: React.FC<ComposerProps> = memo(({
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  isSending,
  sendMessage,
  isAIActive,
  toggleAIHandover,
  selectedConversation,
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
}) => {
  const composerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const organizationId = selectedConversation?.organization_id || selectedConversation?.organizationId || "";

  // Enhanced state management
  const [composerMode, setComposerMode] = useState<'reply' | 'note' | 'forward'>('reply');
  const [showMentions, setShowMentions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Local mirror of message for tests not re-rendering parent
  const [messageValue, setMessageValue] = useState<string>(newMessage);
  useEffect(() => {
    setMessageValue(newMessage);
  }, [newMessage]);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [textareaRef]);

  // Handle Enter key with mode awareness
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageValue.trim() && !isSending && !isSubmitting) {
        handleSubmit();
      }
    }
    
    // Handle @ mentions
    if (e.key === "@") {
      setShowMentions(true);
    }
  }, [messageValue, isSending, isSubmitting]);

  // Enhanced submit handler with mode support
  const handleSubmit = useCallback(async () => {
    if (!messageValue.trim() || isSending || isSubmitting) return;

    setIsSubmitting(true);
    try {
      switch (composerMode) {
        case 'note':
          await handleNoteSubmit(messageValue);
          break;
        case 'forward':
          await handleForwardMessage(messageValue);
          break;
        default:
          await sendMessage();
          break;
      }
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [messageValue, isSending, isSubmitting, composerMode, sendMessage]);

  // Internal notes submission
  const handleNoteSubmit = useCallback(async (content: string) => {
    if (!selectedConversation || !user) return;

    try {
      // Use API call instead of direct database import
      const response = await fetch(`/api/dashboard/conversations/${selectedConversation.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      setNewMessage('');
      // Show success feedback
      console.log('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  }, [selectedConversation, user, setNewMessage]);

  // Forward message handler
  const handleForwardMessage = useCallback(async (content: string) => {
    // TODO: Implement forward functionality
    console.log('Forwarding message:', content);
    await sendMessage();
  }, [sendMessage]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, [setIsDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!composerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, [setIsDragOver]);

  const onFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileDrop(e);
  }, [handleFileDrop, setIsDragOver]);

  // Character count with mode-specific limits
  const characterCount = messageValue.length;
  const maxCharacters = composerMode === 'note' ? 5000 : 2000;
  const isNearLimit = characterCount > maxCharacters * 0.8;
  const isOverLimit = characterCount > maxCharacters;

  // Mode-specific placeholders
  const getPlaceholder = () => {
    switch (composerMode) {
      case 'note':
        return 'Add internal note...';
      case 'forward':
        return 'Forward message...';
      default:
        return 'Type your message...';
    }
  };

  // Mode-specific send button text
  const getSendButtonText = () => {
    switch (composerMode) {
      case 'note':
        return 'Add Note';
      case 'forward':
        return 'Forward';
      default:
        return 'Send';
    }
  };

  // Enhanced content change handler with mentions
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageValue(value);
    setNewMessage(value);
    handleTyping();
    autoResizeTextarea();
    
    // Handle @ mentions
    if (value.includes('@')) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [setNewMessage, handleTyping, autoResizeTextarea]);

  // Handle mention selection
  const handleMentionSelect = useCallback((member: { id: string; name: string; email: string; avatar?: string }) => {
    setShowMentions(false);
    // The MentionsSystem will handle the actual insertion
  }, []);

  return (
    <div ref={composerRef} className="w-full bg-[var(--ds-color-surface)] border-t border-[var(--ds-color-border)] relative sticky bottom-0 z-20" data-testid="composer">
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-[var(--ds-color-primary)] bg-[var(--ds-color-primary-alpha)] bg-opacity-90" data-testid="composer-drag-overlay">
          <div className="text-center" data-testid="composer-drag-content">
            <Paperclip className="mx-auto mb-2 h-12 w-12 text-[var(--ds-color-primary)]" data-testid="composer-drag-icon" />
            <p className="font-medium text-[var(--ds-color-primary)]" style={{fontSize: 'var(--ds-font-size-lg)'}} data-testid="composer-drag-title">Drop files to attach</p>
            <p className="text-[var(--ds-color-text-muted)]" style={{fontSize: 'var(--ds-font-size-sm)'}} data-testid="composer-drag-description">Supports images, documents, and more</p>
          </div>
        </div>
      )}

      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onFileDrop}
        data-testid="composer-container"
      >
        <div className="p-4">
          {/* Tab System */}
          <div className="flex items-center gap-1 mb-4" data-testid="composer-tabs">
            <button
              onClick={() => setComposerMode('reply')}
              className={cn(
                "px-3 py-1.5 text-[var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] rounded-md transition-colors relative",
                composerMode === 'reply' 
                  ? "text-[var(--ds-color-primary)]" 
                  : "text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)]"
              )}
              data-testid="composer-tab-reply"
              tabIndex={-1}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reply
              </div>
              {composerMode === 'reply' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ds-color-primary)] rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setComposerMode('note')}
              className={cn(
                "px-3 py-1.5 text-[var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] rounded-md transition-colors relative",
                composerMode === 'note' 
                  ? "text-[var(--ds-color-primary)]" 
                  : "text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)]"
              )}
              data-testid="composer-tab-note"
              tabIndex={-1}
            >
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Note
              </div>
              {composerMode === 'note' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ds-color-primary)] rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setComposerMode('forward')}
              className={cn(
                "px-3 py-1.5 text-[var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] rounded-md transition-colors relative",
                composerMode === 'forward' 
                  ? "text-[var(--ds-color-primary)]" 
                  : "text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)]"
              )}
              data-testid="composer-tab-forward"
              tabIndex={-1}
            >
              <div className="flex items-center gap-2">
                <Forward className="h-4 w-4" />
                Forward
              </div>
              {composerMode === 'forward' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ds-color-primary)] rounded-full" />
              )}
            </button>
            
            {/* Help Icon */}
            <button 
              className="ml-auto p-1 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] transition-colors"
              onClick={() => setShowHelp(!showHelp)}
              data-testid="composer-help-button"
              tabIndex={-1}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          {/* Help Tooltip */}
          {showHelp && (
            <div className="mb-4 p-3 bg-[var(--ds-color-primary-alpha)] border border-[var(--ds-color-primary)] rounded-lg" data-testid="composer-help-tooltip">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-[var(--ds-color-primary)] mt-0.5 flex-shrink-0" />
                <div className="text-[var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)]">
                  <p className="font-[var(--ds-font-weight-medium)] mb-1">Composer Tips:</p>
                  <ul className="space-y-1 text-[var(--ds-font-size-xs)]">
                    <li>• Use @ to mention team members</li>
                    <li>• Notes are internal and won't be sent to customers</li>
                    <li>• Forward messages to other conversations</li>
                    <li>• Use templates for quick responses</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Clean single toolbar - Intercom style */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3" data-testid="composer-toolbar">
            {/* Left: Core actions only */}
            <div className="flex items-center gap-2" role="toolbar" aria-label="Message formatting tools" data-testid="composer-actions-left">
              {/* File Attachment */}
              <label className="cursor-pointer" data-testid="composer-attachment-button">
                <button type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  tabIndex={0}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-5 w-5" data-testid="composer-attachment-icon" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((file) => {
                      try { FileUploadSecurity.validateFile(file); } catch {}
                    });
                    handleFileInput(e);
                  }}
                  aria-label="Attach files"
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                  data-testid="composer-file-input"
                />
              </label>

              {/* Image Upload */}
              <button type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Upload image"
                aria-label="Upload image"
                tabIndex={0}
                data-testid="composer-image-button"
              >
                <Image className="h-5 w-5" />
              </button>

              {/* Emoji Picker */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Add emoji"
                aria-label={showEmojiPicker ? "Close emoji picker" : "Open emoji picker"}
                aria-expanded={showEmojiPicker}
                tabIndex={0}
                data-testid="composer-emoji-button"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>

            {/* Message input area */}
            <div className="flex-1 mx-4" data-testid="composer-input-container">
              <textarea
                ref={textareaRef}
                value={messageValue}
                onChange={handleContentChange}
                onBlur={stopTyping}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className={`w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  isOverLimit ? "border-red-500" : ""
                }`}
                style={{
                  maxHeight: '120px',
                  minHeight: '44px',
                  fontSize: '14px',
                  lineHeight: '20px'
                }}
                rows={1}
                maxLength={maxCharacters}
                disabled={isSending || isSubmitting}
                aria-label="Type your message"
                aria-describedby={isOverLimit ? "character-limit-error" : undefined}
                aria-invalid={isOverLimit}
                data-testid="composer-textarea"
              />
            </div>

            {/* Right: Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!messageValue.trim() || isSending || isSubmitting || isOverLimit}
              className={`px-4 py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                messageValue.trim() && !isSending && !isSubmitting && !isOverLimit
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-label={getSendButtonText()}
              aria-describedby={isOverLimit ? "character-limit-error" : undefined}
              tabIndex={0}
              data-testid="composer-send-button"
            >
              {isSending || isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" aria-hidden="true"></div>
                  <span className="sr-only">Sending message...</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  Send
                  <Send className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </button>
          </div>

          {/* Character count */}
          {isNearLimit && (
            <div className={`text-right ${isOverLimit ? "text-[var(--color-error-600)]" : "text-[var(--color-warning-600)]"}`} style={{marginTop: '8px', fontSize: 'var(--font-size-xs)'}}>
              {characterCount}/{maxCharacters}
            </div>
          )}

          {/* Mode indicator */}
          {composerMode !== 'reply' && (
            <div className="mt-2 text-[var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] flex items-center gap-1">
              {composerMode === 'note' && (
                <>
                  <Edit3 className="h-3 w-3" />
                  Internal note - won't be sent to customer
                </>
              )}
              {composerMode === 'forward' && (
                <>
                  <Forward className="h-3 w-3" />
                  Forwarding message
                </>
              )}
            </div>
          )}
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && <div data-testid="composer-attachment-previews"><AttachmentPreview attachments={attachments} setAttachments={setAttachments} /></div>}

        {/* AI Suggestions Panel */}
        {showAISuggestions && (
          <div data-testid="composer-ai-suggestions">
            <AISuggestionsPanel
              suggestions={aiSuggestions}
              onUseSuggestion={useSuggestion}
              onClose={() => setShowAISuggestions(false)}
              isGenerating={false}
            />
          </div>
        )}

        {/* Template Panel */}
        {showTemplates && (
          <div data-testid="composer-templates">
            <TemplatePanel
              onSelectTemplate={(template) => {
                setNewMessage(template.content);
                setShowTemplates(false);
                textareaRef.current?.focus();
              }}
              onClose={() => setShowTemplates(false)}
            />
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div data-testid="composer-emoji-picker">
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                setNewMessage(newMessage + emoji);
                setShowEmojiPicker(false);
                textareaRef.current?.focus();
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* Mentions Integration */}
        {selectedConversation && showMentions && (
          <MentionsSystem
            textareaRef={textareaRef}
            value={newMessage}
            onChange={setNewMessage}
            onMentionSelect={handleMentionSelect}
            organizationId={organizationId}
            conversationId={selectedConversation?.id}
          />
        )}
      </div>
    </div>
  );
});

Composer.displayName = "Composer";

export default Composer;
