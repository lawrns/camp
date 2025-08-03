"use client";

import React, { useState } from "react";
import { Smile } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { ComposerPluginProps, Emoji } from "../types";

const EMOJI_CATEGORIES = {
  smileys: [
    { id: "1", native: "😀", name: "grinning", category: "smileys", keywords: ["happy", "smile"] },
    { id: "2", native: "😃", name: "smiley", category: "smileys", keywords: ["happy", "smile"] },
    { id: "3", native: "😄", name: "smile", category: "smileys", keywords: ["happy", "smile"] },
    { id: "4", native: "😁", name: "grin", category: "smileys", keywords: ["happy", "smile"] },
    { id: "5", native: "😅", name: "sweat_smile", category: "smileys", keywords: ["happy", "sweat"] },
    { id: "6", native: "😂", name: "joy", category: "smileys", keywords: ["laugh", "tears"] },
    { id: "7", native: "🤣", name: "rofl", category: "smileys", keywords: ["laugh", "rolling"] },
    { id: "8", native: "😊", name: "blush", category: "smileys", keywords: ["happy", "blush"] },
    { id: "9", native: "😇", name: "innocent", category: "smileys", keywords: ["angel", "halo"] },
    { id: "10", native: "🙂", name: "slightly_smiling", category: "smileys", keywords: ["smile"] },
    { id: "11", native: "🙃", name: "upside_down", category: "smileys", keywords: ["silly"] },
    { id: "12", native: "😉", name: "wink", category: "smileys", keywords: ["wink"] },
    { id: "13", native: "😌", name: "relieved", category: "smileys", keywords: ["calm"] },
    { id: "14", native: "😍", name: "heart_eyes", category: "smileys", keywords: ["love", "heart"] },
    { id: "15", native: "🥰", name: "smiling_face_with_hearts", category: "smileys", keywords: ["love"] },
    { id: "16", native: "😘", name: "kissing_heart", category: "smileys", keywords: ["kiss", "love"] },
  ],
  gestures: [
    { id: "17", native: "👍", name: "thumbs_up", category: "gestures", keywords: ["good", "yes"] },
    { id: "18", native: "👎", name: "thumbs_down", category: "gestures", keywords: ["bad", "no"] },
    { id: "19", native: "👌", name: "ok_hand", category: "gestures", keywords: ["ok", "good"] },
    { id: "20", native: "✌️", name: "victory", category: "gestures", keywords: ["peace", "victory"] },
    { id: "21", native: "🤞", name: "crossed_fingers", category: "gestures", keywords: ["luck", "hope"] },
    { id: "22", native: "🤝", name: "handshake", category: "gestures", keywords: ["deal", "agreement"] },
    { id: "23", native: "👏", name: "clap", category: "gestures", keywords: ["applause", "clap"] },
    { id: "24", native: "🙌", name: "raised_hands", category: "gestures", keywords: ["celebration", "praise"] },
    { id: "25", native: "👋", name: "wave", category: "gestures", keywords: ["hello", "goodbye"] },
    { id: "26", native: "🤚", name: "raised_back_of_hand", category: "gestures", keywords: ["stop"] },
    { id: "27", native: "🖐️", name: "hand_splayed", category: "gestures", keywords: ["five", "stop"] },
    { id: "28", native: "✋", name: "raised_hand", category: "gestures", keywords: ["stop", "high_five"] },
  ],
  hearts: [
    { id: "29", native: "❤️", name: "red_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "30", native: "🧡", name: "orange_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "31", native: "💛", name: "yellow_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "32", native: "💚", name: "green_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "33", native: "💙", name: "blue_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "34", native: "💜", name: "purple_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "35", native: "🖤", name: "black_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "36", native: "🤍", name: "white_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "37", native: "🤎", name: "brown_heart", category: "hearts", keywords: ["love", "heart"] },
    { id: "38", native: "💔", name: "broken_heart", category: "hearts", keywords: ["sad", "broken"] },
    { id: "39", native: "❣️", name: "heart_exclamation", category: "hearts", keywords: ["love"] },
    { id: "40", native: "💕", name: "two_hearts", category: "hearts", keywords: ["love"] },
  ],
};

export function EmojiPlugin({ pluginId, content, onContentChange, onAction, disabled }: ComposerPluginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");

  const handleEmojiSelect = (emoji: Emoji) => {
    const newContent = content + emoji.native;
    onContentChange(newContent);
    onAction(pluginId, "emoji-selected", emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Emoji Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-ds-md",
          "transition-colors duration-200 hover:bg-[--bg-subtle]",
          "text-[--text-muted] hover:text-[--text-primary]",
          isOpen && "bg-[--bg-subtle] text-[--text-primary]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        title="Add emoji"
      >
        <Icon icon={Smile} className="h-4 w-4" />
      </button>

      {/* Emoji Picker */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full right-0 mb-2 w-80 bg-white",
            "z-50 rounded-ds-lg border border-[--border-subtle] shadow-lg"
          )}
        >
          {/* Category Tabs */}
          <div className="flex border-b border-[--border-subtle] p-spacing-sm">
            {Object.keys(EMOJI_CATEGORIES).map((category: any) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
                className={cn(
                  "text-typography-sm rounded-ds-md px-3 py-1 transition-colors duration-200",
                  selectedCategory === category
                    ? "bg-[--color-primary] text-white"
                    : "text-[--text-muted] hover:bg-[--bg-subtle] hover:text-[--text-primary]"
                )}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto spacing-3">
            {EMOJI_CATEGORIES[selectedCategory].map((emoji: any) => (
              <button
                key={emoji.id}
                onClick={() => handleEmojiSelect(emoji)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center text-lg",
                  "rounded transition-colors duration-200 hover:bg-[--bg-subtle]"
                )}
                title={emoji.name}
              >
                {emoji.native}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
