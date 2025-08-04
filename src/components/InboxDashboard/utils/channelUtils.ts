// Channel utilities for Supabase real-time communication

import { UNIFIED_CHANNELS } from '@/lib/realtime/unified-channel-standards';
import { generateUniqueVisitorName } from '@/lib/utils/nameGenerator';

/**
 * Standard channel naming convention for Supabase real-time
 * @deprecated Use UNIFIED_CHANNELS directly instead
 * @param type - Type of channel (conversations, conversation, typing)
 * @param organizationId - Organization ID
 * @param conversationId - Optional conversation ID for specific channels
 * @returns Formatted channel name
 */
export const getChannelName = (
  type: "conversations" | "conversation" | "typing",
  organizationId: string,
  conversationId?: string
): string => {
  switch (type) {
    case "conversations":
      return UNIFIED_CHANNELS.conversations(organizationId);
    case "conversation":
      if (!conversationId) throw new Error('Conversation ID required for conversation channel');
      return UNIFIED_CHANNELS.conversation(organizationId, conversationId);
    case "typing":
      if (!conversationId) throw new Error('Conversation ID required for typing channel');
      return UNIFIED_CHANNELS.conversationTyping(organizationId, conversationId);
    default:
      throw new Error(`Unknown channel type: ${type}`);
  }
};

// File validation constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/**
 * Validates file size and type before upload
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported",
    };
  }
  return { valid: true };
};

/**
 * Performance optimizations - memoized functions outside component
 */
export const getMessageItemSize = () => 80; // Fixed size for message items

/**
 * Maps raw conversation data from Supabase to typed Conversation interface
 * @param raw - Raw conversation data from database
 * @returns Typed Conversation object
 */
export const mapConversation = (raw: unknown): unknown => {
  // Handle both camelCase and snake_case field names from database
  let customerName = raw.customerName || raw.customerName;
  const customerEmail = raw.customerEmail || raw.customerEmail;

  // Check if we need to generate a friendly name
  const needsNameGeneration =
    !customerName ||
    customerName.includes("@") ||
    customerName.startsWith("visitor_session_") ||
    customerName === "Anonymous" ||
    customerName === "Website Visitor" ||
    customerName === "visitor@widget.com";

  if (needsNameGeneration) {
    // Generate a friendly visitor name using the conversation ID as primary seed for uniqueness
    const seed = raw.id?.toString() || customerEmail || "anonymous";
    customerName = generateUniqueVisitorName(seed);
    console.log(`[mapConversation] Generated visitor name: "${customerName}" for conversation ${raw.id}`);
  }

  // Handle both camelCase and snake_case for message preview
  let lastMessagePreview = raw.lastMessagePreview || raw.last_message_preview;
  if (!lastMessagePreview || lastMessagePreview.trim() === "") {
    lastMessagePreview = "No messages yet";
  } else {
    // Truncate long messages for preview
    lastMessagePreview = lastMessagePreview.length > 100
      ? lastMessagePreview.substring(0, 100) + "..."
      : lastMessagePreview;
  }

  // Handle both camelCase and snake_case for timestamps
  let lastMessageAt = raw.lastMessageAt || raw.lastMessageAt;
  if (!lastMessageAt || lastMessageAt === "1969-12-31T00:00:00.000Z" || lastMessageAt === "1970-01-01T00:00:00.000Z") {
    lastMessageAt = raw.updated_at || raw.created_at || new Date().toISOString();
  }

  return {
    id: raw.id,
    customerName: customerName,
    customerEmail: customerEmail,
    status: raw.status || "open",
    lastMessageAt: lastMessageAt,
    unreadCount: typeof raw.unread === "boolean" ? (raw.unread ? 1 : 0) : (raw.unreadCount || raw.unread_count || 0),
    lastMessagePreview: lastMessagePreview,
    metadata: raw.metadata,
    aiHandoverActive: raw.aiHandoverActive || raw.ai_handover_active,
    aiHandoverSessionId: raw.aiHandoverSessionId || raw.ai_handover_session_id,
    priority: raw.priority || "medium",
    tags: raw.tags || [],
  };
};

/**
 * Debounce function for search input
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
