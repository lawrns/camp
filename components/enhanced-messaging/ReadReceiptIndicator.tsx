"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Checks, Clock, Eye, Warning } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ReadStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ReadReceipt {
  userId: string;
  userName: string;
  userAvatar?: string;
  readAt: string;
  status: ReadStatus;
}

interface ReadReceiptIndicatorProps {
  status: ReadStatus;
  readReceipts?: ReadReceipt[];
  showAvatars?: boolean;
  showTimestamp?: boolean;
  maxAvatars?: number;
  className?: string;
  variant?: 'minimal' | 'detailed' | 'avatars';
}

export function ReadReceiptIndicator({
  status,
  readReceipts = [],
  showAvatars = false,
  showTimestamp = false,
  maxAvatars = 3,
  className,
  variant = 'minimal',
}: ReadReceiptIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (status) {
      case 'sending':
        return {
          icon: Clock,
          color: 'text-gray-400',
          label: 'Sending...',
          animate: true,
        };
      case 'sent':
        return {
          icon: Check,
          color: 'text-gray-400',
          label: 'Sent',
          animate: false,
        };
      case 'delivered':
        return {
          icon: Check,
          color: 'text-gray-500',
          label: 'Delivered',
          animate: false,
        };
      case 'read':
        return {
          icon: Checks,
          color: 'text-blue-500',
          label: readReceipts.length > 0 
            ? `Read by ${readReceipts.length} user${readReceipts.length > 1 ? 's' : ''}`
            : 'Read',
          animate: false,
        };
      case 'failed':
        return {
          icon: Warning,
          color: 'text-red-500',
          label: 'Failed to send',
          animate: false,
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();
  if (!statusDisplay) return null;

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Get the most recent read receipt for timestamp
  const latestReceipt = readReceipts.length > 0 
    ? readReceipts.reduce((latest, current) => 
        new Date(current.readAt) > new Date(latest.readAt) ? current : latest
      )
    : null;

  const StatusIcon = statusDisplay.icon;

  // Minimal variant - just the icon
  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
              className={cn('flex items-center', className)}
            >
              <motion.div
                animate={statusDisplay.animate ? { rotate: 360 } : {}}
                transition={statusDisplay.animate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <StatusIcon className={cn('h-3 w-3', statusDisplay.color)} />
              </motion.div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">{statusDisplay.label}</div>
              {showTimestamp && latestReceipt && (
                <div className="text-xs opacity-75">
                  {formatTimestamp(latestReceipt.readAt)}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Avatars variant - show user avatars who have read
  if (variant === 'avatars' && status === 'read' && readReceipts.length > 0) {
    const visibleReceipts = readReceipts.slice(0, maxAvatars);
    const hiddenCount = readReceipts.length - maxAvatars;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 10 }}
              className={cn('flex items-center gap-1', className)}
            >
              <div className="flex -space-x-1">
                <AnimatePresence>
                  {visibleReceipts.map((receipt, index) => (
                    <motion.div
                      key={receipt.userId}
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Avatar className="h-4 w-4 border border-background">
                        <AvatarImage src={receipt.userAvatar} alt={receipt.userName} />
                        <AvatarFallback className="text-xs">
                          {receipt.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {hiddenCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-4 w-4 bg-gray-200 rounded-full border border-background flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-gray-600">
                      +{hiddenCount}
                    </span>
                  </motion.div>
                )}
              </div>
              
              <StatusIcon className={cn('h-3 w-3', statusDisplay.color)} />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-48">
              <div className="font-medium mb-1">{statusDisplay.label}</div>
              <div className="space-y-1">
                {readReceipts.map((receipt) => (
                  <div key={receipt.userId} className="flex items-center gap-2 text-xs">
                    <Avatar className="h-3 w-3">
                      <AvatarImage src={receipt.userAvatar} alt={receipt.userName} />
                      <AvatarFallback className="text-xs">
                        {receipt.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{receipt.userName}</span>
                    <span className="opacity-75">
                      {formatTimestamp(receipt.readAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant - show full information
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 10 }}
      className={cn('flex items-center gap-1 text-xs', className)}
    >
      <motion.div
        animate={statusDisplay.animate ? { rotate: 360 } : {}}
        transition={statusDisplay.animate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
      >
        <StatusIcon className={cn('h-3 w-3', statusDisplay.color)} />
      </motion.div>
      
      <span className={cn('font-medium', statusDisplay.color)}>
        {statusDisplay.label}
      </span>
      
      {showTimestamp && latestReceipt && (
        <span className="opacity-75">
          {formatTimestamp(latestReceipt.readAt)}
        </span>
      )}
      
      {status === 'read' && readReceipts.length > 0 && showAvatars && (
        <div className="flex -space-x-1 ml-1">
          {readReceipts.slice(0, 2).map((receipt) => (
            <Avatar key={receipt.userId} className="h-3 w-3 border border-background">
              <AvatarImage src={receipt.userAvatar} alt={receipt.userName} />
              <AvatarFallback className="text-xs">
                {receipt.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {readReceipts.length > 2 && (
            <div className="h-3 w-3 bg-gray-200 rounded-full border border-background flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{readReceipts.length - 2}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Simple status indicator for basic use cases
export function SimpleStatusIndicator({ 
  status, 
  className 
}: { 
  status: ReadStatus; 
  className?: string; 
}) {
  return (
    <ReadReceiptIndicator
      status={status}
      variant="minimal"
      className={className}
    />
  );
}
