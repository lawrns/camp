/**
 * Display Name Utilities
 * Centralized logic for creating clean, user-friendly display names
 */

/**
 * Create clean visitor display names from email addresses or session identifiers
 */
export function createVisitorDisplayName(email: string): string {
  if (!email) return "Visitor";

  // Handle widget session identifiers like 'visitor_session_ga0p43k4g_1749512121730@widget.campfire'
  if (email.includes("visitor_session_") && email.includes("@widget")) {
    const sessionPart = email.split("@")[0];
    if (!sessionPart) return "Visitor";
    const sessionId = sessionPart.replace("visitor_session_", "");
    // Extract a shorter, more readable identifier
    const shortId = sessionId.substring(0, 8);
    return `Visitor ${shortId}`;
  }

  // Handle regular email addresses
  if (email.includes("@")) {
    const localPart = email.split("@")[0];
    if (!localPart) return "Visitor";
    // If it's a technical identifier, create a friendly name
    if (localPart.includes("_") || localPart.length > 15) {
      return `Visitor ${localPart.substring(0, 8)}`;
    }
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  return email.length > 10 ? `Visitor ${email.substring(0, 8)}` : email;
}

/**
 * Get avatar initials from a name and sender type
 */
export function getAvatarInitials(name: string, senderType: string): string {
  if (senderType === "ai") return "AI";
  if (!name) return senderType === "agent" ? "A" : "V";

  const words = name.split(" ");
  if (words.length >= 2) {
    return ((words[0]?.charAt(0) || "") + (words[1]?.charAt(0) || "")).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Create a clean customer name for display in conversation lists
 */
export function createCustomerDisplayName(customer: { name?: string; email?: string } | null): string {
  if (!customer) return "Unknown Customer";

  // If we have a name and it's not a technical identifier, use it
  if (customer.name && !customer.name.includes("visitor_session_") && !customer.name.includes("@widget")) {
    return customer.name;
  }

  // Otherwise, create a clean name from the email
  return createVisitorDisplayName(customer.email || "Unknown Customer");
}

/**
 * Shorten long identifiers for UI display
 */
export function shortenIdentifier(identifier: string, maxLength: number = 12): string {
  if (identifier.length <= maxLength) return identifier;

  // For session identifiers, extract meaningful parts
  if (identifier.includes("visitor_session_")) {
    const sessionPart = identifier.replace("visitor_session_", "").split("@")[0];
    if (!sessionPart) return `Visitor ${identifier.substring(0, 6)}`;
    return `Visitor ${sessionPart.substring(0, 6)}`;
  }

  // For other long identifiers, truncate with ellipsis
  return `${identifier.substring(0, maxLength - 3)}...`;
}
