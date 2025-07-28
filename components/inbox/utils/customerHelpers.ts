import type { Conversation } from "@/types/entities";
import { generateAvatar } from "./avatarGeneration";
import { generateVisitorName, getVisitorInitials } from "./visitorNameGenerator";

interface VisitorInfo {
  id?: string;
  name?: string | null;
  email?: string | null;
  metadata?: Record<string, any>;
}

interface UserInfo {
  id?: string;
  name?: string | null;
  email?: string | null;
  visitor_id?: string;
  metadata?: {
    visitor_id?: string;
  };
}

export const getVisitorDisplay = (visitor: VisitorInfo) => {
  let displayName = visitor.name || (visitor.email && visitor.email.split("@")[0]);
  let color = "from-blue-400 to-blue-600";

  // If no name or email, generate a friendly visitor name
  if (!displayName || displayName === "Anonymous") {
    const visitorId = visitor.id || "anonymous";
    const generated = generateVisitorName(visitorId);
    displayName = generated.name;
    color = `${generated.color.from} ${generated.color.to}`;
  }

  const initials = getVisitorInitials(displayName || "");

  return {
    displayName: displayName || "Anonymous Visitor",
    initials,
    color,
    tooltip: visitor.email || displayName || "Anonymous Visitor",
  };
};

export const getUserAvatar = (user: UserInfo) => {
  // Use the improved avatar generation with consistent seeding
  const avatar = generateAvatar({
    name: user.name || undefined,
    email: user.email || undefined,
    id: user.id || user.visitor_id || user.metadata?.visitor_id,
    size: 40,
  });

  return avatar.url;
};

export const getCustomerData = (conversation?: Conversation | null) => {
  if (!conversation) {
    return {
      avatarUrl: "/images/avatars/4.png",
      displayName: "Unknown Customer",
      initials: "UC",
      fallbackGradient: "from-gray-400 to-gray-600",
      tooltip: "Unknown",
    };
  }

  // Extract name from email or metadata using modern and legacy fields
  const customerName =
    conversation.customerName ||
    conversation.customer_name ||
    conversation.metadata?.name ||
    (conversation.customerEmail && conversation.customerEmail.split("@")[0]) ||
    (conversation.customer_email && conversation.customer_email.split("@")[0]) ||
    null; // Use null to trigger visitor name generation

  const visitorDisplay = getVisitorDisplay({
    id: conversation.customerId || conversation.customer_id || conversation.id,
    name: customerName,
    email: conversation.customerEmail || conversation.customer_email,
    metadata: conversation.metadata,
  });

  const avatarUrl = getUserAvatar({
    email: conversation.customerEmail || conversation.customer_email,
    name: customerName || visitorDisplay.displayName,
    id: conversation.customerId || conversation.customer_id || conversation.id,
  });

  return {
    avatarUrl,
    displayName: visitorDisplay.displayName,
    initials: visitorDisplay.initials,
    fallbackGradient: `bg-gradient-to-br ${visitorDisplay.color}`,
    tooltip: visitorDisplay.tooltip,
  };
};
