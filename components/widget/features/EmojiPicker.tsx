"use client";

/**
 * Lightweight Emoji Picker - Optimized for <5KB bundle size
 * No external dependencies, minimal emoji set
 */

import React, { useState } from "react";

interface EmojiPickerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: "bottom" | "top";
}

// Minimal emoji set for lightweight bundle
const EMOJI_CATEGORIES = {
  "😊": ["😀", "😃", "😊", "😍", "🥰", "😘", "😉", "😋", "😎", "🤩"],
  "👍": ["👍", "👎", "👌", "✌️", "🤞", "👏", "🙌", "🤝", "👋", "🙏"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕"],
  "🎉": ["🎉", "🎊", "🔥", "💯", "⭐", "✨", "🚀", "💎", "🏆", "🎯"],
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>("😊");

  return (
    <div className="bg-background border-ds-border mt-2 rounded-ds-lg border spacing-3 shadow-card-deep">
      {/* Category Tabs */}
      <div className="mb-3 flex space-x-1 border-b border-[var(--fl-color-border-subtle)] pb-2">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`rounded px-2 py-1 text-lg transition-colors ${
              activeCategory === category ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="grid max-h-32 grid-cols-5 gap-1 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => onEmojiSelect(emoji)}
            className="hover:bg-background flex h-8 w-8 items-center justify-center rounded text-base transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
