/**
 * Message Reactions Component
 *
 * Enables emoji reactions on messages for enhanced communication
 * Part of Phase 2: Core Feature Parity to match Intercom standards
 *
 * Features:
 * - Quick emoji reactions (👍, ❤️, 😊, 😢, 😮, 😡)
 * - Reaction counts and user lists
 * - Real-time reaction updates
 * - Hover interactions and animations
 * - Accessibility support
 */

import React, { useCallback, useState } from "react";
import { Plus, Smile } from "lucide-react";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onReactionAdd: (messageId: string, emoji: string) => void;
  onReactionRemove: (messageId: string, emoji: string) => void;
  currentUserId: string;
  isCompact?: boolean;
}

const QUICK_REACTIONS = ["👍", "❤️", "😊", "😢", "😮", "😡"];

const EMOJI_PICKER_REACTIONS = [
  "👍",
  "👎",
  "❤️",
  "💔",
  "😊",
  "😢",
  "😮",
  "😡",
  "🎉",
  "🔥",
  "💯",
  "👏",
  "🙌",
  "💪",
  "🤝",
  "🙏",
  "✨",
  "⭐",
  "✅",
  "❌",
  "🚀",
  "💡",
  "🎯",
  "📈",
  "📉",
  "⚡",
  "🌟",
  "💎",
  "🏆",
  "🎊",
];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  onReactionAdd,
  onReactionRemove,
  currentUserId,
  isCompact = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionTooltip, setShowReactionTooltip] = useState<string | null>(null);

  const handleReactionClick = useCallback(
    (emoji: string) => {
      const existingReaction = reactions.find((r) => r.emoji === emoji);

      if (existingReaction?.hasReacted) {
        onReactionRemove(messageId, emoji);
      } else {
        onReactionAdd(messageId, emoji);
      }
    },
    [messageId, reactions, onReactionAdd, onReactionRemove]
  );

  const handleEmojiPickerSelect = useCallback(
    (emoji: string) => {
      handleReactionClick(emoji);
      setShowEmojiPicker(false);
    },
    [handleReactionClick]
  );

  const getReactionTooltip = (reaction: Reaction): string => {
    if (reaction.count === 0) return "";

    if (reaction.count === 1) {
      return reaction.hasReacted ? "You reacted" : reaction.users[0] || "Someone reacted";
    }

    if (reaction.hasReacted) {
      const others = reaction.count - 1;
      return others === 0 ? "You reacted" : `You and ${others} other${others > 1 ? "s" : ""} reacted`;
    }

    return `${reaction.count} people reacted`;
  };

  // Filter out reactions with zero count
  const visibleReactions = reactions.filter((r) => r.count > 0);

  if (visibleReactions.length === 0 && !showEmojiPicker) {
    return (
      <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(true)}
            className="hover:bg-background hover:text-foreground flex items-center space-x-1 rounded-ds-full px-2 py-1 text-tiny text-[var(--fl-color-text-muted)] transition-colors"
            aria-label="Add reaction"
          >
            <Smile className="h-3 w-3" />
            <span>React</span>
          </button>

          {showEmojiPicker && (
            <div className="bg-background absolute bottom-full left-0 z-50 mb-2 rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-deep">
              <div className="mb-2 grid grid-cols-6 gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button type="button"
                    key={emoji}
                    onClick={() => handleEmojiPickerSelect(emoji)}
                    className="hover:bg-background flex h-8 w-8 items-center justify-center rounded text-base transition-colors"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="border-t border-[var(--fl-color-border)] pt-2">
                <div className="grid max-h-24 grid-cols-10 gap-1 overflow-y-auto">
                  {EMOJI_PICKER_REACTIONS.map((emoji) => (
                   <button type="button"
                      key={emoji}
                      onClick={() => handleEmojiPickerSelect(emoji)}
                      className="hover:bg-background flex h-6 w-6 items-center justify-center rounded text-sm transition-colors"
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

               <button type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="hover:text-foreground absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded text-gray-400"
                aria-label="Close emoji picker"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${isCompact ? "mt-1" : "mt-2"}`}>
      {/* Existing reactions */}
      {visibleReactions.map((reaction) => (
        <div
          key={reaction.emoji}
          className="relative"
          onMouseEnter={() => setShowReactionTooltip(reaction.emoji)}
          onMouseLeave={() => setShowReactionTooltip(null)}
        >
          <button
            type="button"
            onClick={() => handleReactionClick(reaction.emoji)}
            className={`flex items-center space-x-1 rounded-ds-full px-2 py-1 text-xs transition-all ${
              reaction.hasReacted
                ? "border border-[var(--fl-color-info-muted)] bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "border border-[var(--fl-color-border)] bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label={`${reaction.hasReacted ? "Remove" : "Add"} ${reaction.emoji} reaction`}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>

          {/* Reaction tooltip */}
          {showReactionTooltip === reaction.emoji && (
            <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-tiny text-white">
              {getReactionTooltip(reaction)}
              <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="hover:bg-background hover:text-foreground flex h-7 w-7 items-center justify-center rounded-ds-full text-gray-400 transition-colors"
          aria-label="Add reaction"
        >
          <Plus className="h-3 w-3" />
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="bg-background absolute bottom-full left-0 z-50 mb-2 rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-deep">
            <div className="mb-2 grid grid-cols-6 gap-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button type="button"
                  key={emoji}
                  onClick={() => handleEmojiPickerSelect(emoji)}
                  className="hover:bg-background flex h-8 w-8 items-center justify-center rounded text-base transition-colors"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="border-t border-[var(--fl-color-border)] pt-2">
              <div className="grid max-h-24 grid-cols-10 gap-1 overflow-y-auto">
                {EMOJI_PICKER_REACTIONS.map((emoji) => (
                <button type="button"
                    key={emoji}
                    onClick={() => handleEmojiPickerSelect(emoji)}
                    className="hover:bg-background flex h-6 w-6 items-center justify-center rounded text-sm transition-colors"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="hover:text-foreground absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded text-gray-400"
              aria-label="Close emoji picker"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />}
    </div>
  );
};
