// Composer component for message input

import { Paperclip as Attachment, PaperPlaneRight, Smiley, Sparkle, Note as Template } from "@phosphor-icons/react";
import * as React from "react";
import { useRef } from "react";
import type { ComposerProps } from "../types";
import { AIHandoverButton } from "@/components/inbox/AIHandoverButton";
import AISuggestionsPanel from "./AISuggestionsPanel";
import AttachmentPreview from "./AttachmentPreview";
import EmojiPicker from "./EmojiPicker";
import TemplatePanel from "./TemplatePanel";

/**
 * Message composer component with AI, attachments, and templates
 */
export const Composer: React.FC<ComposerProps> = ({
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

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && !isSending) {
        sendMessage();
      }
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only hide if leaving the composer area
    if (!composerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const onFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileDrop(e);
  };

  // Character count
  const characterCount = newMessage.length;
  const maxCharacters = 2000;
  const isNearLimit = characterCount > maxCharacters * 0.8;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <div className="composer bg-background flex-shrink-0 border-t border-[var(--color-border)]" data-testid="composer">
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)] bg-opacity-90" data-testid="composer-drag-overlay">
          <div className="text-center" data-testid="composer-drag-content">
            <Attachment className="mx-auto mb-2 h-12 w-12 text-[var(--color-info)]" data-testid="composer-drag-icon" />
            <p className="font-medium text-[var(--color-primary-700)]" style={{fontSize: 'var(--font-size-lg)'}} data-testid="composer-drag-title">Drop files to attach</p>
            <p className="text-[var(--color-primary-600)]" style={{fontSize: 'var(--font-size-sm)'}} data-testid="composer-drag-description">Supports images, documents, and more</p>
          </div>
        </div>
      )}

      <div
        ref={composerRef}
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onFileDrop}
        data-testid="composer-container"
      >
        {/* Attachment previews */}
        {attachments.length > 0 && <div data-testid="composer-attachment-previews"><AttachmentPreview attachments={attachments} setAttachments={setAttachments} /></div>}

        {/* AI Suggestions Panel */}
        {showAISuggestions && (
          <div data-testid="composer-ai-suggestions">
            <AISuggestionsPanel
              suggestions={aiSuggestions}
              onUseSuggestion={useSuggestion}
              onClose={() => setShowAISuggestions(false)}
              isGenerating={false} // You might want to pass this as a prop
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

        {/* Main composer */}
        <div className="bg-background border-t border-[var(--color-border)] p-3 shadow-card-deep" data-testid="composer-main">
          <div className="flex items-end gap-3" data-testid="composer-input-row">
            {/* Left side actions */}
            <div className="flex items-center gap-2" data-testid="composer-actions-left">
              {/* Enhanced AI Handover Button */}
              {selectedConversation && (
                <div data-testid="composer-ai-handover">
                  <AIHandoverButton
                    conversationId={selectedConversation.id}
                    organizationId={(selectedConversation as any).organization_id || (selectedConversation as any).organizationId || ""}
                    variant="inline"
                    showDetails={false}
                  />
                </div>
              )}

              {/* File Attachment */}
              <label className="cursor-pointer" aria-label="Attach files" data-testid="composer-attachment-button">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} data-testid="composer-file-input" />
                <div className="hover:bg-background hover:text-foreground rounded-ds-lg text-[var(--color-text-muted)] transition-all flex items-center justify-center w-12 h-12">
                  <Attachment className="h-5 w-5" data-testid="composer-attachment-icon" />
                </div>
              </label>

              {/* Templates */}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`rounded-ds-lg transition-colors flex items-center justify-center w-12 h-12 ${
                  showTemplates ? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-background-subtle)] hover:text-[var(--color-text)]"
                }`}
                title="Quick templates"
                aria-label="Quick templates"
                data-testid="composer-templates-button"
              >
                <Template className="h-5 w-5" data-testid="composer-templates-icon" />
              </button>

              {/* AI Suggestions */}
              <button
                onClick={generateAISuggestions}
                className={`rounded-ds-lg transition-colors flex items-center justify-center w-12 h-12 ${
                  showAISuggestions
                    ? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-background-subtle)] hover:text-[var(--color-text)]"
                }`}
                title="AI suggestions"
                aria-label="Generate AI suggestions"
                data-testid="composer-ai-suggestions-button"
              >
                <Sparkle className="h-5 w-5" data-testid="composer-ai-suggestions-icon" />
              </button>
            </div>

            {/* Message input */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                  autoResizeTextarea();
                }}
                onBlur={stopTyping}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className={`w-full resize-none rounded-ds-xl border transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-[var(--color-primary-500)] ${
                  isOverLimit ? "border-[var(--color-error-300)]" : "border-[var(--color-border)]"
                }`}
                style={{
                  maxHeight: '120px',
                  minHeight: '48px', // 48px proper touch target
                  padding: '12px',
                  paddingRight: '48px'
                }}
                rows={1}
                maxLength={maxCharacters}
                disabled={isSending}
              />

              {/* Emoji picker button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-foreground absolute top-1/2 -translate-y-1/2 transform text-[var(--color-text-muted)] transition-colors flex items-center justify-center rounded-ds-lg w-12 h-12"
                style={{
                  right: '12px'
                }}
                aria-label="Add emoji"
              >
                <Smiley className="h-5 w-5" />
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending || isOverLimit}
              className={`rounded-ds-xl transition-all flex items-center justify-center w-12 h-12 ${
                newMessage.trim() && !isSending && !isOverLimit
                  ? "bg-[var(--color-primary-600)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-700)]"
                  : "cursor-not-allowed bg-[var(--color-background-subtle)] text-[var(--color-text-muted)]"
              }`}
              aria-label="Send message"
            >
              {isSending ? (
                <div className="h-5 w-5 animate-spin rounded-ds-full border-b-2 border-[var(--color-text-inverse)]"></div>
              ) : (
                <PaperPlaneRight className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Character count */}
          {isNearLimit && (
            <div className={`text-right ${isOverLimit ? "text-[var(--color-error-600)]" : "text-[var(--color-warning-600)]"}`} style={{marginTop: '8px', fontSize: 'var(--font-size-xs)'}}>
              {characterCount}/{maxCharacters}
            </div>
          )}

          {/* Connection status removed - was showing inappropriate warnings */}
        </div>
      </div>
    </div>
  );
};

export default Composer;
