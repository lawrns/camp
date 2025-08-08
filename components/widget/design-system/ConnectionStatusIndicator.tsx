/**
 * CONNECTION STATUS INDICATOR
 * 
 * A comprehensive connection status component that provides
 * real-time feedback about WebSocket connection state with
 * beautiful animations and user-friendly messaging.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionStatusIndicator({
  isConnected,
  isConnecting,
  error,
  onRetry,
  className,
}: ConnectionStatusIndicatorProps) {
  const getStatusConfig = () => {
    if (error) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500',
        message: 'Connection failed',
        showRetry: true,
      };
    }
    
    if (isConnecting) {
      return {
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        dotColor: 'bg-amber-500',
        message: 'Connecting to conversation...',
        showRetry: false,
      };
    }
    
    if (!isConnected) {
      return {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        dotColor: 'bg-gray-400',
        message: 'Disconnected',
        showRetry: true,
      };
    }
    
    return null; // Don't show when connected
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig) {
    // When connected, expose a visible test hook for presence
    return (
      <div className="px-4 py-1 text-center">
        <span data-testid="connection-status-online" className="inline-block text-xs text-green-600">online</span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'border-b px-4 py-2 text-center',
          statusConfig.bgColor,
          statusConfig.borderColor,
          className
        )}
      >
        {/* E2E hooks for connection status */}
        {!isConnected && !isConnecting && !error && (
          <span data-testid="connection-status-offline" className="sr-only">offline</span>
        )}
        {isConnecting && (
          <span data-testid="connection-status-connecting" className="sr-only">connecting</span>
        )}
        <div className="flex items-center justify-center space-x-2">
          <motion.div
            animate={isConnecting ? { scale: [1, 1.2, 1] } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={cn(
              'w-2 h-2 rounded-full',
              statusConfig.dotColor,
              isConnecting && 'animate-pulse'
            )}
          />
          <span className={cn('text-sm font-medium', statusConfig.textColor)}>
            {statusConfig.message}
          </span>
          {statusConfig.showRetry && onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className={cn(
                'ml-2 px-2 py-1 text-xs rounded',
                'bg-white bg-opacity-50 hover:bg-opacity-75',
                'transition-colors duration-200',
                statusConfig.textColor
              )}
            >
              Retry
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}