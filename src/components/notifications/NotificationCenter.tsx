"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { EmptyState, EmptyStateVariantsConfig } from "@/components/unified-ui/components/empty-state";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { useOrganizationRealtime } from "@/lib/realtime";
import { getBrowserClient } from "@/lib/supabase";
import { Icon } from "@/lib/ui/Icon";
import { formatRelativeTimeShort } from "@/lib/utils/date";
import {
  Bell,
  BellSlash as BellOff,
  CheckCircle as Check,
  Checks as CheckCheck,
  Clock,
  ChatCircle as MessageSquare,
  Gear as Settings,
  Trash as Trash2,
  X,
  Warning,
  Info,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user, organizationId } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread" | "messages" | "alerts">("all");
  
  // Use real notifications hook
  const {
    notifications,
    loading,
    error,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationById,
    clearNotifications,
  } = useNotifications();

  // Subscribe to real-time updates
  const { connectionStatus } = useOrganizationRealtime(organizationId || "");

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!organizationId || !user || !isOpen) return;

    const supabase = getBrowserClient();
    const channelName = `org:${organizationId}:user:${user.id}:notifications`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "new_notification" }, (payload) => {
        // The useNotifications hook should automatically update
        // Play a subtle sound for new notifications
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [organizationId, user, isOpen]);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await markNotificationAsRead(id);
    },
    [markNotificationAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
  }, [markAllNotificationsAsRead]);

  const handleDeleteNotification = useCallback(
    async (id: string) => {
      await deleteNotificationById(id);
    },
    [deleteNotificationById]
  );

  const handleClearAll = useCallback(async () => {
    await clearNotifications();
  }, [clearNotifications]);

  const filteredNotifications = notifications.filter((notif: any) => {
    switch (filter) {
      case "unread":
        return !notif.read;
      case "messages":
        return notif.type === "message" || notif.type === "mention";
      case "alerts":
        return notif.type === "alert" || notif.type === "system" || notif.priority === "high";
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
      case "mention":
        return MessageSquare;
      case "assignment":
        return Bell;
      case "system":
        return Info;
      case "ai_handover":
        return Warning;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") {
      return "text-[var(--color-error-600)] bg-[var(--color-error-50)] border-[var(--color-error-100)]";
    }
    switch (type) {
      case "message":
      case "mention":
        return "text-[var(--color-info-600)] bg-[var(--color-info-50)] border-[var(--color-info-100)]";
      case "assignment":
        return "text-[var(--color-primary-600)] bg-[var(--color-primary-50)] border-[var(--color-primary-100)]";
      case "system":
        return "text-[var(--color-warning-600)] bg-[var(--color-warning-50)] border-[var(--color-warning-100)]";
      case "ai_handover":
        return "text-[var(--color-warning-600)] bg-[var(--color-warning-50)] border-[var(--color-warning-100)]";
      default:
        return "text-[var(--color-text-muted)] bg-[var(--color-background-subtle)] border-[var(--color-border)]";
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatRelativeTimeShort(dateObj);
  };

  if (!isOpen) return null;

  const MotionDiv = OptimizedMotion.div;

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-[var(--spacing-2)] w-[calc(var(--spacing-4)*24)]"
    >
      <Card className="rounded-[var(--rounded-ds-lg)] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]">
        <CardHeader className="pb-[var(--spacing-3)]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-[var(--spacing-2)]">
              <Icon icon={Bell} className="h-[var(--spacing-5)] w-[var(--spacing-5)]" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-[var(--color-error-500)] text-[var(--font-size-xs)] text-[var(--color-text-inverse)]">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon icon={X} className="h-[var(--spacing-4)] w-[var(--spacing-4)]" />
            </Button>
          </div>

          {/* Filter Tabs - Using proper design tokens */}
          <div className="relative mt-[var(--spacing-3)]">
            <div
              className="flex gap-[var(--spacing-2)] overflow-x-auto pb-[var(--spacing-1)]"
              style={{
                height: "calc(var(--spacing-12) - var(--spacing-1))",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {[
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "messages", label: "Messages" },
                { key: "alerts", label: "Alerts" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-[var(--rounded-ds-md)] px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-[var(--font-weight-medium)] transition-all duration-[var(--duration-fast)] ${
                    filter === tab.key
                      ? "bg-[var(--color-primary-500)] text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-background-subtle)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Fade-out gradient hint */}
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[var(--spacing-6)] bg-gradient-to-l from-[var(--color-surface)] to-transparent" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-[var(--spacing-3)]">
          {/* Actions */}
          <div className="flex items-center gap-[var(--spacing-2)] border-b border-[var(--color-border)] pb-[var(--spacing-2)]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || loading}
            >
              <Icon icon={Check} className="mr-[var(--spacing-1)] h-[var(--spacing-3)] w-[var(--spacing-3)]" />
              Mark All Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={notifications.length === 0 || loading}
            >
              <Icon icon={Trash2} className="mr-[var(--spacing-1)] h-[var(--spacing-3)] w-[var(--spacing-3)]" />
              Clear All
            </Button>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(var(--spacing-10)*8)]">
            <div className="space-y-[var(--spacing-3)]">
              <OptimizedAnimatePresence>
                {loading ? (
                  <div className="flex items-center justify-center py-[var(--spacing-8)]">
                    <div className="h-[var(--spacing-8)] w-[var(--spacing-8)] animate-spin rounded-ds-full border-2 border-[var(--color-border)] border-t-[var(--color-primary-500)]" />
                  </div>
                ) : error ? (
                  <EmptyState
                    icon={<Icon icon={Warning} />}
                    title="Error loading notifications"
                    description="Please try again later"
                  />
                ) : filteredNotifications.length === 0 ? (
                  <EmptyState
                    icon={<Icon icon={Bell} />}
                    title={EmptyStateVariantsConfig.notifications.title}
                    description={EmptyStateVariantsConfig.notifications.description}
                  />
                ) : (
                  filteredNotifications.map((notification: any) => {
                    const NotificationIcon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type, notification.priority);
                    const NotificationMotionDiv = OptimizedMotion.div;
                    
                    return (
                      <NotificationMotionDiv
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`rounded-[var(--rounded-ds-lg)] border border-[var(--color-border)] p-[var(--spacing-4)] shadow-[var(--shadow-card-base)] transition-all hover:shadow-[var(--shadow-card-hover)] ${
                          notification.read ? "bg-[var(--color-background-subtle)]" : "bg-[var(--color-surface)]"
                        }`}
                      >
                        <div className="flex items-start gap-[var(--spacing-4)]">
                          <div
                            className={`flex h-[var(--spacing-10)] w-[var(--spacing-10)] flex-shrink-0 items-center justify-center rounded-[var(--rounded-ds-lg)] ${
                              notification.read ? "bg-[var(--color-background-muted)]" : colorClass
                            }`}
                          >
                            <NotificationIcon className="h-[var(--spacing-5)] w-[var(--spacing-5)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-[var(--spacing-2)] flex items-center gap-[var(--spacing-2)]">
                              <h4 className="truncate text-[var(--font-size-base)] font-[var(--font-weight-semibold)]">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="h-[var(--spacing-2)] w-[var(--spacing-2)] rounded-ds-full bg-[var(--color-primary-500)]" />
                              )}
                              {notification.priority === "high" && (
                                <Badge variant="error" className="text-[var(--font-size-sm)]">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            
                            <p className="mb-[var(--spacing-3)] text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                                {formatTime(notification.created_at || notification.timestamp)}
                              </span>
                              
                              <div className="flex items-center gap-[var(--spacing-2)]">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="h-[var(--spacing-8)] px-[var(--spacing-3)] text-[var(--font-size-sm)]"
                                    disabled={loading}
                                  >
                                    <Check className="h-[var(--spacing-4)] w-[var(--spacing-4)]" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className="h-[var(--spacing-8)] px-[var(--spacing-3)] text-[var(--font-size-sm)] text-[var(--color-error-500)] hover:text-[var(--color-error-600)]"
                                  disabled={loading}
                                >
                                  <X className="h-[var(--spacing-4)] w-[var(--spacing-4)]" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Handle conversation link if present */}
                            {notification.conversation_id && (
                              <div className="mt-[var(--spacing-3)]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    window.location.href = `/dashboard/inbox/${notification.conversation_id}`;
                                  }}
                                  className="h-[var(--spacing-8)] px-[var(--spacing-3)] text-[var(--font-size-sm)]"
                                >
                                  View Conversation
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </NotificationMotionDiv>
                    );
                  })
                )}
              </OptimizedAnimatePresence>
            </div>
          </ScrollArea>

          {/* Settings Footer */}
          <div className="border-t border-[var(--color-border)] pt-[var(--spacing-2)]">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[var(--font-size-xs)]"
              onClick={() => {
                window.location.href = "/dashboard/notifications";
              }}
            >
              <Icon icon={Settings} className="mr-[var(--spacing-1)] h-[var(--spacing-3)] w-[var(--spacing-3)]" />
              Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </MotionDiv>
  );
}

// Notification trigger button component
export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading } = useNotifications();

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-[var(--spacing-10)] w-[var(--spacing-10)] items-center justify-center rounded-[var(--rounded-ds-lg)] transition-colors hover:bg-[var(--color-background-subtle)]"
        aria-label="Notifications"
      >
        <Bell className="h-[var(--spacing-5)] w-[var(--spacing-5)]" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-[var(--spacing-5)] min-w-[var(--spacing-5)] items-center justify-center rounded-ds-full bg-[var(--color-error-500)] px-[var(--spacing-1)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--color-text-inverse)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <OptimizedAnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-[var(--spacing-12)] z-50">
              <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
            </div>
          </>
        )}
      </OptimizedAnimatePresence>
    </div>
  );
}