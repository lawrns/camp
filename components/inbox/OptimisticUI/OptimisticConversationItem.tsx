import React from "react";
import { cn } from "@/lib/utils";
import { optimisticUtils, type OptimisticConversation } from "@/store/optimistic-updates";
import { OptimisticStatusBadge } from "./OptimisticStatusBadge";

interface OptimisticConversationItemProps {
  conversation: OptimisticConversation;
  isSelected?: boolean;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const OptimisticConversationItem: React.FC<OptimisticConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
  onRetry,
  className,
}) => {
  const styles = optimisticUtils.getOptimisticStyles(conversation);
  const isPending = conversation.pending || conversation.is_optimistic;
  const hasError = !!conversation.error;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer spacing-4 transition-all duration-200",
        "border-b border-[var(--fl-color-border)] hover:bg-neutral-50",
        isSelected && "bg-status-info-light border-[var(--fl-color-border-interactive)]",
        hasError && "bg-[var(--fl-color-danger-subtle)]",
        className
      )}
      style={styles}
    >
      {/* Optimistic indicator */}
      {(isPending || hasError) && (
        <div className="absolute right-2 top-2">
          <OptimisticStatusBadge
            status={hasError ? "error" : "pending"}
            {...(hasError && conversation.error ? { error: conversation.error } : {})}
            {...(hasError && onRetry ? { onRetry: onRetry } : {})}
          />
        </div>
      )}

      {/* Conversation content */}
      <div className={cn("space-y-1", (isPending || hasError) && "opacity-70")}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            {conversation.customerName || `Customer ${conversation.customerId?.slice(-6)}`}
          </h4>
          <span className="text-tiny text-[var(--fl-color-text-muted)]">
            {conversation.createdAt ? new Date(conversation.createdAt).toLocaleTimeString() : ""}
          </span>
        </div>

        {conversation.lastMessagePreview && (
          <p className="text-foreground truncate text-sm">{conversation.lastMessagePreview}</p>
        )}

        <div className="flex items-center gap-ds-2 text-tiny">
          <span
            className={cn(
              "rounded-ds-full px-2 py-0.5",
              conversation.status === "open" && "bg-status-success-light text-status-success-dark",
              conversation.status === "closed" && "bg-neutral-100 text-neutral-700",
              conversation.status === "pending" && "bg-status-warning-light text-status-warning-dark"
            )}
          >
            {conversation.status}
          </span>

          {conversation.assignedOperatorId && <span className="text-[var(--fl-color-text-muted)]">Assigned</span>}

          {(conversation.unreadCount ?? 0) > 0 && (
            <span className="bg-primary ml-auto rounded-ds-full px-2 py-0.5 text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Loading overlay for pending operations */}
      {isPending && !hasError && <div className="bg-background pointer-events-none absolute inset-0 bg-opacity-30" />}
    </div>
  );
};
