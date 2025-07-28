/**
 * Unified customer display utilities
 * Provides consistent customer data display across the application
 */

import type { Conversation } from "@/types/common";

export interface UnifiedCustomerData {
  name?: string;
  email?: string;
  displayName: string;
  avatar?: string;
  isVerified?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CustomerDisplayOptions {
  showEmail?: boolean;
  showAvatar?: boolean;
  fallbackToEmail?: boolean;
  maxLength?: number;
}

/**
 * Get unified customer display data
 */
export function getUnifiedCustomerData(
  customer: {
    name?: string;
    email?: string;
    avatar?: string;
    metadata?: Record<string, unknown>;
  },
  options: CustomerDisplayOptions = {}
): UnifiedCustomerData {
  const { fallbackToEmail = true, maxLength = 50 } = options;

  let displayName = customer.name || "";

  if (!displayName && fallbackToEmail && customer.email) {
    displayName = customer.email.split("@")[0];
  }

  if (!displayName) {
    displayName = "Anonymous User";
  }

  if (maxLength && displayName.length > maxLength) {
    displayName = displayName.substring(0, maxLength) + "...";
  }

  return {
    name: customer.name || undefined,
    email: customer.email || undefined,
    displayName,
    avatar: customer.avatar || undefined,
    metadata: customer.metadata,
  };
}

/**
 * Get unified customer display from conversation
 */
export function getCustomerDisplayFromConversation(
  conversation: Conversation,
  options: CustomerDisplayOptions = {}
): UnifiedCustomerData {
  return getUnifiedCustomerData(
    {
      ...(conversation.customerName ? { name: conversation.customerName } : {}),
      ...(conversation.customerEmail ? { email: conversation.customerEmail } : {}),
      ...(conversation.metadata ? { metadata: conversation.metadata } : {}),
    },
    options
  );
}

/**
 * Get unified customer display string
 */
export function getUnifiedCustomerDisplay(
  customer: {
    name?: string;
    email?: string;
    metadata?: Record<string, unknown>;
  },
  options: CustomerDisplayOptions = {}
): string {
  const customerData = getUnifiedCustomerData(customer, options);
  return customerData.displayName;
}

/**
 * Format customer display with email
 */
export function formatCustomerDisplayWithEmail(customer: { name?: string; email?: string }): string {
  if (customer.name && customer.email) {
    return `${customer.name} (${customer.email})`;
  }

  return customer.name || customer.email || "Anonymous User";
}

/**
 * Get customer initials for avatar
 */
export function getCustomerInitials(customer: { name?: string; email?: string }): string {
  if (customer.name) {
    return customer.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (customer.email) {
    return customer.email.slice(0, 2).toUpperCase();
  }

  return "AU"; // Anonymous User
}
