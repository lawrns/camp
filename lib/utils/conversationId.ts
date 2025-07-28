/**
 * @fileoverview Conversation ID type conversion and validation utilities
 * @module utils/conversationId
 *
 * This module handles the conversion between different conversation ID formats
 * used throughout the application. The database uses bigint (number) for IDs,
 * while real-time channels and URLs require string format.
 *
 * @example
 * ```typescript
 * import { conversationIdToString, isValidConversationId } from '@/lib/utils/conversationId';
 *
 * // Convert for URL usage
 * const urlId = conversationIdToString(12345); // "12345"
 *
 * // Validate before database operation
 * if (isValidConversationId(userInput)) {
 *   const dbId = conversationIdToNumber(userInput);
 *   // Safe to use in database query
 * }
 * ```
 */

/**
 * Converts a conversation ID to string format
 *
 * Use this when you need a string representation for:
 * - URL parameters
 * - Real-time channel names
 * - Cache keys
 * - Display purposes
 *
 * @param {number | string} id - The conversation ID to convert
 * @returns {string} String representation of the ID
 *
 * @example
 * conversationIdToString(12345) // "12345"
 * conversationIdToString("12345") // "12345"
 */
export function conversationIdToString(id: number | string): string {
  return String(id);
}

/**
 * Converts a conversation ID to number format for database operations
 *
 * Use this when you need a numeric ID for:
 * - Database queries
 * - Numeric comparisons
 * - API payloads expecting numbers
 *
 * @param {number | string} id - The conversation ID to convert
 * @returns {number} Numeric representation of the ID
 * @throws {Error} If the ID cannot be parsed as a valid positive integer
 *
 * @example
 * conversationIdToNumber("12345") // 12345
 * conversationIdToNumber(12345) // 12345
 * conversationIdToNumber("abc") // throws Error
 */
export function conversationIdToNumber(id: number | string): number {
  if (typeof id === "number") {
    return id;
  }
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid conversation ID: ${id}`);
  }
  return parsed;
}

/**
 * Type guard to check if a value is a valid conversation ID
 *
 * Validates that the value is either:
 * - A positive integer number
 * - A string that can be parsed as a positive integer
 *
 * @param {unknown} id - The value to validate
 * @returns {boolean} True if the value is a valid conversation ID
 *
 * @example
 * isValidConversationId(123) // true
 * isValidConversationId("123") // true
 * isValidConversationId(-1) // false
 * isValidConversationId("abc") // false
 * isValidConversationId(null) // false
 */
export function isValidConversationId(id: unknown): id is number | string {
  if (typeof id === "number") {
    return id > 0 && Number.isInteger(id);
  }
  if (typeof id === "string") {
    const parsed = parseInt(id, 10);
    return !isNaN(parsed) && parsed > 0;
  }
  return false;
}

/**
 * Formats a conversation ID for real-time channel names
 *
 * Creates a properly formatted channel name for Supabase Realtime
 * subscriptions following the pattern: org:{orgId}:conversation:{conversationId}
 *
 * @param {string} orgId - The organization ID
 * @param {number} conversationId - The conversation ID
 * @returns {string} Formatted channel name for real-time subscriptions
 *
 * @example
 * getConversationChannelName("org-123", 456)
 * // Returns: "org:org-123:conversation:456"
 */
export function getConversationChannelName(orgId: string, conversationId: string): string {
  return `org:${orgId}:conversation:${conversationIdToString(conversationId)}`;
}
