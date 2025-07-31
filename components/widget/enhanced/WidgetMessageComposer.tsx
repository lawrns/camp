"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneTilt as Send, Smiley, Paperclip, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Simplified emoji picker for widget
const QUICK_EMOJIS = ['😊', '👍', '❤️', '😢', '😮', '😡', '🎉', '🤔'];

interface WidgetMessageComposerProps {
  onSend: (content: string, attachments?: File[]) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export function WidgetMessageComposer({
  onSend,
  onTyping,
  onStopTyping,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 1000,
  className,
}: WidgetMessageComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle content change with typing indicators
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);

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
  }, [onTyping, onStopTyping, typingTimeout]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!content.trim() && attachments.length === 0) return;
    if (disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend(content.trim(), attachments);
      setContent('');
      setAttachments([]);
      onStopTyping?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [content, attachments, disabled, isSending, onSend, onStopTyping]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB limit for widget
      return file.size <= maxSize;
    });

    setAttachments(prev => [...prev, ...newFiles]);
  }, []);

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
  }, []);

  // Add emoji
  const addEmoji = useCallback((emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }, []);

  const isOverLimit = content.length > maxLength;

  return (
    <div
      className={cn(
        'relative bg-white border rounded-lg transition-all duration-200',
        isDragOver && 'border-blue-500 bg-blue-50',
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
            className="p-3 border-b bg-gray-50 flex flex-wrap gap-2"
          >
            {attachments.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 bg-white rounded px-2 py-1 text-xs border"
              >
                <span className="truncate max-w-[100px]">{file.name}</span>
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
      <div className="flex items-end gap-2 p-3">
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <Smiley className="h-4 w-4" />
            </Button>

            {/* Quick Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 z-50"
                >
                  <div className="grid grid-cols-4 gap-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              'min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0',
              isOverLimit && 'text-red-500'
            )}
          />

          {/* Character Count */}
          {content.length > maxLength * 0.8 && (
            <div className={cn(
              'absolute bottom-1 right-1 text-xs',
              isOverLimit ? 'text-red-500' : 'text-gray-400'
            )}>
              {content.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || (!content.trim() && attachments.length === 0) || isOverLimit}
          size="sm"
          className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
        >
          {isSending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            </motion.div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
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
              <Paperclip className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Drop files to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
