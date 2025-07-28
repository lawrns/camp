"use client";

import React from "react";
import { OptimizedAnimatePresence, OptimizedMotion } from "../animations/OptimizedMotion";

interface TypingIndicatorProps {
  isVisible: boolean;
  avatar?: string;
  name?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, avatar = "💬", name = "Assistant" }) => {
  return (
    <OptimizedAnimatePresence>
      {isVisible && (
        <OptimizedMotion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex justify-start"
        >
          <div className="bg-background max-w-[80%] radius-2xl px-4 py-3 text-gray-800">
            <div className="flex items-center space-x-spacing-sm">
              <span className="text-sm">{avatar}</span>
              <span className="text-tiny text-[var(--fl-color-text-muted)]">{name} is typing</span>
              <div className="typing-dots">
                <OptimizedMotion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0,
                  }}
                  className="inline-block h-1 w-1 rounded-ds-full bg-gray-400"
                />
                <OptimizedMotion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0.2,
                  }}
                  className="ml-1 inline-block h-1 w-1 rounded-ds-full bg-gray-400"
                />
                <OptimizedMotion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0.4,
                  }}
                  className="ml-1 inline-block h-1 w-1 rounded-ds-full bg-gray-400"
                />
              </div>
            </div>
          </div>
        </OptimizedMotion.div>
      )}
    </OptimizedAnimatePresence>
  );
};

export default TypingIndicator;
