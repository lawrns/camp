"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Warning as AlertTriangle,
  Bell,
  CheckCircle as CheckCircle2,
  Clock,
  ChatCircle as MessageCircle,
  User,
  Users,
  SpeakerHigh as Volume2,
  SpeakerSlash as VolumeX,
  X,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface NotificationData {
  id: string;
  type: "new_message" | "assignment" | "status_change" | "urgent" | "handover" | "mention";
  title: string;
  message: string;
  timestamp: Date;
  conversationId?: string;
  customerName?: string;
  agentName?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: "primary" | "secondary";
  }>;
}

interface LiveNotificationSystemProps {
  notifications: NotificationData[];
  onNotificationAction?: (notificationId: string, action: string) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  maxVisible?: number;
  autoDissmissTime?: number;
  className?: string;
}

const NotificationIcon = ({ type }: { type: NotificationData["type"] }) => {
  switch (type) {
    case "new_message":
      return <Icon icon={MessageCircle} className="h-5 w-5 text-blue-600" />;
    case "assignment":
      return <Icon icon={User} className="text-semantic-success-dark h-5 w-5" />;
    case "status_change":
      return <Icon icon={CheckCircle2} className="h-5 w-5 text-purple-600" />;
    case "urgent":
      return <Icon icon={AlertTriangle} className="h-5 w-5 text-red-600" />;
    case "handover":
      return <Icon icon={Users} className="h-5 w-5 text-orange-600" />;
    case "mention":
      return <Icon icon={Bell} className="h-5 w-5 text-yellow-600" />;
    default:
      return <Icon icon={Bell} className="text-foreground h-5 w-5" />;
  }
};

const NotificationCard = ({
  notification,
  onDismiss,
  onAction,
  autoDissmissTime = 5000,
}: {
  notification: NotificationData;
  onDismiss: () => void;
  onAction?: (action: string) => void;
  autoDissmissTime?: number;
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    if (isPaused || autoDissmissTime <= 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          onDismiss();
          return 0;
        }
        return prev - 100 / (autoDissmissTime / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, autoDissmissTime, onDismiss]);

  const getPriorityColor = (priority: string = "medium") => {
    switch (priority) {
      case "urgent":
        return "border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)] text-red-900";
      case "high":
        return "border-orange-200 bg-orange-50 text-orange-900";
      case "low":
        return "border-[var(--fl-color-success-muted)] bg-[var(--fl-color-success-subtle)] text-green-900";
      default:
        return "border-[var(--fl-color-info-muted)] bg-[var(--fl-color-info-subtle)] text-blue-900";
    }
  };

  const getProgressColor = (priority: string = "medium") => {
    switch (priority) {
      case "urgent":
        return "bg-[var(--fl-color-danger-subtle)]0";
      case "high":
        return "bg-orange-500";
      case "low":
        return "bg-[var(--fl-color-success-subtle)]0";
      default:
        return "bg-[var(--fl-color-info-subtle)]0";
    }
  };

  return (
    <OptimizedMotion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative w-80 rounded-ds-lg border bg-white/95 spacing-4 shadow-lg backdrop-blur-sm",
        getPriorityColor(notification.priority)
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress bar */}
      {autoDissmissTime > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg bg-gray-200/50">
          <div
            className={cn("h-full transition-all duration-100 ease-linear", getProgressColor(notification.priority))}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">
          <NotificationIcon type={notification.type} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex items-start justify-between">
            <div className="flex items-center gap-ds-2">
              <h4 className="text-sm font-semibold">{notification.title}</h4>
              {notification.priority && notification.priority !== "medium" && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-typography-xs px-1.5 py-0.5",
                    notification.priority === "urgent" &&
                      "bg-status-error-light text-status-error-dark border-status-error-light",
                    notification.priority === "high" && "border-orange-200 bg-orange-100 text-orange-700",
                    notification.priority === "low" &&
                      "bg-status-success-light text-status-success-dark border-status-success-light"
                  )}
                >
                  {notification.priority}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-foreground h-6 w-6 p-0 text-[var(--fl-color-text-muted)]"
              onClick={onDismiss}
            >
              <Icon icon={X} className="h-4 w-4" />
            </Button>
          </div>

          {/* Message */}
          <p className="leading-relaxed text-foreground mb-2 text-sm">{notification.message}</p>

          {/* Metadata */}
          <div className="text-foreground mb-3 flex items-center gap-3 text-tiny">
            {notification.customerName && (
              <span className="flex items-center gap-1">
                <Icon icon={User} className="h-3 w-3" />
                {notification.customerName}
              </span>
            )}
            {notification.agentName && (
              <span className="flex items-center gap-1">
                <Icon icon={Users} className="h-3 w-3" />
                {notification.agentName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon icon={Clock} className="h-3 w-3" />
              {notification.timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-ds-2">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant === "primary" ? "default" : "outline"}
                  className="h-7 px-3 text-tiny"
                  onClick={() => {
                    action.action();
                    if (onAction) onAction(action.label);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </OptimizedMotion.div>
  );
};

export function LiveNotificationSystem({
  notifications,
  onNotificationAction,
  onNotificationDismiss,
  soundEnabled = true,
  onSoundToggle,
  maxVisible = 5,
  autoDissmissTime = 5000,
  className,
}: LiveNotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationData[]>([]);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audioElement = new Audio("/sounds/notification.mp3");
      audioElement.volume = 0.3;
      setAudio(audioElement);
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(
    (type: NotificationData["type"]) => {
      if (!audio || !soundEnabled) return;

      try {
        // Reset audio to beginning
        audio.currentTime = 0;

        // Adjust volume based on priority
        switch (type) {
          case "urgent":
            audio.volume = 0.6;
            break;
          case "new_message":
            audio.volume = 0.4;
            break;
          default:
            audio.volume = 0.3;
        }

        audio.play().catch(console.warn);
      } catch (error) {}
    },
    [audio, soundEnabled]
  );

  // Update visible notifications when new notifications arrive - FIXED: No infinite loop
  useEffect(() => {
    const newNotifications = notifications.slice(-maxVisible);
    const currentIds = new Set(newNotifications.map((n: unknown) => n.id));

    // Play sound for truly new notifications (not seen before)
    newNotifications.forEach((notification: unknown) => {
      if (!previousIdsRef.current.has(notification.id)) {
        playNotificationSound(notification.type);
      }
    });

    // Update the ref to track current notification IDs
    previousIdsRef.current = currentIds;

    // Update visible notifications
    setVisibleNotifications(newNotifications);
  }, [notifications, maxVisible, playNotificationSound]); // FIXED: Removed visibleNotifications from deps

  const handleDismiss = useCallback(
    (notificationId: string) => {
      setVisibleNotifications((prev) => prev.filter((n: unknown) => n.id !== notificationId));
      if (onNotificationDismiss) {
        onNotificationDismiss(notificationId);
      }
    },
    [onNotificationDismiss]
  );

  const handleAction = useCallback(
    (notificationId: string, action: string) => {
      if (onNotificationAction) {
        onNotificationAction(notificationId, action);
      }
    },
    [onNotificationAction]
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed right-4 top-4 z-50 space-y-3", className)}>
      {/* Sound toggle */}
      {onSoundToggle && (
        <div className="mb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSoundToggle}
            className={cn(
              "h-8 w-8 rounded-ds-full p-0",
              soundEnabled
                ? "text-semantic-success-dark hover:bg-status-success-light"
                : "text-neutral-400 hover:bg-neutral-50"
            )}
            title={soundEnabled ? "Disable notification sounds" : "Enable notification sounds"}
          >
            {soundEnabled ? <Icon icon={Volume2} className="h-4 w-4" /> : <Icon icon={VolumeX} className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Notifications */}
      <OptimizedAnimatePresence mode="popLayout">
        {visibleNotifications.map((notification: unknown) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={() => handleDismiss(notification.id)}
            onAction={(action) => handleAction(notification.id, action)}
            autoDissmissTime={autoDissmissTime}
          />
        ))}
      </OptimizedAnimatePresence>

      {/* Notification count badge */}
      {notifications.length > maxVisible && (
        <OptimizedMotion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <Badge className="bg-brand-blue-500 px-2 py-1 text-white">+{notifications.length - maxVisible} more</Badge>
        </OptimizedMotion.div>
      )}
    </div>
  );
}
