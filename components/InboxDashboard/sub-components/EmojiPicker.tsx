// EmojiPicker component for emoji selection

import * as React from "react";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { emojiPickerEmojis } from "../constants/messageTemplates";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Emoji picker component with search and categories
 */
export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Emoji categories
  const emojiCategories = {
    "Smileys & People": [
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
    Gestures: [
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
      "👇",
      "☝️",
      "✋",
      "🤚",
      "🖐️",
      "🖖",
      "👋",
      "🤝",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤜",
    ],
    Hearts: [
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
    Objects: [
      "💼",
      "📁",
      "📂",
      "🗂️",
      "📅",
      "📆",
      "🗓️",
      "📇",
      "🗃️",
      "🗄️",
      "📋",
      "📌",
      "📍",
      "📎",
      "🖇️",
      "📏",
      "📐",
      "✂️",
      "🗃️",
      "🗄️",
      "🗑️",
      "🔒",
      "🔓",
      "🔏",
    ],
  };

  // Filter emojis based on search
  const filteredEmojis = searchQuery
    ? emojiPickerEmojis.filter((emoji) =>
        // Simple search - in a real app you'd have emoji names/keywords
        emoji.includes(searchQuery)
      )
    : null;

  return (
    <div className="bg-background absolute bottom-full left-0 right-0 z-20 mb-2 max-h-80 overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)] shadow-card-deep">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] spacing-3">
        <h3 className="text-sm font-medium text-gray-900">Emoji</h3>
        <button type="button" onClick={onClose} className="hover:text-foreground text-gray-400" aria-label="Close emoji picker">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-[var(--fl-color-border)] spacing-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-ds-border-strong block w-full rounded-ds-md border py-2 pl-10 pr-3 text-sm focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Emoji grid */}
      <div className="max-h-60 overflow-y-auto">
        {filteredEmojis ? (
          // Search results
          <div className="spacing-3">
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <button type="button"
                  key={index}
                  onClick={() => onSelectEmoji(emoji)}
                  className="hover:bg-background rounded p-spacing-sm text-base transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {filteredEmojis.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--fl-color-text-muted)]">No emoji found</p>
            )}
          </div>
        ) : (
          // Categories
          <div className="space-y-3 spacing-3">
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category}>
                <h4 className="text-foreground mb-2 text-tiny font-medium">{category}</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button type="button"
                      key={index}
                      onClick={() => onSelectEmoji(emoji)}
                      className="hover:bg-background rounded p-spacing-sm text-base transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently used (placeholder) */}
      <div className="border-t border-[var(--fl-color-border)] spacing-3">
        <h4 className="text-foreground mb-2 text-tiny font-medium">Recently Used</h4>
        <div className="grid grid-cols-8 gap-1">
          {["😊", "👍", "❤️", "😂", "🎉", "👏", "🔥", "💯"].map((emoji, index) => (
            <button type="button"
              key={index}
              onClick={() => onSelectEmoji(emoji)}
              className="hover:bg-background rounded p-spacing-sm text-base transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
