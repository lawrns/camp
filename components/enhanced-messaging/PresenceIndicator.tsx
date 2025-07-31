"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Wifi, WifiSlash, Warning } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  status: PresenceStatus;
  lastSeen?: string;
  isTyping?: boolean;
}

interface PresenceIndicatorProps {
  user: PresenceUser;
  showAvatar?: boolean;
  showName?: boolean;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'dot' | 'badge' | 'full';
}

export function PresenceIndicator({
  user,
  showAvatar = false,
  showName = false,
  showLastSeen = false,
  size = 'md',
  className,
  variant = 'dot',
}: PresenceIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Get status color and label
  const getStatusDisplay = () => {
    switch (user.status) {
      case 'online':
        return {
          color: 'bg-green-500',
          label: 'Online',
          pulse: true,
        };
      case 'away':
        return {
          color: 'bg-yellow-500',
          label: 'Away',
          pulse: false,
        };
      case 'busy':
        return {
          color: 'bg-red-500',
          label: 'Busy',
          pulse: false,
        };
      case 'offline':
        return {
          color: 'bg-gray-400',
          label: 'Offline',
          pulse: false,
        };
      default:
        return {
          color: 'bg-gray-400',
          label: 'Unknown',
          pulse: false,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          dot: 'h-2 w-2',
          avatar: 'h-6 w-6',
          text: 'text-xs',
        };
      case 'lg':
        return {
          dot: 'h-4 w-4',
          avatar: 'h-10 w-10',
          text: 'text-sm',
        };
      default:
        return {
          dot: 'h-3 w-3',
          avatar: 'h-8 w-8',
          text: 'text-sm',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Format last seen
  const formatLastSeen = () => {
    if (!user.lastSeen || user.status === 'online') return null;
    
    try {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch {
      return null;
    }
  };

  const lastSeenText = formatLastSeen();

  // Dot variant - just the status dot
  if (variant === 'dot') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
              className={cn('relative', className)}
            >
              <motion.div
                className={cn(
                  'rounded-full border-2 border-background',
                  statusDisplay.color,
                  sizeClasses.dot
                )}
                animate={statusDisplay.pulse ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                } : {}}
                transition={statusDisplay.pulse ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              />
              
              {user.isTyping && (
                <motion.div
                  className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs opacity-75">
                {statusDisplay.label}
                {user.isTyping && ' • Typing...'}
              </div>
              {lastSeenText && (
                <div className="text-xs opacity-60">Last seen {lastSeenText}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant - status with optional avatar
  if (variant === 'badge') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -10 }}
        className={cn('flex items-center gap-2', className)}
      >
        {showAvatar && (
          <div className="relative">
            <Avatar className={sizeClasses.avatar}>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className={sizeClasses.text}>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <motion.div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
                statusDisplay.color,
                sizeClasses.dot
              )}
              animate={statusDisplay.pulse ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1],
              } : {}}
              transition={statusDisplay.pulse ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {!showAvatar && (
            <motion.div
              className={cn(
                'rounded-full',
                statusDisplay.color,
                sizeClasses.dot
              )}
              animate={statusDisplay.pulse ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1],
              } : {}}
              transition={statusDisplay.pulse ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            />
          )}
          
          <span className={cn('font-medium text-gray-700', sizeClasses.text)}>
            {statusDisplay.label}
          </span>
          
          {user.isTyping && (
            <motion.span
              className={cn('text-blue-600 font-medium', sizeClasses.text)}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Typing...
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  }

  // Full variant - complete presence information
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
      className={cn('flex items-center gap-3 p-2 rounded-lg', className)}
    >
      <div className="relative">
        <Avatar className={sizeClasses.avatar}>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className={sizeClasses.text}>
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <motion.div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
            statusDisplay.color,
            sizeClasses.dot
          )}
          animate={statusDisplay.pulse ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          } : {}}
          transition={statusDisplay.pulse ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        {showName && (
          <div className={cn('font-medium text-gray-900 truncate', sizeClasses.text)}>
            {user.name}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className={cn('text-gray-600', sizeClasses.text)}>
            {statusDisplay.label}
          </span>
          
          {user.isTyping && (
            <motion.span
              className={cn('text-blue-600 font-medium', sizeClasses.text)}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Typing...
            </motion.span>
          )}
        </div>
        
        {showLastSeen && lastSeenText && (
          <div className={cn('text-gray-400', sizeClasses.text)}>
            Last seen {lastSeenText}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Connection status indicator
interface ConnectionStatusProps {
  status: ConnectionStatus;
  className?: string;
  showText?: boolean;
}

export function ConnectionStatusIndicator({
  status,
  className,
  showText = false,
}: ConnectionStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-500',
          label: 'Connected',
          animate: false,
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          label: 'Connecting...',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: WifiSlash,
          color: 'text-gray-400',
          label: 'Disconnected',
          animate: false,
        };
      case 'error':
        return {
          icon: Warning,
          color: 'text-red-500',
          label: 'Connection Error',
          animate: false,
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();
  if (!statusDisplay) return null;

  const StatusIcon = statusDisplay.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        animate={statusDisplay.animate ? { opacity: [1, 0.5, 1] } : {}}
        transition={statusDisplay.animate ? { duration: 1, repeat: Infinity } : {}}
      >
        <StatusIcon className={cn('h-4 w-4', statusDisplay.color)} />
      </motion.div>
      
      {showText && (
        <span className={cn('text-sm font-medium', statusDisplay.color)}>
          {statusDisplay.label}
        </span>
      )}
    </div>
  );
}
