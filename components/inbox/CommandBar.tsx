"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { ArrowRight, ChartBar as BarChart3, Calendar, Clock, Command, FileText, HelpCircle as HelpCircle, MessageCircle as MessageSquare, Search as Search, Settings as Settings, Tag, User,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

interface SearchResult {
  id: string;
  type: "conversation" | "customer" | "action" | "help";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  action?: () => void;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "conversation",
    title: "Order #12345 - Shipping delay",
    subtitle: "John Doe • 2 hours ago",
    icon: MessageSquare,
    badge: "unread",
  },
  {
    id: "2",
    type: "customer",
    title: "Jane Smith",
    subtitle: "jane.smith@example.com • Premium",
    icon: User,
  },
  {
    id: "3",
    type: "action",
    title: "View Analytics",
    subtitle: "Open dashboard analytics",
    icon: BarChart3,
  },
];

const recentSearches = ["shipping delay", "refund request", "john doe", "premium customers"];

const quickActions = [
  { id: "1", title: "New Conversation", icon: MessageSquare, shortcut: "⌘N" },
  { id: "2", title: "Settings", icon: Settings, shortcut: "⌘," },
  { id: "3", title: "Help & Docs", icon: HelpCircle, shortcut: "⌘?" },
  { id: "4", title: "Knowledge Base", icon: FileText, shortcut: "⌘K" },
];

export function CommandBar({ isOpen, onClose, onSearch }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter results based on query
  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults([]);
    }
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = query ? filteredResults.length : quickActions.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case "Enter":
          e.preventDefault();
          if (query && filteredResults[selectedIndex]) {
            // Handle result selection
            onSearch?.(query);
            onClose();
          } else if (!query && quickActions[selectedIndex]) {
            // Handle quick action
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [query, filteredResults, selectedIndex, onSearch, onClose]
  );

  return (
    <OptimizedAnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <OptimizedMotion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Command Bar */}
          <OptimizedMotion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="bg-background mx-4 overflow-hidden rounded-ds-xl border shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center border-b px-4 py-3">
                <Icon icon={Search} className="mr-3 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search conversations, customers, or actions..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="ml-3 flex items-center gap-[var(--fl-spacing-1)]">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-tiny">ESC</kbd>
                  <span className="text-tiny text-muted-foreground">to close</span>
                </div>
              </div>

              {/* Results/Content */}
              <ScrollArea className="max-h-[400px]">
                {query ? (
                  // Search Results
                  <div className="p-spacing-sm">
                    {filteredResults.length > 0 ? (
                      <>
                        <div className="mb-2 px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] text-tiny font-medium text-muted-foreground">Search Results</div>
                        {filteredResults.map((result, index) => (
                          <CommandBarItem
                            key={result.id}
                            result={result}
                            isSelected={selectedIndex === index}
                            onClick={() => {
                              onSearch?.(query);
                              onClose();
                            }}
                          />
                        ))}
                      </>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Default View
                  <div className="p-spacing-sm">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <>
                        <div className="mb-2 px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] text-tiny font-medium text-muted-foreground">
                          Recent Searches
                        </div>
                        <div className="mb-4 flex flex-wrap gap-ds-2 px-2">
                          {recentSearches.map((search: unknown) => (
                            <button
                              key={search}
                              onClick={() => setQuery(search)}
                              className="inline-flex items-center gap-[var(--fl-spacing-1)] rounded-ds-md border bg-muted/50 px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] text-tiny hover:bg-muted"
                            >
                              <Icon icon={Clock} className="h-3 w-3" />
                              {search}
                            </button>
                          ))}
                        </div>
                        <Separator className="my-2" />
                      </>
                    )}

                    {/* Quick Actions */}
                    <div className="mb-2 px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] text-tiny font-medium text-muted-foreground">Quick Actions</div>
                    {quickActions.map((action, index) => (
                      <button
                        key={action.id}
                        className={cn(
                          "text-typography-sm flex w-full items-center justify-between rounded-ds-md px-3 py-2 transition-colors",
                          selectedIndex === index ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                        onClick={onClose}
                      >
                        <div className="flex items-center gap-3">
                          <action.icon className="h-4 w-4" />
                          <span>{action.title}</span>
                        </div>
                        <kbd
                          className={cn(
                            "text-typography-xs rounded border px-1.5 py-0.5",
                            selectedIndex === index
                              ? "border-primary-foreground/20 bg-primary-foreground/10"
                              : "border bg-muted"
                          )}
                        >
                          {action.shortcut}
                        </kbd>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </OptimizedMotion.div>
        </>
      )}
    </OptimizedAnimatePresence>
  );
}

// Individual Result Item Component
function CommandBarItem({
  result,
  isSelected,
  onClick,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = result.icon;

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-ds-md px-3 py-2 text-left transition-colors",
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-ds-md",
          isSelected ? "bg-primary-foreground/10" : "bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-sm font-medium">{result.title}</div>
        {result.subtitle && <div className="truncate text-tiny opacity-70">{result.subtitle}</div>}
      </div>
      {result.badge && (
        <Badge variant={isSelected ? "secondary" : "default"} className="ml-2 rounded-full">
          {result.badge}
        </Badge>
      )}
      <Icon icon={ArrowRight} className="h-4 w-4 opacity-50" />
    </button>
  );
}
