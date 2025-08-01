"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt as Send, 
  Smiley, 
  Paperclip, 
  Image as ImageIcon,
  X,
  Plus
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/unified-ui/components/tooltip';

interface WidgetComposerProps {
  onSend: (content: string, attachments?: File[]) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function WidgetComposer({
  onSend,
  onTyping,
  onStopTyping,
  value: controlledValue,
  placeholder = "Message...",
  disabled = false,
  className
}: WidgetComposerProps) {
  const [currentValue, setCurrentValue] = useState(controlledValue || '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max 5 lines approximately
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);

  // Handle content change
  const handleContentChange = useCallback((value: string) => {
    setCurrentValue(value);
    adjustTextareaHeight();
    
    // Handle typing indicators
    if (value.trim()) {
      onTyping?.();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 1000);
    } else {
      onStopTyping?.();
    }
  }, [onTyping, onStopTyping, adjustTextareaHeight]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!currentValue.trim() && attachments.length === 0) return;
    if (disabled || isSending) return;

    try {
      setIsSending(true);

      // Clear typing timeout immediately when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      await onSend(currentValue.trim(), attachments);

      // Clear form
      setCurrentValue('');
      setAttachments([]);
      onStopTyping?.();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [currentValue, attachments, disabled, isSending, onSend, onStopTyping]);

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
      const maxSize = 10 * 1024 * 1024; // 10MB
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

  // Update controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setCurrentValue(controlledValue);
    }
  }, [controlledValue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const hasContent = currentValue.trim() || attachments.length > 0;
  const canSend = hasContent && !disabled && !isSending;

  return (
    <TooltipProvider>
      <div className={cn("sticky bottom-0 border-t bg-white z-10", className)}>
        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3 pb-2"
            >
              <div className="flex flex-wrap gap-2">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove attachment</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Composer */}
        <div
          ref={composerRef}
          className={cn(
            "relative transition-all duration-200",
            isDragOver && "bg-blue-50",
            isFocused && "bg-gray-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-end gap-3 p-4">
            {/* Action Buttons (Left) */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={disabled}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Smiley className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={currentValue}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  onStopTyping?.();
                }}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent p-0 text-sm placeholder-gray-500 focus:outline-none focus:ring-0",
                  "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                )}
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={cn(
                    "p-2 rounded-full transition-all duration-200 flex items-center justify-center",
                    canSend
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
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
      </div>
    </TooltipProvider>
  );
}