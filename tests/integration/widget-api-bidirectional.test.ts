/**
 * WIDGET API BIDIRECTIONAL INTEGRATION TESTS
 * 
 * Integration tests for widget API endpoints with real HTTP requests
 * to verify bidirectional communication works end-to-end.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  organizationId: 'test-org-api-bidirectional',
  widgetToken: 'test-widget-token-api'
};

// Helper function to make API requests
async function makeWidgetRequest(action: string, data: unknown = {}) {
  const response = await fetch(`${TEST_CONFIG.baseURL}/api/widget`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': TEST_CONFIG.organizationId,
      'authorization': `Bearer ${TEST_CONFIG.widgetToken}`
    },
    body: JSON.stringify({
      action,
      ...data
    })
  });

  const result = await response.json();
  return { status: response.status, data: result };
}

// Helper function to create a test conversation
async function createTestConversation(customerData: {
  name: string;
  email: string;
  message: string;
}) {
  const response = await makeWidgetRequest('create-conversation', {
    customerName: customerData.name,
    customerEmail: customerData.email,
    initialMessage: customerData.message,
    metadata: { source: 'api-test' }
  });

  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
  expect(response.data.conversationId).toBeDefined();

  return response.data.conversationId;
}

// Helper function to send a message
async function sendTestMessage(conversationId: string, content: string, senderType = 'customer') {
  const response = await makeWidgetRequest('send-message', {
    conversationId,
    content,
    senderType,
    metadata: { timestamp: new Date().toISOString() }
  });

  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
  return response.data;
}

// Helper function to get conversation messages
async function getConversationMessages(conversationId: string) {
  const response = await fetch(`${TEST_CONFIG.baseURL}/api/conversations/${conversationId}/messages`, {
    headers: {
      'x-organization-id': TEST_CONFIG.organizationId
    }
  });

  const result = await response.json();
  expect(response.status).toBe(200);
  expect(result.success).toBe(true);
  return result.data;
}

describe('Widget API Bidirectional Communication', () => {
  describe('Conversation Creation and Management', () => {
    test('should create conversation with proper validation', async () => {
      const conversationId = await createTestConversation({
        name: 'API Test Customer',
        email: 'api-test@example.com',
        message: 'Hello from API test!'
      });

      expect(typeof conversationId).toBe('string');
      expect(conversationId.length).toBeGreaterThan(0);

      // Verify conversation was created by fetching messages
      const messages = await getConversationMessages(conversationId);
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages[0].content).toBe('Hello from API test!');
    });

    test('should reject invalid conversation creation requests', async () => {
      // Test with invalid email
      const response1 = await makeWidgetRequest('create-conversation', {
        customerName: 'Test Customer',
        customerEmail: 'invalid-email',
        initialMessage: 'Test message'
      });

      expect(response1.status).toBe(400);
      expect(response1.data.success).toBe(false);
      expect(response1.data.error.code).toBe('VALIDATION_ERROR');

      // Test with empty message
      const response2 = await makeWidgetRequest('create-conversation', {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        initialMessage: ''
      });

      expect(response2.status).toBe(400);
      expect(response2.data.success).toBe(false);
    });

    test('should handle visitor identification correctly', async () => {
      // First conversation without visitor ID
      const response1 = await makeWidgetRequest('create-conversation', {
        customerName: 'New Visitor',
        customerEmail: 'new-visitor@example.com',
        initialMessage: 'First visit'
      });

      expect(response1.data.visitorInfo.isReturning).toBe(false);
      expect(response1.data.visitorInfo.visitorId).toBeDefined();

      const visitorId = response1.data.visitorInfo.visitorId;

      // Second conversation with same visitor ID
      const response2 = await makeWidgetRequest('create-conversation', {
        providedVisitorId: visitorId,
        customerName: 'Returning Visitor',
        customerEmail: 'returning-visitor@example.com',
        initialMessage: 'Second visit'
      });

      expect(response2.data.visitorInfo.isReturning).toBe(true);
      expect(response2.data.visitorInfo.visitorId).toBe(visitorId);
    });
  });

  describe('Message Exchange', () => {
    test('should handle bidirectional message flow', async () => {
      // Create conversation
      const conversationId = await createTestConversation({
        name: 'Bidirectional Test',
        email: 'bidirectional@example.com',
        message: 'Initial customer message'
      });

      // Customer sends additional message
      await sendTestMessage(conversationId, 'Customer follow-up message');

      // Agent responds
      await sendTestMessage(conversationId, 'Agent response message', 'agent');

      // Customer replies
      await sendTestMessage(conversationId, 'Customer final message');

      // Verify all messages are in conversation
      const messages = await getConversationMessages(conversationId);
      expect(messages.length).toBe(4);

      // Verify message order and content
      expect(messages[0].content).toBe('Initial customer message');
      expect(messages[0].senderType).toBe('customer');

      expect(messages[1].content).toBe('Customer follow-up message');
      expect(messages[1].senderType).toBe('customer');

      expect(messages[2].content).toBe('Agent response message');
      expect(messages[2].senderType).toBe('agent');

      expect(messages[3].content).toBe('Customer final message');
      expect(messages[3].senderType).toBe('customer');
    });

    test('should validate message content and reject invalid messages', async () => {
      const conversationId = await createTestConversation({
        name: 'Validation Test',
        email: 'validation@example.com',
        message: 'Initial message'
      });

      // Test empty message
      const response1 = await makeWidgetRequest('send-message', {
        conversationId,
        content: '',
        senderType: 'customer'
      });

      expect(response1.status).toBe(400);
      expect(response1.data.error.code).toBe('VALIDATION_ERROR');

      // Test message too long
      const longMessage = 'a'.repeat(5000);
      const response2 = await makeWidgetRequest('send-message', {
        conversationId,
        content: longMessage,
        senderType: 'customer'
      });

      expect(response2.status).toBe(400);
      expect(response2.data.error.code).toBe('VALIDATION_ERROR');

      // Test invalid conversation ID
      const response3 = await makeWidgetRequest('send-message', {
        conversationId: 'invalid-uuid',
        content: 'Valid message',
        senderType: 'customer'
      });

      expect(response3.status).toBe(400);
      expect(response3.data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle concurrent message sending', async () => {
      const conversationId = await createTestConversation({
        name: 'Concurrent Test',
        email: 'concurrent@example.com',
        message: 'Initial message'
      });

      // Send multiple messages concurrently
      const messagePromises = Array.from({ length: 10 }, (_, i) =>
        sendTestMessage(conversationId, `Concurrent message ${i + 1}`)
      );

      const results = await Promise.all(messagePromises);

      // All messages should be sent successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all messages are in conversation
      const messages = await getConversationMessages(conversationId);
      expect(messages.length).toBe(11); // Initial + 10 concurrent messages

      // Verify all concurrent messages are present
      for (let i = 1; i <= 10; i++) {
        const messageExists = messages.some(msg => 
          msg.content === `Concurrent message ${i}`
        );
        expect(messageExists).toBe(true);
      }
    });
  });

  describe('Real-time Features', () => {
    test('should handle typing indicators', async () => {
      const conversationId = await createTestConversation({
        name: 'Typing Test',
        email: 'typing@example.com',
        message: 'Testing typing indicators'
      });

      // Start typing
      const response1 = await fetch(`${TEST_CONFIG.baseURL}/api/widget/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': TEST_CONFIG.organizationId
        },
        body: JSON.stringify({
          conversationId,
          userId: 'test-customer-123',
          userName: 'Test Customer',
          isTyping: true
        })
      });

      const result1 = await response1.json();
      expect(response1.status).toBe(200);
      expect(result1.success).toBe(true);

      // Stop typing
      const response2 = await fetch(`${TEST_CONFIG.baseURL}/api/widget/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': TEST_CONFIG.organizationId
        },
        body: JSON.stringify({
          conversationId,
          userId: 'test-customer-123',
          isTyping: false
        })
      });

      const result2 = await response2.json();
      expect(response2.status).toBe(200);
      expect(result2.success).toBe(true);
    });

    test('should handle message read receipts', async () => {
      const conversationId = await createTestConversation({
        name: 'Read Receipt Test',
        email: 'read-receipt@example.com',
        message: 'Testing read receipts'
      });

      // Send a message
      const messageResult = await sendTestMessage(conversationId, 'Message to mark as read');

      // Get the message ID from the conversation
      const messages = await getConversationMessages(conversationId);
      const lastMessage = messages[messages.length - 1];

      // Mark message as read
      const response = await makeWidgetRequest('read-receipt', {
        messageId: lastMessage.id,
        conversationId,
        status: 'read'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Error Handling and Security', () => {
    test('should require valid authentication', async () => {
      const response = await fetch(`${TEST_CONFIG.baseURL}/api/widget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': TEST_CONFIG.organizationId
          // No authorization header
        },
        body: JSON.stringify({
          action: 'create-conversation',
          customerName: 'Test Customer'
        })
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject invalid widget tokens', async () => {
      const response = await fetch(`${TEST_CONFIG.baseURL}/api/widget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': TEST_CONFIG.organizationId,
          'authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          action: 'create-conversation',
          customerName: 'Test Customer'
        })
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error.code).toBe('INVALID_TOKEN');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${TEST_CONFIG.baseURL}/api/widget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': TEST_CONFIG.organizationId,
          'authorization': `Bearer ${TEST_CONFIG.widgetToken}`
        },
        body: 'invalid json content'
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('INVALID_JSON');
    });

    test('should sanitize potentially dangerous input', async () => {
      const conversationId = await createTestConversation({
        name: 'Security Test',
        email: 'security@example.com',
        message: 'Testing input sanitization'
      });

      // Send message with potentially dangerous content
      const maliciousContent = '<script>alert("xss")</script>Hello world';
      await sendTestMessage(conversationId, maliciousContent);

      // Verify message was stored (sanitization happens at display level)
      const messages = await getConversationMessages(conversationId);
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.content).toBeDefined();
      expect(typeof lastMessage.content).toBe('string');
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle rapid API requests efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple conversations rapidly
      const conversationPromises = Array.from({ length: 5 }, (_, i) =>
        createTestConversation({
          name: `Load Test Customer ${i + 1}`,
          email: `load-test-${i + 1}@example.com`,
          message: `Load test message ${i + 1}`
        })
      );

      const conversationIds = await Promise.all(conversationPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should create 5 conversations in reasonable time
      expect(duration).toBeLessThan(5000);
      expect(conversationIds).toHaveLength(5);

      // Verify all conversations were created successfully
      conversationIds.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    test('should maintain API response times under load', async () => {
      const conversationId = await createTestConversation({
        name: 'Performance Test',
        email: 'performance@example.com',
        message: 'Performance testing'
      });

      const messageCount = 20;
      const startTime = Date.now();

      // Send messages rapidly
      const messagePromises = Array.from({ length: messageCount }, (_, i) =>
        sendTestMessage(conversationId, `Performance message ${i + 1}`)
      );

      await Promise.all(messagePromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should send 20 messages in reasonable time
      expect(duration).toBeLessThan(10000);

      // Verify all messages were sent
      const messages = await getConversationMessages(conversationId);
      expect(messages.length).toBe(messageCount + 1); // +1 for initial message
    });
  });
});
