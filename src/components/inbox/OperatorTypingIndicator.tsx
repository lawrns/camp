import React, { useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";

interface OperatorTypingIndicatorProps {
  isTyping: boolean;
  operatorName?: string;
  operatorAvatar?: string;
  typingSpeed?: "slow" | "normal" | "fast";
  className?: string;
}

export function OperatorTypingIndicator({
  isTyping,
  operatorName = "Operator",
  operatorAvatar,
  typingSpeed = "normal",
  className,
}: OperatorTypingIndicatorProps) {
  const [dots, setDots] = useState("");

  // Animate dots for typing
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) return "";
          return `${prev}.`;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setDots("");
    }

    return undefined;
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn("mb-4 flex items-end gap-2", className)}
      >
        {/* Operator Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-gray-200">
          {operatorAvatar ? (
            <img src={operatorAvatar} alt={operatorName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-foreground text-sm font-medium">{operatorName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Typing bubble */}
        <div className="flex flex-col">
          {/* Name */}
          <div className="mb-1 flex items-baseline gap-ds-2">
            <span className="text-sm font-medium text-foreground">{operatorName}</span>
          </div>

          {/* Typing indicator bubble */}
          <OptimizedMotion.div
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="bg-background max-w-sm rounded-ds-lg border border-[var(--fl-color-border)] px-3 py-2 text-foreground"
          >
            <div className="flex items-center gap-ds-2">
              {/* Status text */}
              <span className="text-foreground text-sm">typing{dots}</span>

              {/* Animated dots */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i: number) => (
                  <OptimizedMotion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="h-1.5 w-1.5 rounded-ds-full bg-neutral-400"
                  />
                ))}
              </div>
            </div>
          </OptimizedMotion.div>
        </div>
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}

// Hook for managing operator typing state
export function useOperatorTypingIndicator() {
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState<"slow" | "normal" | "fast">("normal");

  const startTyping = (options?: { speed?: "slow" | "normal" | "fast" }) => {
    setIsTyping(true);
    if (options?.speed) setTypingSpeed(options.speed);
  };

  const stopTyping = () => {
    setIsTyping(false);
  };

  return {
    isTyping,
    typingSpeed,
    startTyping,
    stopTyping,
  };
}
