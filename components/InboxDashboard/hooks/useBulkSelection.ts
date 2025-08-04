import { useState, useCallback, useMemo } from "react";
import {
  toggleConversationInArray,
  addConversationToArray,
  removeConversationFromArray,
  addMultipleConversationsToArray,
  removeMultipleConversationsFromArray,
  selectAllConversations,
  clearAllSelections,
  isConversationSelectedInArray,
  getSelectionCount,
  validateNoMutation,
} from "@/lib/utils/bulk-selection-utils";

export interface UseBulkSelectionReturn {
  // Selection state
  selectedConversations: string[];
  selectedCount: number;
  hasSelection: boolean;
  
  // Selection actions
  toggleConversation: (conversationId: string) => void;
  selectConversation: (conversationId: string) => void;
  deselectConversation: (conversationId: string) => void;
  selectMultiple: (conversationIds: string[]) => void;
  deselectMultiple: (conversationIds: string[]) => void;
  selectAll: (conversations: Array<{ id: string }>) => void;
  clearSelection: () => void;
  
  // Selection queries
  isSelected: (conversationId: string) => boolean;
  
  // Bulk actions
  getSelectedIds: () => string[];
}

/**
 * Hook for managing bulk conversation selection with safe state mutations
 * Prevents React state mutation issues by always creating new array instances
 */
export function useBulkSelection(): UseBulkSelectionReturn {
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  // Memoized derived state
  const selectedCount = useMemo(() => getSelectionCount(selectedConversations), [selectedConversations]);
  const hasSelection = useMemo(() => selectedCount > 0, [selectedCount]);

  // Toggle a single conversation
  const toggleConversation = useCallback((conversationId: string) => {
    setSelectedConversations(current => {
      const result = toggleConversationInArray(current, conversationId);
      validateNoMutation(current, result, 'toggleConversation');
      return result;
    });
  }, []);

  // Select a single conversation
  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversations(current => {
      const result = addConversationToArray(current, conversationId);
      validateNoMutation(current, result, 'selectConversation');
      return result;
    });
  }, []);

  // Deselect a single conversation
  const deselectConversation = useCallback((conversationId: string) => {
    setSelectedConversations(current => {
      const result = removeConversationFromArray(current, conversationId);
      validateNoMutation(current, result, 'deselectConversation');
      return result;
    });
  }, []);

  // Select multiple conversations
  const selectMultiple = useCallback((conversationIds: string[]) => {
    setSelectedConversations(current => {
      const result = addMultipleConversationsToArray(current, conversationIds);
      validateNoMutation(current, result, 'selectMultiple');
      return result;
    });
  }, []);

  // Deselect multiple conversations
  const deselectMultiple = useCallback((conversationIds: string[]) => {
    setSelectedConversations(current => {
      const result = removeMultipleConversationsFromArray(current, conversationIds);
      validateNoMutation(current, result, 'deselectMultiple');
      return result;
    });
  }, []);

  // Select all conversations
  const selectAll = useCallback((conversations: Array<{ id: string }>) => {
    setSelectedConversations(current => {
      const result = selectAllConversations(conversations);
      validateNoMutation(current, result, 'selectAll');
      return result;
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedConversations(current => {
      const result = clearAllSelections();
      validateNoMutation(current, result, 'clearSelection');
      return result;
    });
  }, []);

  // Check if a conversation is selected
  const isSelected = useCallback((conversationId: string) => {
    return isConversationSelectedInArray(selectedConversations, conversationId);
  }, [selectedConversations]);

  // Get selected IDs as array
  const getSelectedIds = useCallback(() => {
    return [...selectedConversations]; // Return a copy to prevent external mutations
  }, [selectedConversations]);

  return {
    // Selection state
    selectedConversations,
    selectedCount,
    hasSelection,
    
    // Selection actions
    toggleConversation,
    selectConversation,
    deselectConversation,
    selectMultiple,
    deselectMultiple,
    selectAll,
    clearSelection,
    
    // Selection queries
    isSelected,
    
    // Bulk actions
    getSelectedIds,
  };
}
