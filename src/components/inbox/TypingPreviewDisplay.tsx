/**
 * Modern Typing Preview Display Component
 * Shows beautiful, real-time typing previews with smooth animations
 */

import React from "react";
import { PencilSimple, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { useTypingPreview as useTypingPreviewDisplay } from "@/lib/realtime/useTypingPreview";
import { cn } from "@/lib/utils";

interface TypingPreviewDisplayProps {
  conversationId: string;
  showCustomerPreviews?: boolean;
  showAgentPreviews?: boolean;
  className?: string;
}

interface TypingPreview {
  userId: string;
  userName?: string;
  content?: string;
  timestamp: number;
}

interface PreviewItemProps {
  preview: TypingPreview;
  isAgent?: boolean;
}

function PreviewItem({ preview, isAgent = true }: PreviewItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-ds-xl border spacing-3 shadow-sm transition-all duration-300",
        isAgent
          ? "border-status-info-light/60 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md"
          : "border-[var(--fl-color-border)]/60 bg-gradient-to-r from-gray-50 to-slate-50 hover:shadow-md"
      )}
    >
      <div className="relative">
        <Avatar className="h-8 w-8 shadow-card-base ring-2 ring-white">
          <AvatarImage src={`/avatars/${preview.userId}.png`} />
          <AvatarFallback
            className={cn(
              "text-typography-xs font-medium",
              isAgent ? "bg-status-info-light text-status-info-dark" : "bg-neutral-100 text-neutral-700"
            )}
          >
            {preview.userName?.charAt(0)?.toUpperCase() || "A"}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            "absolute -bottom-1 -right-1 h-3 w-3 animate-pulse rounded-ds-full border-2 border-white",
            isAgent ? "bg-brand-blue-500" : "bg-neutral-500"
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-ds-2">
          <span className={cn("text-typography-sm font-medium", isAgent ? "text-blue-900" : "text-gray-900")}>
            {preview.userName || "Agent"}
          </span>
          <Badge variant="secondary" className="px-1 py-0 text-tiny rounded-full">
            <User className="mr-1 h-3 w-3" />
            Agent
          </Badge>
          <span className="animate-pulse text-tiny text-[var(--fl-color-text-muted)]">typing...</span>
        </div>

        {preview.content?.trim() && preview.content !== "typing..." && (
          <div className="relative mt-2">
            <div
              className={cn(
                "text-typography-sm leading-relaxed rounded-ds-lg border spacing-3 font-mono",
                isAgent
                  ? "border-status-info-light/60 bg-gradient-to-r from-blue-50 to-blue-100/50 text-[var(--fl-color-primary)]"
                  : "border-[var(--fl-color-border)]/60 bg-gradient-to-r from-gray-50 to-gray-100/50 text-neutral-800"
              )}
            >
              <div className="flex items-start gap-ds-2">
                <span className="mt-1 text-tiny opacity-60">💬</span>
                <span className="flex-1 break-words">
                  "{preview.content}"
                  <span className={cn("ml-1 animate-pulse font-bold", isAgent ? "text-blue-600" : "text-gray-600")}>
                    |
                  </span>
                </span>
              </div>
            </div>

            <div className="absolute -right-2 -top-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-typography-xs border-0 px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] shadow-sm",
                  isAgent ? "bg-status-info-light text-status-info-dark" : "bg-neutral-100 text-neutral-700"
                )}
              >
                <PencilSimple className="mr-1 h-3 w-3" />
                Live Preview
              </Badge>
            </div>
          </div>
        )}

        {(!preview.content || preview.content.trim() === "" || preview.content === "typing...") && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex gap-[var(--fl-spacing-1)]">
              <div
                className={cn("h-2 w-2 animate-bounce rounded-ds-full", isAgent ? "bg-brand-blue-500" : "bg-neutral-500")}
                style={{ animationDelay: "0ms" }}
              />
              <div
                className={cn("h-2 w-2 animate-bounce rounded-ds-full", isAgent ? "bg-brand-blue-500" : "bg-neutral-500")}
                style={{ animationDelay: "150ms" }}
              />
              <div
                className={cn("h-2 w-2 animate-bounce rounded-ds-full", isAgent ? "bg-brand-blue-500" : "bg-neutral-500")}
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className={cn("text-typography-sm font-medium", isAgent ? "text-blue-600" : "text-gray-600")}>
              typing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingPreviewDisplay({
  conversationId,
  showCustomerPreviews = true,
  showAgentPreviews = true,
  className,
}: TypingPreviewDisplayProps) {
  const { typingUsers } = useTypingPreviewDisplay(conversationId);
  const activePreviews = typingUsers;
  const hasActivePreviews = typingUsers.length > 0;

  if (!hasActivePreviews) {
    return null;
  }

  const filteredPreviews =
    (activePreviews as unknown as TypingPreview[])?.filter((preview: TypingPreview) => {
      const isAgent = preview.userId !== conversationId;
      if (isAgent && !showAgentPreviews) return false;
      if (!isAgent && !showCustomerPreviews) return false;
      return true;
    }) || [];

  if (!filteredPreviews || filteredPreviews.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {filteredPreviews.map((preview: TypingPreview) => (
        <PreviewItem
          key={`${preview.userId}-${preview.timestamp}`}
          preview={preview}
          isAgent={preview.userId !== conversationId}
        />
      ))}
    </div>
  );
}

export function InlineTypingPreview({
  conversationId,
  compact = false,
  className,
}: {
  conversationId: string;
  compact?: boolean;
  className?: string;
}) {
  const { typingUsers } = useTypingPreviewDisplay(conversationId);

  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const preview = (typingUsers as unknown as TypingPreview[])[0];

  if (!preview) {
    return null;
  }

  return (
    <div className={cn("border-status-info-light bg-status-info-light/50 border-l-4 py-2 pl-3", className)}>
      <PreviewItem preview={preview} />
    </div>
  );
}

export function AgentTypingPreviewPanel({ conversationId, className }: { conversationId: string; className?: string }) {
  const { typingUsers } = useTypingPreviewDisplay(conversationId);
  const activePreviews = typingUsers;
  const hasActivePreviews = typingUsers.length > 0;
  const typedPreviews = (activePreviews as unknown as TypingPreview[]) || [];

  if (!hasActivePreviews || !typedPreviews.length) {
    return (
      <div className={cn("text-typography-sm spacing-4 text-center text-neutral-500", className)}>
        <div className="mb-2 flex justify-center">
          <PencilSimple className="h-6 w-6 text-gray-400" />
        </div>
        <p>No typing activity</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 spacing-4", className)}>
      <div className="text-foreground flex items-center gap-ds-2 border-b pb-2 text-sm font-medium">
        <div className="bg-semantic-success h-2 w-2 animate-pulse rounded-ds-full" />
        <span>Live Typing Activity</span>
        <Badge variant="secondary" className="text-tiny rounded-full">
          {typedPreviews.length}
        </Badge>
      </div>

      <div className="max-h-48 space-y-spacing-sm overflow-y-auto">
        {typedPreviews.map((preview: TypingPreview) => (
          <PreviewItem key={`${preview.userId}-${preview.timestamp}`} preview={preview} isAgent={true} />
        ))}
      </div>

      <div className="border-t pt-2 text-tiny text-[var(--fl-color-text-muted)]">
        <p>Real-time preview • Auto-hide in 8s • Privacy filtered</p>
      </div>
    </div>
  );
}

export default TypingPreviewDisplay;
