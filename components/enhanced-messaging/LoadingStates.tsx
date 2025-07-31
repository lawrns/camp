"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Spinner, ChatCircle, Warning, Wifi } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Message skeleton loader
export function MessageSkeleton({ 
  isOwn = false, 
  showAvatar = true,
  className 
}: { 
  isOwn?: boolean; 
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex gap-3 px-4 py-2',
      isOwn ? 'flex-row-reverse' : 'flex-row',
      className
    )}>
      {/* Avatar skeleton */}
      {showAvatar && !isOwn && (
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
      )}

      {/* Message content skeleton */}
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name skeleton */}
        {!isOwn && (
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1" />
        )}

        {/* Message bubble skeleton */}
        <div className={cn(
          'rounded-2xl px-4 py-2 animate-pulse',
          isOwn ? 'bg-blue-100' : 'bg-gray-200'
        )}>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-300 rounded" />
            <div className="h-4 w-24 bg-gray-300 rounded" />
          </div>
        </div>

        {/* Timestamp skeleton */}
        <div className="h-2 w-12 bg-gray-200 rounded animate-pulse mt-1" />
      </div>
    </div>
  );
}

// Multiple message skeletons
export function MessageListSkeleton({ 
  count = 5,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton
          key={index}
          isOwn={Math.random() > 0.5}
          showAvatar={true}
        />
      ))}
    </div>
  );
}

// Typing indicator skeleton
export function TypingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-2', className)}>
      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
      <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-gray-400"
            animate={{ y: [-2, 0, -2], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Composer loading state
export function ComposerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'border rounded-lg p-3 bg-gray-50 animate-pulse',
      className
    )}>
      <div className="flex items-end gap-2">
        <div className="h-6 w-6 bg-gray-200 rounded" />
        <div className="h-6 w-6 bg-gray-200 rounded" />
        <div className="flex-1 h-10 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// Connection loading state
export function ConnectionLoader({ 
  status = 'connecting',
  message,
  onRetry,
  className 
}: { 
  status?: 'connecting' | 'reconnecting' | 'failed';
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: Wifi,
          title: 'Connecting...',
          message: message || 'Establishing connection to chat server',
          showRetry: false,
          color: 'text-blue-600',
        };
      case 'reconnecting':
        return {
          icon: Wifi,
          title: 'Reconnecting...',
          message: message || 'Connection lost, attempting to reconnect',
          showRetry: true,
          color: 'text-yellow-600',
        };
      case 'failed':
        return {
          icon: Warning,
          title: 'Connection Failed',
          message: message || 'Unable to connect to chat server',
          showRetry: true,
          color: 'text-red-600',
        };
      default:
        return {
          icon: Spinner,
          title: 'Loading...',
          message: message || 'Please wait',
          showRetry: false,
          color: 'text-gray-600',
        };
    }
  };

  const display = getStatusDisplay();
  const StatusIcon = display.icon;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <motion.div
        animate={{ rotate: status === 'connecting' ? 360 : 0 }}
        transition={{ 
          duration: 2, 
          repeat: status === 'connecting' ? Infinity : 0, 
          ease: "linear" 
        }}
        className="mb-4"
      >
        <StatusIcon className={cn('h-12 w-12', display.color)} />
      </motion.div>
      
      <h3 className={cn('text-lg font-semibold mb-2', display.color)}>
        {display.title}
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-sm">
        {display.message}
      </p>

      {display.showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}

// Empty state component
export function EmptyState({
  icon: Icon = ChatCircle,
  title = "No messages yet",
  description = "Start the conversation by sending a message",
  action,
  actionLabel = "Send Message",
  className
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="mb-4 p-4 bg-gray-100 rounded-full">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        {description}
      </p>

      {action && (
        <Button onClick={action} size="sm">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

// Error boundary component
export function ErrorState({
  error,
  onRetry,
  onReport,
  className
}: {
  error: Error | string;
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}) {
  const errorMessage = error instanceof Error ? error.message : error;
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('connection');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-200 rounded-lg',
        className
      )}
    >
      <div className="mb-4 p-4 bg-red-100 rounded-full">
        <Warning className="h-12 w-12 text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        {isNetworkError ? 'Connection Error' : 'Something went wrong'}
      </h3>
      
      <p className="text-red-700 mb-6 max-w-sm">
        {isNetworkError 
          ? 'Please check your internet connection and try again.'
          : errorMessage
        }
      </p>

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        )}
        
        {onReport && (
          <Button onClick={onReport} variant="ghost" size="sm">
            Report Issue
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Loading overlay for actions
export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  className
}: {
  isVisible: boolean;
  message?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-lg shadow-lg border">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Spinner className="h-8 w-8 text-blue-600" />
        </motion.div>
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </motion.div>
  );
}

// Progress indicator for file uploads
export function UploadProgress({
  progress,
  fileName,
  onCancel,
  className
}: {
  progress: number;
  fileName: string;
  onCancel?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-blue-50 border border-blue-200 rounded-lg p-3',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-900 truncate">
          {fileName}
        </span>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            ×
          </Button>
        )}
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <div className="text-xs text-blue-700 mt-1">
        {Math.round(progress)}% uploaded
      </div>
    </motion.div>
  );
}
