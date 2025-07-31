"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
  role?: 'agent' | 'ai' | 'user';
}

interface EnhancedTypingIndicatorProps {
  typingUsers: TypingUser[];
  showAvatars?: boolean;
  showNames?: boolean;
  maxVisibleUsers?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  position?: 'left' | 'right';
}

export function EnhancedTypingIndicator({
  typingUsers,
  showAvatars = true,
  showNames = true,
  maxVisibleUsers = 3,
  className,
  variant = 'default',
  position = 'left',
}: EnhancedTypingIndicatorProps) {
  const [visibleUsers, setVisibleUsers] = useState<TypingUser[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);

  // Update visible users when typing users change
  useEffect(() => {
    if (typingUsers.length <= maxVisibleUsers) {
      setVisibleUsers(typingUsers);
      setHiddenCount(0);
    } else {
      setVisibleUsers(typingUsers.slice(0, maxVisibleUsers));
      setHiddenCount(typingUsers.length - maxVisibleUsers);
    }
  }, [typingUsers, maxVisibleUsers]);

  // Don't render if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Generate typing text
  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    if (variant === 'minimal') {
      return 'typing...';
    }

    if (!showNames) {
      const count = typingUsers.length;
      if (count === 1) return 'Someone is typing...';
      return `${count} people are typing...`;
    }

    const names = visibleUsers.map(user => user.name);
    
    if (typingUsers.length === 1) {
      return `${names[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (hiddenCount === 0) {
      const lastUser = names.pop();
      return `${names.join(', ')} and ${lastUser} are typing...`;
    } else {
      return `${names.join(', ')} and ${hiddenCount} other${hiddenCount > 1 ? 's' : ''} are typing...`;
    }
  };

  // Typing dots animation variants
  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { y: [-2, 0, -2], opacity: [0.4, 1, 0.4] },
  };

  // Container animation
  const containerVariants = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  // Get variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'px-3 py-1.5 text-sm';
      case 'minimal':
        return 'px-2 py-1 text-xs';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`typing-${typingUsers.length}`}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'flex items-center gap-3 max-w-[70%]',
          position === 'right' ? 'flex-row-reverse ml-auto' : 'flex-row',
          className
        )}
      >
        {/* Avatars */}
        {showAvatars && variant !== 'minimal' && (
          <div className="flex -space-x-2">
            {visibleUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.8, x: position === 'right' ? 10 : -10 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  x: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Avatar className={cn(
                  'border-2 border-background',
                  variant === 'compact' ? 'h-6 w-6' : 'h-8 w-8'
                )}>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            
            {/* Hidden users indicator */}
            {hiddenCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex items-center justify-center bg-gray-200 text-gray-600 rounded-full border-2 border-background text-xs font-medium',
                  variant === 'compact' ? 'h-6 w-6' : 'h-8 w-8'
                )}
              >
                +{hiddenCount}
              </motion.div>
            )}
          </div>
        )}

        {/* Typing bubble */}
        <motion.div
          className={cn(
            'bg-gray-100 rounded-2xl flex items-center gap-2',
            getVariantStyles(),
            position === 'right' && 'bg-blue-100'
          )}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          {/* Typing dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={cn(
                  'rounded-full bg-gray-400',
                  variant === 'minimal' ? 'h-1 w-1' : 'h-1.5 w-1.5'
                )}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Typing text */}
          {variant !== 'minimal' && (
            <motion.span
              className="text-gray-600 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getTypingText()}
            </motion.span>
          )}
        </motion.div>

        {/* Role indicators */}
        {showNames && variant === 'default' && (
          <div className="flex flex-col gap-1">
            {visibleUsers.map((user) => (
              user.role && (
                <motion.span
                  key={`${user.id}-role`}
                  initial={{ opacity: 0, x: position === 'right' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded text-white font-medium',
                    user.role === 'ai' && 'bg-purple-500',
                    user.role === 'agent' && 'bg-green-500',
                    user.role === 'user' && 'bg-blue-500'
                  )}
                >
                  {user.role.toUpperCase()}
                </motion.span>
              )
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Simplified typing indicator for basic use cases
export function SimpleTypingIndicator({ 
  isVisible, 
  text = "typing...",
  className 
}: { 
  isVisible: boolean; 
  text?: string;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn('flex items-center gap-2 text-gray-500 text-sm', className)}
        >
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="h-1 w-1 rounded-full bg-gray-400"
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
          <span>{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
