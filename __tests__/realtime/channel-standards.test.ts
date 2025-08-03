/**
 * COMPREHENSIVE CHANNEL STANDARDS TEST SUITE
 * 
 * Tests for unified channel naming conventions, bidirectional communication,
 * event validation, and monitoring systems.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  UNIFIED_CHANNELS, 
  UNIFIED_EVENTS, 
  isValidChannelName, 
  isValidEventName,
  extractOrgId,
  extractResourceType,
  extractResourceId
} from '../../lib/realtime/unified-channel-standards';
// Note: ChannelTestRunner, runQuickChannelTest, testChannelFunction imports removed as they're not used in current tests
import { 
  ChannelEventValidator,
  validateMessagePayload,
  validateTypingPayload,
  validatePresencePayload
} from '../../lib/realtime/channel-validation';
import { 
  ChannelMonitor
} from '../../lib/realtime/channel-monitoring';

// Note: mockSupabaseClient removed as it's not used in current tests

describe('Unified Channel Standards', () => {
  describe('Channel Naming Conventions', () => {
    const orgId = 'test-org-123';
    const convId = 'conv-456';
    const userId = 'user-789';

    it('should generate valid organization channel names', () => {
      const channelName = UNIFIED_CHANNELS.organization(orgId);
      expect(channelName).toBe(`org:${orgId}`);
      expect(isValidChannelName(channelName)).toBe(true);
    });

    it('should generate valid conversation channel names', () => {
      const channelName = UNIFIED_CHANNELS.conversation(orgId, convId);
      expect(channelName).toBe(`org:${orgId}:conv:${convId}`);
      expect(isValidChannelName(channelName)).toBe(true);
    });

    it('should generate valid typing indicator channel names', () => {
      const channelName = UNIFIED_CHANNELS.conversationTyping(orgId, convId);
      expect(channelName).toBe(`org:${orgId}:conv:${convId}:typing`);
      expect(isValidChannelName(channelName)).toBe(true);
    });

    it('should generate valid user notification channel names', () => {
      const channelName = UNIFIED_CHANNELS.userNotifications(orgId, userId);
      expect(channelName).toBe(`org:${orgId}:user:${userId}:notifications`);
      expect(isValidChannelName(channelName)).toBe(true);
    });

    it('should generate valid widget channel names', () => {
      const channelName = UNIFIED_CHANNELS.widget(orgId, convId);
      expect(channelName).toBe(`org:${orgId}:widget:${convId}`);
      expect(isValidChannelName(channelName)).toBe(true);
    });

    it('should generate valid system channel names', () => {
      const channelName = UNIFIED_CHANNELS.system();
      expect(channelName).toBe('system:announcements');
      expect(isValidChannelName(channelName)).toBe(true);
    });

    it('should reject invalid channel names', () => {
      const invalidChannels = [
        'invalid-format',
        'org:',
        'org:abc:invalid:too:many:parts:here',
        'wrong:format:entirely',
        '',
      ];

      invalidChannels.forEach(channel => {
        expect(isValidChannelName(channel)).toBe(false);
      });
    });

    it('should extract organization ID correctly', () => {
      const channelName = UNIFIED_CHANNELS.conversation(orgId, convId);
      expect(extractOrgId(channelName)).toBe(orgId);
      expect(extractOrgId('invalid-channel')).toBeNull();
    });

    it('should extract resource type correctly', () => {
      const channelName = UNIFIED_CHANNELS.conversation(orgId, convId);
      expect(extractResourceType(channelName)).toBe('conv');
      
      const userChannel = UNIFIED_CHANNELS.user(orgId, userId);
      expect(extractResourceType(userChannel)).toBe('user');
    });

    it('should extract resource ID correctly', () => {
      const channelName = UNIFIED_CHANNELS.conversation(orgId, convId);
      expect(extractResourceId(channelName)).toBe(convId);
    });
  });

  describe('Event Naming Standards', () => {
    it('should validate standard event names', () => {
      const validEvents = [
        UNIFIED_EVENTS.MESSAGE_CREATED,
        UNIFIED_EVENTS.TYPING_START,
        UNIFIED_EVENTS.PRESENCE_JOIN,
        UNIFIED_EVENTS.CONVERSATION_ASSIGNED,
        UNIFIED_EVENTS.AI_HANDOVER_REQUESTED,
      ];

      validEvents.forEach(event => {
        expect(isValidEventName(event)).toBe(true);
      });
    });

    it('should reject invalid event names', () => {
      const invalidEvents = [
        'invalid_event',
        'wrong-format',
        'too:many:colons:here',
        '',
        'random-string',
      ];

      invalidEvents.forEach(event => {
        expect(isValidEventName(event)).toBe(false);
      });
    });

    it('should follow consistent naming patterns', () => {
      // All message events should start with "message:"
      expect(UNIFIED_EVENTS.MESSAGE_CREATED).toMatch(/^message:/);
      expect(UNIFIED_EVENTS.MESSAGE_UPDATED).toMatch(/^message:/);
      expect(UNIFIED_EVENTS.MESSAGE_DELETED).toMatch(/^message:/);

      // All typing events should start with "typing:"
      expect(UNIFIED_EVENTS.TYPING_START).toMatch(/^typing:/);
      expect(UNIFIED_EVENTS.TYPING_STOP).toMatch(/^typing:/);

      // All presence events should start with "presence:"
      expect(UNIFIED_EVENTS.PRESENCE_JOIN).toMatch(/^presence:/);
      expect(UNIFIED_EVENTS.PRESENCE_LEAVE).toMatch(/^presence:/);
    });
  });
});

describe('Channel Event Validation', () => {
  let validator: ChannelEventValidator;

  beforeEach(() => {
    validator = new ChannelEventValidator({
      strictMode: true,
      allowLegacyEvents: false,
      sanitizePayloads: true,
      logValidationErrors: false,
    });
  });

  describe('Message Payload Validation', () => {
    it('should validate valid message payload', () => {
      const payload = {
        messageId: 'msg-123',
        content: 'Hello world',
        conversationId: 'conv-456',
        senderId: 'user-789',
        timestamp: new Date().toISOString(),
      };

      const result = validateMessagePayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedPayload).toBeDefined();
    });

    it('should reject message payload missing required fields', () => {
      const payload = {
        content: 'Hello world',
        // Missing messageId and conversationId
      };

      const result = validateMessagePayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message ID is required');
      expect(result.errors).toContain('Conversation ID is required');
    });

    it('should sanitize message payload', () => {
      const payload = {
        id: 'msg-123', // Alternative field name
        text: 'Hello world', // Alternative field name
        conversationId: 'conv-456',
        userId: 'user-789', // Alternative field name
      };

      const result = validateMessagePayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPayload?.payload.messageId).toBe('msg-123');
      expect(result.sanitizedPayload?.payload.content).toBe('Hello world');
      expect(result.sanitizedPayload?.payload.senderId).toBe('user-789');
    });
  });

  describe('Typing Payload Validation', () => {
    it('should validate valid typing payload', () => {
      const payload = {
        userId: 'user-123',
        conversationId: 'conv-456',
        isTyping: true,
        timestamp: new Date().toISOString(),
      };

      const result = validateTypingPayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedPayload?.event).toBe(UNIFIED_EVENTS.TYPING_START);
    });

    it('should handle typing stop events', () => {
      const payload = {
        userId: 'user-123',
        conversationId: 'conv-456',
        isTyping: false,
      };

      const result = validateTypingPayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPayload?.event).toBe(UNIFIED_EVENTS.TYPING_STOP);
    });

    it('should reject typing payload missing required fields', () => {
      const payload = {
        isTyping: true,
        // Missing userId and conversationId
      };

      const result = validateTypingPayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required for typing events');
      expect(result.errors).toContain('Conversation ID is required for typing events');
    });
  });

  describe('Presence Payload Validation', () => {
    it('should validate valid presence payload', () => {
      const payload = {
        userId: 'user-123',
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      const result = validatePresencePayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedPayload?.event).toBe(UNIFIED_EVENTS.PRESENCE_JOIN);
    });

    it('should reject invalid status values', () => {
      const payload = {
        userId: 'user-123',
        status: 'invalid-status',
      };

      const result = validatePresencePayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status: invalid-status. Must be one of: online, away, busy, offline');
    });

    it('should handle different status types', () => {
      const statuses = ['online', 'away', 'busy', 'offline'];
      
      statuses.forEach(status => {
        const payload = { userId: 'user-123', status };
        const result = validatePresencePayload(payload);
        expect(result.isValid).toBe(true);
        
        if (status === 'online') {
          expect(result.sanitizedPayload?.event).toBe(UNIFIED_EVENTS.PRESENCE_JOIN);
        } else {
          expect(result.sanitizedPayload?.event).toBe(UNIFIED_EVENTS.PRESENCE_UPDATE);
        }
      });
    });
  });

  describe('Complete Event Validation', () => {
    it('should validate complete channel event', () => {
      const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
      const eventName = UNIFIED_EVENTS.MESSAGE_CREATED;
      const payload = {
        messageId: 'msg-123',
        content: 'Hello',
        conversationId: 'conv-456',
        senderId: 'user-789',
      };

      const result = validator.validateChannelEvent(channelName, eventName, payload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject events with invalid channel names in strict mode', () => {
      const channelName = 'invalid-channel';
      const eventName = UNIFIED_EVENTS.MESSAGE_CREATED;
      const payload = {};

      const result = validator.validateChannelEvent(channelName, eventName, payload);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid channel name format: invalid-channel');
    });

    it('should reject events with invalid event names', () => {
      const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
      const eventName = 'invalid-event';
      const payload = {};

      const result = validator.validateChannelEvent(channelName, eventName, payload);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid event name: invalid-event');
    });
  });
});

describe('Channel Monitoring', () => {
  let monitor: ChannelMonitor;

  beforeEach(() => {
    monitor = new ChannelMonitor();
  });

  afterEach(() => {
    monitor.setEnabled(false);
  });

  it('should record channel events', () => {
    const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
    const eventName = UNIFIED_EVENTS.MESSAGE_CREATED;
    const payload = { messageId: 'msg-123', content: 'Hello' };

    monitor.recordEvent(channelName, eventName, payload, 'incoming');

    const events = monitor.getRecentEvents(10);
    expect(events).toHaveLength(1);
    expect(events[0]?.channelName).toBe(channelName);
    expect(events[0]?.eventName).toBe(eventName);
    expect(events[0]?.source).toBe('incoming');
  });

  it('should track channel metrics', () => {
    const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
    
    // Record multiple events
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming');
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'outgoing');
    monitor.recordEvent(channelName, UNIFIED_EVENTS.TYPING_START, {}, 'incoming');

    const metrics = monitor.getChannelMetrics(channelName);
    expect(metrics).toBeDefined();
    expect(metrics!.totalEvents).toBe(3);
    expect(metrics!.eventsByType[UNIFIED_EVENTS.MESSAGE_CREATED]).toBe(2);
    expect(metrics!.eventsByType[UNIFIED_EVENTS.TYPING_START]).toBe(1);
  });

  it('should calculate performance metrics', () => {
    const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
    
    // Record events with latency
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming', 100);
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming', 200);

    const performance = monitor.getPerformanceMetrics();
    expect(performance.totalChannels).toBe(1);
    expect(performance.totalEvents).toBe(2);
    expect(performance.averageLatency).toBeGreaterThan(0);
  });

  it('should assess channel health', () => {
    const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
    
    // Record successful events
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming');
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming');

    const health = monitor.getChannelHealth(channelName);
    expect(health.status).toBe('healthy');
    expect(health.issues).toHaveLength(0);
  });

  it('should detect unhealthy channels', () => {
    const channelName = UNIFIED_CHANNELS.conversation('org-123', 'conv-456');
    
    // Record events with errors
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming', undefined, 'Test error');
    monitor.recordEvent(channelName, UNIFIED_EVENTS.MESSAGE_CREATED, {}, 'incoming', undefined, 'Another error');

    const health = monitor.getChannelHealth(channelName);
    expect(health.status).not.toBe('healthy');
    expect(health.issues.length).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  it('should work with all components together', () => {
    const orgId = 'test-org';
    const convId = 'test-conv';
    const userId = 'test-user';

    // Generate channel name using standards
    const channelName = UNIFIED_CHANNELS.conversation(orgId, convId);
    expect(isValidChannelName(channelName)).toBe(true);

    // Validate event
    const eventName = UNIFIED_EVENTS.MESSAGE_CREATED;
    const payload = {
      messageId: 'msg-123',
      content: 'Test message',
      conversationId: convId,
      senderId: userId,
    };

    const validator = new ChannelEventValidator();
    const validation = validator.validateChannelEvent(channelName, eventName, payload);
    expect(validation.isValid).toBe(true);

    // Monitor the event
    const monitor = new ChannelMonitor();
    monitor.recordEvent(channelName, eventName, payload, 'incoming');

    const metrics = monitor.getChannelMetrics(channelName);
    expect(metrics?.totalEvents).toBe(1);

    const health = monitor.getChannelHealth(channelName);
    expect(health.status).toBe('healthy');
  });

  describe('Standardized Event Broadcasting', () => {
    it('should use consistent event names across widget and dashboard', () => {
      // Test that all message-related events use standardized names
      expect(UNIFIED_EVENTS.MESSAGE_CREATED).toBe('message_created');
      expect(UNIFIED_EVENTS.CONVERSATION_UPDATED).toBe('conversation_updated');
      expect(UNIFIED_EVENTS.CONVERSATION_CREATED).toBe('conversation_created');
      expect(UNIFIED_EVENTS.TYPING_START).toBe('typing_start');
      expect(UNIFIED_EVENTS.TYPING_STOP).toBe('typing_stop');
    });

    it('should validate standardized event payloads', () => {
      const messagePayload = {
        message: { id: 'test-id', content: 'test' },
        conversationId: 'conv-123',
        organizationId: 'org-456',
        timestamp: new Date().toISOString()
      };

      const typingPayload = {
        conversationId: 'conv-123',
        organizationId: 'org-456',
        userId: 'user-789',
        isTyping: true,
        timestamp: new Date().toISOString()
      };

      expect(validateMessagePayload(messagePayload)).toBe(true);
      expect(validateTypingPayload(typingPayload)).toBe(true);
    });

    it('should ensure widget and dashboard use same channel patterns', () => {
      const orgId = 'test-org-123';
      const convId = 'test-conv-456';

      // Both widget and dashboard should use these exact channel names
      const conversationChannel = UNIFIED_CHANNELS.conversation(orgId, convId);
      const organizationChannel = UNIFIED_CHANNELS.organization(orgId);

      expect(conversationChannel).toBe(`org:${orgId}:conv:${convId}`);
      expect(organizationChannel).toBe(`org:${orgId}`);

      // Validate channel name format
      expect(isValidChannelName(conversationChannel)).toBe(true);
      expect(isValidChannelName(organizationChannel)).toBe(true);
    });

    it('should extract correct metadata from standardized channels', () => {
      const orgId = 'test-org-123';
      const convId = 'test-conv-456';
      const channelName = UNIFIED_CHANNELS.conversation(orgId, convId);

      expect(extractOrgId(channelName)).toBe(orgId);
      expect(extractResourceType(channelName)).toBe('conv');
      expect(extractResourceId(channelName)).toBe(convId);
    });
  });
});
