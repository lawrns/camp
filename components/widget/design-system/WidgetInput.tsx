/**
 * PIXEL-PERFECT WIDGET INPUT COMPONENT
 *
 * Meticulously designed input area with perfect alignment,
 * auto-resize, and Intercom-quality interactions
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACING, TYPOGRAPHY, COLORS, RADIUS, SHADOWS, LAYOUT, ANIMATIONS } from './tokens';
import { EmojiPicker } from '../features/EmojiPicker';

// ============================================================================
// TYPES
// ============================================================================
export interface WidgetInputProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  maxRows?: number;
  autoFocus?: boolean;
  className?: string;
  onSend: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  // NEW: Advanced features
  onFileSelect?: (files: File[]) => void;
  onFileUpload?: (file: File) => Promise<string>;
  maxFileSize?: number;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  enableFileUpload?: boolean;
}

// ============================================================================
// SEND BUTTON COMPONENT
// ============================================================================
function SendButton({ 
  disabled, 
  onClick 
}: { 
  disabled: boolean; 
  onClick: () => void; 
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: RADIUS.full,
        backgroundColor: disabled ? COLORS.border : COLORS.primary[500],
        color: 'white',
        border: 'none',
        boxShadow: disabled ? 'none' : SHADOWS.button,
      }}
      aria-label="Send message"
      data-testid="widget-send-button"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 3 3 9-3 9 19-9Z" />
        <path d="m6 12 13 0" />
      </svg>
    </motion.button>
  );
}

// ============================================================================
// EMOJI BUTTON COMPONENT
// ============================================================================
function EmojiButton({ 
  onClick 
}: { 
  onClick: () => void; 
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className="flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: RADIUS.md,
        backgroundColor: 'transparent',
        color: COLORS.agent.timestamp,
        border: 'none',
      }}
      aria-label="Add emoji"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 9 1.5 1.5L12 9l1.5 1.5L15 9" />
        <path d="M8 15s1.5 2 4 2 4-2 4-2" />
      </svg>
    </motion.button>
  );
}

// ============================================================================
// FILE UPLOAD BUTTON COMPONENT
// ============================================================================
function FileUploadButton({ 
  onClick,
  disabled = false
}: { 
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: RADIUS.md,
        backgroundColor: 'transparent',
        color: COLORS.agent.timestamp,
        border: 'none',
      }}
      aria-label="Upload file"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </motion.button>
  );
}

// ============================================================================
// PIXEL-PERFECT WIDGET INPUT
// ============================================================================
export function WidgetInput({
  value: controlledValue,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 2000,
  maxRows = 6,
  autoFocus = false,
  className,
  onSend,
  onTyping,
  onStopTyping,
  onChange,
  onFocus,
  onBlur,
  // NEW: Advanced features
  onFileSelect,
  onFileUpload,
  maxFileSize = 10,
  maxFiles = 5,
  acceptedFileTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt", "video/*", "audio/*"],
  enableFileUpload = false,
}: WidgetInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use controlled or uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledValue !== undefined ? onChange : setInternalValue;

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to calculate new height
    textarea.style.height = 'auto';
    
    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = parseInt(TYPOGRAPHY.input.lineHeight, 10);
    const padding = 24; // 12px top + 12px bottom
    const minHeight = lineHeight + padding;
    const maxHeight = (lineHeight * maxRows) + padding;
    
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  // Handle input change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    
    // Enforce max length
    if (newValue.length > maxLength) return;
    
    setValue?.(newValue);
    adjustTextareaHeight();

    // Handle typing indicators
    if (newValue.length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout for stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onStopTyping?.();
    }, 1000);
  }, [setValue, adjustTextareaHeight, maxLength, isTyping, onTyping, onStopTyping]);

  // Handle send
  const handleSend = useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue || disabled) return;

    onSend(trimmedValue);
    setValue?.('');

    // Reset textarea height
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);

    // Clear typing state
    setIsTyping(false);
    onStopTyping?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [value, disabled, onSend, setValue, adjustTextareaHeight, onStopTyping]);

  // Handle key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    const newValue = value + emoji;
    setValue?.(newValue);
    setShowEmojiPicker(false);

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [value, setValue]);

  // File upload handlers
  const handleFileUploadClick = useCallback(() => {
    if (enableFileUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [enableFileUpload]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onFileSelect) {
      const fileArray = Array.from(files);
      onFileSelect(fileArray);
    }
    // Reset input value
    if (event.target) {
      event.target.value = '';
    }
  }, [onFileSelect]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Adjust height on mount and value change
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: parseFloat(ANIMATIONS.normal) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex items-end gap-2 transition-all duration-200',
        className
      )}
      style={{
        padding: '12px',
        backgroundColor: COLORS.background,
        borderTop: `1px solid ${COLORS.border}`,
      }}
      data-campfire-widget-input
    >
      {/* Emoji button */}
      <div className="relative" ref={emojiPickerRef}>
        <EmojiButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>

      {/* File upload button */}
      {enableFileUpload && (
        <FileUploadButton 
          onClick={handleFileUploadClick}
          disabled={disabled}
        />
      )}

      {/* Input container */}
      <div
        className={cn(
          'flex-1 relative transition-all duration-200',
          isFocused && 'ring-2 ring-offset-2'
        )}
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${isFocused ? COLORS.primary[300] : COLORS.border}`,
          borderRadius: RADIUS.input,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          data-testid="widget-message-input"
          className={cn(
            'w-full resize-none border-none outline-none bg-transparent',
            'placeholder:text-gray-400',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          data-campfire-message-input
          style={{
            padding: LAYOUT.input.padding,
            fontSize: TYPOGRAPHY.input.fontSize,
            lineHeight: TYPOGRAPHY.input.lineHeight,
            fontWeight: TYPOGRAPHY.input.fontWeight,
            fontFamily: TYPOGRAPHY.messageText.fontFamily,
            minHeight: LAYOUT.input.minHeight,
            maxHeight: LAYOUT.input.maxHeight,
          }}
        />

        {/* Character count */}
        {value.length > maxLength * 0.8 && (
          <div
            className="absolute bottom-2 right-2 text-xs"
            style={{
              color: value.length >= maxLength ? '#ef4444' : COLORS.agent.timestamp,
            }}
          >
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      {/* Send button */}
      <SendButton disabled={!canSend} onClick={handleSend} />

      {/* Hidden file input */}
      {enableFileUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept={acceptedFileTypes.join(',')}
          className="hidden"
          disabled={disabled}
        />
      )}
    </motion.div>
  );
}
