/**
 * Avatar utility functions for generating deterministic wave gradient avatars
 * Based on the build guide requirements
 */

import { generateDeterministicName } from "./nameGenerator";

// Simple hash function for deterministic color generation
function hash(str: string): number {
  // Handle null, undefined, or empty strings
  if (!str || typeof str !== "string") {
    str = "anonymous";
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Professional avatar gradient system with beautiful color combinations
 * Creates sophisticated, brand-aligned gradients - NO YELLOW COLORS
 */
export const genWaveAvatar = (seed: string): string => {
  // Professional gradient combinations - carefully curated for beauty and accessibility
  const gradientPalettes = [
    // Ocean Blues - Professional and calming
    {
      primary: "#1e40af", // Blue-700
      secondary: "#3b82f6", // Blue-500
      accent: "#60a5fa", // Blue-400
    },
    // Forest Greens - Natural and trustworthy
    {
      primary: "#166534", // Green-800
      secondary: "#22c55e", // Green-500
      accent: "#4ade80", // Green-400
    },
    // Royal Purples - Creative and premium
    {
      primary: "#7c3aed", // Violet-600
      secondary: "#a855f7", // Purple-500
      accent: "#c084fc", // Purple-400
    },
    // Warm Crimsons - Energetic and confident
    {
      primary: "#dc2626", // Red-600
      secondary: "#ef4444", // Red-500
      accent: "#f87171", // Red-400
    },
    // Elegant Teals - Modern and sophisticated
    {
      primary: "#0f766e", // Teal-700
      secondary: "#14b8a6", // Teal-500
      accent: "#5eead4", // Teal-300
    },
    // Sunset Oranges - Warm and approachable (NO YELLOW)
    {
      primary: "#ea580c", // Orange-600
      secondary: "#f97316", // Orange-500
      accent: "#fb923c", // Orange-400
    },
    // Deep Indigos - Professional and trustworthy
    {
      primary: "#4338ca", // Indigo-600
      secondary: "#6366f1", // Indigo-500
      accent: "#818cf8", // Indigo-400
    },
    // Rose Golds - Elegant and premium
    {
      primary: "#e11d48", // Rose-600
      secondary: "#f43f5e", // Rose-500
      accent: "#fb7185", // Rose-400
    },
  ];

  const hashValue = hash(seed);
  const palette = gradientPalettes[hashValue % gradientPalettes.length];

  if (!palette) {
    // Fallback to first palette if something goes wrong
    const fallbackPalette = gradientPalettes[0];
    if (!fallbackPalette) {
      return "linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1e3a8a 100%)";
    }
    return `linear-gradient(135deg,
      ${fallbackPalette.primary} 0%,
      ${fallbackPalette.secondary} 50%,
      ${fallbackPalette.accent} 100%)`;
  }

  // Create sophisticated multi-stop gradient with depth
  return `linear-gradient(135deg,
    ${palette.primary} 0%,
    ${palette.secondary} 50%,
    ${palette.accent} 100%)`;
};

// Use the centralized deterministic name generator
export const generateFriendlyName = generateDeterministicName;

/**
 * Get initials from a name (supports both generated and real names)
 * @param name - The name to extract initials from
 * @returns Two-character initials string, or "AN" for anonymous/invalid names
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Alice") // "AL"
 * getInitials("") // "AN"
 * getInitials(null) // "AN"
 */
export const getInitials = (name: string): string => {
  // Handle null, undefined, or empty names
  if (!name || typeof name !== "string") {
    return "AN"; // Anonymous
  }

  return name
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

/**
 * Avatar assignment system using PNG files from
 *;'\/public/images/avatars/
 */

// Available avatar files (1.png to 7.png)
const AVATAR_FILES = [1, 2, 3, 4, 5, 6, 7];

// Avatar assignment pools
const AGENT_AVATARS = [1, 2, 3]; // Professional avatars for agents
const CUSTOMER_AVATARS = [4, 5, 6, 7]; // Friendly avatars for customers
// AI uses same pool as agents to appear human-like
const AI_AVATARS = [1, 2, 3]; // Use agent avatars for AI to maintain human illusion

/**
 * Generate deterministic avatar assignment based on user identifier
 */
export const getAvatarPath = (
  identifier: string,
  userType: "agent" | "customer" | "ai" | "system" = "customer"
): string => {
  // Handle null, undefined, or empty identifiers
  if (!identifier || typeof identifier !== "string") {
    identifier = "anonymous";
  }

  const hashValue = hash(identifier);

  switch (userType) {
    case "agent":
      const agentIndex = hashValue % AGENT_AVATARS.length;
      return `/images/avatars/${AGENT_AVATARS[agentIndex]}.png`;

    case "customer":
      const customerIndex = hashValue % CUSTOMER_AVATARS.length;
      return `/images/avatars/${CUSTOMER_AVATARS[customerIndex]}.png`;

    case "ai":
      // AI uses agent avatars to appear human-like
      const aiIndex = hashValue % AI_AVATARS.length;
      return `/images/avatars/${AI_AVATARS[aiIndex]}.png`;

    case "system":
      // System messages get a neutral avatar
      return `/images/avatars/1.png`;

    default:
      // Fallback to customer avatar
      const fallbackIndex = hashValue % CUSTOMER_AVATARS.length;
      return `/images/avatars/${CUSTOMER_AVATARS[fallbackIndex]}.png`;
  }
};

/**
 * Avatar component props interface
 */
export interface AvatarData {
  name: string;
  email: string;
  avatar?: string;
  isGenerated?: boolean;
  userType?: "agent" | "customer" | "ai" | "system";
}

/**
 * Generate complete avatar data for a user with PNG avatar assignment
 */
export const generateAvatarData = (
  email: string,
  name?: string,
  userType: "agent" | "customer" | "ai" | "system" = "customer"
): AvatarData => {
  const generatedName = name || generateFriendlyName(email);
  const avatarPath = getAvatarPath(email, userType);

  return {
    name: generatedName,
    email,
    avatar: avatarPath,
    isGenerated: !name,
    userType,
  };
};

/**
 * UNIFIED AVATAR SYSTEM - All components should use this function
 * Get avatar for a specific user with fallback logic
 */
export const getUserAvatar = (user: {
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
  role?: string;
  customer_email?: string;
  customer_name?: string;
  visitor_email?: string;
  visitor_name?: string;
}): string => {
  // If user already has a valid avatar URL, use it (unless it's a gradient fallback)
  if (user.avatar && !user.avatar.includes("gradient") && !user.avatar.includes("linear-gradient")) {
    return user.avatar;
  }

  // Determine user type based on role or context
  let userType: "agent" | "customer" | "ai" | "system" = "customer";
  if (user.role === "agent" || user.role === "admin") {
    userType = "agent";
  } else if (user.role === "ai") {
    userType = "ai";
  } else if (user.role === "system") {
    userType = "system";
  }

  // Use comprehensive identifier extraction for customers/visitors
  const identifier =
    user.email ||
    user.customerEmail ||
    user.visitor_email ||
    user.id ||
    user.name ||
    user.customerName ||
    user.visitor_name ||
    "anonymous";

  return getAvatarPath(identifier, userType);
};

/**
 * UNIFIED CUSTOMER DATA EXTRACTION
 * Extract standardized customer data from any conversation object
 */
export interface UnifiedCustomerData {
  displayName: string;
  email?: string;
  avatarUrl: string;
  initials: string;
  isOnline?: boolean;
  isVerified?: boolean;
  fallbackGradient: string;
}

export const getUnifiedCustomerData = (conversation: unknown): UnifiedCustomerData => {
  if (!conversation) {
    return {
      displayName: "Unknown Customer",
      avatarUrl: "/images/avatars/4.png",
      initials: "UC",
      isOnline: false,
      isVerified: false,
      fallbackGradient: "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
    };
  }

  // Extract customer name from various sources
  const customerName =
    conversation.customerName ||
    conversation.visitor_name ||
    conversation.customer?.name ||
    conversation.metadata?.name ||
    conversation.customerEmail?.split("@")[0] ||
    conversation.visitor_email?.split("@")[0] ||
    conversation.emailFrom?.split("@")[0] ||
    "Anonymous";

  // Extract customer email
  const customerEmail =
    conversation.customerEmail || conversation.visitor_email || conversation.customer?.email || conversation.emailFrom;

  // Get avatar using unified system
  const avatarUrl = getUserAvatar({
    email: customerEmail,
    name: customerName,
    id: conversation.visitor_id || conversation.id,
    role: "customer",
  });

  // Generate initials
  const initials = getInitials(customerName);

  // Extract status
  const isOnline = Boolean(
    conversation.isOnline || conversation.customer?.isOnline || conversation.online_status === "online"
  );

  const isVerified = Boolean(conversation.isVerified || conversation.customer?.isVerified || conversation.verified);

  return {
    displayName: customerName,
    email: customerEmail,
    avatarUrl,
    initials,
    isOnline,
    isVerified,
    fallbackGradient: genWaveAvatar(customerEmail || customerName),
  };
};

/**
 * STATUS INDICATOR UTILITIES
 */
export type StatusType = "online" | "away" | "offline" | "unknown";

export const getStatusColor = (status: StatusType): string => {
  switch (status) {
    case "online":
      return "#22c55e"; // Green-500
    case "away":
      return "#f59e0b"; // Amber-500
    case "offline":
      return "#6b7280"; // Gray-500
    default:
      return "#6b7280"; // Gray-500
  }
};

export const getStatusIndicator = (isOnline?: boolean): StatusType => {
  if (isOnline === true) return "online";
  if (isOnline === false) return "offline";
  return "unknown";
};

/**
 * Avatar utility for consistent user avatar generation
 * Uses email hash to deterministically select from available avatar images
 */

export const getAvatarUrl = (email: string): string => {
  if (!email) {
    return "/images/avatars/1.png"; // Default avatar
  }

  // Create a simple hash from the email
  const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Map to avatar numbers 1-7
  const avatarNumber = (hash % 7) + 1;

  return `/images/avatars/${avatarNumber}.png`;
};

export const getAvatarInitials = (name: string | null | undefined, email: string): string => {
  if (name && name.trim()) {
    const nameParts = name.trim().split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
  }

  return "?";
};

export const getOnlineStatus = (lastSeen?: string): "online" | "away" | "offline" => {
  if (!lastSeen) return "offline";

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  if (diffInMinutes < 5) return "online";
  if (diffInMinutes < 30) return "away";
  return "offline";
};
