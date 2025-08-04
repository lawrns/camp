/**
 * Smart visitor display name system
 * Converts long visitor IDs into user-friendly display names
 */

export interface VisitorInfo {
  id: string;
  name?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface VisitorDisplay {
  displayName: string;
  tooltip: string;
  initials: string;
  color: string;
}

/**
 * Generate a deterministic color based on visitor ID
 */
function getVisitorColor(id: string): string {
  const colors = [
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-teal-500",
    "from-yellow-500 to-orange-500",
    "from-red-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-green-500",
    "from-violet-500 to-purple-500",
  ];

  const hash = id.split("").reduce((acc: unknown, char: unknown) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Extract initials from a display name
 */
function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get visitor display information with smart fallbacks
 */
export function getVisitorDisplay(visitor: VisitorInfo): VisitorDisplay {
  // Priority 1: Actual name if provided
  if (visitor.name && visitor.name.trim()) {
    return {
      displayName: visitor.name,
      tooltip: `${visitor.name} (${visitor.id})`,
      initials: getInitialsFromName(visitor.name),
      color: getVisitorColor(visitor.id),
    };
  }

  // Priority 2: Email-based display
  if (visitor.email && visitor.email.trim()) {
    const [username, domain] = visitor.email.split("@");
    if (!username) {
      return {
        displayName: "Visitor",
        tooltip: `${visitor.email} (${visitor.id})`,
        initials: "V",
        color: getVisitorColor(visitor.id),
      };
    }
    const displayName = username.length > 20 ? `${username.slice(0, 17)}...` : username;

    return {
      displayName: displayName,
      tooltip: `${visitor.email} (${visitor.id})`,
      initials: getInitialsFromName(username),
      color: getVisitorColor(visitor.id),
    };
  }

  // Priority 3: Smart anonymous display
  // Extract the last segment of the ID and convert to a friendly number
  const idParts = visitor.id.split(/[-_]/);
  const lastPart = idParts[idParts.length - 1] || visitor.id;

  // Take last 4-6 characters and convert to a number
  const shortId = lastPart.slice(-6);
  const visitorNumber =
    parseInt(shortId, 16) % 10000 ||
    Math.abs(
      visitor.id.split("").reduce((acc: unknown, char: unknown) => {
        return (acc << 5) - acc + char.charCodeAt(0);
      }, 0)
    ) % 10000;

  const displayName = `Visitor #${visitorNumber.toString().padStart(4, "0")}`;

  return {
    displayName: displayName,
    tooltip: visitor.id,
    initials: `V${visitorNumber.toString()[0]}`,
    color: getVisitorColor(visitor.id),
  };
}

/**
 * Improved visitor display name function for improved UX
 * Implements the smart display name system from the inbox improvement proposal
 * Returns simplified display name and tooltip for better user experience
 */
export function getVisitorDisplayName(visitor: { id: string; name?: string; email?: string; metadata?: unknown }): {
  displayName: string;
  tooltip: string;
} {
  // Priority 1: Actual name if provided
  if (visitor.name && visitor.name.trim()) {
    return {
      displayName: visitor.name.trim(),
      tooltip: visitor.id,
    };
  }

  // Priority 2: Email-based display
  if (visitor.email && visitor.email.trim()) {
    const [username] = visitor.email.split("@");
    if (!username) {
      return {
        displayName: "Visitor",
        tooltip: visitor.id,
      };
    }
    return {
      displayName: username.length > 20 ? `${username.slice(0, 17)}...` : username,
      tooltip: `${visitor.email} (${visitor.id})`,
    };
  }

  // Priority 3: Smart anonymous display
  const shortId = visitor.id.split("_").pop()?.slice(-4) || "0000";
  const visitorNumber = parseInt(shortId, 16) % 10000;

  return {
    displayName: `Visitor #${visitorNumber}`,
    tooltip: visitor.id,
  };
}

/**
 * Format visitor display for conversation lists
 */
export function formatVisitorForList(visitor: VisitorInfo): {
  primary: string;
  secondary?: string;
  avatar: {
    src?: string;
    fallback: string;
    gradient: string;
  };
} {
  const display = getVisitorDisplay(visitor);

  const avatarUrl = visitor.metadata?.avatarUrl;
  return {
    primary: display.displayName,
    secondary: visitor.email || undefined,
    avatar: {
      ...(avatarUrl && typeof avatarUrl === "string" && { src: avatarUrl }),
      fallback: display.initials,
      gradient: `bg-gradient-to-br ${display.color}`,
    },
  };
}
