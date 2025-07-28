"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

interface SlaTimerChipProps {
  conversationId: string;
  conversationStatus: "open" | "closed" | "active" | "queued" | "pending" | "resolved" | "spam";
  lastMessageAt: string | Date;
  slaMinutes?: number; // SLA threshold in minutes
  className?: string;
}

type TimerState = "ok" | "warn" | "late";

export const SlaTimerChip: React.FC<SlaTimerChipProps> = ({
  conversationId,
  conversationStatus,
  lastMessageAt,
  slaMinutes = 60, // Default 1 hour SLA
  className,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Don't show timer for closed/resolved conversations
  if (conversationStatus === "closed" || conversationStatus === "resolved") {
    return null;
  }

  // Calculate stable response time based on conversation ID to prevent flickering
  const responseTimeMinutes = useMemo(() => {
    const lastMessageTime = new Date(lastMessageAt).getTime();
    const timeDiff = Math.floor((currentTime - lastMessageTime) / (1000 * 60));
    return Math.max(0, timeDiff);
  }, [conversationId, lastMessageAt, currentTime]);

  // Determine timer state using Flame UI status colors
  const timerState: TimerState = useMemo(() => {
    if (responseTimeMinutes < slaMinutes * 0.7) return "ok";
    if (responseTimeMinutes < slaMinutes) return "warn";
    return "late";
  }, [responseTimeMinutes, slaMinutes]);

  // Format display text with cap at 99h+
  const displayText = useMemo(() => {
    if (responseTimeMinutes < 60) {
      return `${responseTimeMinutes}m`;
    }
    const hours = Math.floor(responseTimeMinutes / 60);
    if (hours >= 99) {
      return "99h+";
    }
    return `${hours}h`;
  }, [responseTimeMinutes]);

  // Update timer once per minute (debounced) to prevent flickering
  useEffect(() => {
    const updateTimer = () => {
      setCurrentTime(Date.now());
    };

    // Update immediately
    updateTimer();

    // Set up interval for once per minute updates
    intervalRef.current = setInterval(() => {
      requestAnimationFrame(updateTimer);
    }, 60000); // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversationId]); // Only re-run when conversation changes

  // Flame UI color classes using CSS custom properties
  const colorClasses = {
    ok: "text-[--status-ok]",
    warn: "text-[--status-warn]",
    late: "text-[--status-late]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium",
        "transition-colors duration-150 ease-out",
        colorClasses[timerState],
        className
      )}
      title={`Response time: ${responseTimeMinutes} minutes`}
    >
      <Icon name="Clock" className="h-3 w-3" />
      <span>{displayText}</span>
    </div>
  );
};
