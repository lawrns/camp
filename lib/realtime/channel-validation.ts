/**
 * CHANNEL EVENT VALIDATION SYSTEM
 * 
 * Type-safe event validation and error handling for all channel communications
 * with proper fallbacks and comprehensive error recovery mechanisms.
 */

import { UNIFIED_CHANNELS, UNIFIED_EVENTS, isValidChannelName, isValidEventName } from './unified-channel-standards';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export interface ChannelEventPayload {
  event: string;
  payload: Record<string, any>;
  timestamp: string;
  source?: 'widget' | 'agent' | 'system' | 'ai';
  organizationId: string;
  conversationId?: string;
  userId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedPayload?: ChannelEventPayload;
}

export interface ChannelValidationConfig {
  strictMode: boolean;
  allowLegacyEvents: boolean;
  sanitizePayloads: boolean;
  logValidationErrors: boolean;
  maxPayloadSize: number;
}

// ============================================================================
// PAYLOAD VALIDATORS
// ============================================================================

/**
 * Message event payload validator
 */
export function validateMessagePayload(payload: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!payload.messageId && !payload.id) {
    errors.push('Message ID is required');
  }
  if (!payload.content && !payload.text) {
    errors.push('Message content is required');
  }
  if (!payload.conversationId) {
    errors.push('Conversation ID is required');
  }
  if (!payload.senderId && !payload.userId) {
    warnings.push('Sender ID is recommended for message tracking');
  }

  // Sanitize payload
  const sanitizedPayload: ChannelEventPayload = {
    event: UNIFIED_EVENTS.MESSAGE_CREATED,
    payload: {
      messageId: payload.messageId || payload.id,
      content: payload.content || payload.text,
      conversationId: payload.conversationId,
      senderId: payload.senderId || payload.userId,
      senderType: payload.senderType || 'user',
      timestamp: payload.timestamp || new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    source: payload.source || 'system',
    organizationId: payload.organizationId,
    conversationId: payload.conversationId,
    userId: payload.senderId || payload.userId,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedPayload: errors.length === 0 ? sanitizedPayload : undefined,
  };
}

/**
 * Typing event payload validator
 */
export function validateTypingPayload(payload: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload.userId) {
    errors.push('User ID is required for typing events');
  }
  if (!payload.conversationId) {
    errors.push('Conversation ID is required for typing events');
  }
  if (typeof payload.isTyping !== 'boolean') {
    warnings.push('isTyping should be a boolean value');
  }

  const sanitizedPayload: ChannelEventPayload = {
    event: payload.isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP,
    payload: {
      userId: payload.userId,
      conversationId: payload.conversationId,
      isTyping: Boolean(payload.isTyping),
      content: payload.content || '',
      timestamp: payload.timestamp || new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    source: payload.source || 'system',
    organizationId: payload.organizationId,
    conversationId: payload.conversationId,
    userId: payload.userId,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedPayload: errors.length === 0 ? sanitizedPayload : undefined,
  };
}

/**
 * Presence event payload validator
 */
export function validatePresencePayload(payload: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload.userId) {
    errors.push('User ID is required for presence events');
  }
  if (!payload.status) {
    errors.push('Status is required for presence events');
  }
  
  const validStatuses = ['online', 'away', 'busy', 'offline'];
  if (payload.status && !validStatuses.includes(payload.status)) {
    errors.push(`Invalid status: ${payload.status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const sanitizedPayload: ChannelEventPayload = {
    event: payload.status === 'online' ? UNIFIED_EVENTS.PRESENCE_JOIN : UNIFIED_EVENTS.PRESENCE_UPDATE,
    payload: {
      userId: payload.userId,
      status: payload.status,
      lastSeen: payload.lastSeen || new Date().toISOString(),
      metadata: payload.metadata || {},
    },
    timestamp: new Date().toISOString(),
    source: payload.source || 'system',
    organizationId: payload.organizationId,
    userId: payload.userId,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedPayload: errors.length === 0 ? sanitizedPayload : undefined,
  };
}

// ============================================================================
// MAIN VALIDATOR
// ============================================================================

export class ChannelEventValidator {
  private config: ChannelValidationConfig;

  constructor(config: Partial<ChannelValidationConfig> = {}) {
    this.config = {
      strictMode: false,
      allowLegacyEvents: true,
      sanitizePayloads: true,
      logValidationErrors: true,
      maxPayloadSize: 1024 * 1024, // 1MB
      ...config,
    };
  }

  /**
   * Validate channel name
   */
  validateChannelName(channelName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!channelName) {
      errors.push('Channel name is required');
    } else if (!isValidChannelName(channelName)) {
      if (this.config.strictMode) {
        errors.push(`Invalid channel name format: ${channelName}`);
      } else {
        warnings.push(`Channel name does not follow unified standards: ${channelName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate event name
   */
  validateEventName(eventName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!eventName) {
      errors.push('Event name is required');
    } else if (!isValidEventName(eventName)) {
      if (this.config.allowLegacyEvents) {
        warnings.push(`Legacy event name detected: ${eventName}`);
      } else {
        errors.push(`Invalid event name: ${eventName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate complete channel event
   */
  validateChannelEvent(channelName: string, eventName: string, payload: any): ValidationResult {
    const channelValidation = this.validateChannelName(channelName);
    const eventValidation = this.validateEventName(eventName);
    
    const errors = [...channelValidation.errors, ...eventValidation.errors];
    const warnings = [...channelValidation.warnings, ...eventValidation.warnings];

    // Validate payload size
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > this.config.maxPayloadSize) {
      errors.push(`Payload size (${payloadSize} bytes) exceeds maximum (${this.config.maxPayloadSize} bytes)`);
    }

    // Validate payload structure based on event type
    let payloadValidation: ValidationResult = { isValid: true, errors: [], warnings: [] };
    
    if (eventName.startsWith('message:')) {
      payloadValidation = validateMessagePayload(payload);
    } else if (eventName.startsWith('typing:')) {
      payloadValidation = validateTypingPayload(payload);
    } else if (eventName.startsWith('presence:')) {
      payloadValidation = validatePresencePayload(payload);
    }

    errors.push(...payloadValidation.errors);
    warnings.push(...payloadValidation.warnings);

    // Log validation errors if enabled
    if (this.config.logValidationErrors && (errors.length > 0 || warnings.length > 0)) {
      console.warn('[ChannelValidation]', {
        channelName,
        eventName,
        errors,
        warnings,
        payload: this.config.sanitizePayloads ? '[SANITIZED]' : payload,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedPayload: payloadValidation.sanitizedPayload,
    };
  }

  /**
   * Sanitize and validate before sending
   */
  validateAndSanitize(channelName: string, eventName: string, payload: any): {
    isValid: boolean;
    sanitizedChannelName?: string;
    sanitizedEventName?: string;
    sanitizedPayload?: any;
    errors: string[];
    warnings: string[];
  } {
    const validation = this.validateChannelEvent(channelName, eventName, payload);
    
    return {
      isValid: validation.isValid,
      sanitizedChannelName: validation.isValid ? channelName : undefined,
      sanitizedEventName: validation.isValid ? eventName : undefined,
      sanitizedPayload: validation.sanitizedPayload?.payload,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Default validator instance
 */
export const defaultValidator = new ChannelEventValidator();

/**
 * Quick validation function
 */
export function validateChannelEvent(channelName: string, eventName: string, payload: any): ValidationResult {
  return defaultValidator.validateChannelEvent(channelName, eventName, payload);
}

/**
 * Safe channel send with validation
 */
export async function safeSendChannelEvent(
  supabase: SupabaseClient,
  channelName: string,
  eventName: string,
  payload: any,
  validator: ChannelEventValidator = defaultValidator
): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
  const validation = validator.validateAndSanitize(channelName, eventName, payload);
  
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  try {
    const channel = supabase.channel(validation.sanitizedChannelName!);
    await channel.send({
      type: 'broadcast',
      event: validation.sanitizedEventName!,
      payload: validation.sanitizedPayload,
    });

    return {
      success: true,
      errors: [],
      warnings: validation.warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to send event: ${error}`],
      warnings: validation.warnings,
    };
  }
}
