/**
 * @fileoverview Comprehensive date and time formatting utilities for Campfire
 * @module utils/date
 *
 * This module provides a unified API for date/time operations throughout the application.
 * It wraps date-fns functions with additional validation and formatting options optimized
 * for the customer support use case.
 *
 * @example
 * ```typescript
 * import { formatRelativeTime, formatDateTime } from '@/lib/utils/date';
 *
 * // Display "5 minutes ago"
 * const relativeTime = formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000));
 *
 * // Display "Mar 15, 2024 at 3:30 PM"
 * const fullDateTime = formatDateTime(new Date());
 * ```
 */

import {
  addDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears,
  endOfDay,
  format,
  formatDistanceStrict,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isSameDay,
  isSameWeek,
  isSameYear,
  isToday,
  isValid,
  isYesterday,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Formats a date to display time only in 12-hour format
 *
 * @param {Date | string} date - The date to format (Date object or ISO string)
 * @returns {string} Formatted time string (e.g., "3:30 PM")
 *
 * @example
 * formatTime(new Date()) // "3:30 PM"
 * formatTime("2024-03-15T15:30:00Z") // "3:30 PM"
 * formatTime(invalidDate) // "Invalid time"
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid time";
  }

  return format(dateObj, "h:mm a");
}

/**
 * Formats a date to display time in 24-hour format
 *
 * @param {Date | string} date - The date to format (Date object or ISO string)
 * @returns {string} Formatted time string in 24-hour format (e.g., "15:30")
 *
 * @example
 * formatTime24(new Date()) // "15:30"
 * formatTime24("2024-03-15T03:30:00Z") // "03:30"
 */
export function formatTime24(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid time";
  }

  return format(dateObj, "HH:mm");
}

/**
 * Formats a date with intelligent formatting based on recency
 *
 * Uses contextual formatting rules:
 * - Today: "Today"
 * - Yesterday: "Yesterday"
 * - This week: Day name (e.g., "Monday")
 * - This year: Month and day (e.g., "Mar 15")
 * - Older: Full date (e.g., "Mar 15, 2023")
 *
 * @param {Date | string} date - The date to format
 * @returns {string} Contextually formatted date string
 *
 * @example
 * formatDate(new Date()) // "Today"
 * formatDate(yesterday) // "Yesterday"
 * formatDate(lastMonday) // "Monday"
 * formatDate(lastMonth) // "Feb 15"
 * formatDate(lastYear) // "Mar 15, 2023"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid date";
  }

  const now = new Date();

  if (isToday(dateObj)) {
    return "Today";
  } else if (isYesterday(dateObj)) {
    return "Yesterday";
  } else if (isSameWeek(dateObj, now)) {
    return format(dateObj, "EEEE");
  } else if (isSameYear(dateObj, now)) {
    return format(dateObj, "MMM d");
  } else {
    return format(dateObj, "MMM d, yyyy");
  }
}

/**
 * Formats a date with full date and time information
 *
 * @param {Date | string} date - The date to format
 * @param {boolean} [includeSeconds=false] - Whether to include seconds in the output
 * @returns {string} Full date and time string (e.g., "Mar 15, 2024 at 3:30 PM")
 *
 * @example
 * formatDateTime(new Date()) // "Mar 15, 2024 at 3:30 PM"
 * formatDateTime(new Date(), true) // "Mar 15, 2024 at 3:30:45 PM"
 */
export function formatDateTime(date: Date | string, includeSeconds = false): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid date";
  }

  const timeFormat = includeSeconds ? "h:mm:ss a" : "h:mm a";
  return format(dateObj, `MMM d, yyyy 'at' ${timeFormat}`);
}

/**
 * Formats a date as relative time from now
 *
 * @param {Date | string} date - The date to format
 * @param {boolean} [addSuffix=true] - Whether to add "ago" or "in" suffix
 * @returns {string} Relative time string (e.g., "5 minutes ago", "in 2 hours")
 *
 * @example
 * formatRelativeTime(fiveMinutesAgo) // "5 minutes ago"
 * formatRelativeTime(inTwoHours) // "in 2 hours"
 * formatRelativeTime(fiveMinutesAgo, false) // "5 minutes"
 */
export function formatRelativeTime(date: Date | string, addSuffix = true): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid time";
  }

  return formatDistanceToNow(dateObj, { addSuffix });
}

/**
 * @deprecated Use formatRelativeTime instead
 * @see formatRelativeTime
 */
export const formatTimeAgo = formatRelativeTime;

/**
 * Formats relative time in compact notation for space-constrained UIs
 *
 * Outputs abbreviated time units:
 * - < 1 minute: "just now"
 * - Minutes: "5m"
 * - Hours: "2h"
 * - Days: "3d"
 * - Weeks: "2w"
 * - Months: "3mo"
 * - Years: "1y"
 *
 * @param {Date | string} date - The date to format
 * @returns {string} Compact relative time string
 *
 * @example
 * formatRelativeTimeShort(fiveMinutesAgo) // "5m"
 * formatRelativeTimeShort(twoHoursAgo) // "2h"
 * formatRelativeTimeShort(threeDaysAgo) // "3d"
 */
export function formatRelativeTimeShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "";
  }

  const now = new Date();
  const seconds = differenceInSeconds(now, dateObj);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = differenceInMinutes(now, dateObj);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = differenceInHours(now, dateObj);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = differenceInDays(now, dateObj);
  if (days < 7) {
    return `${days}d`;
  }

  const weeks = differenceInWeeks(now, dateObj);
  if (weeks < 4) {
    return `${weeks}w`;
  }

  const months = differenceInMonths(now, dateObj);
  if (months < 12) {
    return `${months}mo`;
  }

  const years = differenceInYears(now, dateObj);
  return `${years}y`;
}

/**
 * Format a date to show relative time with more detail
 * Similar to formatRelativeTimeShort but with full words
 */
export function formatDistanceToNowShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Unknown time";
  }

  const now = new Date();
  const seconds = differenceInSeconds(now, dateObj);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = differenceInMinutes(now, dateObj);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = differenceInHours(now, dateObj);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = differenceInDays(now, dateObj);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = differenceInWeeks(now, dateObj);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  const months = differenceInMonths(now, dateObj);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = differenceInYears(now, dateObj);
  return `${years}y ago`;
}

/**
 * Format a timestamp for different time ranges (used in charts)
 * @param timestamp - The timestamp to format
 * @param timeRange - The time range context ('1h', '24h', '7d', '30d')
 */
export function formatTimestamp(timestamp: string | Date, timeRange: "1h" | "24h" | "7d" | "30d"): string {
  const date = typeof timestamp === "string" ? parseISO(timestamp) : timestamp;

  if (!isValid(date)) {
    return "Invalid time";
  }

  switch (timeRange) {
    case "1h":
    case "24h":
      return format(date, "HH:mm");
    case "7d":
      return format(date, "EEE HH:mm");
    case "30d":
      return format(date, "MMM d");
    default:
      return format(date, "MMM d HH:mm");
  }
}

/**
 * Format a date range (e.g., "Mar 1 - Mar 15, 2024")
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  if (!isValid(start) || !isValid(end)) {
    return "Invalid date range";
  }

  if (isSameDay(start, end)) {
    return format(start, "MMM d, yyyy");
  } else if (isSameYear(start, end)) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  } else {
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  }
}

/**
 * Format a date in a specific timezone
 */
export function formatInTimezone(date: Date | string, timezone: string, formatStr = "PPP p"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid date";
  }

  return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Get a human-readable duration string (e.g., "2 hours 30 minutes")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? "s" : ""}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}` : ""}`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? "s" : ""}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}` : ""}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

/**
 * Utility function to check if two dates are on the same day
 * Re-exported from date-fns for convenience
 */
export { isSameDay, isToday, isYesterday };

/**
 * Parse a date string safely
 */
export function parseDate(dateString: string): Date | null {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Get the start and end of a day
 */
export function getDayBounds(date: Date | string) {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    throw new Error("Invalid date");
  }

  return {
    start: startOfDay(dateObj),
    end: endOfDay(dateObj),
  };
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  if (!isValid(dateObj) || !isValid(start) || !isValid(end)) {
    return false;
  }

  return isAfter(dateObj, start) && isBefore(dateObj, end);
}

/**
 * Get relative date labels for navigation (e.g., "Today", "Yesterday", "Last 7 days")
 */
export function getRelativeDateLabel(daysAgo: number): string {
  switch (daysAgo) {
    case 0:
      return "Today";
    case 1:
      return "Yesterday";
    case 7:
      return "Last 7 days";
    case 30:
      return "Last 30 days";
    default:
      return `Last ${daysAgo} days`;
  }
}

/**
 * Format a date for API requests (ISO string)
 */
export function formatForAPI(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    throw new Error("Invalid date");
  }

  return dateObj.toISOString();
}
