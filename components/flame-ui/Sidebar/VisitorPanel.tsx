"use client";

import React, { useState } from "react";
import {
  Activity,
  Buildings as Building,
  CaretDown as ChevronDown,
  CaretRight as ChevronRight,
  Clock,
  Eye,
  Globe,
  Envelope as Mail,
  MapPin,
  ChatCircle as MessageSquare,
  Phone,
  Tag,
  User,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface VisitorData {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  location?: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  localTime?: string;
  company?: string;
  role?: string;
  phone?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  browser?: string;
  os?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  ipAddress?: string;
  customAttributes?: Record<string, string>;
  tags?: string[];
  firstSeen?: string;
  lastSeen?: string;
  sessions?: number;
  visitedPages?: {
    url: string;
    title: string;
    visitedAt: string;
    timeSpent?: number;
  }[];
  previousConversations?: {
    id: string;
    subject: string;
    status: string;
    createdAt: string;
    messageCount: number;
  }[];
}

interface VisitorPanelProps {
  visitor: VisitorData;
  className?: string;
}

interface AccordionSectionProps {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false, className }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("overflow-hidden rounded-ds-lg border border-[--border-subtle]", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[--bg-subtle]/50 flex w-full items-center justify-between spacing-3 transition-colors duration-200 hover:bg-[--bg-subtle]"
      >
        <div className="flex items-center gap-ds-2">
          <Icon className="h-4 w-4 text-[--color-primary]" />
          <span className="text-sm font-medium text-[--text-primary]">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-[--text-muted]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[--text-muted]" />
        )}
      </button>

      {isOpen && <div className="bg-background border-t border-[--border-subtle] spacing-3">{children}</div>}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${diffDays}d ago`;
}

function getDeviceIcon(deviceType?: string) {
  switch (deviceType) {
    case "mobile":
      return "📱";
    case "tablet":
      return "📱";
    case "desktop":
    default:
      return "💻";
  }
}

export function VisitorPanel({ visitor, className }: VisitorPanelProps) {
  const displayName = visitor.name || visitor.email?.split("@")[0] || "Anonymous Visitor";
  const initials = displayName
    .split(" ")
    .map((n: unknown) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      {/* Header */}
      <div className="border-b border-[--border-subtle] spacing-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {visitor.avatar ? (
              <img src={visitor.avatar} alt={displayName} className="h-12 w-12 rounded-ds-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-400 to-blue-600 font-medium text-white">
                {initials}
              </div>
            )}

            {/* Online Status */}
            {visitor.isOnline && (
              <div className="bg-semantic-success absolute -bottom-1 -right-1 h-4 w-4 rounded-ds-full border-2 border-white" />
            )}
          </div>

          {/* Name and Email */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-ds-2">
              <h3 className="truncate text-base font-semibold text-[--text-primary]">{displayName}</h3>
              {visitor.isVerified && (
                <div className="flex h-4 w-4 items-center justify-center rounded-ds-full bg-brand-blue-500 text-tiny text-white">
                  ✓
                </div>
              )}
            </div>
            {visitor.email && <p className="truncate text-sm text-[--text-muted]">{visitor.email}</p>}
          </div>
        </div>

        {/* Tags */}
        {visitor.tags && visitor.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {visitor.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="rounded-ds-md bg-[--bg-subtle] px-2 py-1 text-tiny text-[--text-muted]">
                {tag}
              </span>
            ))}
            {visitor.tags.length > 3 && (
              <span className="rounded-ds-md bg-[--bg-subtle] px-2 py-1 text-tiny text-[--text-muted]">
                +{visitor.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-3 overflow-y-auto spacing-3">
        {/* Contact Information */}
        <AccordionSection title="Contact Information" icon={User} defaultOpen>
          <div className="space-y-3">
            {visitor.email && (
              <div className="flex items-center gap-ds-2">
                <Mail className="h-4 w-4 text-[--text-muted]" />
                <span className="text-sm text-[--text-primary]">{visitor.email}</span>
              </div>
            )}

            {visitor.phone && (
              <div className="flex items-center gap-ds-2">
                <Phone className="h-4 w-4 text-[--text-muted]" />
                <span className="text-sm text-[--text-primary]">{visitor.phone}</span>
              </div>
            )}

            {visitor.company && (
              <div className="flex items-center gap-ds-2">
                <Building className="h-4 w-4 text-[--text-muted]" />
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">{visitor.company}</p>
                  {visitor.role && <p className="text-tiny text-[--text-muted]">{visitor.role}</p>}
                </div>
              </div>
            )}

            {visitor.location && (
              <div className="flex items-center gap-ds-2">
                <MapPin className="h-4 w-4 text-[--text-muted]" />
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">
                    {visitor.location.city}, {visitor.location.country}
                  </p>
                  {visitor.localTime && (
                    <p className="flex items-center gap-1 text-tiny text-[--text-muted]">
                      <Clock className="h-3 w-3" />
                      {visitor.localTime}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Activity Summary */}
        <AccordionSection title="Activity Summary" icon={Activity} defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-base font-semibold text-[--text-primary]">{visitor.sessions || 1}</p>
              <p className="text-tiny text-[--text-muted]">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[--text-primary]">
                {visitor.previousConversations?.length || 0}
              </p>
              <p className="text-tiny text-[--text-muted]">Conversations</p>
            </div>
          </div>

          <div className="mt-4 space-y-spacing-sm">
            {visitor.firstSeen && (
              <div className="flex items-center justify-between">
                <span className="text-tiny text-[--text-muted]">First seen</span>
                <span className="text-tiny text-[--text-primary]">{formatTimeAgo(visitor.firstSeen)}</span>
              </div>
            )}
            {visitor.lastSeen && (
              <div className="flex items-center justify-between">
                <span className="text-tiny text-[--text-muted]">Last seen</span>
                <span className="text-tiny text-[--text-primary]">{formatTimeAgo(visitor.lastSeen)}</span>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Technical Information */}
        <AccordionSection title="Technical Information" icon={Globe}>
          <div className="space-y-3">
            <div className="flex items-center gap-ds-2">
              <span className="text-base">{getDeviceIcon(visitor.deviceType)}</span>
              <div>
                <p className="text-sm font-medium text-[--text-primary]">
                  {visitor.deviceType
                    ? visitor.deviceType.charAt(0).toUpperCase() + visitor.deviceType.slice(1)
                    : "Unknown"}
                </p>
                <p className="text-tiny text-[--text-muted]">
                  {visitor.browser} on {visitor.os}
                </p>
              </div>
            </div>

            {visitor.ipAddress && (
              <div>
                <p className="text-tiny text-[--text-muted]">IP Address</p>
                <p className="text-sm font-medium text-[--text-primary]">{visitor.ipAddress}</p>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Recent Pages */}
        {visitor.visitedPages && visitor.visitedPages.length > 0 && (
          <AccordionSection title="Recent Pages" icon={Eye}>
            <div className="space-y-spacing-sm">
              {visitor.visitedPages.slice(0, 5).map((page, index) => (
                <div key={index} className="bg-[--bg-subtle]/30 rounded-ds-md p-spacing-sm">
                  <p className="truncate text-sm font-medium text-[--text-primary]">{page.title}</p>
                  <p className="truncate text-tiny text-[--text-muted]">{page.url}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-tiny text-[--text-muted]">{formatTimeAgo(page.visitedAt)}</span>
                    {page.timeSpent && (
                      <span className="text-tiny text-[--text-muted]">{Math.round(page.timeSpent / 1000)}s</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Previous Conversations */}
        {visitor.previousConversations && visitor.previousConversations.length > 0 && (
          <AccordionSection title="Previous Conversations" icon={MessageSquare}>
            <div className="space-y-spacing-sm">
              {visitor.previousConversations.slice(0, 5).map((conversation: unknown) => (
                <div key={conversation.id} className="bg-[--bg-subtle]/30 rounded-ds-md p-spacing-sm">
                  <p className="truncate text-sm font-medium text-[--text-primary]">{conversation.subject}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-typography-xs rounded-ds-full px-2 py-0.5",
                        conversation.status === "closed"
                          ? "bg-neutral-100 text-neutral-600"
                          : conversation.status === "open"
                            ? "bg-status-success-light text-semantic-success-dark"
                            : "bg-status-info-light text-blue-600"
                      )}
                    >
                      {conversation.status}
                    </span>
                    <span className="text-tiny text-[--text-muted]">{conversation.messageCount} messages</span>
                  </div>
                  <p className="mt-1 text-tiny text-[--text-muted]">{formatTimeAgo(conversation.createdAt)}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Custom Attributes */}
        {visitor.customAttributes && Object.keys(visitor.customAttributes).length > 0 && (
          <AccordionSection title="Custom Attributes" icon={Tag}>
            <div className="space-y-spacing-sm">
              {Object.entries(visitor.customAttributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-tiny capitalize text-[--text-muted]">{key.replace("_", " ")}</span>
                  <span className="text-tiny font-medium text-[--text-primary]">{value}</span>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}
      </div>
    </div>
  );
}
