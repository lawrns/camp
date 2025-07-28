"use client";

import React, { useEffect, useState } from "react";
import {
  Buildings as Building,
  Clock,
  Globe,
  MapPin,
  ChatCircle as MessageSquare,
  Monitor,
  Phone,
  DeviceMobile as Smartphone,
  User,
  WifiHigh,
  WifiSlash as WifiHighOff,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/unified-ui/components/collapsible";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface VisitorDetailsSidebarProps {
  visitor: VisitorData;
  className?: string;
  onClose?: () => void;
}

interface VisitorData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: {
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
  visitedPages?: Array<{
    url: string;
    title: string;
    visitedAt: string;
    timeSpent?: number;
  }>;
  previousConversations?: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: string;
    messageCount: number;
  }>;
}

interface AccordionSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false, className }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-between spacing-3 text-left font-medium hover:bg-[var(--fl-color-background-subtle)] focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-neutral-800"
        >
          <div className="flex items-center gap-ds-2">
            <Icon className="text-foreground h-4 w-4 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">{title}</span>
          </div>
          <Icon
            name="ChevronDown"
            className={cn("h-4 w-4 text-neutral-500 transition-transform duration-150", isOpen && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
        <div className="px-3 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MapPreview({ location }: { location: VisitorData["location"] }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Lazy load map when section becomes visible
    if (isVisible && !mapLoaded) {
      setMapLoaded(true);
    }
  }, [isVisible, mapLoaded]);

  const mapUrl = `https://via.placeholder.com/300x160/f3f4f6/6b7280?text=${encodeURIComponent(location.city + ", " + location.country)}`;

  return (
    <div
      className="bg-background relative h-40 w-full overflow-hidden rounded-ds-md border border-[var(--fl-color-border)] dark:border-neutral-700 dark:bg-neutral-800"
      ref={(el) => {
        if (el && !isVisible) {
          const observer = new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              if (entry && entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
              }
            },
            { threshold: 0.1 }
          );
          observer.observe(el);
        }
      }}
    >
      {mapLoaded ? (
        <img
          src={mapUrl}
          alt={`Map of ${location.city}, ${location.country}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Icon icon={MapPin} className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-[var(--fl-color-text-muted)] dark:text-gray-400">
              {location.city}, {location.country}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getDeviceIcon(deviceType?: string) {
  switch (deviceType) {
    case "mobile":
    case "tablet":
      return Smartphone;
    default:
      return Monitor;
  }
}

function formatTimeAgo(timestamp?: string): string {
  if (!timestamp) return "Unknown";

  const now = new Date();
  const time = new Date(timestamp);

  // Check if the date is valid
  if (isNaN(time.getTime())) return "Unknown";

  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

export function VisitorDetailsSidebar({ visitor, className, onClose }: VisitorDetailsSidebarProps) {
  const DeviceIcon = getDeviceIcon(visitor.deviceType);

  return (
    <div
      className={cn(
        "visitor-details-sidebar h-full w-full border-l border-[var(--fl-color-border)] bg-white dark:border-neutral-700 dark:bg-neutral-900",
        className
      )}
    >
      {/* Identity Card Section */}
      <div className="border-b border-border spacing-3">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <Avatar className="h-20 w-20 shadow-card-deep ring-2 ring-white">
              {visitor.avatar && <AvatarImage src={visitor.avatar!} alt={visitor.name} />}
              <AvatarFallback className="text-status-info-dark bg-[var(--fl-color-info-subtle)] text-lg font-semibold">
                {visitor.name
                  .split(" ")
                  .map((n: any) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Online status indicator */}
            <div className="absolute -bottom-1 -right-1">
              {visitor.isOnline ? (
                <div className="bg-semantic-success flex h-5 w-5 items-center justify-center rounded-ds-full border-2 border-white dark:border-neutral-900">
                  <Icon icon={WifiHigh} className="h-2.5 w-2.5 text-white" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-ds-full border-2 border-white bg-neutral-400 dark:border-neutral-900">
                  <Icon icon={WifiHighOff} className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
          </div>

          <h2 className="mb-1 text-base font-semibold text-primary">{visitor.name}</h2>
          <p className="mb-2 text-sm text-muted-foreground">{visitor.email}</p>

          {/* Location and Local Time */}
          <div className="mb-3 flex items-center gap-ds-2 text-sm text-muted-foreground">
            <Icon icon={MapPin} className="h-4 w-4" />
            <span>
              {visitor.location.city}, {visitor.location.country}
            </span>
          </div>

          {visitor.localTime && (
            <Badge variant="secondary" className="text-tiny">
              <Icon icon={Clock} className="mr-1 h-3 w-3" />
              {visitor.localTime}
            </Badge>
          )}
        </div>
      </div>

      {/* Map Preview */}
      <div className="border-b border-border spacing-3">
        <MapPreview location={visitor.location} />
      </div>

      {/* Accordion Sections */}
      <div className="flex-1 space-y-3 overflow-y-auto spacing-3">
        {/* Contact Information Section */}
        <div className="rounded-ds-md border border-border bg-muted/50 px-3 py-2">
          <AccordionSection title="Contact Information" icon={User as any} defaultOpen>
            <div className="space-y-3">
              {/* Identity sub-block with status badges */}
              <div className="space-y-spacing-sm">
                <h4 className="text-tiny font-medium uppercase tracking-wide text-muted-foreground">Identity</h4>
                <div className="flex flex-wrap gap-ds-2">
                  <Badge variant={visitor.isOnline ? "default" : "secondary"} className="text-tiny">
                    {visitor.isOnline ? "Online" : "Offline"}
                  </Badge>
                  {visitor.isVerified && (
                    <Badge
                      variant="secondary"
                      className="text-green-600-dark border-status-success-light bg-[var(--fl-color-success-subtle)] text-tiny"
                    >
                      <Icon name="Shield" className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {visitor.company && (
                <div className="flex items-center gap-ds-2">
                  <Icon name="Building" className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-primary">{visitor.company}</p>
                    {visitor.role && <p className="text-tiny text-muted-foreground">{visitor.role}</p>}
                  </div>
                </div>
              )}

              {visitor.phone && (
                <div className="flex items-center gap-ds-2">
                  <Icon icon={Phone} className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-primary">{visitor.phone}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-ds-2 text-tiny">
                <div>
                  <p className="text-muted-foreground">First seen</p>
                  <p className="font-medium text-primary">{formatTimeAgo(visitor.firstSeen)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last seen</p>
                  <p className="font-medium text-primary">{formatTimeAgo(visitor.lastSeen)}</p>
                </div>
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* Customer Value Section */}
        <div className="rounded-ds-md border border-border bg-muted/50 px-3 py-2">
          <AccordionSection title="Customer Value" icon={Building as any}>
            <div className="space-y-3">
              {visitor.sessions && (
                <div>
                  <p className="text-tiny text-muted-foreground">Total Sessions</p>
                  <p className="text-sm font-medium text-primary">{visitor.sessions}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-ds-2 text-tiny">
                <div>
                  <p className="text-muted-foreground">Engagement</p>
                  <p className="font-medium text-primary">High</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lifetime Value</p>
                  <p className="font-medium text-primary">$0</p>
                </div>
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* Technical Information Section */}
        <div className="rounded-ds-md border border-border bg-muted/50 px-3 py-2">
          <AccordionSection title="Technical Information" icon={Globe as any}>
            <div className="space-y-3">
              <div className="flex items-center gap-ds-2">
                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {visitor.deviceType
                      ? visitor.deviceType.charAt(0).toUpperCase() + visitor.deviceType.slice(1)
                      : "Unknown"}
                  </p>
                  <p className="text-tiny text-muted-foreground">
                    {visitor.browser} on {visitor.os}
                  </p>
                </div>
              </div>

              {visitor.ipAddress && (
                <div>
                  <p className="text-tiny text-muted-foreground">IP Address</p>
                  <p className="text-sm font-medium text-primary">{visitor.ipAddress}</p>
                </div>
              )}
            </div>
          </AccordionSection>
        </div>

        {/* Conversation Insights Section */}
        <div className="rounded-ds-md border border-border bg-muted/50 px-3 py-2">
          <AccordionSection title="Conversation Insights" icon={MessageSquare as any}>
            <div className="space-y-spacing-sm">
              {/* Visited Pages */}
              <div className="mb-4">
                <h4 className="mb-2 text-tiny font-medium uppercase tracking-wide text-muted-foreground">
                  Recent Pages
                </h4>
                {visitor.visitedPages && visitor.visitedPages.length > 0 ? (
                  visitor.visitedPages.slice(0, 3).map((page, index) => (
                    <div key={index} className="mb-2 rounded-ds-md bg-background p-spacing-sm">
                      <p className="truncate text-sm font-medium text-primary">{page.title}</p>
                      <p className="truncate text-tiny text-muted-foreground">{page.url}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-tiny text-muted-foreground">{formatTimeAgo(page.visitedAt)}</span>
                        {page.timeSpent && (
                          <span className="text-tiny text-muted-foreground">{Math.round(page.timeSpent / 1000)}s</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No page visits recorded</p>
                )}
              </div>

              {/* Previous Conversations */}
              <div>
                <h4 className="mb-2 text-tiny font-medium uppercase tracking-wide text-muted-foreground">
                  Previous Conversations
                </h4>
                {visitor.previousConversations && visitor.previousConversations.length > 0 ? (
                  visitor.previousConversations.slice(0, 3).map((conversation: any) => (
                    <div key={conversation.id} className="mb-2 rounded-ds-md bg-background p-spacing-sm">
                      <p className="truncate text-sm font-medium text-primary">{conversation.subject}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <Badge variant="outline" className="text-tiny">
                          {conversation.status}
                        </Badge>
                        <span className="text-tiny text-muted-foreground">{conversation.messageCount} messages</span>
                      </div>
                      <p className="mt-1 text-tiny text-muted-foreground">{formatTimeAgo(conversation.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No previous conversations</p>
                )}
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}
