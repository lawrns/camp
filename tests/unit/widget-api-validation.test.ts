/**
 * WIDGET API VALIDATION UNIT TESTS
 * 
 * Unit tests for widget API validation logic without HTTP dependencies.
 * Tests the core validation and business logic for bidirectional communication.
 */

import { describe, test, expect } from '@jest/globals';
import { 
  WidgetSchemas, 
  validateRequest,
  BaseSchemas 
} from '@/lib/validation/schemas';

describe('Widget API Validation for Bidirectional Communication', () => {
  describe('Create Conversation Validation', () => {
    test('should validate complete create conversation request', () => {
      const validRequest = {
        action: 'create-conversation',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        initialMessage: 'Hello, I need help with my account!',
        metadata: { 
          source: 'website',
          userAgent: 'Mozilla/5.0',
          referrer: 'https://example.com'
        }
      };

      const result = validateRequest(WidgetSchemas.createConversation, validRequest);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.customerName).toBe('John Doe');
      expect(result.data?.customerEmail).toBe('john@example.com');
      expect(result.data?.initialMessage).toBe('Hello, I need help with my account!');
    });

    test('should validate minimal create conversation request', () => {
      const minimalRequest = {
        action: 'create-conversation',
        metadata: {}
      };

      const result = validateRequest(WidgetSchemas.createConversation, minimalRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.action).toBe('create-conversation');
    });

    test('should reject invalid email formats', () => {
      const invalidEmailRequest = {
        action: 'create-conversation',
        customerEmail: 'not-an-email',
        customerName: 'John Doe',
        metadata: {}
      };

      const result = validateRequest(WidgetSchemas.createConversation, invalidEmailRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(error => error.includes('email'))).toBe(true);
    });

    test('should handle returning visitor identification', () => {
      const returningVisitorRequest = {
        action: 'create-conversation',
        providedVisitorId: '123e4567-e89b-12d3-a456-426614174000',
        customerName: 'Returning Customer',
        customerEmail: 'returning@example.com',
        metadata: { returning: true }
      };

      const result = validateRequest(WidgetSchemas.createConversation, returningVisitorRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.providedVisitorId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    test('should reject invalid visitor ID format when provided', () => {
      // Test with BaseSchemas.uuid directly since providedVisitorId is optional
      const invalidUuidResult = validateRequest(BaseSchemas.uuid, 'invalid-uuid');

      expect(invalidUuidResult.success).toBe(false);
      expect(invalidUuidResult.errors?.some(error => error.includes('UUID'))).toBe(true);

      // Valid UUID should pass
      const validUuidResult = validateRequest(BaseSchemas.uuid, '123e4567-e89b-12d3-a456-426614174000');
      expect(validUuidResult.success).toBe(true);
    });
  });

  describe('Send Message Validation', () => {
    test('should validate complete send message request', () => {
      const validRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'This is a test message from the customer.',
        senderEmail: 'customer@example.com',
        senderName: 'Customer Name',
        senderType: 'customer',
        metadata: { 
          timestamp: new Date().toISOString(),
          messageType: 'text'
        }
      };

      const result = validateRequest(WidgetSchemas.sendMessage, validRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.conversationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data?.content).toBe('This is a test message from the customer.');
      expect(result.data?.senderType).toBe('customer');
    });

    test('should validate agent message', () => {
      const agentRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Hello! How can I help you today?',
        senderType: 'agent',
        metadata: { agentId: 'agent-123' }
      };

      const result = validateRequest(WidgetSchemas.sendMessage, agentRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.senderType).toBe('agent');
    });

    test('should reject empty message content', () => {
      const emptyContentRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: '',
        senderType: 'customer'
      };

      const result = validateRequest(WidgetSchemas.sendMessage, emptyContentRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('empty'))).toBe(true);
    });

    test('should reject message content that is too long', () => {
      const longContentRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'a'.repeat(5000), // Exceeds 4000 character limit
        senderType: 'customer'
      };

      const result = validateRequest(WidgetSchemas.sendMessage, longContentRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('long'))).toBe(true);
    });

    test('should reject invalid conversation ID', () => {
      const invalidConversationRequest = {
        action: 'send-message',
        conversationId: 'not-a-uuid',
        content: 'Valid message content',
        senderType: 'customer'
      };

      const result = validateRequest(WidgetSchemas.sendMessage, invalidConversationRequest);

      expect(result.success).toBe(false);
      expect(result.errors?.some(error =>
        error.includes('UUID') || error.includes('Invalid') || error.includes('format')
      )).toBe(true);
    });

    test('should reject invalid sender type', () => {
      const invalidSenderRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Valid message content',
        senderType: 'invalid_sender'
      };

      const result = validateRequest(WidgetSchemas.sendMessage, invalidSenderRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('sender'))).toBe(true);
    });

    test('should sanitize message content by trimming whitespace', () => {
      const whitespaceRequest = {
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: '  Message with extra whitespace  ',
        senderType: 'customer'
      };

      const result = validateRequest(WidgetSchemas.sendMessage, whitespaceRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Message with extra whitespace');
    });
  });

  describe('Typing Indicator Validation', () => {
    test('should validate typing indicator request', () => {
      const typingRequest = {
        action: 'typing-indicator',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        userName: 'John Doe',
        isTyping: true
      };

      const result = validateRequest(WidgetSchemas.typingIndicator, typingRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.isTyping).toBe(true);
      expect(result.data?.userId).toBe('user-123');
    });

    test('should validate stop typing request', () => {
      const stopTypingRequest = {
        action: 'typing-indicator',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        isTyping: false
      };

      const result = validateRequest(WidgetSchemas.typingIndicator, stopTypingRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.isTyping).toBe(false);
    });

    test('should reject invalid typing indicator data', () => {
      const invalidTypingRequest = {
        action: 'typing-indicator',
        conversationId: 'invalid-uuid',
        userId: '',
        isTyping: 'not-boolean'
      };

      const result = validateRequest(WidgetSchemas.typingIndicator, invalidTypingRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Read Receipt Validation', () => {
    test('should validate read receipt request', () => {
      const readReceiptRequest = {
        action: 'read-receipt',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'read'
      };

      const result = validateRequest(WidgetSchemas.readReceipt, readReceiptRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('read');
    });

    test('should validate delivered status', () => {
      const deliveredRequest = {
        action: 'read-receipt',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'delivered'
      };

      const result = validateRequest(WidgetSchemas.readReceipt, deliveredRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('delivered');
    });

    test('should reject invalid message status', () => {
      const invalidStatusRequest = {
        action: 'read-receipt',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'invalid-status'
      };

      const result = validateRequest(WidgetSchemas.readReceipt, invalidStatusRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('status'))).toBe(true);
    });
  });

  describe('Get Messages Validation', () => {
    test('should validate get messages request', () => {
      const getMessagesRequest = {
        action: 'get-messages',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 20,
        since: new Date().toISOString()
      };

      const result = validateRequest(WidgetSchemas.getMessages, getMessagesRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    test('should apply default pagination values', () => {
      const minimalRequest = {
        action: 'get-messages',
        conversationId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = validateRequest(WidgetSchemas.getMessages, minimalRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1); // Default value
      expect(result.data?.limit).toBe(20); // Default value
    });

    test('should reject invalid pagination parameters', () => {
      const invalidPaginationRequest = {
        action: 'get-messages',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        page: 0, // Invalid: must be >= 1
        limit: 200 // Invalid: exceeds max of 100
      };

      const result = validateRequest(WidgetSchemas.getMessages, invalidPaginationRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-validation and Edge Cases', () => {
    test('should handle null and undefined values gracefully', () => {
      const nullRequest = null;
      const undefinedRequest = undefined;
      const emptyRequest = {};

      const nullResult = validateRequest(WidgetSchemas.createConversation, nullRequest);
      const undefinedResult = validateRequest(WidgetSchemas.createConversation, undefinedRequest);
      const emptyResult = validateRequest(WidgetSchemas.createConversation, emptyRequest);

      expect(nullResult.success).toBe(false);
      expect(undefinedResult.success).toBe(false);
      expect(emptyResult.success).toBe(false);
    });

    test('should handle malformed action types', () => {
      const malformedRequest = {
        action: 'invalid-action',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Test message'
      };

      const result = validateRequest(WidgetSchemas.sendMessage, malformedRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('action'))).toBe(true);
    });

    test('should validate complex nested metadata', () => {
      const complexMetadataRequest = {
        action: 'create-conversation',
        customerName: 'Test Customer',
        metadata: {
          source: 'widget',
          browser: {
            name: 'Chrome',
            version: '91.0.4472.124'
          },
          screen: {
            width: 1920,
            height: 1080
          },
          customFields: {
            department: 'support',
            priority: 'high'
          }
        }
      };

      const result = validateRequest(WidgetSchemas.createConversation, complexMetadataRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata.source).toBe('widget');
    });

    test('should handle concurrent validation requests', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => ({
        action: 'send-message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        content: `Concurrent message ${i + 1}`,
        senderType: 'customer'
      }));

      const validationPromises = requests.map(request =>
        Promise.resolve(validateRequest(WidgetSchemas.sendMessage, request))
      );

      const results = await Promise.all(validationPromises);
      
      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.content).toBe(`Concurrent message ${index + 1}`);
      });
    });
  });
});
