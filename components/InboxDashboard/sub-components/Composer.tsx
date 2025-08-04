// Composer component for message input

import { 
  Paperclip, 
  Send, 
  Smile, 
  Sparkles, 
  FileText,
  AtSign,
  Image,
  Heart,
  Star,
  HelpCircle,
  Bookmark,
  Clipboard,
  Grid,
  MessageSquare,
  Forward,
  Edit3
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
  const organizationId = (selectedConversation as any)?.organization_id || (selectedConversation as any)?.organizationId || "";

  // Enhanced state management
  const [composerMode, setComposerMode] = useState<'reply' | 'note' | 'forward'>('reply');
  const [showMentions, setShowMentions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      if (newMessage.trim() && !isSending && !isSubmitting) {
        handleSubmit();
      }
    }
    
    // Handle @ mentions
    if (e.key === "@") {
      setShowMentions(true);
    }
  }, [newMessage, isSending, isSubmitting]);

  // Enhanced submit handler with mode support
  const handleSubmit = useCallback(async () => {
    if (!newMessage.trim() || isSending || isSubmitting) return;

    setIsSubmitting(true);
    try {
      switch (composerMode) {
        case 'note':
          await handleNoteSubmit(newMessage);
          break;
        case 'forward':
          await handleForwardMessage(newMessage);
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
  }, [newMessage, isSending, isSubmitting, composerMode, sendMessage]);

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
  const characterCount = newMessage.length;
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
  const handleMentionSelect = useCallback((member: any) => {
    setShowMentions(false);
    // The MentionsSystem will handle the actual insertion
  }, []);

  return (
    <div ref={composerRef} className="w-full bg-[var(--ds-color-surface)] border-t border-[var(--ds-color-border)] relative" data-testid="composer">
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

          {/* Enhanced icon row */}
          <div className="flex items-center gap-2 mb-3" data-testid="composer-icon-row">
            <button 
              className="p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors"
              title="Document"
              data-testid="composer-icon-document"
            >
              <FileText className="h-4 w-4" />
            </button>
            
            <button 
              className="p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors"
              title="Bookmark"
              data-testid="composer-icon-bookmark"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors"
              title="Emoji"
              data-testid="composer-icon-emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            
            <span className="text-[var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)] px-2">GIF</span>
            
            <button 
              className="p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors"
              title="Image"
              data-testid="composer-icon-image"
            >
              <Image className="h-4 w-4" />
            </button>
            
            <label className="cursor-pointer p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors" title="Attachment">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
              <Paperclip className="h-4 w-4" />
            </label>
            
            <button 
              className="p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors"
              title="Clipboard"
              data-testid="composer-icon-clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </button>
            
            <button 
              className="p-2 text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-hover)] rounded-md transition-colors"
              title="Grid"
              data-testid="composer-icon-grid"
            >
              <Grid className="h-4 w-4" />
            </button>
            
            <button 
              className="p-2 text-[var(--ds-color-primary)] hover:text-[var(--ds-color-primary-hover)] hover:bg-[var(--ds-color-primary-alpha)] rounded-md transition-colors"
              title="Star"
              data-testid="composer-icon-star"
            >
              <Star className="h-4 w-4" />
            </button>
            
            <button 
              className="p-2 text-[var(--ds-color-error)] hover:text-[var(--ds-color-error)] hover:bg-[var(--ds-color-error-subtle)] rounded-md transition-colors"
              title="Heart"
              data-testid="composer-icon-heart"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-end gap-3" data-testid="composer-input-row">
            {/* Left side actions */}
            <div className="flex items-center gap-2" data-testid="composer-actions-left">
              {/* File Attachment */}
              <label className="cursor-pointer" aria-label="Attach files" data-testid="composer-attachment-button">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} data-testid="composer-file-input" />
                <div className="hover:bg-[var(--ds-color-surface-hover)] hover:text-[var(--ds-color-text-primary)] rounded-ds-lg text-[var(--ds-color-text-muted)] transition-all flex items-center justify-center w-12 h-12">
                  <Paperclip className="h-5 w-5" data-testid="composer-attachment-icon" />
                </div>
              </label>

              {/* Templates */}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`rounded-ds-lg transition-colors flex items-center justify-center w-12 h-12 ${
                  showTemplates ? "bg-[var(--ds-color-primary-alpha)] text-[var(--ds-color-primary)]" : "text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-hover)] hover:text-[var(--ds-color-text-primary)]"
                }`}
                title="Quick templates"
                aria-label="Quick templates"
                data-testid="composer-templates-button"
              >
                <FileText className="h-5 w-5" data-testid="composer-templates-icon" />
              </button>

              {/* AI Suggestions */}
              <button
                onClick={generateAISuggestions}
                className={`rounded-ds-lg transition-colors flex items-center justify-center w-12 h-12 ${
                  showAISuggestions
                    ? "bg-[var(--ds-color-primary-alpha)] text-[var(--ds-color-primary)]"
                    : "text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-hover)] hover:text-[var(--ds-color-text-primary)]"
                }`}
                title="AI suggestions"
                aria-label="Generate AI suggestions"
                data-testid="composer-ai-suggestions-button"
              >
                <Sparkles className="h-5 w-5" data-testid="composer-ai-suggestions-icon" />
              </button>

              {/* Mentions Button */}
              <button
                onClick={() => setShowMentions(!showMentions)}
                className={`rounded-ds-lg transition-colors flex items-center justify-center w-12 h-12 ${
                  showMentions
                    ? "bg-[var(--ds-color-primary-alpha)] text-[var(--ds-color-primary)]"
                    : "text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-hover)] hover:text-[var(--ds-color-text-primary)]"
                }`}
                title="Mention team members"
                aria-label="Mention team members"
                data-testid="composer-mentions-button"
              >
                <AtSign className="h-5 w-5" data-testid="composer-mentions-icon" />
              </button>
            </div>

            {/* Message input - Increased size with design system tokens */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleContentChange}
                onBlur={stopTyping}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className={`w-full resize-none rounded-ds-xl border transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[var(--ds-color-primary)] ${
                  isOverLimit ? "border-[var(--ds-color-error)]" : "border-[var(--ds-color-border)]"
                }`}
                style={{
                  maxHeight: '200px', // Increased from 120px
                  minHeight: '80px',  // Increased from 48px
                  padding: '16px',    // Increased padding
                  paddingRight: '48px',
                  fontSize: 'var(--ds-font-size-sm)', // Use design system font size
                  lineHeight: 'var(--ds-line-height-normal)'
                }}
                rows={3} // Increased from 1
                maxLength={maxCharacters}
                disabled={isSending || isSubmitting}
                data-testid="composer-textarea"
              />

              {/* Emoji picker button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-foreground absolute top-1/2 -translate-y-1/2 transform text-[var(--ds-color-text-muted)] transition-colors flex items-center justify-center rounded-ds-lg w-12 h-12"
                style={{
                  right: '12px'
                }}
                aria-label="Add emoji"
                data-testid="composer-emoji-button"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!newMessage.trim() || isSending || isSubmitting || isOverLimit}
              className={`rounded-ds-xl transition-all flex items-center justify-center w-12 h-12 ${
                newMessage.trim() && !isSending && !isSubmitting && !isOverLimit
                  ? "bg-[var(--ds-color-primary)] text-[var(--ds-color-text-inverse)] hover:bg-[var(--ds-color-primary-hover)]"
                  : "cursor-not-allowed bg-[var(--ds-color-surface-hover)] text-[var(--ds-color-text-muted)]"
              }`}
              aria-label={getSendButtonText()}
              data-testid="composer-send-button"
            >
              {isSending || isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-ds-full border-b-2 border-[var(--ds-color-text-inverse)]"></div>
              ) : (
                <Send className="h-5 w-5" />
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
