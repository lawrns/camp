"use client";

import ImprovedHandoverButton from "@/components/ai/handover/ImprovedHandoverButton";
import { Button } from "@/components/ui/Button-unified";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { CheckCircle, CaretRight as ChevronRight, Shield, Star, WifiHigh, WifiSlash as WifiHighOff, X,  } from "lucide-react";

interface CustomerHeaderProps {
  customer: CustomerData;
  conversationId?: string;
  organizationId?: string;
  verification: CustomerVerification | null;
  insights: CustomerInsights | null;
  isMobile: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  sessions: number;
  lastSeen: string;
  isVerified?: boolean;
  isOnline?: boolean;
  displayName?: string;
  avatarUrl?: string;
  initials?: string;
  company?: string;
  role?: string;
  customAttributes?: Record<string, string>;
}

interface CustomerInsights {
  satisfaction?: {
    score: number;
  };
}

interface CustomerVerification {
  status: string;
}

// Helper functions
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function getVerificationColor(status: string): string {
  switch (status.toLowerCase()) {
    case "verified":
      return "text-green-600 bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-muted)]";
    case "partial":
      return "text-yellow-600 bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-muted)]";
    case "unverified":
      return "text-red-600 bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)]";
    default:
      return "text-gray-600 bg-[var(--fl-color-background-subtle)] border-[var(--fl-color-border)]";
  }
}

export function CustomerHeader({
  customer,
  conversationId,
  organizationId,
  verification,
  insights,
  isMobile,
  onClose,
  onToggleCollapse,
}: CustomerHeaderProps) {
  return (
    <div className="customer-details-header relative flex-shrink-0 overflow-hidden border-b bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-spacing-md">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-ds-full bg-gradient-to-br from-blue-200/20 to-purple-200/20"></div>

      {/* Mobile close button */}
      {isMobile && onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-2 top-2 z-10">
          <Icon icon={X} className="h-4 w-4" />
        </Button>
      )}

      {/* Collapse toggle for desktop */}
      {!isMobile && onToggleCollapse && (
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="absolute left-2 top-2 z-10">
          <Icon icon={ChevronRight} className="h-4 w-4" />
        </Button>
      )}

      <div className="relative">
        <div className="mb-4 flex items-center space-x-3">
          <div className="relative">
            <Avatar className="ring-3 h-14 w-14 shadow-card-deep ring-white">
              {(customer.avatarUrl || customer.avatar) && (
                <AvatarImage
                  {...((customer.avatarUrl || customer.avatar) && {
                    src: customer.avatarUrl || customer.avatar,
                    alt: customer.displayName || customer.name,
                  })}
                />
              )}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white">
                {customer.initials ||
                  customer.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ||
                  "CU"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex items-center gap-1">
              {customer.isOnline ? (
                <div className="bg-semantic-success h-4 w-4 animate-pulse rounded-ds-full border-2 border-white"></div>
              ) : (
                <div className="h-4 w-4 rounded-ds-full border-2 border-white bg-neutral-400"></div>
              )}
              {verification?.status === "verified" && (
                <div className="flex h-4 w-4 items-center justify-center rounded-ds-full border-2 border-white bg-brand-blue-500">
                  <Icon icon={Shield} className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-ds-2">
              <h3 className="truncate text-base font-bold text-gray-900">{customer.displayName || customer.name}</h3>
              {customer.isVerified && (
                <Icon icon={CheckCircle} className="h-4 w-4 flex-shrink-0 text-[var(--fl-color-info)]" />
              )}
            </div>
            <p className="text-foreground truncate text-sm">{customer.email}</p>
            {customer.company && (
              <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">
                {customer.company} {customer.role && `• ${customer.role}`}
              </p>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="mb-4 flex items-center gap-ds-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-typography-xs border font-medium",
              customer.isOnline
                ? "bg-status-success-light text-status-success-dark border-status-success-light"
                : "border-[var(--fl-color-border)] bg-neutral-50 text-neutral-600"
            )}
          >
            {customer.isOnline ? (
              <>
                <Icon icon={WifiHigh} className="mr-1 h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <Icon icon={WifiHighOff} className="mr-1 h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
          {verification && (
            <Badge
              variant="secondary"
              className={cn("text-typography-xs border font-medium", getVerificationColor(verification.status))}
            >
              <Icon icon={Shield} className="mr-1 h-3 w-3" />
              {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
            </Badge>
          )}
          {customer.customAttributes?.plan && (
            <Badge variant="secondary" className="border-purple-200 bg-purple-50 text-tiny font-medium text-purple-700">
              <Icon icon={Star} className="mr-1 h-3 w-3" />
              {customer.customAttributes.plan}
            </Badge>
          )}
        </div>

        {/* AI Handover Button */}
        {conversationId && organizationId && (
          <div className="mb-4">
            <ImprovedHandoverButton
              conversationId={conversationId}
              currentConfidence={0.7}
              complexity={5}
              reasons={[]}
              config={{
                confidenceThreshold: 0.6,
                complexityThreshold: 7,
                timeoutThreshold: 30,
                availableAgents: 3,
                estimatedWaitTime: 5,
              }}
              onHandover={async () => { }}
              variant="inline"
              className="w-full"
            />
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background/60 rounded-ds-xl border border-white/50 spacing-3 text-center backdrop-blur-sm">
            <div className="text-lg font-bold text-blue-600">{customer.sessions}</div>
            <div className="text-foreground text-tiny font-medium">Sessions</div>
          </div>
          <div className="bg-background/60 rounded-ds-xl border border-white/50 spacing-3 text-center backdrop-blur-sm">
            <div className="text-lg font-bold text-indigo-600">
              {customer.isOnline ? "Now" : formatTimeAgo(customer.lastSeen)}
            </div>
            <div className="text-foreground text-tiny font-medium">Last Seen</div>
          </div>
          <div className="bg-background/60 rounded-ds-xl border border-white/50 spacing-3 text-center backdrop-blur-sm">
            <div className="text-lg font-bold text-purple-600">
              {insights?.satisfaction?.score ? insights.satisfaction.score.toFixed(1) : "4.5"}
            </div>
            <div className="text-foreground text-tiny font-medium">Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
}
