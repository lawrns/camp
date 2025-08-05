"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Command, Hash, Keyboard, MessageCircle as MessageCircle, Plus, ArrowBendUpLeft as Reply, Search as Search, Settings as Settings, Star, Trash as Trash2, User, Zap as Zap,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/unified-ui/components/input";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// Types
interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: string;
  action: () => void;
  context?: "global" | "conversation" | "composer";
  enabled: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (shortcut: KeyboardShortcut) => void;
  className?: string;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  onNewConversation?: () => void;
  onReply?: () => void;
  onArchive?: () => void;
  onStar?: () => void;
  onDelete?: () => void;
  onNextConversation?: () => void;
  onPreviousConversation?: () => void;
  onOpenSettings?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
}

// Default shortcuts configuration
const createShortcuts = (handlers: Partial<KeyboardShortcutsProviderProps>): KeyboardShortcut[] => [
  // Global shortcuts
  {
    id: "command-palette",
    name: "Command Palette",
    description: "Open command palette",
    keys: ["⌘", "K"],
    category: "Global",
    action: () => {},
    context: "global",
    enabled: true,
  },
  {
    id: "search",
    name: "Search",
    description: "Search conversations",
    keys: ["/"],
    category: "Global",
    action: handlers.onSearch || (() => {}),
    context: "global",
    enabled: true,
  },
  {
    id: "new-conversation",
    name: "New Conversation",
    description: "Start a new conversation",
    keys: ["C"],
    category: "Global",
    action: handlers.onNewConversation || (() => {}),
    context: "global",
    enabled: true,
  },
  {
    id: "settings",
    name: "Settings",
    description: "Open settings",
    keys: ["⌘", ","],
    category: "Global",
    action: handlers.onOpenSettings || (() => {}),
    context: "global",
    enabled: true,
  },
  {
    id: "escape",
    name: "Escape",
    description: "Close modals and cancel actions",
    keys: ["Escape"],
    category: "Global",
    action: handlers.onEscape || (() => {}),
    context: "global",
    enabled: true,
  },

  // Navigation shortcuts
  {
    id: "next-conversation",
    name: "Next Conversation",
    description: "Navigate to next conversation",
    keys: ["J"],
    category: "Navigation",
    action: handlers.onNextConversation || (() => {}),
    context: "conversation",
    enabled: true,
  },
  {
    id: "previous-conversation",
    name: "Previous Conversation",
    description: "Navigate to previous conversation",
    keys: ["K"],
    category: "Navigation",
    action: handlers.onPreviousConversation || (() => {}),
    context: "conversation",
    enabled: true,
  },

  // Conversation actions
  {
    id: "reply",
    name: "Reply",
    description: "Reply to conversation",
    keys: ["R"],
    category: "Actions",
    action: handlers.onReply || (() => {}),
    context: "conversation",
    enabled: true,
  },
  {
    id: "archive",
    name: "Archive",
    description: "Archive conversation",
    keys: ["E"],
    category: "Actions",
    action: handlers.onArchive || (() => {}),
    context: "conversation",
    enabled: true,
  },
  {
    id: "star",
    name: "Star",
    description: "Star/unstar conversation",
    keys: ["S"],
    category: "Actions",
    action: handlers.onStar || (() => {}),
    context: "conversation",
    enabled: true,
  },
  {
    id: "delete",
    name: "Delete",
    description: "Delete conversation",
    keys: ["⌘", "⌫"],
    category: "Actions",
    action: handlers.onDelete || (() => {}),
    context: "conversation",
    enabled: true,
  },

  // Composer shortcuts (handled by composer component)
  {
    id: "send-message",
    name: "Send Message",
    description: "Send the current message",
    keys: ["⌘", "Enter"],
    category: "Composer",
    action: () => {},
    context: "composer",
    enabled: true,
  },
  {
    id: "new-line",
    name: "New Line",
    description: "Insert new line in message",
    keys: ["Shift", "Enter"],
    category: "Composer",
    action: () => {},
    context: "composer",
    enabled: true,
  },
  {
    id: "mention",
    name: "Mention",
    description: "Mention team member",
    keys: ["@"],
    category: "Composer",
    action: () => {},
    context: "composer",
    enabled: true,
  },
  {
    id: "canned-response",
    name: "Canned Response",
    description: "Insert canned response",
    keys: ["/"],
    category: "Composer",
    action: () => {},
    context: "composer",
    enabled: true,
  },
];

const CATEGORIES = [
  { id: "all", name: "All", icon: Command },
  { id: "Global", name: "Global", icon: Settings },
  { id: "Navigation", name: "Navigation", icon: ArrowUp },
  { id: "Actions", name: "Actions", icon: Zap },
  { id: "Composer", name: "Composer", icon: MessageCircle },
];

// Command Palette Component
export function CommandPalette({ isOpen, onClose, onExecute, className }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [shortcuts] = useState(createShortcuts({}));

  // Filter shortcuts based on search and category
  const filteredShortcuts = React.useMemo(() => {
    let filtered = shortcuts;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s: unknown) => s.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.description.toLowerCase().includes(lowerQuery) ||
          s.keys.some((key) => key.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered.filter((s: unknown) => s.enabled);
  }, [shortcuts, searchQuery, selectedCategory]);

  // Reset selection when filtered shortcuts change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredShortcuts]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredShortcuts.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredShortcuts.length) % filteredShortcuts.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredShortcuts[selectedIndex]) {
            onExecute?.(filteredShortcuts[selectedIndex]);
            filteredShortcuts[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredShortcuts, selectedIndex, onExecute, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-command-palette]")) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-32">
      <div
        data-command-palette
        className={cn(
          "rounded-ds-lg border border-[var(--fl-color-border)] bg-white shadow-xl",
          "flex max-h-96 w-full max-w-2xl flex-col overflow-hidden",
          className
        )}
      >
        {/* Header with search */}
        <div className="flex items-center gap-3 border-b border-[var(--fl-color-border-subtle)] spacing-3">
          <Icon icon={Command} className="h-5 w-5 text-[var(--fl-color-text-muted)]" />
          <div className="relative flex-1">
            <Icon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="border-0 pl-10 text-base focus:ring-0"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-[var(--fl-spacing-1)] overflow-x-auto border-b border-[var(--fl-color-border-subtle)] spacing-3">
          {CATEGORIES.map((category: unknown) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "text-typography-sm h-8 whitespace-nowrap px-3",
                  isSelected && "bg-status-info-light text-status-info-dark"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredShortcuts.length === 0 ? (
            <div className="p-spacing-lg text-center text-[var(--fl-color-text-muted)]">
              <Icon icon={Keyboard} className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
              <p>No shortcuts found matching your search.</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredShortcuts.map((shortcut, index) => (
                <button
                  key={shortcut.id}
                  onClick={() => {
                    onExecute?.(shortcut);
                    shortcut.action();
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                    index === selectedIndex && "bg-status-info-light border-l-2 border-brand-blue-500"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{shortcut.name}</span>
                      <Badge variant="secondary" className="text-tiny rounded-full">
                        {shortcut.category}
                      </Badge>
                    </div>
                    <p className="text-foreground mt-1 text-sm">{shortcut.description}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-[var(--fl-spacing-1)]">
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <kbd className="bg-background rounded border border-[var(--fl-color-border)] px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] font-mono text-tiny">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && <span className="text-tiny text-gray-400">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] px-4 py-3">
          <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
            <span>↑↓ Navigate • Enter Execute • Esc Close</span>
            <span>{filteredShortcuts.length} shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keyboard Shortcuts Provider
export function KeyboardShortcutsProvider({ children, ...handlers }: KeyboardShortcutsProviderProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [shortcuts] = useState(createShortcuts(handlers));

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Only handle specific shortcuts in inputs
        if (e.key === "Escape") {
          handlers.onEscape?.();
        }
        return;
      }

      // Handle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Handle other shortcuts
      const matchingShortcut = shortcuts.find((shortcut) => {
        if (!shortcut.enabled) return false;

        // Handle single key shortcuts
        if (shortcut.keys.length === 1) {
          const key = shortcut.keys[0];
          if (!key) return false;
          if (key === "Escape") return e.key === "Escape";
          if (key === "/") return e.key === "/" && !e.metaKey && !e.ctrlKey;
          return e.key.toLowerCase() === key.toLowerCase() && !e.metaKey && !e.ctrlKey && !e.shiftKey;
        }

        // Handle multi-key shortcuts
        if (shortcut.keys.length === 2) {
          const [modifier, key] = shortcut.keys;
          if (modifier === "⌘" || modifier === "Ctrl") {
            return (e.metaKey || e.ctrlKey) && key && e.key.toLowerCase() === key.toLowerCase();
          }
          if (modifier === "Shift") {
            return e.shiftKey && key && e.key === key;
          }
        }

        return false;
      });

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, handlers]);

  return (
    <>
      {children}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onExecute={(shortcut) => {}}
      />
    </>
  );
}

// Hook for getting shortcuts info
export function useKeyboardShortcuts() {
  const [shortcuts] = useState(createShortcuts({}));

  const getShortcutByAction = useCallback(
    (actionId: string) => {
      return shortcuts.find((s) => s.id === actionId);
    },
    [shortcuts]
  );

  const getShortcutsByCategory = useCallback(
    (category: string) => {
      return shortcuts.filter((s: unknown) => s.category === category && s.enabled);
    },
    [shortcuts]
  );

  const formatShortcut = useCallback((keys: string[]) => {
    return keys.join(" + ");
  }, []);

  return {
    shortcuts: shortcuts.filter((s: unknown) => s.enabled),
    getShortcutByAction,
    getShortcutsByCategory,
    formatShortcut,
  };
}

// Shortcut display component
export function ShortcutBadge({ shortcutId, className }: { shortcutId: string; className?: string }) {
  const { getShortcutByAction } = useKeyboardShortcuts();
  const shortcut = getShortcutByAction(shortcutId);

  if (!shortcut) return null;

  return (
    <div className={cn("flex items-center gap-[var(--fl-spacing-1)]", className)}>
      {shortcut.keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="bg-background rounded border border-[var(--fl-color-border)] px-1.5 py-0.5 font-mono text-tiny">
            {key}
          </kbd>
          {index < shortcut.keys.length - 1 && <span className="text-tiny text-gray-400">+</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
