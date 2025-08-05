"use client";

/**
 * @deprecated This component is deprecated in favor of MessageItem + EmojiReactionModal
 * The new system uses click-based interactions instead of hover to prevent content displacement.
 * Use MessageItem for message rendering with built-in emoji reaction support.
 */
import { useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/unified-ui/tooltip";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
  messageId: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
  }>;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  className?: string;
}

const QUICK_REACTIONS = [
  { emoji: "😊", label: "Smile" },
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "⚡", label: "Zap" },
  { emoji: "🎉", label: "Party" },
  { emoji: "👏", label: "Clap" },
];

export function MessageReactions({
  messageId,
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  className,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showEmojiPicker && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.top - 60, // Position above the trigger
        left: rect.left,
      });
    }
  }, [showEmojiPicker]);

  const handleReactionClick = (emoji: string, hasReacted: boolean) => {
    if (hasReacted && onRemoveReaction) {
      onRemoveReaction(messageId, emoji);
    } else if (!hasReacted && onAddReaction) {
      onAddReaction(messageId, emoji);
    }
  };

  const handleQuickReaction = (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    if (existingReaction?.hasReacted && onRemoveReaction) {
      onRemoveReaction(messageId, emoji);
    } else if (onAddReaction) {
      onAddReaction(messageId, emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {/* Existing Reactions */}
        {reactions.map((reaction: unknown) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-typography-xs h-8 rounded-ds-full px-2 transition-all",
                  reaction.hasReacted
                    ? "bg-status-info-light text-status-info-dark border-status-info-light border"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
                onClick={() => handleReactionClick(reaction.emoji, reaction.hasReacted)}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {reaction.users.length > 0
                  ? `${reaction.users.slice(0, 3).join(", ")}${reaction.users.length > 3 ? ` and ${reaction.users.length - 3} more` : ""} reacted with ${reaction.emoji}`
                  : `React with ${reaction.emoji}`}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Add Reaction Button */}
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={triggerRef}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 rounded-ds-full p-0 transition-all",
                  showEmojiPicker
                    ? "bg-status-info-light text-status-info-dark"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Icon icon={Plus} className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add reaction</p>
            </TooltipContent>
          </Tooltip>

          {/* Quick Emoji Picker - Fixed positioning to prevent content displacement */}
          <OptimizedAnimatePresence>
            {showEmojiPicker && (
              <OptimizedMotion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-background z-50 rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm shadow-card-deep"
                style={{
                  position: "fixed",
                  top: pickerPosition.top,
                  left: pickerPosition.left,
                  pointerEvents: "auto",
                }}
              >
                <div className="flex items-center gap-1">
                  {QUICK_REACTIONS.map((reaction: unknown) => (
                    <Tooltip key={reaction.emoji}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-background h-8 w-8 rounded-ds-md p-0"
                          onClick={() => handleQuickReaction(reaction.emoji)}
                        >
                          {reaction.emoji}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{reaction.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </OptimizedMotion.div>
            )}
          </OptimizedAnimatePresence>
        </div>

        {/* Forward Button (from your image) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-background text-foreground ml-1 h-8 w-8 rounded-ds-full p-0 hover:bg-gray-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 12L21 12M21 12L15 6M21 12L15 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Forward message</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />}
    </TooltipProvider>
  );
}
