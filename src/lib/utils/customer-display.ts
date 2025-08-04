/**
 * Customer Display Utilities
 * Handles customer avatars, visitor names, and display formatting
 */

// Avatar configuration
const AVATAR_COUNT = 7;

// Pre-generate visitor names for consistency
const VISITOR_ADJECTIVES = [
  "Curious",
  "Friendly",
  "Helpful",
  "Smart",
  "Active",
  "Quick",
  "Bright",
  "Creative",
  "Eager",
  "Patient",
  "Kind",
  "Clever",
  "Gentle",
  "Bold",
  "Wise",
  "Calm",
  "Happy",
  "Loyal",
  "Fair",
  "Honest",
];

const VISITOR_NOUNS = [
  "Visitor",
  "Guest",
  "Explorer",
  "User",
  "Friend",
  "Customer",
  "Traveler",
  "Seeker",
  "Browser",
  "Reader",
  "Learner",
  "Helper",
  "Partner",
  "Client",
];

// Avatar color palette
const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
  "#F1948A",
  "#85C1E9",
  "#D7BDE2",
];

/**
 * Simple hash function for deterministic generation
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a hash code for consistent avatar assignment (legacy compatibility)
 */
function hashCode(str: string): number {
  return simpleHash(str);
}

/**
 * Get avatar path for a customer/visitor
 */
export function getAvatarPath(customerId: string): string {
  const avatarIndex = (hashCode(customerId || "anonymous") % AVATAR_COUNT) + 1;
  return `/images/avatars/${avatarIndex}.png`;
}

/**
 * Generate a unique, friendly name for visitors
 */
export function generateVisitorName(identifier: string): string {
  const hash = simpleHash(identifier);
  const adjective = VISITOR_ADJECTIVES[hash % VISITOR_ADJECTIVES.length];
  const noun = VISITOR_NOUNS[Math.floor(hash / VISITOR_ADJECTIVES.length) % VISITOR_NOUNS.length];

  return `${adjective} ${noun}`;
}

/**
 * Generate visitor email for display
 */
export function generateVisitorEmail(visitorId: string): string {
  return `visitor-${visitorId}@anonymous.local`;
}

/**
 * Get deterministic avatar based on identifier
 */
export function getAvatarForIdentifier(identifier: string): string {
  const hash = simpleHash(identifier);
  const avatarNumber = (hash % 7) + 1; // We have 7 avatar images (1-7.png)
  return `/images/avatars/${avatarNumber}.png`;
}

/**
 * Get fallback color for identifier
 */
export function getFallbackColor(identifier: string): string {
  const hash = simpleHash(identifier);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Generate initials from name or email
 */
export function generateInitials(name: string, email: string): string {
  if (name && name !== "Unknown Customer" && !name.includes("Visitor")) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return ((nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "")).toUpperCase();
    } else if (nameParts[0] && nameParts[0].length > 0) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
  }

  if (email && email.includes("@")) {
    const emailPart = email.split("@")[0];
    if (emailPart && emailPart.length >= 2) {
      return emailPart.substring(0, 2).toUpperCase();
    }
  }

  return "CU"; // Customer Unknown
}

/**
 * Get customer initials for fallback avatars (legacy compatibility)
 */
export function getCustomerInitials(name: string): string {
  const words = name.split(" ").filter((word: unknown) => word.length > 0);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0]?.substring(0, 2).toUpperCase() || "??";
  return ((words[0]?.[0] || "") + (words[1]?.[0] || "")).toUpperCase();
}

/**
 * Generate background color for fallback avatars (legacy compatibility)
 */
export function getAvatarBackgroundColor(identifier: string): string {
  const colors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#6366F1", // Indigo
  ];

  const hash = hashCode(identifier);
  return colors[hash % colors.length];
}

// Type definitions
export interface CustomerDisplayInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  fallbackColor: string;
  isVisitor: boolean;
  visitorBadge?: string;
  displayLocation: string;
  localTime?: string;
}

export interface CustomerDisplay {
  name: string;
  email: string;
  avatar: string;
  displayType: "customer" | "visitor";
  isAnonymous: boolean;
}

/**
 * Get comprehensive customer display information (legacy compatibility)
 */
export function getCustomerDisplay(conversation: unknown): CustomerDisplay {
  // Extract customer info from conversation
  const customerId = conversation.customer_id || conversation.visitor_id;
  const customerName = conversation.customerName || conversation.visitor_name;
  const customerEmail = conversation.customerEmail || conversation.visitor_email;

  // Determine if this is a known customer or anonymous visitor
  const isKnownCustomer = !!(customerName && customerEmail);
  const isAnonymous = !isKnownCustomer;

  return {
    name: customerName || generateVisitorName(customerId || "unknown"),
    email: customerEmail || generateVisitorEmail(customerId || "unknown"),
    avatar: getAvatarPath(customerId || "unknown"),
    displayType: isKnownCustomer ? "customer" : "visitor",
    isAnonymous,
  };
}

/**
 * Format customer name for display with status indicators
 */
export function formatCustomerName(display: CustomerDisplay): string {
  if (display.isAnonymous) {
    return `${display.name} 👤`; // Anonymous visitor indicator
  }
  return display.name;
}

/**
 * Synchronous customer display info generation
 */
export function getCustomerDisplayInfoSync(customer: unknown): CustomerDisplayInfo {
  // Extract customer data with comprehensive fallbacks
  const id = customer?.id || customer?.customer_id || customer?.visitor_id || `temp-${Date.now()}`;

  const email =
    customer?.email ||
    customer?.customerEmail ||
    customer?.visitor_email ||
    customer?.customerEmail ||
    customer?.visitorEmail ||
    "";

  const providedName =
    customer?.name ||
    customer?.customerName ||
    customer?.visitor_name ||
    customer?.customerName ||
    customer?.visitorName ||
    "";

  // Determine if this is a visitor
  const isVisitor =
    !email ||
    email.includes("visitor-") ||
    email.includes("anonymous") ||
    providedName.includes("Visitor") ||
    !email.includes("@");

  // Generate appropriate name
  const identifier = email || id.toString();
  const name = isVisitor
    ? providedName && !providedName.includes("Unknown")
      ? providedName
      : generateVisitorName(identifier)
    : providedName || email.split("@")[0] || "Customer";

  // Get avatar
  const providedAvatar = customer?.avatar || customer?.customer_avatar || customer?.customerAvatar;
  const avatar = providedAvatar || getAvatarForIdentifier(identifier);

  // Generate initials and color
  const initials = generateInitials(name, email);
  const fallbackColor = getFallbackColor(identifier);

  // Basic location info (no async detection)
  const existingLocation = customer?.location || customer?.customer_location || customer?.customerLocation || null;

  const displayLocation = existingLocation ? `🌍 ${existingLocation}` : "🌍 Unknown location";

  // Generate visitor badge if applicable
  const visitorBadge = isVisitor ? "Anonymous Visitor" : undefined;

  return {
    id: id.toString(),
    name,
    email: email || "No email provided",
    avatar,
    initials,
    fallbackColor,
    isVisitor,
    visitorBadge,
    displayLocation,
    localTime: undefined,
  };
}

/**
 * Bulk process customer display info (for conversation lists)
 */
export function bulkGetCustomerDisplayInfo(customers: unknown[]): CustomerDisplayInfo[] {
  return customers.map((customer: unknown) => getCustomerDisplayInfoSync(customer));
}
