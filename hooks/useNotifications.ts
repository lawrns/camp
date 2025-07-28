import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: "message" | "mention" | "assignment" | "system" | "alert";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
  metadata?: any;
}

interface NotificationSettings {
  email: {
    newMessages: boolean;
    mentions: boolean;
    assignments: boolean;
    systemAlerts: boolean;
  };
  push: {
    newMessages: boolean;
    mentions: boolean;
    assignments: boolean;
    systemAlerts: boolean;
  };
  inApp: {
    newMessages: boolean;
    mentions: boolean;
    assignments: boolean;
    systemAlerts: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface UseNotificationsReturn {
  notifications: Notification[];
  settings: NotificationSettings | null;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(
    async (signal?: AbortSignal) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const response = await fetch("/api/notifications", {
          ...(signal !== undefined && { signal }),
          headers: {
            Authorization: `Bearer ${(user as any).accessToken || (user as any).access_token || ""}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view notifications");
          }
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();
        return data.notifications || [];
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        throw err;
      }
    },
    [user]
  );

  const fetchSettings = useCallback(
    async (signal?: AbortSignal) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const response = await fetch("/api/notifications/settings", {
          ...(signal !== undefined && { signal }),
          headers: {
            Authorization: `Bearer ${(user as any).accessToken || (user as any).access_token || ""}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view settings");
          }
          throw new Error("Failed to fetch notification settings");
        }

        const data = await response.json();
        return data.settings;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        throw err;
      }
    },
    [user]
  );

  const loadData = useCallback(async () => {
    // Don't load data if user is not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const [notificationsData, settingsData] = await Promise.all([
        fetchNotifications(abortController.signal),
        fetchSettings(abortController.signal),
      ]);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (notificationsData) {
        setNotifications(notificationsData);
      }

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Use default settings if API doesn't return them
        setSettings({
          email: {
            newMessages: true,
            mentions: true,
            assignments: true,
            systemAlerts: false,
          },
          push: {
            newMessages: true,
            mentions: true,
            assignments: true,
            systemAlerts: true,
          },
          inApp: {
            newMessages: true,
            mentions: true,
            assignments: true,
            systemAlerts: true,
          },
          quietHours: {
            enabled: false,
            startTime: "22:00",
            endTime: "08:00",
          },
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);

        // Show user-friendly error
        toast({
          title: "Failed to load notifications",
          description: err.message || "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, fetchNotifications, fetchSettings, toast]);

  useEffect(() => {
    loadData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${(user as any).accessToken || (user as any).access_token || ""}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }

        setNotifications((prev) => prev.map((n: any) => (n.id === notificationId ? { ...n, read: true } : n)));
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) {
      throw new Error("Authentication required");
    }

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${(user as any).accessToken || (user as any).access_token || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      setNotifications((prev) => prev.map((n: any) => ({ ...n, read: true })));

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${(user as any).accessToken || (user as any).access_token || ""}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete notification");
        }

        setNotifications((prev) => prev.filter((n: any) => n.id !== notificationId));

        toast({
          title: "Success",
          description: "Notification deleted",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete notification",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  const updateSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const response = await fetch("/api/notifications/settings", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${(user as any).accessToken || (user as any).access_token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSettings),
        });

        if (!response.ok) {
          throw new Error("Failed to update notification settings");
        }

        setSettings(newSettings);

        toast({
          title: "Success",
          description: "Notification settings updated",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update settings",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    notifications,
    settings,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    refresh,
  };
}
