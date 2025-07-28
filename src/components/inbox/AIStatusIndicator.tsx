import React, { useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";

interface AIStatusIndicatorProps {
  status: "idle" | "thinking" | "typing" | "processing" | "error";
  confidence?: number;
  processingTime?: number;
  humanModeEnabled?: boolean;
  className?: string;
}

export function AIStatusIndicator({
  status,
  confidence,
  processingTime,
  humanModeEnabled = false,
  className,
}: AIStatusIndicatorProps) {
  const [displayTime, setDisplayTime] = useState(0);

  // Update processing time display
  useEffect(() => {
    if (status === "processing" || status === "thinking" || status === "typing") {
      const interval = setInterval(() => {
        setDisplayTime((prev) => prev + 100);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setDisplayTime(processingTime || 0);
    }
    return undefined;
  }, [status, processingTime]);

  const getStatusConfig = () => {
    switch (status) {
      case "thinking":
        return {
          icon: "🤔",
          text: "AI is thinking...",
          color: "text-blue-600",
          bgColor: "bg-[var(--fl-color-info-subtle)]",
          borderColor: "border-[var(--fl-color-info-muted)]",
        };
      case "typing":
        return {
          icon: "✍️",
          text: humanModeEnabled ? "AI is typing..." : "Generating response...",
          color: "text-green-600",
          bgColor: "bg-[var(--fl-color-success-subtle)]",
          borderColor: "border-[var(--fl-color-success-muted)]",
        };
      case "processing":
        return {
          icon: "⚡",
          text: "Processing request...",
          color: "text-yellow-600",
          bgColor: "bg-[var(--fl-color-warning-subtle)]",
          borderColor: "border-[var(--fl-color-warning-muted)]",
        };
      case "error":
        return {
          icon: "❌",
          text: "AI encountered an error",
          color: "text-red-600",
          bgColor: "bg-[var(--fl-color-danger-subtle)]",
          borderColor: "border-[var(--fl-color-danger-muted)]",
        };
      default:
        return {
          icon: "🤖",
          text: "AI is ready",
          color: "text-gray-600",
          bgColor: "bg-[var(--fl-color-background-subtle)]",
          borderColor: "border-[var(--fl-color-border)]",
        };
    }
  };

  const config = getStatusConfig();

  if (status === "idle") return null;

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-3 rounded-ds-lg border px-3 py-2",
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        {/* Status icon with animation */}
        <OptimizedMotion.div
          animate={{
            rotate: status === "processing" ? [0, 360] : 0,
            scale: status === "thinking" ? [1, 1.1, 1] : 1,
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
          className="text-base"
        >
          {config.icon}
        </OptimizedMotion.div>

        {/* Status text and details */}
        <div className="min-w-0 flex-1">
          <div className={cn("text-typography-sm font-medium", config.color)}>{config.text}</div>

          {/* Additional details */}
          <div className="mt-0.5 flex items-center gap-ds-2 text-tiny text-muted-foreground">
            {/* Processing time */}
            {(status === "processing" || status === "thinking" || status === "typing") && (
              <span>{(displayTime / 1000).toFixed(1)}s</span>
            )}

            {/* Confidence score */}
            {confidence && status !== "error" && <span>{Math.round(confidence * 100)}% confident</span>}

            {/* Human mode indicator */}
            {humanModeEnabled && (
              <span className="flex items-center gap-1">
                <span className="bg-semantic-success h-1.5 w-1.5 rounded-ds-full"></span>
                Human-like mode
              </span>
            )}
          </div>
        </div>

        {/* Progress indicator for active states */}
        {(status === "processing" || status === "thinking" || status === "typing") && (
          <div className="relative h-8 w-8">
            <OptimizedMotion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-full w-full"
            >
              <svg className="h-full w-full" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className={cn("opacity-20", config.color)}
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="20 40"
                  className={config.color}
                />
              </svg>
            </OptimizedMotion.div>
          </div>
        )}
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}

// Hook for managing AI status
export function useAIStatus() {
  const [status, setStatus] = useState<"idle" | "thinking" | "typing" | "processing" | "error">("idle");
  const [confidence, setConfidence] = useState<number | undefined>();
  const [processingTime, setProcessingTime] = useState<number | undefined>();
  const [startTime, setStartTime] = useState<number | undefined>();

  const startProcessing = () => {
    setStatus("processing");
    setStartTime(Date.now());
    setProcessingTime(undefined);
  };

  const startThinking = () => {
    setStatus("thinking");
    setStartTime(Date.now());
  };

  const startTyping = (conf?: number) => {
    setStatus("typing");
    if (conf) setConfidence(conf);
  };

  const setError = () => {
    setStatus("error");
    if (startTime) {
      setProcessingTime(Date.now() - startTime);
    }
  };

  const setIdle = (conf?: number) => {
    setStatus("idle");
    if (startTime) {
      setProcessingTime(Date.now() - startTime);
    }
    if (conf) setConfidence(conf);
  };

  return {
    status,
    confidence,
    processingTime,
    startProcessing,
    startThinking,
    startTyping,
    setError,
    setIdle,
  };
}
