/**
 * PHASE 2 CRITICAL FIX: Validation Schemas Unit Tests
 * 
 * Unit tests for Zod validation schemas to ensure proper input validation
 * and error handling across all API endpoints.
 */

import { describe, test, expect } from '@jest/globals';
import { 
  BaseSchemas, 
  WidgetSchemas, 
  DashboardSchemas, 
  AuthSchemas,
  validateRequest 
} from '@/lib/validation/schemas';

describe('BaseSchemas', () => {
  test('should validate UUID format correctly', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUUID = 'not-a-uuid';

    expect(() => BaseSchemas.uuid.parse(validUUID)).not.toThrow();
    expect(() => BaseSchemas.uuid.parse(invalidUUID)).toThrow();
  });

  test('should validate email format correctly', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';

    expect(() => BaseSchemas.email.parse(validEmail)).not.toThrow();
    expect(() => BaseSchemas.email.parse(invalidEmail)).toThrow();
  });

  test('should validate and sanitize message content', () => {
    const validContent = 'Hello, this is a test message!';
    const contentWithSpaces = '  Hello with spaces  ';
    const emptyContent = '';
    const tooLongContent = 'a'.repeat(5000);

    expect(BaseSchemas.messageContent.parse(validContent)).toBe(validContent);
    expect(BaseSchemas.messageContent.parse(contentWithSpaces)).toBe('Hello with spaces');
    expect(() => BaseSchemas.messageContent.parse(emptyContent)).toThrow();
    expect(() => BaseSchemas.messageContent.parse(tooLongContent)).toThrow();
  });

  test('should validate sender type enum', () => {
    const validTypes = ['visitor', 'agent', 'ai_assistant', 'customer'];
    const invalidType = 'invalid_sender';

    validTypes.forEach(type => {
      expect(() => BaseSchemas.senderType.parse(type)).not.toThrow();
    });
    expect(() => BaseSchemas.senderType.parse(invalidType)).toThrow();
  });
});

describe('WidgetSchemas', () => {
  test('should validate create conversation request', () => {
    const validRequest = {
      action: 'create-conversation',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      initialMessage: 'Hello, I need help!',
      metadata: { source: 'website' }
    };

    const invalidRequest = {
      action: 'create-conversation',
      customerEmail: 'invalid-email',
      // Missing other fields
    };

    const validation1 = validateRequest(WidgetSchemas.createConversation, validRequest);
    expect(validation1.success).toBe(true);
    expect(validation1.data).toBeDefined();

    const validation2 = validateRequest(WidgetSchemas.createConversation, invalidRequest);
    expect(validation2.success).toBe(false);
    expect(validation2.errors).toBeDefined();
  });

  test('should validate send message request', () => {
    const validRequest = {
      action: 'send-message',
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'This is a test message',
      senderType: 'customer',
      metadata: {}
    };

    const invalidRequest = {
      action: 'send-message',
      conversationId: 'invalid-uuid',
      content: '', // Empty content
    };

    const validation1 = validateRequest(WidgetSchemas.sendMessage, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(WidgetSchemas.sendMessage, invalidRequest);
    expect(validation2.success).toBe(false);
    expect(validation2.errors?.length).toBeGreaterThan(0);
  });

  test('should validate get messages request', () => {
    const validRequest = {
      action: 'get-messages',
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      page: 1,
      limit: 20
    };

    const invalidRequest = {
      action: 'get-messages',
      conversationId: 'invalid-uuid',
      page: 0, // Invalid page number
      limit: 200 // Too high limit
    };

    const validation1 = validateRequest(WidgetSchemas.getMessages, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(WidgetSchemas.getMessages, invalidRequest);
    expect(validation2.success).toBe(false);
  });

  test('should validate typing indicator request', () => {
    const validRequest = {
      action: 'typing-indicator',
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user123',
      userName: 'John Doe',
      isTyping: true
    };

    const invalidRequest = {
      action: 'typing-indicator',
      conversationId: 'invalid-uuid',
      isTyping: 'not-boolean' // Should be boolean
    };

    const validation1 = validateRequest(WidgetSchemas.typingIndicator, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(WidgetSchemas.typingIndicator, invalidRequest);
    expect(validation2.success).toBe(false);
  });
});

describe('DashboardSchemas', () => {
  test('should validate get conversations request', () => {
    const validRequest = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      page: 1,
      limit: 50,
      status: 'active'
    };

    const invalidRequest = {
      organizationId: 'invalid-uuid',
      page: -1,
      status: 'invalid-status'
    };

    const validation1 = validateRequest(DashboardSchemas.getConversations, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(DashboardSchemas.getConversations, invalidRequest);
    expect(validation2.success).toBe(false);
  });

  test('should validate update conversation request', () => {
    const validRequest = {
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'closed',
      priority: 'high',
      tags: ['urgent', 'billing']
    };

    const invalidRequest = {
      conversationId: 'invalid-uuid',
      status: 'invalid-status',
      priority: 'invalid-priority',
      tags: Array(15).fill('tag') // Too many tags
    };

    const validation1 = validateRequest(DashboardSchemas.updateConversation, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(DashboardSchemas.updateConversation, invalidRequest);
    expect(validation2.success).toBe(false);
  });

  test('should validate agent message request', () => {
    const validRequest = {
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Agent response message',
      agentId: 'agent123',
      agentName: 'Agent Smith',
      metadata: { department: 'support' }
    };

    const invalidRequest = {
      conversationId: 'invalid-uuid',
      content: '', // Empty content
      agentId: '', // Empty agent ID
    };

    const validation1 = validateRequest(DashboardSchemas.agentMessage, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(DashboardSchemas.agentMessage, invalidRequest);
    expect(validation2.success).toBe(false);
  });
});

describe('AuthSchemas', () => {
  test('should validate login request', () => {
    const validRequest = {
      email: 'user@example.com',
      password: 'SecurePass123',
      organizationId: '123e4567-e89b-12d3-a456-426614174000'
    };

    const invalidRequest = {
      email: 'invalid-email',
      password: '123', // Too short
    };

    const validation1 = validateRequest(AuthSchemas.login, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(AuthSchemas.login, invalidRequest);
    expect(validation2.success).toBe(false);
  });

  test('should validate register request with strong password requirements', () => {
    const validRequest = {
      email: 'newuser@example.com',
      password: 'StrongPass123',
      name: 'New User'
    };

    const invalidRequest = {
      email: 'invalid-email',
      password: 'weak', // Doesn't meet requirements
      name: ''
    };

    const validation1 = validateRequest(AuthSchemas.register, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(AuthSchemas.register, invalidRequest);
    expect(validation2.success).toBe(false);
  });

  test('should validate password reset request', () => {
    const validRequest = {
      email: 'user@example.com'
    };

    const invalidRequest = {
      email: 'invalid-email'
    };

    const validation1 = validateRequest(AuthSchemas.passwordReset, validRequest);
    expect(validation1.success).toBe(true);

    const validation2 = validateRequest(AuthSchemas.passwordReset, invalidRequest);
    expect(validation2.success).toBe(false);
  });
});

describe('validateRequest helper function', () => {
  test('should return success for valid data', () => {
    const schema = BaseSchemas.email;
    const validData = 'test@example.com';

    const result = validateRequest(schema, validData);
    expect(result.success).toBe(true);
    expect(result.data).toBe(validData);
    expect(result.errors).toBeUndefined();
  });

  test('should return errors for invalid data', () => {
    const schema = BaseSchemas.email;
    const invalidData = 'not-an-email';

    const result = validateRequest(schema, invalidData);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  test('should handle complex nested validation errors', () => {
    const invalidRequest = {
      action: 'send-message',
      conversationId: 'invalid-uuid',
      content: '', // Empty content
      senderType: 'invalid-type',
      metadata: 'not-an-object' // Should be object
    };

    const result = validateRequest(WidgetSchemas.sendMessage, invalidRequest);
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(1);
    
    // Check that error messages are descriptive
    const errorString = result.errors?.join(' ');
    expect(errorString).toContain('conversationId');
    expect(errorString).toContain('content');
  });
});
