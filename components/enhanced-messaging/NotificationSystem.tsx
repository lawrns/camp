"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellSlash, MessageCircle, User, AlertTriangle, CheckCircle, Info, ArrowRight } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type NotificationType = 'message' | 'mention' | 'reaction' | 'system' | 'error' | 'success' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
  actionLabel?: string;
  autoHide?: boolean;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
}

interface NotificationSystemProps {
  notifications: Notification[];
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  className?: string;
}

export function NotificationSystem({
  notifications,
  maxVisible = 5,
  position = 'top-right',
  enableSound = true,
  enableBrowserNotifications = false,
  onNotificationClick,
  onNotificationDismiss,
  onMarkAsRead,
  className,
}: NotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  // Request browser notification permission
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          setHasPermission(permission === 'granted');
        });
      }
    }
  }, [enableBrowserNotifications]);

  // Update visible notifications
  useEffect(() => {
    const unreadNotifications = notifications
      .filter(n => !n.read)
      .slice(0, maxVisible)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setVisibleNotifications(unreadNotifications);
  }, [notifications, maxVisible]);

  // Handle new notifications
  useEffect(() => {
    const newNotifications = visibleNotifications.filter(n => {
      const isNew = !notifications.some(existing => 
        existing.id === n.id && existing.read === n.read
      );
      return isNew;
    });

    newNotifications.forEach(notification => {
      // Play sound
      if (enableSound) {
        playNotificationSound(notification.type);
      }

      // Show browser notification
      if (enableBrowserNotifications && hasPermission) {
        showBrowserNotification(notification);
      }

      // Auto-hide notification
      if (notification.autoHide !== false) {
        const duration = notification.duration || getDefaultDuration(notification.type);
        setTimeout(() => {
          handleDismiss(notification.id);
        }, duration);
      }
    });
  }, [visibleNotifications, enableSound, enableBrowserNotifications, hasPermission]);

  // Play notification sound
  const playNotificationSound = (type: NotificationType) => {
    try {
      const audio = new Audio();
      switch (type) {
        case 'message':
          audio.src = '/sounds/message.mp3';
          break;
        case 'mention':
          audio.src = '/sounds/mention.mp3';
          break;
        case 'error':
          audio.src = '/sounds/error.mp3';
          break;
        default:
          audio.src = '/sounds/notification.mp3';
      }
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.avatar || '/icons/notification.png',
        tag: notification.id,
        requireInteraction: notification.type === 'error',
      });

      browserNotification.onclick = () => {
        window.focus();
        onNotificationClick?.(notification);
        browserNotification.close();
      };
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
    }
  };

  // Get default duration based on type
  const getDefaultDuration = (type: NotificationType): number => {
    switch (type) {
      case 'error':
        return 10000; // 10 seconds
      case 'success':
        return 3000; // 3 seconds
      case 'message':
      case 'mention':
        return 5000; // 5 seconds
      default:
        return 4000; // 4 seconds
    }
  };

  // Handle notification click
  const handleClick = useCallback((notification: Notification) => {
    onMarkAsRead?.(notification.id);
    onNotificationClick?.(notification);
  }, [onMarkAsRead, onNotificationClick]);

  // Handle notification dismiss
  const handleDismiss = useCallback((notificationId: string) => {
    onNotificationDismiss?.(notificationId);
  }, [onNotificationDismiss]);

  // Get notification icon and colors
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return {
          icon: MessageCircle,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
        };
      case 'mention':
        return {
          icon: User,
          bgColor: 'bg-purple-50 border-purple-200',
          iconColor: 'text-purple-600',
          titleColor: 'text-purple-900',
        };
      case 'reaction':
        return {
          icon: MessageCircle,
          bgColor: 'bg-pink-50 border-pink-200',
          iconColor: 'text-pink-600',
          titleColor: 'text-pink-900',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
        };
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
        };
      default:
        return {
          icon: Bell,
          bgColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
        };
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={cn(
      'fixed z-50 flex flex-col gap-2 max-w-sm w-full',
      getPositionClasses(),
      className
    )}>
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => {
          const style = getNotificationStyle(notification.type);
          const NotificationIcon = style.icon;

          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                'bg-background border rounded-lg shadow-lg p-4 cursor-pointer',
                'hover:shadow-xl transition-shadow',
                style.bgColor
              )}
              onClick={() => handleClick(notification)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                {/* Icon or Avatar */}
                <div className="flex-shrink-0">
                  {notification.avatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.avatar} alt="Notification" />
                      <AvatarFallback>
                        <NotificationIcon className={cn('h-4 w-4', style.iconColor)} />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={cn('p-2 rounded-lg', style.bgColor)}>
                      <NotificationIcon className={cn('h-4 w-4', style.iconColor)} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn('font-semibold text-sm truncate', style.titleColor)}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Action Button */}
                  {notification.actionLabel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClick(notification);
                      }}
                    >
                      {notification.actionLabel}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Notification hook for easy usage
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll,
  };
}
