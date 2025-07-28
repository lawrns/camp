"use client";

import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Input } from "@/components/unified-ui/components/input";
import { useCannedResponses } from "@/hooks/useCannedResponses";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import {
  Clock,
  Copy,
  Hash,
  ChatCircle as MessageCircle,
  Plus,
  MagnifyingGlass as Search,
  Gear as Settings,
  Star,
  Lightning as Zap,
} from "@phosphor-icons/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Types
interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut?: string;
  tags: string[];
  usage_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface CannedResponsesProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  onResponseSelect?: (response: CannedResponse) => void;
  organizationId?: string;
  className?: string;
  trigger?: string; // Character that triggers the dropdown (default: "/")
}

// Real canned responses data is now fetched from API via useCannedResponses hook

const CATEGORIES = [
  { id: "all", name: "All", icon: MessageCircle, color: "bg-gray-100 text-gray-700" },
  { id: "greeting", name: "Greetings", icon: MessageCircle, color: "bg-blue-100 text-blue-700" },
  { id: "action", name: "Actions", icon: Zap, color: "bg-yellow-100 text-yellow-700" },
  { id: "security", name: "Security", icon: Settings, color: "bg-red-100 text-red-700" },
  { id: "escalation", name: "Escalation", icon: Plus, color: "bg-purple-100 text-purple-700" },
  { id: "follow-up", name: "Follow-up", icon: Clock, color: "bg-green-100 text-green-700" },
  { id: "closing", name: "Closing", icon: MessageCircle, color: "bg-indigo-100 text-indigo-700" },
  { id: "technical", name: "Technical", icon: Settings, color: "bg-orange-100 text-orange-700" },
  { id: "billing", name: "Billing", icon: Hash, color: "bg-pink-100 text-pink-700" },
];

export function CannedResponses({
  textareaRef,
  value,
  onChange,
  onResponseSelect,
  organizationId,
  className,
  trigger = "/",
}: CannedResponsesProps) {
  // Use real data from API instead of mock data
  const { responses: apiResponses, loading, error } = useCannedResponses();

  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<CannedResponse[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [triggerPosition, setTriggerPosition] = useState({ start: 0, end: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update local state when API data changes
  useEffect(() => {
    if (apiResponses.length > 0) {
      setResponses(apiResponses);
    } else if (!loading && !error) {
      // If no API responses and not loading, use empty array
      setResponses([]);
    }
  }, [apiResponses, loading, error]);

  // Filter responses based on search and category
  const filterResponses = useCallback(
    (query: string, category: string) => {
      let filtered = responses;

      // Filter by category
      if (category !== "all") {
        filtered = filtered.filter((r: any) => r.category === category);
      }

      // Filter by search query
      if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title.toLowerCase().includes(lowerQuery) ||
            r.content.toLowerCase().includes(lowerQuery) ||
            r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
            r.shortcut?.toLowerCase().includes(lowerQuery)
        );
      }

      // Sort by usage count and favorites
      filtered.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (b.is_favorite && !a.is_favorite) return 1;
        return b.usage_count - a.usage_count;
      });

      return filtered;
    },
    [responses]
  );

  // Update filtered responses when search or category changes
  useEffect(() => {
    setFilteredResponses(filterResponses(searchQuery, selectedCategory));
    setSelectedIndex(0);
  }, [searchQuery, selectedCategory, filterResponses]);

  // Handle text changes and detect trigger
  const handleTextChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = newValue.substring(0, cursorPos);

      // Find the last trigger character before cursor
      const lastTriggerIndex = textBeforeCursor.lastIndexOf(trigger);

      if (lastTriggerIndex !== -1) {
        // Check if trigger is at start or preceded by whitespace
        const charBeforeTrigger = lastTriggerIndex === 0 ? " " : textBeforeCursor[lastTriggerIndex - 1];
        if (charBeforeTrigger === " " || charBeforeTrigger === "\n" || lastTriggerIndex === 0) {
          const query = textBeforeCursor.substring(lastTriggerIndex + 1);

          // Only show suggestions if query doesn't contain spaces
          if (!query.includes(" ") && !query.includes("\n")) {
            setSearchQuery(query);
            setTriggerPosition({ start: lastTriggerIndex, end: cursorPos });
            setIsOpen(true);

            // Focus search input after opening
            setTimeout(() => {
              searchInputRef.current?.focus();
            }, 0);
            return;
          }
        }
      }

      // Close suggestions if no valid trigger context
      setIsOpen(false);
    },
    [onChange, textareaRef, trigger]
  );

  // Handle response selection
  const selectResponse = useCallback(
    (response: CannedResponse) => {
      const newValue =
        value.substring(0, triggerPosition.start) + response.content + " " + value.substring(triggerPosition.end);

      onChange(newValue);
      onResponseSelect?.(response);

      // Update usage count
      setResponses((prev) =>
        prev.map((r: any) => (r.id === response.id ? { ...r, usage_count: r.usage_count + 1 } : r))
      );

      setIsOpen(false);
      setSearchQuery("");

      // Focus back to textarea
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const newCursorPos = triggerPosition.start + response.content.length + 1;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, triggerPosition, onChange, onResponseSelect, textareaRef]
  );

  // Toggle favorite
  const toggleFavorite = useCallback((responseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResponses((prev) => prev.map((r: any) => (r.id === responseId ? { ...r, is_favorite: !r.is_favorite } : r)));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Don't handle if focus is in search input
      if (document.activeElement === searchInputRef.current) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          searchInputRef.current?.blur();
        } else {
          return;
        }
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredResponses.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredResponses.length) % filteredResponses.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (filteredResponses[selectedIndex]) {
            selectResponse(filteredResponses[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          break;
        case "/":
          if (!isOpen) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResponses, selectedIndex, selectResponse]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate dropdown position
  const getDropdownPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    const rect = textarea.getBoundingClientRect();
    return {
      top: rect.top - 400, // Show above textarea
      left: rect.left,
      width: Math.max(500, rect.width),
    };
  };

  if (!isOpen) return null;

  const position = getDropdownPosition();

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed z-50 rounded-ds-lg border border-[var(--fl-color-border)] bg-white shadow-xl",
        "flex max-h-96 flex-col overflow-hidden",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {/* Header with search */}
      <div className="flex items-center gap-3 border-b border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] spacing-3">
        <Icon icon={Zap} className="h-4 w-4 text-[var(--fl-color-info)]" />
        <span className="text-foreground text-sm font-medium">Canned Responses</span>
        <div className="relative flex-1">
          <Icon icon={Search} className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 transform text-gray-400" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search responses..."
            className="h-7 pl-7 text-tiny"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--fl-color-border-subtle)] p-spacing-sm">
        {CATEGORIES.map((category: any) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <Button
              key={category.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn("text-typography-xs h-7 whitespace-nowrap px-2", isSelected && category.color)}
            >
              <Icon className="mr-1 h-3 w-3" />
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* Responses List */}
      <div className="flex-1 overflow-y-auto">
        {filteredResponses.length === 0 ? (
          <div className="spacing-3 text-center text-sm text-[var(--fl-color-text-muted)]">
            No responses found matching your criteria.
          </div>
        ) : (
          <div className="py-1">
            {filteredResponses.map((response, index) => (
              <button
                key={response.id}
                onClick={() => selectResponse(response)}
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-50",
                  index === selectedIndex && "bg-status-info-light border-l-2 border-brand-blue-500"
                )}
              >
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-ds-2">
                    <span className="truncate text-sm font-medium text-gray-900">{response.title}</span>
                    {response.shortcut && (
                      <Badge variant="outline" className="px-1 py-0 text-tiny">
                        {response.shortcut}
                      </Badge>
                    )}
                  </div>
                  <p className="text-foreground mb-1 line-clamp-2 text-tiny">{response.content}</p>
                  <div className="flex items-center gap-ds-2 text-tiny text-gray-400">
                    <span>{response.usage_count} uses</span>
                    {response.tags.slice(0, 2).map((tag: any) => (
                      <Badge key={tag} variant="secondary" className="px-1 py-0 text-tiny">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button onClick={(e) => toggleFavorite(response.id, e)} className="rounded spacing-1 hover:bg-gray-200">
                    <Icon
                      icon={Star}
                      className={cn(
                        "h-3 w-3",
                        response.is_favorite ? "text-semantic-warning fill-yellow-500" : "text-gray-400"
                      )}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(response.content);
                    }}
                    className="rounded spacing-1 hover:bg-gray-200"
                  >
                    <Icon icon={Copy} className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with shortcuts */}
      <div className="border-t border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] px-3 py-2">
        <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
          <span>↑↓ Navigate • Enter/Tab Select • Esc Close</span>
          <span>{filteredResponses.length} responses</span>
        </div>
      </div>
    </div>
  );
}

// Hook for managing canned responses
export function useCannedResponses() {
  const [responses, setResponses] = useState(MOCK_RESPONSES);
  const [favorites, setFavorites] = useState(MOCK_RESPONSES.filter((r: any) => r.is_favorite));

  const addResponse = useCallback(
    (response: Omit<CannedResponse, "id" | "usage_count" | "created_at" | "updated_at">) => {
      const newResponse: CannedResponse = {
        ...response,
        id: Date.now().toString(),
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setResponses((prev) => [...prev, newResponse]);
      return newResponse;
    },
    []
  );

  const updateResponse = useCallback((id: string, updates: Partial<CannedResponse>) => {
    setResponses((prev) =>
      prev.map((r: any) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
  }, []);

  const deleteResponse = useCallback((id: string) => {
    setResponses((prev) => prev.filter((r: any) => r.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setResponses((prev) => prev.map((r: any) => (r.id === id ? { ...r, is_favorite: !r.is_favorite } : r)));
  }, []);

  useEffect(() => {
    setFavorites(responses.filter((r: any) => r.is_favorite));
  }, [responses]);

  return {
    responses,
    favorites,
    addResponse,
    updateResponse,
    deleteResponse,
    toggleFavorite,
  };
}
