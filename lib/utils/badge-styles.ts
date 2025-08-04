/**
 * Standardized badge and button styling utilities for consistent design system
 * All classes are explicitly listed to ensure Tailwind purging doesn't remove them
 */

// Status badge color mapping
export const getStatusBadgeClasses = (status: string): string => {
  switch (status) {
    case "open":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "assigned":
      return "bg-blue-100 text-blue-700";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Priority badge color mapping
export const getPriorityBadgeClasses = (priority: string): string => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// User type badge color mapping
export const getUserTypeBadgeClasses = (userType: string): string => {
  switch (userType) {
    case "human":
      return "bg-blue-100 text-blue-700";
    case "ai":
      return "bg-purple-100 text-purple-700";
    case "system":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Base badge classes - explicitly listed for Tailwind safelist
export const getBadgeClasses = (colorClasses: string): string => {
  return `text-xs px-2 py-1 rounded-full font-medium ${colorClasses}`;
};

// Unread badge classes
export const unreadBadgeClasses = "bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium";

// Avatar ring classes
export const avatarRingClasses = "ring-2 ring-white shadow-sm";

// Conversation card classes
export const conversationCardClasses = {
  base: "p-4 rounded-xl cursor-pointer transition-all duration-200 border",
  selected: "bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100",
  unselected: "hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm"
};

// Layout utility classes
export const layoutClasses = {
  flexStart: "flex items-start",
  flexCenter: "flex items-center",
  conversationGap: "gap-3",
  textTruncate: "truncate"
};

// Button styles for consistency
export const buttonClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
  ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
};

// Header button classes
export const headerButtonClasses = {
  base: "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors",
  active: "p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors",
  notification: "relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
};

// Search input classes
export const searchInputClasses = {
  container: "relative",
  input: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  icon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
};

// Mobile responsive classes
export const mobileClasses = {
  hidden: "hidden sm:block",
  visible: "block sm:hidden",
  searchDialog: "sm:hidden",
  headerCompact: "sm:flex-row sm:gap-4"
};
