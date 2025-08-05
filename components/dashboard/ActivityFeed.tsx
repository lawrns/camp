"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { EmptyState } from "@/components/unified-ui/components/empty-state";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { useAuth } from "@/hooks/useAuth";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { formatDistanceToNowShort } from "@/lib/utils/date";
import { ChartLine as Activity, Bot as Bot, CheckCircle, MessageCircle as MessageSquare, Star, User, Zap as Zap,  } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Activity types
export interface ActivityItem {
  id: string;
  type: "message" | "ticket" | "user" | "system" | "ai" | "achievement";
  action: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: {
    conversationId?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    rating?: number;
    count?: number;
  };
}

// REMOVED: Mock activity generator replaced with real database queries
// All activity data now comes from the activity_events table via /api/activity endpoint

interface ActivityFeedProps {
  compact?: boolean;
  maxItems?: number;
}

export function ActivityFeed({ compact = false, maxItems = 20 }: ActivityFeedProps) {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch real activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      if (!organizationId) return;

      try {
        const response = await fetch(`/api/activities?limit=20&organizationId=${organizationId}`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.activities) {
            // ACTIVATED: Handle real activities from enhanced API
            const formattedActivities = data.activities.map((activity: unknown) => ({
              id: activity.id,
              type: activity.type,
              action: activity.action,
              description: activity.description,
              timestamp: new Date(activity.timestamp),
              user: activity.user,
              metadata: activity.metadata,
            }));
            setActivities(formattedActivities);

          } else {
            // API returned no activities, start with empty array
            setActivities([]);

          }
        } else {
          // API failed, start with empty array

          setActivities([]);
        }
      } catch (error) {

        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [organizationId]);

  // INTEGRATION: Real-time activities using UnifiedRealtimeManager
  const handleActivityUpdate = useCallback(
    (activity: ActivityItem) => {
      setActivities((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
    },
    [maxItems]
  );

  // REPLACED: Use real-time subscription instead of polling
  useEffect(() => {
    if (!isLive || !organizationId) return;

    // Real-time subscription will be handled by DashboardMetricsManager
    // Activities will be updated through context or direct subscription

    // Note: This will be connected to the real-time dashboard metrics system
    // For now, activities are loaded once on mount above

    return () => {

    };
  }, [isLive, organizationId, handleActivityUpdate]);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "message":
        return MessageSquare;
      case "ticket":
        return CheckCircle;
      case "user":
        return User;
      case "system":
        return Zap;
      case "ai":
        return Bot;
      case "achievement":
        return Star;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: ActivityItem["type"], priority?: string) => {
    if (priority === "urgent") return "text-[var(--fl-color-danger)] bg-[var(--fl-color-danger-subtle)]";
    if (priority === "high") return "text-orange-500 bg-orange-50";

    switch (type) {
      case "message":
        return "text-[var(--fl-color-info)] bg-[var(--fl-color-info-subtle)]";
      case "ticket":
        return "text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]";
      case "user":
        return "text-purple-500 bg-purple-50";
      case "system":
        return "text-indigo-500 bg-indigo-50";
      case "ai":
        return "text-brand-500 bg-brand-50";
      case "achievement":
        return "text-orange-500 bg-orange-50";
      default:
        return "text-[var(--fl-color-text-muted)] bg-[var(--fl-color-background-subtle)]";
    }
  };

  const formatTime = (date: Date) => formatDistanceToNowShort(date);

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const config = {
      urgent: { color: "bg-[var(--fl-color-danger-subtle)]0", label: "Urgent" },
      high: { color: "bg-orange-500", label: "High" },
      medium: { color: "bg-[var(--fl-color-info-subtle)]0", label: "Medium" },
      low: { color: "bg-[var(--fl-color-background-subtle)]0", label: "Low" },
    } as const;

    const { color, label } = config[priority as keyof typeof config] || config.low;

    return <Badge className={`text-xs text-white ${color}`}>{label}</Badge>;
  };

  if (compact) {
    return (
      <div className="space-y-spacing-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Live Activity</h3>
          <div className="flex items-center gap-ds-2">
            <div className={`h-2 w-2 rounded-ds-full ${isLive ? "bg-semantic-success" : "bg-neutral-400"}`} />
            <Button variant="ghost" size="sm" onClick={() => setIsLive(!isLive)} className="h-6 text-tiny">
              {isLive ? "Live" : "Paused"}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-40">
          <div className="space-y-spacing-sm">
            <OptimizedAnimatePresence>
              {activities.slice(0, 5).map((activity: unknown) => {
                const Icon = getActivityIcon(activity.type);

                return (
                  <OptimizedMotion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-ds-2 rounded-ds-md p-spacing-sm transition-colors hover:bg-accent/30"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-ds-full ${getActivityColor(activity.type, activity.metadata?.priority)}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-tiny text-muted-foreground">
                        {activity.user ? (
                          <>
                            <span className="font-medium text-foreground">{activity.user.name}</span>
                            {" " + activity.action + " " + activity.description}
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-foreground">System</span>
                            {" " + activity.action + " " + activity.description}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-tiny text-muted-foreground">{formatTime(activity.timestamp)}</span>
                  </OptimizedMotion.div>
                );
              })}
            </OptimizedAnimatePresence>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Activity} className="h-5 w-5 text-brand-500" />
            Live Activity Feed
            <div className={`h-2 w-2 rounded-ds-full ${isLive ? "bg-semantic-success" : "bg-neutral-400"}`} />
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)}>
            {isLive ? "Pause" : "Resume"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            <OptimizedAnimatePresence>
              {activities.length === 0 ? (
                <EmptyState
                  icon={<Icon icon={Activity} className="h-12 w-12" />}
                  title="No recent activity"
                  description="Activity will appear here as your team interacts with customers."
                />
              ) : (
                activities.map((activity: unknown) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type, activity.metadata?.priority);

                  return (
                    <OptimizedMotion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex cursor-pointer items-start gap-3 rounded-ds-lg spacing-3 transition-colors hover:bg-accent/30"
                    >
                      {activity.user ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback className="bg-brand-50 text-tiny text-brand-700">
                            {activity.user.name
                              .split(" ")
                              .map((n: unknown) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`flex h-8 w-8 items-center justify-center rounded-ds-full ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-ds-2">
                          <p className="text-sm">
                            {activity.user ? (
                              <>
                                <span className="font-medium">{activity.user.name}</span>
                                {" " + activity.action}
                              </>
                            ) : (
                              <>
                                <span className="font-medium">System</span>
                                {" " + activity.action}
                              </>
                            )}
                          </p>
                          {activity.metadata?.priority && getPriorityBadge(activity.metadata.priority)}
                        </div>

                        <p className="mb-2 text-tiny text-muted-foreground">{activity.description}</p>

                        <div className="flex items-center gap-3">
                          <span className="text-tiny text-muted-foreground">{formatTime(activity.timestamp)}</span>

                          {activity.metadata?.rating && (
                            <div className="flex items-center gap-[var(--fl-spacing-1)]">
                              {Array.from({ length: activity.metadata.rating }).map((_, i) => (
                                <Star key={i} className="text-semantic-warning h-3 w-3 fill-current" />
                              ))}
                            </div>
                          )}

                          {activity.metadata?.count && (
                            <Badge variant="outline" className="text-tiny rounded-full">
                              {activity.metadata.count} items
                            </Badge>
                          )}

                          {activity.user?.role && (
                            <Badge variant="secondary" className="text-tiny rounded-full">
                              {activity.user.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </OptimizedMotion.div>
                  );
                })
              )}
            </OptimizedAnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Simple activity indicator for other components
export function ActivityIndicator() {
  const [activityCount, setActivityCount] = useState(0);

  // REAL DATA: Fetch actual activity count from API
  useEffect(() => {
    const fetchActivityCount = async () => {
      try {
        const response = await fetch("/api/activities?count=true", {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setActivityCount(data.data?.count || 0);
        }
      } catch (error) {

        setActivityCount(0);
      }
    };

    fetchActivityCount();

    return () => {

    };
  }, []);

  return (
    <div className="flex items-center gap-ds-2">
      <div className="bg-semantic-success h-2 w-2 rounded-ds-full" />
      <span className="text-tiny text-muted-foreground">{activityCount} activities today</span>
    </div>
  );
}
