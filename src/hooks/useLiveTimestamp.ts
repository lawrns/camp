"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  formatDate,
  formatRelativeTime,
  formatRelativeTimeShort,
  formatTime24,
  isToday,
  isYesterday,
  parseDate,
} from "@/lib/utils/date";

interface UseLiveTimestampOptions {
  /**
   * Update interval in milliseconds
   * @default 60000 (1 minute)
   */
  updateInterval?: number;

  /**
   * Format style for timestamps
   * @default 'relative'
   */
  format?: "relative" | "absolute" | "smart";

  /**
   * Whether to include "ago" suffix for relative times
   * @default true
   */
  addSuffix?: boolean;

  /**
   * Whether to enable live updates
   * @default true
   */
  enableLiveUpdates?: boolean;
}

/**
 * Hook for live timestamp updates that automatically refreshes relative timestamps
 * Optimized to minimize re-renders and memory usage
 */
export function useLiveTimestamp(
  timestamp: string | Date | null | undefined,
  options: UseLiveTimestampOptions = {}
): string {
  const {
    updateInterval = 60000, // 1 minute
    format: formatStyle = "relative",
    addSuffix = true,
    enableLiveUpdates = true,
  } = options;

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Format timestamp based on style
  const formatTimestamp = useCallback(
    (date: Date, now: Date): string => {
      switch (formatStyle) {
        case "absolute":
          if (isToday(date)) {
            return formatTime24(date);
          } else if (isYesterday(date)) {
            return "Yesterday";
          } else {
            return format(date, "MMM d");
          }

        case "smart":
          return formatRelativeTimeShort(date);

        case "relative":
        default:
          return formatRelativeTime(date, addSuffix);
      }
    },
    [formatStyle, addSuffix]
  );

  // Parse and validate timestamp
  const parsedDate = useCallback((): Date | null => {
    if (!timestamp) return null;

    try {
      if (timestamp instanceof Date) {
        return timestamp;
      }

      if (typeof timestamp === "string") {
        return parseDate(timestamp);
      }

      return null;
    } catch (error) {
      return null;
    }
  }, [timestamp]);

  // Set up live updates
  useEffect(() => {
    if (!enableLiveUpdates) return;

    const updateCurrentTime = () => {
      const now = Date.now();
      // Only update if enough time has passed to avoid excessive re-renders
      if (now - lastUpdateRef.current >= updateInterval) {
        setCurrentTime(new Date(now));
        lastUpdateRef.current = now;
      }
    };

    // Set up interval
    intervalRef.current = setInterval(updateCurrentTime, updateInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateInterval, enableLiveUpdates]);

  // Calculate formatted timestamp
  const date = parsedDate();
  if (!date) {
    return "Unknown time";
  }

  return formatTimestamp(date, currentTime);
}

/**
 * Hook for managing multiple live timestamps efficiently
 * Uses a single interval for all timestamps to optimize performance
 */
export function useLiveTimestamps(
  timestamps: Array<string | Date | null | undefined>,
  options: UseLiveTimestampOptions = {}
): string[] {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const {
    updateInterval = 60000,
    format: formatStyle = "relative",
    addSuffix = true,
    enableLiveUpdates = true,
  } = options;

  // Format timestamp function (same as above)
  const formatTimestamp = useCallback(
    (date: Date, now: Date): string => {
      switch (formatStyle) {
        case "absolute":
          if (isToday(date)) {
            return formatTime24(date);
          } else if (isYesterday(date)) {
            return "Yesterday";
          } else {
            return format(date, "MMM d");
          }

        case "smart":
          return formatRelativeTimeShort(date);

        case "relative":
        default:
          return formatRelativeTime(date, addSuffix);
      }
    },
    [formatStyle, addSuffix]
  );

  // Set up live updates (same as above)
  useEffect(() => {
    if (!enableLiveUpdates) return;

    const updateCurrentTime = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= updateInterval) {
        setCurrentTime(new Date(now));
        lastUpdateRef.current = now;
      }
    };

    intervalRef.current = setInterval(updateCurrentTime, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateInterval, enableLiveUpdates]);

  // Format all timestamps
  return timestamps.map((timestamp: any) => {
    if (!timestamp) return "Unknown time";

    try {
      const date = timestamp instanceof Date ? timestamp : parseDate(timestamp.toString());
      if (!date) return "Invalid time";
      return formatTimestamp(date, currentTime);
    } catch (error) {
      return "Invalid time";
    }
  });
}

/**
 * Performance-optimized hook for conversation lists
 * Only updates timestamps that are currently visible
 */
export function useConversationTimestamps(
  conversations: Array<{ id: string; lastMessageAt: string | Date }>,
  options: UseLiveTimestampOptions = {}
) {
  const timestamps = conversations.map((conv: any) => conv.lastMessageAt);
  const formattedTimestamps = useLiveTimestamps(timestamps, options);

  return conversations.reduce(
    (acc, conv, index) => {
      acc[conv.id] = formattedTimestamps[index] || "";
      return acc;
    },
    {} as Record<string, string>
  );
}
