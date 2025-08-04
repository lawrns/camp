"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { At as AtSign, CheckCircle, Clock, Users } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
  department?: string;
  isAvailable: boolean;
}

interface MentionSuggestion extends TeamMember {
  relevanceScore: number;
}

interface MentionsSystemProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  onMentionSelect?: (member: TeamMember) => void;
  organizationId?: string;
  conversationId?: string;
  className?: string;
}

// Real team data is now fetched from API via useTeamMembers hook

const STATUS_COLORS = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-gray-400",
};

export function MentionsSystem({
  textareaRef,
  value,
  onChange,
  onMentionSelect,
  organizationId,
  conversationId,
  className,
}: MentionsSystemProps) {
  // Use real team data instead of mock data
  const { teamMembers, loading, error } = useTeamMembers();

  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search and filter team members
  const searchMembers = useCallback(
    (query: string): MentionSuggestion[] => {
      if (!query) {
        return teamMembers
          .map((member: unknown) => ({
            ...member,
            relevanceScore: member.isAvailable ? 1.0 : 0.7,
          }))
          .sort((a, b) => {
            // Prioritize: online status > available > role > name
            if (a.status === "online" && b.status !== "online") return -1;
            if (b.status === "online" && a.status !== "online") return 1;
            if (a.isAvailable && !b.isAvailable) return -1;
            if (b.isAvailable && !a.isAvailable) return 1;
            return a.name.localeCompare(b.name);
          });
      }

      const lowerQuery = query.toLowerCase();
      return teamMembers
        .map((member: unknown) => {
          let score = 0;

          // Name match (highest priority)
          if (member.name.toLowerCase().includes(lowerQuery)) {
            score += member.name.toLowerCase().startsWith(lowerQuery) ? 1.0 : 0.8;
          }

          // Email match
          if (member.email.toLowerCase().includes(lowerQuery)) {
            score += 0.6;
          }

          // Role match
          if (member.role.toLowerCase().includes(lowerQuery)) {
            score += 0.4;
          }

          // Department match
          if (member.department?.toLowerCase().includes(lowerQuery)) {
            score += 0.3;
          }

          // Boost for availability
          if (member.isAvailable) score *= 1.2;
          if (member.status === "online") score *= 1.1;

          return { ...member, relevanceScore: score };
        })
        .filter((member: unknown) => member.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 8); // Limit to 8 suggestions
    },
    [teamMembers]
  );

  // Handle text changes and detect @ mentions
  const handleTextChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = newValue.substring(0, cursorPos);

      // Find the last @ symbol before cursor
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Check if @ is at start or preceded by whitespace
        const charBeforeAt = lastAtIndex === 0 ? " " : textBeforeCursor[lastAtIndex - 1];
        if (charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) {
          const query = textBeforeCursor.substring(lastAtIndex + 1);

          // Only show suggestions if query doesn't contain spaces (incomplete mention)
          if (!query.includes(" ") && !query.includes("\n")) {
            setMentionQuery(query);
            setMentionPosition({ start: lastAtIndex, end: cursorPos });
            setSuggestions(searchMembers(query));
            setSelectedIndex(0);
            setIsOpen(true);
            return;
          }
        }
      }

      // Close suggestions if no valid @ context
      setIsOpen(false);
    },
    [onChange, textareaRef, searchMembers]
  );

  // Handle mention selection
  const selectMention = useCallback(
    (member: TeamMember) => {
      const newValue =
        value.substring(0, mentionPosition.start) + `@${member.name} ` + value.substring(mentionPosition.end);

      onChange(newValue);
      onMentionSelect?.(member);
      setIsOpen(false);

      // Focus back to textarea
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const newCursorPos = mentionPosition.start + member.name.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, mentionPosition, onChange, onMentionSelect, textareaRef]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            selectMention(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, selectMention]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
    const lineHeight = 20; // Approximate line height
    const lines = value.substring(0, mentionPosition.start).split("\n").length;

    return {
      top: rect.top + lines * lineHeight - textarea.scrollTop - 200, // Show above cursor
      left: rect.left + 10,
    };
  };

  if (!isOpen || suggestions.length === 0) return null;

  const position = getDropdownPosition();

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed z-50 rounded-ds-lg border border-[var(--fl-color-border)] bg-white shadow-lg",
        "max-h-64 min-w-80 max-w-96 overflow-y-auto",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-ds-2 border-b border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] px-3 py-2">
        <Icon icon={AtSign} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
        <span className="text-foreground text-sm font-medium">Mention team member</span>
        {mentionQuery && (
          <Badge variant="secondary" className="text-tiny">
            "{mentionQuery}"
          </Badge>
        )}
      </div>

      {/* Suggestions List */}
      <div className="py-1">
        {suggestions.map((member, index) => (
          <button
            key={member.id}
            onClick={() => selectMention(member)}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-50",
              index === selectedIndex && "bg-status-info-light border-l-2 border-brand-blue-500"
            )}
          >
            {/* Avatar with status */}
            <div className="relative">
              <Avatar className="h-8 w-8">
                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback className="text-tiny">
                  {member.name
                    .split(" ")
                    .map((n: unknown) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-ds-full border-2 border-white",
                  STATUS_COLORS[member.status]
                )}
              />
            </div>

            {/* Member info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-ds-2">
                <span className="truncate text-sm font-medium text-gray-900">{member.name}</span>
                {!member.isAvailable && <Icon icon={Clock} className="h-3 w-3 text-amber-500" />}
              </div>
              <div className="flex items-center gap-ds-2 text-tiny text-[var(--fl-color-text-muted)]">
                <span>{member.role}</span>
                {member.department && (
                  <>
                    <span>•</span>
                    <span>{member.department}</span>
                  </>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1">
              {member.status === "online" && member.isAvailable && (
                <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />
              )}
              <span className="text-tiny capitalize text-gray-400">{member.status}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer with shortcut hints */}
      <div className="border-t border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] px-3 py-2">
        <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
          <span>↑↓ Navigate • Enter/Tab Select • Esc Close</span>
          <div className="flex items-center gap-1">
            <Icon icon={Users} className="h-3 w-3" />
            <span>{suggestions.length} available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easier integration
export function useMentions() {
  const [mentions, setMentions] = useState<TeamMember[]>([]);

  const addMention = useCallback((member: TeamMember) => {
    setMentions((prev) => {
      if (prev.find((m) => m.id === member.id)) return prev;
      return [...prev, member];
    });
  }, []);

  const removeMention = useCallback((memberId: string) => {
    setMentions((prev) => prev.filter((m: unknown) => m.id !== memberId));
  }, []);

  const clearMentions = useCallback(() => {
    setMentions([]);
  }, []);

  return {
    mentions,
    addMention,
    removeMention,
    clearMentions,
  };
}
