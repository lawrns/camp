import { useState, useEffect, useCallback } from 'react';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface UseTypingIndicatorProps {
  conversationId?: string;
  organizationId?: string;
  onTypingUpdate?: (users: TypingUser[]) => void;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
  sendTypingIndicator: (isTyping: boolean) => void;
}

export const useTypingIndicator = ({
  conversationId,
  organizationId,
  onTypingUpdate,
}: UseTypingIndicatorProps = {}): UseTypingIndicatorReturn => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const updateTypingUsers = useCallback((users: TypingUser[]) => {
    setTypingUsers(users);
    onTypingUpdate?.(users);
  }, [onTypingUpdate]);

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
  }, [isTyping]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  }, [isTyping]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    if (!conversationId || !organizationId) return;

    // Simulate sending typing indicator
    console.log(`Sending typing indicator: ${typing} for conversation ${conversationId}`);
    
    // In a real implementation, this would send to your realtime service
    // For now, we'll just manage local state
  }, [conversationId, organizationId]);

  const handleTypingTimeout = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  useEffect(() => {
    // Clean up timeout on unmount
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Simulate receiving typing indicators from other users
  useEffect(() => {
    if (!conversationId) return;

    // In a real implementation, you'd listen for typing events
    // For now, we'll just return empty arrays
    const interval = setInterval(() => {
      // Clean up old typing indicators (older than 3 seconds)
      const now = Date.now();
      setTypingUsers(prev => prev.filter(user => now - user.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, [conversationId]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
    sendTypingIndicator,
  };
};