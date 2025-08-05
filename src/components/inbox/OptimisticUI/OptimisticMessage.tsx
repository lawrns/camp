import React from "react";
import { AlertTriangle as AlertCircle, CheckCircle as Check, Clock, RefreshCw as RefreshCw,  } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { optimisticUtils, type OptimisticMessage } from "@/store/optimistic-updates";

interface OptimisticMessageProps {
  message: OptimisticMessage;
  onRetry?: () => void;
  className?: string;
}

export const OptimisticMessageComponent: React.FC<OptimisticMessageProps> = ({ message, onRetry, className }) => {
  const styles = optimisticUtils.getOptimisticStyles(message);
  const statusIndicator = optimisticUtils.getStatusIndicator(message);

  return (
    <div
      className={cn("relative transition-all duration-200", message.error && "hover:opacity-100", className)}
      style={styles}
    >
      {/* Status indicator */}
      {statusIndicator && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2">
          {statusIndicator.icon === "pending" && (
            <Icon
              icon={Clock}
              className="h-4 w-4 animate-pulse"
              style={{ color: statusIndicator.color }}
              aria-label={statusIndicator.tooltip}
            />
          )}
          {statusIndicator.icon === "error" && (
            <button onClick={onRetry} className="group flex items-center" title={statusIndicator.tooltip}>
              <Icon
                icon={AlertCircle}
                className="h-4 w-4"
                style={{ color: statusIndicator.color }}
                aria-label={statusIndicator.tooltip}
              />
              <Icon
                icon={RefreshCw}
                className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: statusIndicator.color }}
                aria-label="Retry"
              />
            </button>
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          "rounded-ds-lg px-4 py-2",
          message.senderType === "visitor"
            ? "bg-[var(--fl-color-info-subtle)]"
            : "bg-[var(--fl-color-background-subtle)]"
        )}
      >
        <p className="text-sm">{message.content}</p>

        {/* Timestamp */}
        <div className="mt-1 flex items-center gap-ds-2 text-tiny text-[var(--fl-color-text-muted)]">
          <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
          {message.pending && <span className="text-gray-400">• Sending...</span>}
          {message.error && <span className="text-brand-mahogany-500">• Failed to send</span>}
        </div>
      </div>

      {/* Retry button for failed messages */}
      {message.error && onRetry && (
        <button onClick={onRetry} className="mt-2 flex items-center gap-1 text-tiny text-blue-600 hover:text-blue-800">
          <Icon icon={RefreshCw} className="h-3 w-3" aria-label="Retry" />
          Retry
        </button>
      )}
    </div>
  );
};
