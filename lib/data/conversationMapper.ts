/**
 * Data Transformation Layer for Conversations
 * 
 * Maps database snake_case fields to TypeScript camelCase types
 * Handles data validation and type safety
 */

import type { Conversation } from "@/components/InboxDashboard/types";
import { generateUniqueVisitorName } from "@/lib/utils/nameGenerator";

// Database conversation interface (snake_case) - more flexible to handle actual DB structure
interface DatabaseConversation {
  id: string;
  organization_id?: string;
  customer_id?: string;
  assigned_to_user_id?: string;
  status?: string;
  priority?: string;
  subject?: string;
  channel?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
  last_message_content?: string;
  last_message_sender_type?: string;
  last_message_sender_name?: string;
  unread_count?: number;
  assigned_to_ai?: boolean;
  ai_handover_session_id?: string;
  tags?: string[];
  // Direct customer fields in conversations table
  customer_name?: string;
  customer_email?: string;
  customer?: any; // JSONB field
  // Legacy joined customers table (for backward compatibility)
  customers?: {
    id: string;
    name?: string;
    email?: string;
  } | null | any; // Allow for error states and flexible types
  [key: string]: any; // Allow additional properties
}

/**
 * Maps database conversation to TypeScript Conversation type
 * @param dbConversation - Raw database conversation data
 * @returns Properly typed Conversation object
 */
export function mapDatabaseConversation(dbConversation: DatabaseConversation): Conversation {
  // Handle missing or invalid data gracefully
  if (!dbConversation || !dbConversation.id) {
    console.warn("mapDatabaseConversation: Invalid conversation data", dbConversation);
    throw new Error("Invalid conversation data: missing id");
  }

  // Extract customer data - prioritize direct fields in conversations table
  const customerName = dbConversation.customer_name || dbConversation.customers?.name || "";
  const customerEmail = dbConversation.customer_email || dbConversation.customers?.email || "";

  // Generate a friendly name if customer_name is missing or is just an email
  let finalCustomerName = customerName;

  // Check if we need to generate a friendly name
  const needsNameGeneration =
    !finalCustomerName ||
    finalCustomerName.includes("@") ||
    finalCustomerName.startsWith("visitor_session_") ||
    finalCustomerName === "Anonymous" ||
    finalCustomerName === "Website Visitor" ||
    finalCustomerName === "visitor@widget.com";

  if (needsNameGeneration) {
    // Generate a friendly visitor name using the conversation ID as primary seed for uniqueness
    const seed = dbConversation.id?.toString() || customerEmail || "anonymous";
    finalCustomerName = generateUniqueVisitorName(seed);
  }

  // Ensure we have a valid last_message_preview
  let lastMessagePreview = dbConversation.last_message_content || "";
  if (!lastMessagePreview || lastMessagePreview.trim() === "") {
    lastMessagePreview = "No messages yet";
  }

  // Ensure we have a valid timestamp
  let lastMessageAt = dbConversation.last_message_at || "";
  if (!lastMessageAt || lastMessageAt === "1969-12-31T00:00:00.000Z" || lastMessageAt === "1970-01-01T00:00:00.000Z") {
    lastMessageAt = dbConversation.updated_at || dbConversation.created_at || new Date().toISOString();
  }

  // Map status to valid enum values
  const validStatuses = ["open", "pending", "resolved", "escalated"] as const;
  const status = validStatuses.includes(dbConversation.status as any) 
    ? dbConversation.status as "open" | "pending" | "resolved" | "escalated"
    : "open";

  // Map priority to valid enum values
  const validPriorities = ["low", "medium", "high", "urgent"] as const;
  const priority = validPriorities.includes(dbConversation.priority as any)
    ? dbConversation.priority as "low" | "medium" | "high" | "urgent"
    : "medium";

  return {
    id: dbConversation.id,
    customerName: finalCustomerName,
    customerEmail: customerEmail,
    status: status,
    lastMessageAt: lastMessageAt,
    unreadCount: typeof dbConversation.unread_count === "number" ? dbConversation.unread_count : 0,
    lastMessagePreview: lastMessagePreview,
    metadata: dbConversation.metadata || {},
    assigned_to_ai: dbConversation.assigned_to_ai || false,
    ai_handover_session_id: dbConversation.ai_handover_session_id,
    priority: priority,
    tags: dbConversation.tags || [],
  };
}

/**
 * Maps array of database conversations to TypeScript Conversation array
 * @param dbConversations - Array of raw database conversation data
 * @returns Array of properly typed Conversation objects
 */
export function mapDatabaseConversations(dbConversations: DatabaseConversation[]): Conversation[] {
  return dbConversations.map(mapDatabaseConversation);
}

/**
 * Validates that a database conversation has required fields
 * @param data - Raw data to validate
 * @returns True if data has required fields
 */
export function validateDatabaseConversation(data: any): data is DatabaseConversation {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.id === "string"
  );
}

/**
 * Validates array of database conversations
 * @param data - Array of raw data to validate
 * @returns True if all items have required fields
 */
export function validateDatabaseConversations(data: any[]): data is DatabaseConversation[] {
  return Array.isArray(data) && data.every(validateDatabaseConversation);
}

/**
 * Safe conversation mapping with error handling
 * @param data - Raw data that might be a conversation
 * @returns Conversation object or null if invalid
 */
export function safeMapConversation(data: any): Conversation | null {
  try {
    // More lenient validation - just check if it has an id
    if (!data || typeof data !== "object" || !data.id) {
      console.warn("safeMapConversation: Invalid conversation data (missing id)", data);
      return null;
    }
    return mapDatabaseConversation(data);
  } catch (error) {
    console.error("Error mapping conversation:", error, data);
    return null;
  }
}

/**
 * Safe conversation array mapping with error handling
 * @param data - Raw data that might be an array of conversations
 * @returns Array of Conversation objects, filtering out invalid ones
 */
export function safeMapConversations(data: any[]): Conversation[] {
  try {
    if (!Array.isArray(data)) {
      console.warn("Expected array of conversations, got:", typeof data);
      return [];
    }
    return data.map(safeMapConversation).filter(Boolean) as Conversation[];
  } catch (error) {
    console.error("Error mapping conversations:", error);
    return [];
  }
} 