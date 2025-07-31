// Channel utilities for Supabase real-time communication

import { generateUniqueVisitorName } from '@/lib/utils/nameGenerator';

/**
 * Standard channel naming convention for Supabase real-time
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
      return `org:${organizationId}:conversations`;
    case "conversation":
      return `org:${organizationId}:conv:${conversationId}`;
    case "typing":
      return `org:${organizationId}:typing:${conversationId}`;
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
export const mapConversation = (raw: any): any => {
  // Generate a friendly name if customer_name is missing or is just an email
  let customerName = raw.customer_name;

  // Check if we need to generate a friendly name
  const needsNameGeneration =
    !customerName ||
    customerName.includes("@") ||
    customerName.startsWith("visitor_session_") ||
    customerName === "Anonymous" ||
    customerName === "Website Visitor" ||
    customerName === "visitor@widget.com";

  if (needsNameGeneration) {
    // Generate a friendly visitor name using the customer email or conversation ID as seed
    const seed = raw.customer_email || raw.id?.toString() || "anonymous";
    customerName = generateUniqueVisitorName(seed);
  }

  // Ensure we have a valid last_message_preview
  let lastMessagePreview = raw.last_message_preview;
  if (!lastMessagePreview || lastMessagePreview.trim() === "") {
    lastMessagePreview = "No messages yet";
  }

  // Ensure we have a valid timestamp
  let lastMessageAt = raw.last_message_at;
  if (!lastMessageAt || lastMessageAt === "1969-12-31T00:00:00.000Z" || lastMessageAt === "1970-01-01T00:00:00.000Z") {
    lastMessageAt = raw.updated_at || raw.created_at || new Date().toISOString();
  }

  return {
    id: raw.id,
    customer_name: customerName,
    customer_email: raw.customer_email,
    status: raw.status || "open",
    last_message_at: lastMessageAt,
    unread_count: typeof raw.unread === "boolean" ? (raw.unread ? 1 : 0) : (raw.unread_count || 0),
    last_message_preview: lastMessagePreview,
    metadata: raw.metadata,
    assigned_to_ai: raw.assigned_to_ai,
    ai_handover_session_id: raw.ai_handover_session_id,
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
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
