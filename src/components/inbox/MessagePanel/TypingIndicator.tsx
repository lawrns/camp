"use client";

import React from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import type { TypingUser } from "./types";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  return (
    <OptimizedMotion.div
      className="panel-sticky-bottom px-6 py-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3 text-sm">
        <div className="flex gap-1">
          <OptimizedMotion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="h-2 w-2 rounded-ds-full bg-brand-blue-500"
          />
          <OptimizedMotion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="h-2 w-2 rounded-ds-full bg-brand-blue-500"
          />
          <OptimizedMotion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="h-2 w-2 rounded-ds-full bg-brand-blue-500"
          />
        </div>
        <span className="font-medium text-blue-600">
          {typingUsers.length === 1 ? `${typingUsers[0]?.name} is typing` : `${typingUsers.length} agents are typing`}
        </span>
      </div>
    </OptimizedMotion.div>
  );
}
