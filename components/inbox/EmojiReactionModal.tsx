"use client";

import React, { useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Heart, Smiley as Smile, ThumbsUp, Lightning as Zap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/unified-ui/components/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { cn } from "@/lib/utils";

interface EmojiReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
  }>;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

// Quick reaction emojis with labels
const QUICK_REACTIONS = [
  { emoji: "👍", label: "Like", icon: ThumbsUp },
  { emoji: "❤️", label: "Love", icon: Heart },
  { emoji: "😊", label: "Happy", icon: Smile },
  { emoji: "👏", label: "Clap", icon: null },
  { emoji: "🔥", label: "Fire", icon: Zap },
  { emoji: "😂", label: "Laugh", icon: null },
  { emoji: "😮", label: "Wow", icon: null },
  { emoji: "😢", label: "Sad", icon: null },
];

// Extended emoji categories for full picker
const EMOJI_CATEGORIES = {
  smileys: {
    label: "Smileys & People",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
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
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🤩",
      "🥳",
      "😏",
    ],
  },
  gestures: {
    label: "Gestures",
    emojis: [
      "👍",
      "👎",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👋",
      "🤚",
      "🖐",
      "✋",
      "🖖",
      "👏",
      "🙌",
      "🤲",
      "🤝",
      "🙏",
    ],
  },
  hearts: {
    label: "Hearts",
    emojis: [
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
      "💯",
      "💢",
      "💥",
      "💫",
    ],
  },
};

export function EmojiReactionModal({
  isOpen,
  onClose,
  messageId,
  messageContent,
  reactions = [],
  onAddReaction,
  onRemoveReaction,
}: EmojiReactionModalProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");
  const [showFullPicker, setShowFullPicker] = useState(false);

  const handleReactionClick = (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    if (existingReaction?.hasReacted && onRemoveReaction) {
      onRemoveReaction(messageId, emoji);
    } else if (onAddReaction) {
      onAddReaction(messageId, emoji);
    }
    onClose();
  };

  const getReactionCount = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction?.count || 0;
  };

  const hasUserReacted = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction?.hasReacted || false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">React to Message</DialogTitle>
          <div className="text-foreground mt-2 rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3 text-sm">
            <p className="line-clamp-2">{messageContent}</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Reactions */}
          <div>
            <h3 className="text-foreground mb-3 text-sm font-medium">Quick Reactions</h3>
            <div className="grid grid-cols-4 gap-ds-2">
              {QUICK_REACTIONS.map((reaction) => {
                const count = getReactionCount(reaction.emoji);
                const hasReacted = hasUserReacted(reaction.emoji);

                return (
                  <TooltipProvider key={reaction.emoji}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <OptimizedMotion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReactionClick(reaction.emoji)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-ds-lg border-2 spacing-3 transition-all",
                            hasReacted
                              ? "bg-status-info-light text-status-info-dark border-brand-blue-500"
                              : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)] hover:bg-neutral-50"
                          )}
                        >
                          <span className="text-3xl">{reaction.emoji}</span>
                          <span className="text-tiny font-medium">{reaction.label}</span>
                          {count > 0 && <span className="text-tiny text-[var(--fl-color-text-muted)]">({count})</span>}
                        </OptimizedMotion.button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{hasReacted ? `Remove ${reaction.label}` : `React with ${reaction.label}`}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Toggle Full Picker */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowFullPicker(!showFullPicker)} className="text-sm">
              {showFullPicker ? "Show Less" : "More Emojis"}
            </Button>
          </div>

          {/* Full Emoji Picker */}
          <OptimizedAnimatePresence>
            {showFullPicker && (
              <OptimizedMotion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Category Tabs */}
                <div className="mb-4 flex gap-1 border-b">
                  {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key as keyof typeof EMOJI_CATEGORIES)}
                      className={cn(
                        "text-typography-sm rounded-t-lg px-3 py-2 font-medium transition-colors",
                        activeCategory === key
                          ? "bg-status-info-light text-status-info-dark border-b-2 border-brand-blue-500"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                  {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => {
                    const count = getReactionCount(emoji);
                    const hasReacted = hasUserReacted(emoji);

                    return (
                      <TooltipProvider key={emoji}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <OptimizedMotion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReactionClick(emoji)}
                              className={cn(
                                "relative rounded-ds-md spacing-2 text-xl transition-all",
                                hasReacted ? "bg-status-info-light ring-2 ring-blue-500" : "hover:bg-gray-100"
                              )}
                            >
                              {emoji}
                              {count > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-ds-full bg-brand-blue-500 text-tiny text-white">
                                  {count}
                                </span>
                              )}
                            </OptimizedMotion.button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{hasReacted ? `Remove ${emoji}` : `React with ${emoji}`}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </OptimizedMotion.div>
            )}
          </OptimizedAnimatePresence>
        </div>

        {/* Existing Reactions Summary */}
        {reactions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-foreground mb-2 text-sm font-medium">Current Reactions</h4>
            <div className="flex flex-wrap gap-ds-2">
              {reactions.map((reaction) => (
                <div
                  key={reaction.emoji}
                  className="bg-background flex items-center gap-1 rounded-ds-full px-2 py-1 text-sm"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-foreground">{reaction.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
