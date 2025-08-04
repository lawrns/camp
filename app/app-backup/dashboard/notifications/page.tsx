"use client";

import { NotificationErrorBoundary } from "@/components/error/NotificationErrorBoundary";
import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Icon } from "@/lib/ui/Icon";
import {
  Warning as AlertTriangle,
  Bell,
  CheckCircle,
  Checks,
  Clock,
  Spinner as Loader2,
  Envelope as Mail,
  ChatCircle as MessageSquare,
  Monitor,
  ArrowsClockwise as RefreshCw,
  MagnifyingGlass as Search,
  Gear as Settings,
  DeviceMobile as Smartphone,
  Trash as Trash2,
  Users
} from "@phosphor-icons/react";
import { useState } from "react";

function NotificationsContent() {
  // Hook calls must be at the top level, not inside try-catch
  const {
    notifications,
    settings,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    refresh,
  } = useNotifications();

  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
      switch (type) {
        case "message":
          return <Icon icon={MessageSquare} className="h-5 w-5 text-blue-600" />;
        case "mention":
          return <Icon icon={Users} className="h-5 w-5 text-purple-600" />;
        case "assignment":
          return <Icon icon={CheckCircle} className="text-semantic-success-dark h-5 w-5" />;
        case "system":
          return <Icon icon={Settings} className="h-5 w-5 text-gray-600" />;
        case "alert":
          return <Icon icon={AlertTriangle} className="h-5 w-5 text-red-600" />;
        default:
          return <Icon icon={Bell} className="h-5 w-5 text-gray-600" />;
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "urgent":
          return "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]";
        case "high":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "medium":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "low":
          return "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]";
        default:
          return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
      }
    };

    const filteredNotifications = notifications.filter((notification: any) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.read) ||
        (filter === "read" && notification.read) ||
        notification.type === filter;

      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    if (loading && notifications.length === 0) {
      return (
        <div className="space-y-6 spacing-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="spacing-4">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (error && notifications.length === 0) {
      return (
        <div className="spacing-6">
          <Card className="border-status-error-light bg-[var(--fl-color-danger-subtle)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Icon icon={AlertTriangle} className="h-5 w-5" />
                Unable to Load Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-600-dark text-sm">
                {(error instanceof Error ? error.message : String(error)) || "We encountered an error while loading your notifications."}
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-[var(--fl-color-danger-muted)] hover:bg-[var(--fl-color-danger-subtle)]"
              >
                <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    try {
      return (
        <div className="space-y-6 spacing-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0} leftIcon={<Icon icon={Checks} className="h-4 w-4" />}>
              Mark All as Read
            </Button>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Icon
                  icon={Search}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full rounded-ds-md border border-[var(--fl-color-border-strong)] py-2 pl-10 pr-4 text-sm"
                />
              </div>
              <select
                value={filter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
                className="rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 text-sm"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="message">Messages</option>
                <option value="mention">Mentions</option>
                <option value="assignment">Assignments</option>
                <option value="system">System</option>
                <option value="alert">Alerts</option>
              </select>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <Icon icon={Bell} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      {searchTerm || filter !== "all" ? "No matching notifications" : "No notifications yet"}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || filter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "You'll see notifications here when they arrive"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: any) => (
                  <Card
                    key={notification.id}
                    className={`transition-all duration-200 hover:shadow-md ${!notification.read ? "bg-[var(--fl-color-info-subtle)]/30 border-l-4 border-l-blue-500" : ""
                      }`}
                  >
                    <CardContent className="spacing-6">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center space-x-2">
                                <h4
                                  className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"
                                    }`}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.read && <div className="h-2 w-2 rounded-ds-full bg-brand-blue-500"></div>}
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="mb-3 text-sm text-gray-600 leading-relaxed">{notification.description}</p>
                              <p className="text-xs text-[var(--fl-color-text-muted)]">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="hover:text-status-info-dark text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
                                >
                                  <Icon icon={CheckCircle} className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:bg-[var(--fl-color-danger-subtle)] hover:text-red-600"
                              >
                                <Icon icon={Trash2} className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {notification.actionUrl && (
                            <div className="mt-3">
                              <Button variant="outline" size="sm" className="text-xs">
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {settings && (
              <div className="space-y-6">
                {/* Email Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon icon={Mail} className="h-5 w-5" />
                      <span>Email Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Messages</p>
                        <p className="text-sm text-gray-600">Email notifications for new messages</p>
                      </div>
                      <Switch
                        checked={settings.email.newMessages}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            email: { ...settings.email, newMessages: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mentions</p>
                        <p className="text-sm text-gray-600">When someone mentions you</p>
                      </div>
                      <Switch
                        checked={settings.email.mentions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            email: { ...settings.email, mentions: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Assignments</p>
                        <p className="text-sm text-gray-600">When conversations are assigned to you</p>
                      </div>
                      <Switch
                        checked={settings.email.assignments}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            email: { ...settings.email, assignments: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">System Alerts</p>
                        <p className="text-sm text-gray-600">Important system notifications</p>
                      </div>
                      <Switch
                        checked={settings.email.systemAlerts}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            email: { ...settings.email, systemAlerts: e.target.checked },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Push Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon icon={Smartphone} className="h-5 w-5" />
                      <span>Push Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Messages</p>
                        <p className="text-sm text-gray-600">Real-time push notifications for new messages</p>
                      </div>
                      <Switch
                        checked={settings.push.newMessages}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            push: { ...settings.push, newMessages: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mentions</p>
                        <p className="text-sm text-gray-600">When someone mentions you</p>
                      </div>
                      <Switch
                        checked={settings.push.mentions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            push: { ...settings.push, mentions: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Assignments</p>
                        <p className="text-sm text-gray-600">When conversations are assigned to you</p>
                      </div>
                      <Switch
                        checked={settings.push.assignments}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            push: { ...settings.push, assignments: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">System Alerts</p>
                        <p className="text-sm text-gray-600">Important system notifications</p>
                      </div>
                      <Switch
                        checked={settings.push.systemAlerts}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            push: { ...settings.push, systemAlerts: e.target.checked },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* In-App Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon icon={Monitor} className="h-5 w-5" />
                      <span>In-App Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Messages</p>
                        <p className="text-sm text-gray-600">Show notifications within the app</p>
                      </div>
                      <Switch
                        checked={settings.inApp.newMessages}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            inApp: { ...settings.inApp, newMessages: e.target.checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mentions</p>
                        <p className="text-sm text-gray-600">When someone mentions you</p>
                      </div>
                      <Switch
                        checked={settings.inApp.mentions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            inApp: { ...settings.inApp, mentions: e.target.checked },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quiet Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Icon icon={Clock} className="h-5 w-5" />
                      <span>Quiet Hours</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable Quiet Hours</p>
                        <p className="text-sm text-gray-600">Pause notifications during specific hours</p>
                      </div>
                      <Switch
                        checked={settings.quietHours.enabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSettings({
                            ...settings,
                            quietHours: { ...settings.quietHours, enabled: e.target.checked },
                          })
                        }
                      />
                    </div>
                    {settings.quietHours.enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Start Time</label>
                          <input
                            type="time"
                            value={settings.quietHours.startTime}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateSettings({
                                ...settings,
                                quietHours: { ...settings.quietHours, startTime: e.target.value },
                              })
                            }
                            className="mt-1 w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Time</label>
                          <input
                            type="time"
                            value={settings.quietHours.endTime}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateSettings({
                                ...settings,
                                quietHours: { ...settings.quietHours, endTime: e.target.value },
                              })
                            }
                            className="mt-1 w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (authError) {
    // Handle auth provider context errors gracefully
    return (
      <div className="spacing-6">
        <Card className="border-status-error-light bg-[var(--fl-color-danger-subtle)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Icon icon={AlertTriangle} className="h-5 w-5" />
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600-dark text-sm">
              {authError instanceof Error
                ? authError.message
                : "Authentication context is not available. Please refresh the page."}
            </p>
            <Button
              onClick={() => {
                if (isFeatureEnabled("enableRealtimeSync")) {
                  // Trigger data refresh without page reload
                  window.location.reload();
                } else {
                  window.location.reload();
                }
              }}
              variant="outline"
              className="border-[var(--fl-color-danger-muted)] hover:bg-[var(--fl-color-danger-subtle)]"
            >
              <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

const NotificationErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default function NotificationsPage() {
  return (
    <NotificationErrorBoundary>
      <NotificationsContent />
    </NotificationErrorBoundary>
  );
}
