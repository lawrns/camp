import { useMemo, useState, useCallback } from "react";
import type { Conversation } from "../types";

export interface ConversationFilters {
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  activeFilters: Record<string, unknown>;
}

export interface UseConversationFiltersReturn {
  // Filter state
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  activeFilters: Record<string, unknown>;
  
  // Filter setters
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setActiveFilters: (filters: Record<string, unknown>) => void;
  
  // Filter actions
  clearAllFilters: () => void;
  applyFilters: (filters: Record<string, unknown>) => void;
  
  // Filtered data
  filteredConversations: Conversation[];
}

/**
 * Hook for managing conversation filters and filtering logic
 * Separates filter state management from the main component
 */
export function useConversationFilters(conversations: Conversation[]): UseConversationFiltersReturn {
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});

  // Filter actions
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    setActiveFilters({});
  }, []);

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    setActiveFilters(filters);
  }, []);

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = !statusFilter || conv.status === statusFilter;

      // Priority filter
      const matchesPriority = !priorityFilter || conv.priority === priorityFilter;

      // Advanced filters
      let matchesAdvancedFilters = true;
      if (Object.keys(activeFilters).length > 0) {
        // Apply advanced filters based on activeFilters object
        for (const [key, value] of Object.entries(activeFilters)) {
          if (value && conv[key as keyof Conversation] !== value) {
            matchesAdvancedFilters = false;
            break;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesAdvancedFilters;
    });
  }, [conversations, searchQuery, statusFilter, priorityFilter, activeFilters]);

  return {
    // Filter state
    searchQuery,
    statusFilter,
    priorityFilter,
    activeFilters,
    
    // Filter setters
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setActiveFilters,
    
    // Filter actions
    clearAllFilters,
    applyFilters,
    
    // Filtered data
    filteredConversations,
  };
}
