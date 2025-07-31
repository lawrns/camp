"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, Clock, Heart, Smiley, HandWaving, Lightbulb, Football, Car, Pizza } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Emoji categories with comprehensive emoji sets
const EMOJI_CATEGORIES = {
  recent: {
    name: 'Recently Used',
    icon: Clock,
    emojis: [] as string[], // Will be populated from localStorage
  },
  smileys: {
    name: 'Smileys & People',
    icon: Smiley,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
      '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
      '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
      '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
    ],
  },
  gestures: {
    name: 'Gestures',
    icon: HandWaving,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
    ],
  },
  activities: {
    name: 'Activities',
    icon: Football,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
      '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺',
      '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆',
    ],
  },
  objects: {
    name: 'Objects',
    icon: Lightbulb,
    emojis: [
      '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
      '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨',
      '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣',
      '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️',
      '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹',
    ],
  },
  travel: {
    name: 'Travel & Places',
    icon: Car,
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
      '🚁', '🛸', '✈️', '🛩️', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵',
      '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇',
      '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🎡', '🎢',
    ],
  },
  food: {
    name: 'Food & Drink',
    icon: Pizza,
    emojis: [
      '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
      '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
      '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈',
      '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕',
    ],
  },
  nature: {
    name: 'Animals & Nature',
    icon: Heart,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢',
    ],
  },
};

interface EnhancedEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
  maxRecentEmojis?: number;
  showSearch?: boolean;
  showCategories?: boolean;
  position?: 'top' | 'bottom';
}

export function EnhancedEmojiPicker({
  onEmojiSelect,
  onClose,
  className,
  maxRecentEmojis = 24,
  showSearch = true,
  showCategories = true,
  position = 'bottom',
}: EnhancedEmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('campfire-recent-emojis');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentEmojis(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentEmojis([]);
      }
    }
  }, []);

  // Update recent emojis category
  useEffect(() => {
    EMOJI_CATEGORIES.recent.emojis = recentEmojis;
  }, [recentEmojis]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);

    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, maxRecentEmojis);
    setRecentEmojis(newRecent);
    localStorage.setItem('campfire-recent-emojis', JSON.stringify(newRecent));

    onClose?.();
  };

  // Filter emojis based on search
  const filteredEmojis = useMemo(() => {
    if (!searchQuery) {
      return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
    }

    // Search across all categories
    const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis);
    return allEmojis.filter(emoji => {
      // Simple search - could be enhanced with emoji names/keywords
      return emoji.includes(searchQuery.toLowerCase());
    });
  }, [activeCategory, searchQuery]);

  // Get category keys, filtering out recent if empty
  const categoryKeys = useMemo(() => {
    return Object.keys(EMOJI_CATEGORIES).filter(key => 
      key !== 'recent' || recentEmojis.length > 0
    );
  }, [recentEmojis.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
      className={cn(
        'bg-background border rounded-lg shadow-lg p-3 w-80 max-h-96',
        className
      )}
    >
      {/* Search */}
      {showSearch && (
        <div className="relative mb-3">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
            className="pl-10 h-8"
          />
        </div>
      )}

      {/* Categories */}
      {showCategories && !searchQuery && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {categoryKeys.map((key) => {
            const category = EMOJI_CATEGORIES[key as keyof typeof EMOJI_CATEGORIES];
            const Icon = category.icon;
            return (
              <Button
                key={key}
                variant={activeCategory === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(key)}
                className="h-8 w-8 p-0 flex-shrink-0"
                title={category.name}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <ScrollArea className="h-64">
        <div className="grid grid-cols-8 gap-1">
          <AnimatePresence mode="wait">
            {filteredEmojis.map((emoji, index) => (
              <motion.button
                key={`${emoji}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => handleEmojiSelect(emoji)}
                className="h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                title={emoji}
              >
                {emoji}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filteredEmojis.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <>
                <MagnifyingGlass className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emojis found for "{searchQuery}"</p>
              </>
            ) : activeCategory === 'recent' ? (
              <>
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent emojis</p>
                <p className="text-xs text-gray-400 mt-1">Start using emojis to see them here</p>
              </>
            ) : (
              <p className="text-sm">No emojis in this category</p>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t text-center">
        <p className="text-xs text-gray-400">
          {searchQuery ? `${filteredEmojis.length} emojis found` : 
           `${EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.name || 'Emojis'}`}
        </p>
      </div>
    </motion.div>
  );
}
