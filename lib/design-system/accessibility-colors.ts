/**
 * WCAG AA compliant color combinations for the design system
 * All combinations have been tested to meet 4.5:1 contrast ratio for normal text
 * and 3:1 for large text (18pt+ or 14pt+ bold)
 */

export interface ColorCombination {
  background: string;
  text: string;
  border: string;
  hover?: {
    background: string;
    text: string;
  };
}

/**
 * Status color combinations that meet WCAG AA standards
 */
export const statusColors = {
  success: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
    hover: {
      background: "bg-green-100",
      text: "text-green-950",
    },
  },
  warning: {
    background: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
    hover: {
      background: "bg-amber-100",
      text: "text-amber-950",
    },
  },
  error: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
    hover: {
      background: "bg-red-100",
      text: "text-red-950",
    },
  },
  info: {
    background: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-200",
    hover: {
      background: "bg-blue-100",
      text: "text-blue-950",
    },
  },
  neutral: {
    background: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-200",
    hover: {
      background: "bg-gray-100",
      text: "text-gray-950",
    },
  },
} as const;

/**
 * Priority color combinations that meet WCAG AA standards
 */
export const priorityColors = {
  urgent: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
    hover: {
      background: "bg-red-100",
      text: "text-red-950",
    },
  },
  high: {
    background: "bg-orange-50",
    text: "text-orange-900",
    border: "border-orange-200",
    hover: {
      background: "bg-orange-100",
      text: "text-orange-950",
    },
  },
  medium: {
    background: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
    hover: {
      background: "bg-amber-100",
      text: "text-amber-950",
    },
  },
  low: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
    hover: {
      background: "bg-green-100",
      text: "text-green-950",
    },
  },
  none: {
    background: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-200",
    hover: {
      background: "bg-gray-100",
      text: "text-gray-950",
    },
  },
} as const;

/**
 * Conversation status color combinations
 */
export const conversationStatusColors = {
  open: statusColors.success,
  pending: statusColors.warning,
  resolved: statusColors.info,
  closed: statusColors.neutral,
  archived: statusColors.neutral,
} as const;

/**
 * Utility function to get status colors with fallback
 */
export function getStatusColors(status: string): ColorCombination {
  const normalizedStatus = status.toLowerCase() as keyof typeof conversationStatusColors;
  return conversationStatusColors[normalizedStatus] || statusColors.neutral;
}

/**
 * Utility function to get priority colors with fallback
 */
export function getPriorityColors(priority: string): ColorCombination {
  const normalizedPriority = priority.toLowerCase() as keyof typeof priorityColors;
  return priorityColors[normalizedPriority] || priorityColors.none;
}

/**
 * Generate CSS classes for a color combination
 */
export function getColorClasses(combination: ColorCombination): string {
  return `${combination.background} ${combination.text} ${combination.border}`;
}

/**
 * Generate hover CSS classes for a color combination
 */
export function getHoverColorClasses(combination: ColorCombination): string {
  if (!combination.hover) return "";
  return `hover:${combination.hover.background} hover:${combination.hover.text}`;
}

/**
 * Complete class string with hover states
 */
export function getCompleteColorClasses(combination: ColorCombination): string {
  const baseClasses = getColorClasses(combination);
  const hoverClasses = getHoverColorClasses(combination);
  return `${baseClasses} ${hoverClasses}`.trim();
}

/**
 * Semantic color mappings for common UI elements
 */
export const semanticColors = {
  // Button states
  buttonPrimary: {
    background: "bg-blue-600",
    text: "text-white",
    border: "border-blue-600",
    hover: {
      background: "bg-blue-700",
      text: "text-white",
    },
  },
  buttonSecondary: {
    background: "bg-gray-100",
    text: "text-gray-900",
    border: "border-gray-300",
    hover: {
      background: "bg-gray-200",
      text: "text-gray-950",
    },
  },
  buttonDanger: {
    background: "bg-red-600",
    text: "text-white",
    border: "border-red-600",
    hover: {
      background: "bg-red-700",
      text: "text-white",
    },
  },
  
  // Form states
  inputDefault: {
    background: "bg-white",
    text: "text-gray-900",
    border: "border-gray-300",
    hover: {
      background: "bg-white",
      text: "text-gray-900",
    },
  },
  inputError: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-300",
    hover: {
      background: "bg-red-50",
      text: "text-red-900",
    },
  },
  inputSuccess: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-300",
    hover: {
      background: "bg-green-50",
      text: "text-green-900",
    },
  },
} as const;

/**
 * Accessibility helper to validate color contrast
 * Note: This is a simplified check - use actual contrast calculation tools for production
 */
export function validateColorCombination(combination: ColorCombination): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Basic validation - in production, use actual contrast calculation
  if (combination.background.includes("100") && combination.text.includes("800")) {
    warnings.push("Potential contrast issue: light background with medium text");
  }
  
  if (combination.background.includes("yellow") || combination.text.includes("yellow")) {
    warnings.push("Yellow combinations may have contrast issues - verify with WCAG tools");
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
