"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt as Send, 
  Smiley, 
  Paperclip, 
  Microphone, 
  Image as ImageIcon,
  X,
  Plus,
  Sparkles,
  ArrowClockwise,
  Check,
  Warning
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Enhanced Composer Props
export interface EnhancedComposerProps {
  // Core functionality
  onSend: (content: string, attachments?: File[], metadata?: unknown) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onContentChange?: (content: string) => void;
  onDraftSave?: (content: string) => void;

  // Content & state
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;

  // Feature toggles
  enableRichText?: boolean;
  enableEmoji?: boolean;
  enableAttachments?: boolean;
  enableVoiceRecording?: boolean;
  enableAISuggestions?: boolean;
  enableDrafts?: boolean;
  enableMentions?: boolean;
  enableAutoResize?: boolean;

  // Data
  aiSuggestions?: AISuggestion[];
  mentionableUsers?: MentionUser[];
  quickReplies?: string[];

  // Styling & behavior
  className?: string;
  variant?: 'default' | 'compact' | 'widget' | 'dashboard';
  theme?: 'light' | 'dark' | 'auto';
  showCharacterCount?: boolean;
  autoFocus?: boolean;
  
  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;
  onAttachmentAdd?: (file: File) => void;
  onAttachmentRemove?: (index: number) => void;
}

export interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  category: 'response' | 'completion' | 'correction';
  reasoning?: string;
}

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

// Enhanced Composer Component
export function EnhancedComposer({
  onSend,
  onTyping,
  onStopTyping,
  onContentChange,
  onDraftSave,
  value: controlledValue,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 2000,
  minHeight = 44,
  maxHeight = 200,
  enableRichText = false,
  enableEmoji = true,
  enableAttachments = true,
  enableVoiceRecording = false,
  enableAISuggestions = false,
  enableDrafts = true,
  enableMentions = false,
  enableAutoResize = true,
  aiSuggestions = [],
  mentionableUsers = [],
  quickReplies = [],
  className,
  variant = 'default',
  theme = 'auto',
  showCharacterCount = true,
  autoFocus = false,
  onFocus,
  onBlur,
  onAttachmentAdd,
  onAttachmentRemove,
}: EnhancedComposerProps) {
  // State management
  const [content, setContent] = useState(controlledValue || '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Controlled vs uncontrolled value
  const currentValue = controlledValue !== undefined ? controlledValue : content;

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current && enableAutoResize) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [enableAutoResize, minHeight, maxHeight]);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    if (controlledValue === undefined) {
      setContent(newContent);
    }
    onContentChange?.(newContent);
    adjustTextareaHeight();

    // Handle typing indicators
    if (newContent.length > 0) {
      onTyping?.();
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing
      const timeout = setTimeout(() => {
        onStopTyping?.();
      }, 1000);
      setTypingTimeout(timeout);
    } else {
      onStopTyping?.();
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }

    // Auto-save draft
    if (enableDrafts && onDraftSave) {
      const draftTimeout = setTimeout(() => {
        onDraftSave(newContent);
      }, 2000);
      return () => clearTimeout(draftTimeout);
    }
  }, [controlledValue, onContentChange, onTyping, onStopTyping, typingTimeout, enableDrafts, onDraftSave, adjustTextareaHeight]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!currentValue.trim() && attachments.length === 0) return;
    if (disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend(currentValue.trim(), attachments);
      
      // Clear content and attachments after successful send
      if (controlledValue === undefined) {
        setContent('');
      }
      setAttachments([]);
      onContentChange?.('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = `${minHeight}px`;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [currentValue, attachments, disabled, isSending, onSend, controlledValue, onContentChange, minHeight]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || !enableAttachments) return;

    const newFiles = Array.from(files).filter(file => {
      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      return file.size <= maxSize;
    });

    setAttachments(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => onAttachmentAdd?.(file));
  }, [enableAttachments, onAttachmentAdd]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    onAttachmentRemove?.(index);
  }, [onAttachmentRemove]);

  // Character count and validation
  const characterCount = currentValue.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.8;

  // Focus management
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-2 rounded-lg';
      case 'widget':
        return 'p-3 rounded-xl border-2';
      case 'dashboard':
        return 'p-4 rounded-lg border';
      default:
        return 'p-3 rounded-lg border';
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={composerRef}
        className={cn(
          'relative bg-background transition-all duration-200',
          getVariantStyles(),
          isDragOver && 'border-blue-500 bg-blue-50',
          isFocused && 'ring-2 ring-blue-500 ring-opacity-20',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex flex-wrap gap-2"
            >
              {attachments.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Area */}
        <div className="flex items-end gap-2">
          {/* Action Buttons (Left) */}
          <div className="flex items-center gap-1">
            {enableAttachments && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
            )}

            {enableEmoji && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Smiley className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add emoji</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={currentValue}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => {
                setIsFocused(false);
                onBlur?.();
              }}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className={cn(
                'min-h-[44px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0',
                isOverLimit && 'text-red-500'
              )}
              style={{ height: minHeight }}
            />

            {/* Character Count */}
            {showCharacterCount && (characterCount > 0 || isNearLimit) && (
              <div className={cn(
                'absolute bottom-1 right-1 text-xs',
                isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'
              )}>
                {characterCount}/{maxLength}
              </div>
            )}
          </div>

          {/* Send Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSend}
                disabled={disabled || isSending || (!currentValue.trim() && attachments.length === 0) || isOverLimit}
                size="sm"
                className="h-8 w-8 p-0"
              >
                {isSending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <ArrowClockwise className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center"
            >
              <div className="text-blue-600 text-center">
                <Plus className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Drop files to attach</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
