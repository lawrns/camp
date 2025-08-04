/**
 * UNIFIED CONVERSATION INTERFACE
 *
 * This file consolidates all conversation-related types and provides
 * adapters to eliminate confusion between components.
 */

// import { generateAvatar } from './utils/avatarGeneration';
import { getLocalTime } from "../../lib/services/geolocation";

export interface UnifiedConversation {
  id: string;
  email_from: string;
  subject: string;
  preview: string;
  status: "active" | "queued" | "closed" | "all";
  lastMessageAt: string;
  unread: boolean;
  priority: "high" | "medium" | "low";
  tags: string[];
  avatar?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  assignedTo?: string;
  aiEnabled?: boolean;
  customer?: {
    location?: string;
    localTime?: string;
  };

  // Additional fields for compatibility
  customer_email?: string;
  visitor_email?: string;
  customerEmail?: string;
  last_message_preview?: string;
  lastMessagePreview?: string;
  last_message_at?: string;
  updated_at?: string;
  updatedAt?: string;
  unread_count?: number;
  unreadCount?: number;
  customer_avatar?: string;
  customerAvatar?: string;
  customer_online?: boolean;
  customerOnline?: boolean;
  customer_verified?: boolean;
  customerVerified?: boolean;
  assigned_agent_name?: string;
  assignedOperatorName?: string;
  rag_enabled?: boolean;
  customer_name?: string;
  visitor_name?: string;
  customer_company?: string;
  customer_role?: string;
  customer_phone?: string;
  created_at?: string;
  customer_location?: string;
}

export interface UnifiedMessage {
  id: string;
  content: string;
  senderType: "agent" | "customer" | "visitor";
  created_at: string;
  delivery_status?: "sent" | "delivered" | "read";
  status?: string;
  read_status?: string;
  read_at?: string;
  sender_avatar_url?: string;
  sender_name?: string;
  conversation_id?: string;
  organization_id?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedCustomerData {
  id: string;
  name: string;
  email: string;
  avatar?: string | undefined;
  location: {
    city: string;
    country: string;
  };
  localTime?: string | undefined;
  company?: string | undefined;
  role?: string | undefined;
  phone?: string | undefined;
  lastSeen: string;
  firstSeen: string;
  sessions: number;
  browser?: string | undefined;
  os?: string | undefined;
  deviceType: "desktop" | "mobile" | "tablet";
  ipAddress?: string | undefined;
  customAttributes?: Record<string, string> | undefined;
  tags?: string[] | undefined;
  isVerified?: boolean | undefined;
  isOnline?: boolean | undefined;
  displayName?: string | undefined;
  avatarUrl?: string | undefined;
  initials?: string | undefined;
  fallbackGradient?: string | undefined;
}

/**
 * Adapts any conversation object to the unified format
 */
export function adaptToUnifiedConversation(rawConversation: unknown): UnifiedConversation {
  const id = String(rawConversation?.id || `conv-${Date.now()}`);
  const email_from =
    rawConversation?.customerEmail ||
    rawConversation?.visitor_email ||
    rawConversation?.customerEmail ||
    rawConversation?.email_from ||
    "Unknown Customer";

  const subject = rawConversation?.subject || `Conversation #${id.slice(-6)}`;

  const preview =
    rawConversation?.last_message_preview ||
    rawConversation?.lastMessagePreview ||
    rawConversation?.preview ||
    "No preview available";

  const status = (
    rawConversation?.status === "open" ? "active" : rawConversation?.status || "active"
  ) as UnifiedConversation["status"];

  const lastMessageAt =
    rawConversation?.lastMessageAt ||
    rawConversation?.lastMessageAt ||
    rawConversation?.updated_at ||
    rawConversation?.updatedAt ||
    new Date().toISOString();

  const unread =
    (rawConversation?.unread_count || rawConversation?.unreadCount || 0) > 0 || rawConversation?.unread === true;

  const priority = (rawConversation?.priority || "medium") as UnifiedConversation["priority"];
  const tags = rawConversation?.tags || [];
  const avatar = rawConversation?.customer_avatar || rawConversation?.customerAvatar || rawConversation?.avatar;
  const isOnline =
    rawConversation?.customer_online || rawConversation?.customerOnline || rawConversation?.isOnline || false;
  const isVerified =
    rawConversation?.customer_verified || rawConversation?.customerVerified || rawConversation?.isVerified || false;
  const assignedTo =
    rawConversation?.assigned_agent_name || rawConversation?.assignedOperatorName || rawConversation?.assignedTo;
  const aiEnabled = rawConversation?.rag_enabled || rawConversation?.aiEnabled || false;

  // Handle customer_location properly to prevent object rendering errors
  let processedCustomerLocation: string;
  if (typeof rawConversation?.customer_location === "string") {
    processedCustomerLocation = rawConversation.customer_location;
  } else if (typeof rawConversation?.customer_location === "object" && rawConversation.customer_location !== null) {
    // Convert geolocation object to string format
    const loc = rawConversation.customer_location as unknown;
    processedCustomerLocation = `${loc?.city || "Unknown"}, ${loc?.country || "Unknown"}`;
  } else {
    processedCustomerLocation = "Unknown";
  }

  return {
    id,
    email_from,
    subject,
    preview,
    status,
    lastMessageAt,
    unread,
    priority,
    tags,
    avatar,
    isOnline,
    isVerified,
    assignedTo,
    aiEnabled,
    customer: {
      location:
        typeof rawConversation?.customer_location === "string"
          ? rawConversation.customer_location.split(",")[0]
          : rawConversation?.customer?.location || "Unknown",
      localTime: rawConversation?.customer?.localTime || "",
    },
    // Preserve original fields but filter out problematic ones
    customerEmail: rawConversation?.customerEmail,
    visitor_email: rawConversation?.visitor_email,
    customerEmail: rawConversation?.customerEmail,
    last_message_preview: rawConversation?.last_message_preview,
    lastMessagePreview: rawConversation?.lastMessagePreview,
    lastMessageAt: rawConversation?.lastMessageAt,
    updated_at: rawConversation?.updated_at,
    updatedAt: rawConversation?.updatedAt,
    unread_count: rawConversation?.unread_count,
    unreadCount: rawConversation?.unreadCount,
    customer_avatar: rawConversation?.customer_avatar,
    customerAvatar: rawConversation?.customerAvatar,
    customer_online: rawConversation?.customer_online,
    customerOnline: rawConversation?.customerOnline,
    customer_verified: rawConversation?.customer_verified,
    customerVerified: rawConversation?.customerVerified,
    assigned_agent_name: rawConversation?.assigned_agent_name,
    assignedOperatorName: rawConversation?.assignedOperatorName,
    rag_enabled: rawConversation?.rag_enabled,
    customerName: rawConversation?.customerName,
    visitor_name: rawConversation?.visitor_name,
    customer_company: rawConversation?.customer_company,
    customer_role: rawConversation?.customer_role,
    customer_phone: rawConversation?.customer_phone,
    created_at: rawConversation?.created_at,
    // Use processed location instead of raw object
    customer_location: processedCustomerLocation,
  };
}

/**
 * Adapts customer data for the sidebar
 */
export function adaptToUnifiedCustomerData(conversation: UnifiedConversation): UnifiedCustomerData {
  const customerName =
    conversation?.customerName ||
    conversation?.visitor_name ||
    conversation?.customerEmail ||
    conversation?.visitor_email ||
    conversation?.email_from ||
    "Customer";

  const customerEmail =
    conversation?.customerEmail || conversation?.visitor_email || conversation?.email_from || "No email provided";

  return {
    id: String(conversation?.id || "unknown"),
    name: String(customerName),
    email: String(customerEmail),
    avatar: conversation?.customer_avatar || conversation?.avatar,
    location: {
      city:
        (conversation?.customer_location as unknown)?.city ||
        (typeof conversation?.customer?.location === "string"
          ? conversation.customer.location.split(", ")[0] || "Unknown"
          : "Unknown"),
      country:
        (conversation?.customer_location as unknown)?.country ||
        (typeof conversation?.customer?.location === "string"
          ? conversation.customer.location.split(", ")[1] || "Unknown"
          : "Unknown"),
    },
    localTime: (conversation?.customer_location as unknown)?.timezone
      ? getLocalTime((conversation.customer_location as unknown).timezone)
      : conversation?.customer?.localTime || "",
    company: String(conversation?.customer_company || ""),
    role: String(conversation?.customer_role || ""),
    phone: String(conversation?.customer_phone || ""),
    lastSeen: String(conversation?.lastMessageAt || conversation?.lastMessageAt || new Date().toISOString()),
    firstSeen: String(conversation?.created_at || new Date().toISOString()),
    sessions: Math.floor(Math.random() * 50) + 1,
    browser: "Chrome",
    os: "macOS",
    deviceType: "desktop" as const,
    ipAddress: String(conversation?.customer || "Unknown"),
    customAttributes: {
      plan: ["Basic", "Premium", "Enterprise"][Math.floor(Math.random() * 3)] as string,
      accountValue: `$${(Math.random() * 100000).toFixed(0)}`,
    },
    tags: conversation?.tags || ["customer"],
    isVerified: conversation?.isVerified || false,
    isOnline: conversation?.isOnline || false,
    displayName: String(customerName),
    avatarUrl: conversation?.customer_avatar || conversation?.avatar || undefined,
    initials:
      customerName
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "CU",
    fallbackGradient: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
  };
}

/**
 * Adapts message data to unified format
 */
export function adaptToUnifiedMessage(rawMessage: unknown): UnifiedMessage {
  return {
    id: rawMessage?.id || `msg-${Date.now()}`,
    content: rawMessage?.content || "",
    senderType: rawMessage?.senderType || "customer",
    created_at: rawMessage?.created_at || new Date().toISOString(),
    delivery_status: rawMessage?.delivery_status || rawMessage?.status,
    status: rawMessage?.status,
    read_status: rawMessage?.read_status,
    read_at: rawMessage?.read_at,
    sender_avatar_url: rawMessage?.sender_avatar_url,
    senderName: rawMessage?.senderName,
    conversation_id: rawMessage?.conversation_id,
    organization_id: rawMessage?.organization_id,
    metadata: rawMessage?.metadata || {},
  };
}
