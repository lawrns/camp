/**
 * Runtime Validation for Conversations
 * 
 * Validates conversation data at runtime to catch type mismatches early
 * Provides helpful error messages for debugging
 */

import type { Conversation } from "@/components/InboxDashboard/types";

/**
 * Validates that a conversation object has the correct structure
 * @param data - Data to validate
 * @returns True if data is a valid Conversation
 */
export function validateConversation(data: unknown): data is Conversation {
  if (!data || typeof data !== "object") {
    console.warn("validateConversation: data is not an object", data);
    return false;
  }

  const requiredFields = {
    id: "string",
    customerName: "string", 
    customerEmail: "string",
    status: "string",
    lastMessageAt: "string",
    unreadCount: "number",
    lastMessagePreview: "string"
  };

  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!(field in data)) {
      console.warn(`validateConversation: missing required field '${field}'`, data);
      return false;
    }
    
    if (typeof data[field] !== expectedType) {
      console.warn(`validateConversation: field '${field}' has wrong type. Expected ${expectedType}, got ${typeof data[field]}`, data);
      return false;
    }
  }

  return true;
}

/**
 * Validates array of conversations
 * @param data - Array to validate
 * @returns True if all items are valid conversations
 */
export function validateConversations(data: unknown[]): data is Conversation[] {
  if (!Array.isArray(data)) {
    console.warn("validateConversations: data is not an array", data);
    return false;
  }

  return data.every((item, index) => {
    if (!validateConversation(item)) {
      console.warn(`validateConversations: invalid conversation at index ${index}`, item);
      return false;
    }
    return true;
  });
}

/**
 * Safe validation that doesn't throw errors
 * @param data - Data to validate
 * @returns Validation result with details
 */
export function safeValidateConversation(data: unknown): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Data is not an object");
    return { isValid: false, errors, warnings };
  }

  // Check for snake_case properties that should be camelCase
  const snakeCaseFields = [
    "customer_name", "customer_email", "last_message_at", 
    "last_message_preview", "unread_count"
  ];

  for (const field of snakeCaseFields) {
    if (field in data) {
      warnings.push(`Found snake_case field '${field}' - should be camelCase`);
    }
  }

  // Check required fields
  const requiredFields = {
    id: "string",
    customerName: "string",
    customerEmail: "string", 
    status: "string",
    lastMessageAt: "string",
    unreadCount: "number",
    lastMessagePreview: "string"
  };

  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!(field in data)) {
      errors.push(`Missing required field '${field}'`);
      continue;
    }
    
    if (typeof data[field] !== expectedType) {
      errors.push(`Field '${field}' has wrong type. Expected ${expectedType}, got ${typeof data[field]}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates conversation data and logs helpful debugging info
 * @param data - Data to validate
 * @param context - Context for logging (e.g., component name)
 */
export function debugValidateConversation(data: unknown, context: string = "Unknown") {
  const result = safeValidateConversation(data);
  
  if (!result.isValid) {
    console.error(`[${context}] Conversation validation failed:`, {
      errors: result.errors,
      warnings: result.warnings,
      data
    });
  } else if (result.warnings.length > 0) {
    console.warn(`[${context}] Conversation validation warnings:`, {
      warnings: result.warnings,
      data
    });
  }
}

/**
 * Validates conversation array and logs debugging info
 * @param data - Array to validate
 * @param context - Context for logging
 */
export function debugValidateConversations(data: unknown[], context: string = "Unknown") {
  if (!Array.isArray(data)) {
    console.error(`[${context}] Data is not an array:`, data);
    return;
  }

  console.log(`[${context}] Validating ${data.length} conversations`);
  
  data.forEach((item, index) => {
    const result = safeValidateConversation(item);
    if (!result.isValid) {
      console.error(`[${context}] Invalid conversation at index ${index}:`, {
        errors: result.errors,
        warnings: result.warnings,
        data: item
      });
    }
  });
}

/**
 * Type guard for checking if data might be a conversation
 * @param data - Data to check
 * @returns True if data has conversation-like structure
 */
export function isConversationLike(data: unknown): boolean {
  return (
    data &&
    typeof data === "object" &&
    typeof data.id === "string" &&
    (typeof data.customerName === "string" || typeof data.customerName === "string")
  );
}

/**
 * Attempts to fix common conversation data issues
 * @param data - Potentially broken conversation data
 * @returns Fixed conversation data or null if unfixable
 */
export function attemptFixConversation(data: unknown): Conversation | null {
  if (!isConversationLike(data)) {
    return null;
  }

  try {
    // Try to map snake_case to camelCase
    const fixed = {
      id: data.id,
      customerName: data.customerName || data.customerName || "Unknown Customer",
      customerEmail: data.customerEmail || data.customerEmail || "",
      status: data.status || "open",
      lastMessageAt: data.lastMessageAt || data.lastMessageAt || new Date().toISOString(),
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 
                   typeof data.unread_count === "number" ? data.unread_count : 0,
      lastMessagePreview: data.lastMessagePreview || data.last_message_preview || "No messages yet",
      metadata: data.metadata || {},
      assigned_to_ai: data.assigned_to_ai || false,
      ai_handover_session_id: data.ai_handover_session_id,
      priority: data.priority || "medium",
      tags: data.tags || [],
    };

    if (validateConversation(fixed)) {
      return fixed;
    }
  } catch (error) {
    console.error("Error attempting to fix conversation:", error);
  }

  return null;
} 