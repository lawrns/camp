// Channel utilities for Supabase real-time communication

// Simple name generator arrays
const adjectives = ["Friendly", "Happy", "Curious", "Bright", "Clever", "Swift", "Gentle", "Brave", "Kind", "Wise"];
const nouns = ["Visitor", "Guest", "Panda", "Eagle", "Fox", "Dolphin", "Tiger", "Bear", "Owl", "Wolf"];

// Simple hash function for deterministic name generation
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate deterministic visitor name
function generateVisitorName(seed: string): string {
  const hash = simpleHash(seed);
  const adjective = adjectives[hash % adjectives.length];
  const noun = nouns[Math.floor(hash / adjectives.length) % nouns.length];
  return `${adjective} ${noun}`;
}

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
    customerName === "Anonymous";

  if (needsNameGeneration) {
    // Generate a friendly visitor name using the customer email or conversation ID as seed
    const seed = raw.customer_email || raw.id || "anonymous";
    customerName = generateVisitorName(seed);
  }

  return {
    id: raw.id,
    customer_name: customerName,
    customer_email: raw.customer_email,
    status: raw.status,
    last_message_at: raw.last_message_at,
    unread_count: typeof raw.unread === "boolean" ? (raw.unread ? 1 : 0) : raw.unread_count,
    last_message_preview: raw.last_message_preview,
    metadata: raw.metadata,
    assigned_to_ai: raw.assigned_to_ai,
    ai_handover_session_id: raw.ai_handover_session_id,
    priority: raw.priority,
    tags: raw.tags,
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
