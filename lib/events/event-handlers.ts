/**
 * Event Handling Standards
 * Follows GUIDE.md specifications for debounced operations and rate limiting
 */

import { debounce } from 'lodash';
import { EVENT_TYPES } from '../realtime/channel-conventions';

// ============================================================================
// CONSTANTS
// ============================================================================

export const TYPING_DEBOUNCE_MS = 300;
export const TYPING_TIMEOUT_MS = 3000;
export const READ_RECEIPT_BATCH_MS = 1000;
export const MESSAGE_RATE_LIMIT = {
  maxMessages: 10,
  windowMs: 60000 // 1 minute
};

// ============================================================================
// TYPING INDICATOR HANDLERS
// ============================================================================

/**
 * Debounced typing start handler
 */
export const createTypingStartHandler = (
  supabase: any,
  channelName: string,
  userId: string,
  userName: string
) => {
  return debounce(async () => {
    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: EVENT_TYPES.TYPING_START,
        payload: {
          userId,
          userName,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[Typing Start] Failed to send typing indicator:', error);
    }
  }, TYPING_DEBOUNCE_MS);
};

/**
 * Typing stop handler
 */
export const createTypingStopHandler = (
  supabase: any,
  channelName: string,
  userId: string
) => {
  return async () => {
    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: EVENT_TYPES.TYPING_STOP,
        payload: {
          userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[Typing Stop] Failed to send typing stop:', error);
    }
  };
};

/**
 * Auto-stop typing indicator after timeout
 */
export const createTypingTimeoutHandler = (
  stopHandler: () => Promise<void>
) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(stopHandler, TYPING_TIMEOUT_MS);
  };
};

// ============================================================================
// READ RECEIPT HANDLERS
// ============================================================================

/**
 * Batched read receipt handler
 */
export const createReadReceiptHandler = (
  supabase: any,
  channelName: string,
  userId: string
) => {
  let pendingReceipts: string[] = [];
  let batchTimeout: NodeJS.Timeout;

  const sendBatch = async () => {
    if (pendingReceipts.length === 0) return;

    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'read_receipt.batch',
        payload: {
          userId,
          messageIds: pendingReceipts,
          timestamp: new Date().toISOString()
        }
      });
      pendingReceipts = [];
    } catch (error) {
      console.error('[Read Receipt] Failed to send batch:', error);
    }
  };

  return (messageId: string) => {
    pendingReceipts.push(messageId);
    
    clearTimeout(batchTimeout);
    batchTimeout = setTimeout(sendBatch, READ_RECEIPT_BATCH_MS);
  };
};

// ============================================================================
// MESSAGE RATE LIMITING
// ============================================================================

export class MessageRateLimiter {
  private messageCount = 0;
  private windowStart = Date.now();

  constructor(
    private maxMessages: number = MESSAGE_RATE_LIMIT.maxMessages,
    private windowMs: number = MESSAGE_RATE_LIMIT.windowMs
  ) {}

  /**
   * Check if message can be sent
   */
  canSendMessage(): boolean {
    const now = Date.now();
    
    // Reset window if expired
    if (now - this.windowStart > this.windowMs) {
      this.messageCount = 0;
      this.windowStart = now;
    }

    return this.messageCount < this.maxMessages;
  }

  /**
   * Record a sent message
   */
  recordMessage(): void {
    this.messageCount++;
  }

  /**
   * Get time until next message can be sent
   */
  getTimeUntilNext(): number {
    const now = Date.now();
    const timeInWindow = now - this.windowStart;
    const timeRemaining = this.windowMs - timeInWindow;
    
    return Math.max(0, timeRemaining);
  }

  /**
   * Get remaining messages in current window
   */
  getRemainingMessages(): number {
    const now = Date.now();
    
    if (now - this.windowStart > this.windowMs) {
      return this.maxMessages;
    }

    return Math.max(0, this.maxMessages - this.messageCount);
  }
}

// ============================================================================
// MESSAGE SENDING HANDLERS
// ============================================================================

/**
 * Create message sending handler with rate limiting
 */
export const createMessageSender = (
  supabase: any,
  channelName: string,
  organizationId: string,
  conversationId: string,
  userId: string
) => {
  const rateLimiter = new MessageRateLimiter();

  return async (content: string, metadata?: Record<string, any>) => {
    if (!rateLimiter.canSendMessage()) {
      const timeUntilNext = rateLimiter.getTimeUntilNext();
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilNext / 1000)} seconds.`);
    }

    try {
      // Create message in database
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversationId,
          organizationId,
          content,
          senderType: 'customer',
          metadata: { 
            widgetVersion: '3.0',
            ...metadata 
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast via realtime
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: EVENT_TYPES.MESSAGE_CREATED,
        payload: message
      });

      rateLimiter.recordMessage();
      return message;

    } catch (error) {
      console.error('[Message Sender] Failed to send message:', error);
      throw error;
    }
  };
};

// ============================================================================
// EVENT SUBSCRIPTION HANDLERS
// ============================================================================

/**
 * Create message received handler
 */
export const createMessageReceivedHandler = (
  onMessage: (message: any) => void,
  onError?: (error: Error) => void
) => {
  return (payload: any) => {
    try {
      onMessage(payload);
    } catch (error) {
      console.error('[Message Received] Handler error:', error);
      onError?.(error as Error);
    }
  };
};

/**
 * Create typing indicator handler
 */
export const createTypingIndicatorHandler = (
  onTypingStart: (user: { id: string; name: string }) => void,
  onTypingStop: (userId: string) => void
) => {
  const typingUsers = new Map<string, NodeJS.Timeout>();

  return (payload: any) => {
    const { event, payload: data } = payload;

    if (event === EVENT_TYPES.TYPING_START) {
      const { userId, userName } = data;
      
      // Clear existing timeout
      if (typingUsers.has(userId)) {
        clearTimeout(typingUsers.get(userId)!);
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        onTypingStop(userId);
        typingUsers.delete(userId);
      }, TYPING_TIMEOUT_MS);

      typingUsers.set(userId, timeoutId);
      onTypingStart({ id: userId, name: userName });

    } else if (event === EVENT_TYPES.TYPING_STOP) {
      const { userId } = data;
      
      if (typingUsers.has(userId)) {
        clearTimeout(typingUsers.get(userId)!);
        typingUsers.delete(userId);
      }
      
      onTypingStop(userId);
    }
  };
};

// ============================================================================
// CONVERSATION EVENT HANDLERS
// ============================================================================

/**
 * Create conversation update handler
 */
export const createConversationUpdateHandler = (
  onConversationUpdate: (conversation: any) => void
) => {
  return (payload: any) => {
    try {
      onConversationUpdate(payload);
    } catch (error) {
      console.error('[Conversation Update] Handler error:', error);
    }
  };
};

/**
 * Create assignment handler
 */
export const createAssignmentHandler = (
  onAssignment: (assignment: any) => void
) => {
  return (payload: any) => {
    try {
      onAssignment(payload);
    } catch (error) {
      console.error('[Assignment] Handler error:', error);
    }
  };
};

// ============================================================================
// AI HANDOVER HANDLERS
// ============================================================================

/**
 * Create AI handover handler
 */
export const createAIHandoverHandler = (
  onHandoverRequested: (data: any) => void,
  onHandoverCompleted: (data: any) => void,
  onConfidenceUpdate: (data: any) => void
) => {
  return (payload: any) => {
    const { event, payload: data } = payload;

    try {
      switch (event) {
        case EVENT_TYPES.AI_HANDOVER_REQUESTED:
          onHandoverRequested(data);
          break;
        case EVENT_TYPES.AI_HANDOVER_COMPLETED:
          onHandoverCompleted(data);
          break;
        case EVENT_TYPES.AI_CONFIDENCE_UPDATE:
          onConfidenceUpdate(data);
          break;
      }
    } catch (error) {
      console.error('[AI Handover] Handler error:', error);
    }
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create event handler with error boundary
 */
export const createSafeEventHandler = <T>(
  handler: (data: T) => void,
  context: string = 'Event Handler'
) => {
  return (data: T) => {
    try {
      handler(data);
    } catch (error) {
      console.error(`[${context}] Error:`, error);
    }
  };
};

/**
 * Create debounced event handler
 */
export const createDebouncedEventHandler = <T>(
  handler: (data: T) => void,
  delay: number = 300,
  context: string = 'Debounced Event Handler'
) => {
  return debounce(
    createSafeEventHandler(handler, context),
    delay
  );
};

/**
 * Create throttled event handler
 */
export const createThrottledEventHandler = <T>(
  handler: (data: T) => void,
  delay: number = 1000,
  context: string = 'Throttled Event Handler'
) => {
  let lastCall = 0;
  
  return (data: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      createSafeEventHandler(handler, context)(data);
    }
  };
}; 