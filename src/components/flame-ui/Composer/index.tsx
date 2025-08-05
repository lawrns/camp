"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import {
  Image,
  Microphone as Mic,
  Paperclip,
  PaperPlaneTilt as Send,
  Smiley as Smile,
  Sparkle as Sparkles,
  Square,
  X,
  Lightning as Zap,
} from "@phosphor-icons/react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";

// Export all the types for backward compatibility
export * from "./types";

// ===========================================
// COMPREHENSIVE COMPOSER INTERFACE
// ===========================================

export interface ComposerProps {
  // Core functionality
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onContentChange?: (content: string) => void;

  // Content & state
  value?: string;
  initialValue?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;

  // Feature toggles
  enableAttachments?: boolean;
  enableEmoji?: boolean;
  enableVoiceRecording?: boolean;
  enableAutoResize?: boolean;
  enableAISuggestions?: boolean;
  enableQuickReplies?: boolean;

  // Data
  suggestedResponses?: string[];
  aiSuggestions?: AISuggestion[];

  // Styling
  className?: string;
  variant?: "default" | "compact" | "widget";
}

export interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  category: "response" | "action" | "escalation";
  reasoning?: string;
}

// ===========================================
// EMOJI CATEGORIES - Improved from both versions
// ===========================================

const EMOJI_CATEGORIES = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "🤗",
  ],
  gestures: [
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤝",
    "👏",
    "🙌",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👆",
    "👇",
    "☝️",
    "👈",
    "👉",
    "🤘",
    "🤟",
  ],
  hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "♥️",
  ],
  objects: [
    "💼",
    "📱",
    "💻",
    "⌨️",
    "🖥️",
    "🖨️",
    "📞",
    "☎️",
    "📠",
    "📧",
    "📨",
    "📩",
    "📤",
    "📥",
    "📦",
    "📋",
    "📊",
    "📈",
    "📉",
    "📑",
  ],
  flags: [
    "🏁",
    "🚩",
    "🎌",
    "🏴",
    "🏳️",
    "🏳️‍🌈",
    "🏳️‍⚧️",
    "🏴‍☠️",
    "🇺🇸",
    "🇨🇦",
    "🇬🇧",
    "🇫🇷",
    "🇩🇪",
    "🇮🇹",
    "🇪🇸",
    "🇯🇵",
    "🇨🇳",
    "🇰🇷",
    "🇮🇳",
    "🇧🇷",
  ],
};

// ===========================================
// SAMPLE DATA - Improved from both versions
// ===========================================

const SAMPLE_QUICK_REPLIES = [
  "Thank you for contacting us! How can I help you today?",
  "I'm looking into this for you right now. Give me just a moment.",
  "I'll follow up with you shortly with more information.",
  "Let me connect you with a specialist who can better assist you.",
  "Is there anything else I can help you with today?",
  "I understand your concern and I'm here to help.",
  "Let me check on that for you.",
  "I apologize for any inconvenience this may have caused.",
];

const SAMPLE_AI_SUGGESTIONS: AISuggestion[] = [
  {
    id: "1",
    content: "Thank you for reaching out! I understand your concern and I'm here to help.",
    confidence: 0.9,
    category: "response",
    reasoning: "Professional and empathetic opening",
  },
  {
    id: "2",
    content: "Let me look into this issue for you right away.",
    confidence: 0.8,
    category: "response",
    reasoning: "Shows immediate action and care",
  },
  {
    id: "3",
    content: "I'll escalate this to our technical team for a faster resolution.",
    confidence: 0.7,
    category: "escalation",
    reasoning: "Appropriate for technical issues",
  },
];

// ===========================================
// MAIN COMPOSER COMPONENT
// ===========================================

export const Composer = memo(function Composer({
  onSend,
  onTyping,
  onStopTyping,
  onContentChange,
  value,
  initialValue = "",
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  enableAttachments = true,
  enableEmoji = true,
  enableVoiceRecording = false,
  enableAutoResize = true,
  enableAISuggestions = false,
  enableQuickReplies = true,
  suggestedResponses = SAMPLE_QUICK_REPLIES,
  aiSuggestions = SAMPLE_AI_SUGGESTIONS,
  className,
  variant = "default",
}: ComposerProps) {
  // ===========================================
  // STATE MANAGEMENT
  // ===========================================

  const [content, setContent] = useState(value || initialValue);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");

  // ===========================================
  // REFS
  // ===========================================

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===========================================
  // EFFECTS
  // ===========================================

  // Sync with controlled value
  useEffect(() => {
    if (value !== undefined && value !== content) {
      setContent(value);
    }
  }, [value]);

  // Update content when initialValue changes
  useEffect(() => {
    if (initialValue !== content && !value) {
      setContent(initialValue);
    }
  }, [initialValue, content, value]);

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================

  const adjustTextareaHeight = useCallback(() => {
    if (enableAutoResize && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [enableAutoResize]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  // ===========================================
  // EVENT HANDLERS
  // ===========================================

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      adjustTextareaHeight();

      // Show/hide quick replies based on content
      setShowQuickReplies(newContent.trim().length === 0 && enableQuickReplies && suggestedResponses.length > 0);

      // Show AI suggestions for partially typed content
      setShowAISuggestions(enableAISuggestions && newContent.trim().length > 0 && newContent.trim().length < 50);

      // Notify parent of content change
      if (onContentChange) {
        onContentChange(newContent);
      }

      // Trigger typing indicator
      if (newContent.trim().length > 0 && onTyping) {
        onTyping();
      } else if (newContent.trim().length === 0 && onStopTyping) {
        onStopTyping();
      }
    }
  };

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;

    try {
      if (onStopTyping) {
        onStopTyping();
      }

      await onSend(content.trim(), attachments.length > 0 ? attachments : undefined);

      // Clear on successful send
      setContent("");
      setAttachments([]);
      setShowQuickReplies(enableQuickReplies && suggestedResponses.length > 0);
      setShowAISuggestions(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) { }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickReplyClick = (reply: string) => {
    setContent(reply);
    setShowQuickReplies(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    }, 0);
  };

  const handleAISuggestionClick = (suggestion: AISuggestion) => {
    setContent(suggestion.content);
    setShowAISuggestions(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
        adjustTextareaHeight();
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  // ===========================================
  // COMPUTED VALUES
  // ===========================================

  const canSend = content.trim().length > 0 || attachments.length > 0;
  const characterCount = content.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  const isCompact = variant === "compact";
  const isWidget = variant === "widget";

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div
      className={cn(
        "message-composer-container overflow-hidden border-t bg-background transition-all duration-200",
        isWidget && "rounded-ds-lg border-[var(--fl-color-border)] shadow-lg",
        isCompact && "border-t-0",
        className
      )}
      data-testid="message-composer-container"
    >
      {/* AI Suggestions */}
      {enableAISuggestions && showAISuggestions && aiSuggestions.length > 0 && (
        <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 spacing-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Sparkles} className="h-4 w-4 text-blue-600" />
              <span className="text-foreground text-sm font-medium">AI Suggestions</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAISuggestions(false)} className="h-6 w-6 p-0">
              <Icon icon={X} className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-spacing-sm">
            {aiSuggestions.map((suggestion: unknown) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                onClick={() => handleAISuggestionClick(suggestion)}
                className="hover:border-status-info-light h-auto w-full justify-start px-3 py-2 text-left hover:bg-[var(--fl-color-info-subtle)]"
              >
                <div className="flex w-full items-start justify-between gap-ds-2">
                  <span className="flex-1 text-sm">{suggestion.content}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-tiny text-muted-foreground">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {enableQuickReplies && showQuickReplies && suggestedResponses.length > 0 && (
        <div className="border-b border-[var(--fl-color-border-subtle)] spacing-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Zap} className="h-4 w-4 text-blue-600" />
              <span className="text-foreground text-sm font-medium">Quick Replies</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowQuickReplies(false)} className="h-6 w-6 p-0">
              <Icon icon={X} className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-ds-2">
            {suggestedResponses.map((response, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReplyClick(response)}
                className="hover:border-status-info-light h-8 px-3 text-tiny hover:bg-[var(--fl-color-info-subtle)]"
              >
                {response.length > 40 ? `${response.slice(0, 40)}...` : response}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-b spacing-3">
          <div className="flex flex-wrap gap-ds-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-ds-2 rounded-ds-lg bg-muted px-3 py-2 text-tiny">
                <div className="flex items-center gap-ds-2">
                  {file.type.startsWith("image/") ? (
                    <Icon icon={Image} className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Icon icon={Paperclip} className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="max-w-32 truncate font-medium">{file.name}</p>
                    <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-4 w-4 p-0 hover:bg-destructive/10"
                  disabled={disabled}
                >
                  <Icon icon={X} className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="spacing-3">
        <div className="flex items-end gap-ds-2">
          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "resize-none border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0",
                "bg-background placeholder:text-muted-foreground",
                enableAutoResize ? "max-h-[120px] min-h-[40px]" : "h-[40px]",
                isCompact && "text-typography-xs h-[32px] min-h-[32px] py-1.5",
                isWidget && "border-[var(--fl-color-border-strong)] focus:border-brand-blue-500 focus:ring-blue-500/20",
                "min-h-[44px]"
              )}
              rows={1}
              data-testid="composer-textarea"
              className="min-h-[44px]"
              aria-label="Message input"
            />

            {/* Character Count */}
            {isNearLimit && (
              <div
                className={cn(
                  "text-typography-xs pointer-events-none absolute bottom-1 right-2",
                  characterCount >= maxLength ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {characterCount}/{maxLength}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Attachment Button */}
            {enableAttachments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={cn("h-8 w-8 p-0", isCompact && "h-6 w-6")}
                title="Attach file"
                aria-label="Attach file"
              >
                <Icon icon={Paperclip} className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
              </Button>
            )}

            {/* Quick Replies Toggle */}
            {enableQuickReplies && suggestedResponses.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 p-0", isCompact && "h-6 w-6")}
                title="Quick replies"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                aria-label="Quick replies"
              >
                <Icon icon={Zap} className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
              </Button>
            )}

            {/* AI Suggestions Toggle */}
            {enableAISuggestions && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 p-0", isCompact && "h-6 w-6")}
                title="AI suggestions"
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                aria-label="AI suggestions"
              >
                <Icon icon={Sparkles} className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
              </Button>
            )}

            {/* Emoji Button */}
            {enableEmoji && (
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className={cn("h-8 w-8 p-0", isCompact && "h-6 w-6")}
                    title="Add emoji"
                    aria-label="Open emoji picker"
                  >
                    <Icon icon={Smile} className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="border-b border-[var(--fl-color-border)] p-spacing-sm">
                    <div className="text-foreground mb-2 text-sm font-medium">Choose an emoji</div>
                    {/* Category Tabs */}
                    <div className="flex gap-1">
                      {Object.keys(EMOJI_CATEGORIES).map((category: unknown) => (
                        <Button
                          key={category}
                          variant={selectedEmojiCategory === category ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                          className="h-6 px-2 text-tiny"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto spacing-3">
                    {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-background h-8 w-8 text-base"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Voice Recording Button */}
            {enableVoiceRecording && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleRecording}
                disabled={disabled}
                className={cn(
                  "h-8 w-8 p-0",
                  isCompact && "h-6 w-6",
                  isRecording && "text-brand-mahogany-500 hover:text-status-error"
                )}
                title="Record voice message"
                aria-label="Record voice message"
              >
                {isRecording ? (
                  <Icon icon={Square} className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
                ) : (
                  <Icon icon={Mic} className={cn("h-4 w-4", isCompact && "h-3 w-3")} />
                )}
              </Button>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={disabled || !canSend}
              size="sm"
              className={cn(
                "touch-target h-10 w-10 rounded-ds-lg p-0 transition-all duration-200",
                isCompact && "h-8 w-8",
                canSend
                  ? "bg-blue-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                  : "bg-neutral-100 text-neutral-400"
              )}
              title="Send message"
              data-testid="composer-send-button"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label="Send message"
            >
              <Icon icon={Send} className={cn("h-5 w-5", isCompact && "h-4 w-4")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
      />
    </div>
  );
});

// ===========================================
// SPECIALIZED COMPOSER VARIANTS
// ===========================================

export const CompactComposer = memo(function CompactComposer(props: Omit<ComposerProps, "variant">) {
  return <Composer {...props} variant="compact" />;
});

export const WidgetComposer = memo(function WidgetComposer(props: Omit<ComposerProps, "variant">) {
  return <Composer {...props} variant="widget" />;
});

// ===========================================
// LEGACY COMPATIBILITY COMPONENTS
// ===========================================

export const MessageComposer = Composer;
export const UnifiedMessageComposer = Composer;

// Default export for convenience
export default Composer;
