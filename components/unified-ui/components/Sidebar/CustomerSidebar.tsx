"use client";

import React from "react";
import { Activity, MapPin, Monitor, User } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar";
import { Badge } from "../Badge";

interface FlameCustomerSidebarProps {
  conversation: unknown;
  customerId?: string;
  className?: string;
}

/**
 * FlameCustomerSidebar - Professional customer sidebar with real data integration
 * Features: collapsible sections, real-time data, responsive design, accessibility
 */
export function FlameCustomerSidebar({ conversation, customerId, className }: FlameCustomerSidebarProps) {
  const actualCustomerId = customerId || conversation?.customer_id || conversation?.id || "unknown";

  // Transform conversation data to customer format
  const customerData = {
    id: actualCustomerId,
    name: conversation?.customerName || conversation?.customerName || "Unknown Customer",
    email: conversation?.customerEmail || conversation?.customerEmail || "visitor@local",
    phone: conversation?.customer_phone || conversation?.customerPhone,
    avatar: conversation?.customer_avatar || conversation?.customerAvatar,
    status: conversation?.customer_status || ("offline" as const),
    location: conversation?.customer_location || conversation?.customerLocation,
    timezone: conversation?.customer_timezone || conversation?.customerTimezone,
    company: conversation?.customer_company || conversation?.customerCompany,
    title: conversation?.customer_title || conversation?.customerTitle,
    website: conversation?.customer_website || conversation?.customerWebsite,
    createdAt: conversation?.created_at ? new Date(conversation.created_at) : new Date(),
    lastSeen: conversation?.lastMessageAt ? new Date(conversation.lastMessageAt) : undefined,
    totalConversations: conversation?.total_conversations || 1,
    averageResponseTime: conversation?.average_response_time || "N/A",
    satisfaction: conversation?.satisfaction_score,
    notes: conversation?.notes || "",
    tags: Array.isArray(conversation?.tags) ? conversation.tags : [],
    isVerified: false, // Will be updated with real API data later
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: unknown) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      className={cn(
        "flame-customer-sidebar h-full overflow-y-auto bg-white",
        "scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300",
        // Responsive design
        "w-full md:w-80 lg:w-96",
        // Smooth scrolling
        "scroll-smooth",
        className
      )}
    >
      {/* Customer Information Section */}
      <div className="border-b border-[var(--fl-color-border)]">
        <div className="bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex items-center gap-ds-2">
            <Icon icon={User} className="text-foreground h-4 w-4" />
            <h3 className="font-semibold text-gray-900">Customer Information</h3>
          </div>
        </div>

        <div className="space-y-3 spacing-3">
          {/* Customer Avatar and Name */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={customerData?.avatar} alt={customerData?.name} />
                <AvatarFallback className="text-sm font-medium">
                  {customerData?.name ? getInitials(customerData.name) : "?"}
                </AvatarFallback>
              </Avatar>
              {/* Online Status Indicator */}
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 h-4 w-4 rounded-ds-full border-2 border-white",
                  getStatusColor(customerData?.status || "offline")
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-gray-900">{customerData?.name || "Unknown Customer"}</h3>
              <p className="text-tiny capitalize text-[var(--fl-color-text-muted)]">
                {customerData?.status || "offline"}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-spacing-sm">
            <div className="text-foreground truncate text-sm">📧 {customerData.email}</div>

            {customerData?.phone && <div className="text-foreground text-sm">📞 {customerData.phone}</div>}

            {customerData?.company && (
              <div className="text-foreground text-sm">
                🏢 {customerData.company}
                {customerData?.title && (
                  <span className="text-[var(--fl-color-text-muted)]"> • {customerData.title}</span>
                )}
              </div>
            )}
          </div>

          {/* Customer Tags */}
          {customerData?.tags && customerData.tags.length > 0 && (
            <div className="space-y-spacing-sm">
              <p className="text-tiny font-medium uppercase tracking-wide text-[var(--fl-color-text-muted)]">Tags</p>
              <div className="flex flex-wrap gap-1">
                {customerData.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-tiny">
                    {tag}
                  </Badge>
                ))}
                {customerData.tags.length > 3 && (
                  <Badge variant="outline" className="text-tiny">
                    +{customerData.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary Section */}
      <div className="border-b border-[var(--fl-color-border)]">
        <div className="bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex items-center gap-ds-2">
            <Icon icon={Activity} className="text-foreground h-4 w-4" />
            <h3 className="font-semibold text-gray-900">Activity Summary</h3>
          </div>
        </div>

        <div className="space-y-3 spacing-3">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
              <div className="mb-1 text-tiny font-medium uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                Conversations
              </div>
              <p className="text-base font-semibold text-gray-900">{customerData?.totalConversations || 1}</p>
            </div>

            <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
              <div className="mb-1 text-tiny font-medium uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                Avg Response
              </div>
              <p className="text-base font-semibold text-gray-900">{customerData?.averageResponseTime || "N/A"}</p>
            </div>
          </div>

          {/* Customer Since */}
          {customerData?.createdAt && (
            <div className="text-foreground text-sm">
              📅 Customer since{" "}
              {customerData.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}

          {/* Satisfaction Score */}
          {customerData?.satisfaction && (
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">Satisfaction</span>
              <Badge variant="outline" className="text-tiny">
                {Math.round((customerData.satisfaction || 0) * 100)}%
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Location Information Section */}
      <div className="border-b border-[var(--fl-color-border)]">
        <div className="bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex items-center gap-ds-2">
            <Icon icon={MapPin} className="text-foreground h-4 w-4" />
            <h3 className="font-semibold text-gray-900">Location & Time</h3>
          </div>
        </div>

        <div className="space-y-3 spacing-3">
          <div className="text-foreground text-sm">🌍 {customerData?.location || "Unknown Location"}</div>

          <div className="text-foreground text-sm">
            🕒{" "}
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}{" "}
            (Local Time)
          </div>

          {conversation?.ipAddress && (
            <div className="text-foreground font-mono text-sm">🌐 {conversation.ipAddress}</div>
          )}
        </div>
      </div>

      {/* Technical Information Section */}
      <div className="border-b border-[var(--fl-color-border)]">
        <div className="bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex items-center gap-ds-2">
            <Icon icon={Monitor} className="text-foreground h-4 w-4" />
            <h3 className="font-semibold text-gray-900">Technical Information</h3>
          </div>
        </div>

        <div className="space-y-3 spacing-3">
          {conversation?.device_type && (
            <div className="text-foreground text-sm capitalize">📱 {conversation.device_type} Device</div>
          )}

          {conversation?.browser && (
            <div className="text-foreground text-sm">
              🌐 {conversation.browser}
              {conversation?.os && ` on ${conversation.os}`}
            </div>
          )}

          {(conversation?.screen_width || conversation?.screen_height) && (
            <div className="text-foreground text-sm">
              📺 {conversation.screen_width}×{conversation.screen_height}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
