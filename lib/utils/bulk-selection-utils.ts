/**
 * Utility functions for safe bulk selection operations
 * Prevents state mutation issues by always creating new instances
 */

/**
 * Safely toggle a conversation in a Set-based selection
 * Always returns a new Set instance to prevent React state mutation issues
 */
export function toggleConversationInSet(
  currentSelection: Set<string>,
  conversationId: string
): Set<string> {
  const newSelection = new Set(currentSelection);
  
  if (newSelection.has(conversationId)) {
    newSelection.delete(conversationId);
  } else {
    newSelection.add(conversationId);
  }
  
  return newSelection;
}

/**
 * Safely add a conversation to a Set-based selection
 * Always returns a new Set instance
 */
export function addConversationToSet(
  currentSelection: Set<string>,
  conversationId: string
): Set<string> {
  const newSelection = new Set(currentSelection);
  newSelection.add(conversationId);
  return newSelection;
}

/**
 * Safely remove a conversation from a Set-based selection
 * Always returns a new Set instance
 */
export function removeConversationFromSet(
  currentSelection: Set<string>,
  conversationId: string
): Set<string> {
  const newSelection = new Set(currentSelection);
  newSelection.delete(conversationId);
  return newSelection;
}

/**
 * Safely add multiple conversations to a Set-based selection
 * Always returns a new Set instance
 */
export function addMultipleConversationsToSet(
  currentSelection: Set<string>,
  conversationIds: string[]
): Set<string> {
  const newSelection = new Set(currentSelection);
  conversationIds.forEach(id => newSelection.add(id));
  return newSelection;
}

/**
 * Safely remove multiple conversations from a Set-based selection
 * Always returns a new Set instance
 */
export function removeMultipleConversationsFromSet(
  currentSelection: Set<string>,
  conversationIds: string[]
): Set<string> {
  const newSelection = new Set(currentSelection);
  conversationIds.forEach(id => newSelection.delete(id));
  return newSelection;
}

/**
 * Safely toggle a conversation in an Array-based selection
 * Always returns a new array instance to prevent React state mutation issues
 */
export function toggleConversationInArray(
  currentSelection: string[],
  conversationId: string
): string[] {
  const index = currentSelection.indexOf(conversationId);
  
  if (index > -1) {
    // Remove conversation - create new array without this item
    return currentSelection.filter(id => id !== conversationId);
  } else {
    // Add conversation - create new array with this item
    return [...currentSelection, conversationId];
  }
}

/**
 * Safely add a conversation to an Array-based selection
 * Always returns a new array instance
 */
export function addConversationToArray(
  currentSelection: string[],
  conversationId: string
): string[] {
  if (currentSelection.includes(conversationId)) {
    return currentSelection; // Already exists, return same array
  }
  return [...currentSelection, conversationId];
}

/**
 * Safely remove a conversation from an Array-based selection
 * Always returns a new array instance
 */
export function removeConversationFromArray(
  currentSelection: string[],
  conversationId: string
): string[] {
  return currentSelection.filter(id => id !== conversationId);
}

/**
 * Safely add multiple conversations to an Array-based selection
 * Always returns a new array instance
 */
export function addMultipleConversationsToArray(
  currentSelection: string[],
  conversationIds: string[]
): string[] {
  const newSelection = [...currentSelection];
  conversationIds.forEach(id => {
    if (!newSelection.includes(id)) {
      newSelection.push(id);
    }
  });
  return newSelection;
}

/**
 * Safely remove multiple conversations from an Array-based selection
 * Always returns a new array instance
 */
export function removeMultipleConversationsFromArray(
  currentSelection: string[],
  conversationIds: string[]
): string[] {
  return currentSelection.filter(id => !conversationIds.includes(id));
}

/**
 * Select all conversations from a list
 * Returns a new array with all conversation IDs
 */
export function selectAllConversations(conversations: Array<{ id: string }>): string[] {
  return conversations.map(conv => conv.id);
}

/**
 * Clear all selections
 * Returns an empty array
 */
export function clearAllSelections(): string[] {
  return [];
}

/**
 * Check if a conversation is selected in Set-based selection
 */
export function isConversationSelectedInSet(
  selection: Set<string>,
  conversationId: string
): boolean {
  return selection.has(conversationId);
}

/**
 * Check if a conversation is selected in Array-based selection
 */
export function isConversationSelectedInArray(
  selection: string[],
  conversationId: string
): boolean {
  return selection.includes(conversationId);
}

/**
 * Get the count of selected conversations
 */
export function getSelectionCount(selection: Set<string> | string[]): number {
  if (selection instanceof Set) {
    return selection.size;
  }
  return selection.length;
}

/**
 * Convert Set to Array
 */
export function setToArray(selection: Set<string>): string[] {
  return Array.from(selection);
}

/**
 * Convert Array to Set
 */
export function arrayToSet(selection: string[]): Set<string> {
  return new Set(selection);
}

/**
 * Validate that selection operations don't mutate the original state
 * This is a development helper to catch mutation bugs
 */
export function validateNoMutation<T extends Set<string> | string[]>(
  original: T,
  result: T,
  operationName: string
): void {
  if (process.env.NODE_ENV === 'development') {
    if (original === result) {
      console.warn(
        `[BulkSelection] Potential mutation detected in ${operationName}. ` +
        `The result should be a new instance, not the same reference.`
      );
    }
  }
}
