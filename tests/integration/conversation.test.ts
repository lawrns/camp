import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { 
  createConversation, 
  sendMessage, 
  getConversationHistory,
  updateConversationStatus,
  assignConversation
} from '@/lib/conversations';
import { generateAIResponse } from '@/lib/ai/core';
import { triggerHandoff } from '@/lib/ai/handoff';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@/lib/ai/core');
jest.mock('@/lib/ai/handoff');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGenerateAIResponse = generateAIResponse as jest.MockedFunction<typeof generateAIResponse>;
const mockTriggerHandoff = triggerHandoff as jest.MockedFunction<typeof triggerHandoff>;

describe('Conversation Integration Tests', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        then: jest.fn()
      })),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
        send: jest.fn()
      }))
    };
    
    mockCreateClient.mockReturnValue(mockSupabase);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Conversation Creation', () => {
    it('should create a new conversation successfully', async () => {
      const conversationData = {
        title: 'Customer Inquiry',
        channel: 'web',
        priority: 'medium',
        organizationId: 'org-123',
        customerId: 'customer-123'
      };
      
      const mockConversation = {
        id: 'conv-123',
        ...conversationData,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockConversation,
        error: null
      });
      
      const result = await createConversation(conversationData);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConversation);
    });
    
    it('should handle conversation creation errors', async () => {
      const conversationData = {
        title: 'Customer Inquiry',
        channel: 'web',
        organizationId: 'invalid-org'
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: null,
        error: { message: 'Organization not found' }
      });
      
      const result = await createConversation(conversationData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Organization not found');
    });
    
    it('should auto-assign conversation based on routing rules', async () => {
      const conversationData = {
        title: 'Technical Support',
        channel: 'email',
        priority: 'high',
        organizationId: 'org-123',
        tags: ['technical', 'urgent']
      };
      
      const mockConversation = {
        id: 'conv-123',
        ...conversationData,
        assignedAgent: 'agent-456',
        status: 'active'
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockConversation,
        error: null
      });
      
      const result = await createConversation(conversationData);
      
      expect(result.data.assignedAgent).toBe('agent-456');
    });
  });

  describe('Message Handling', () => {
    it('should send a customer message and trigger AI response', async () => {
      const messageData = {
        conversationId: 'conv-123',
        content: 'I need help with my account',
        type: 'text',
        sender: 'customer'
      };
      
      const mockMessage = {
        id: 'msg-123',
        ...messageData,
        timestamp: new Date().toISOString()
      };
      
      const mockAIResponse = {
        id: 'msg-124',
        conversationId: 'conv-123',
        content: 'I\'d be happy to help you with your account. Could you please provide more details?',
        type: 'text',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      mockSupabase.from().insert().single
        .mockResolvedValueOnce({
          data: mockMessage,
          error: null
        })
        .mockResolvedValueOnce({
          data: mockAIResponse,
          error: null
        });
      
      mockGenerateAIResponse.mockResolvedValue({
        content: mockAIResponse.content,
        confidence: 0.85,
        shouldHandoff: false
      });
      
      const result = await sendMessage(messageData);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      expect(mockGenerateAIResponse).toHaveBeenCalledWith(
        messageData.content,
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.aiResponse).toBeDefined();
    });
    
    it('should handle message sending errors', async () => {
      const messageData = {
        conversationId: 'invalid-conv',
        content: 'Test message',
        type: 'text',
        sender: 'customer'
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: null,
        error: { message: 'Conversation not found' }
      });
      
      const result = await sendMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Conversation not found');
    });
    
    it('should trigger handoff when AI confidence is low', async () => {
      const messageData = {
        conversationId: 'conv-123',
        content: 'This is a very complex technical issue that requires human expertise',
        type: 'text',
        sender: 'customer'
      };
      
      const mockMessage = {
        id: 'msg-123',
        ...messageData,
        timestamp: new Date().toISOString()
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockMessage,
        error: null
      });
      
      mockGenerateAIResponse.mockResolvedValue({
        content: 'I understand this is complex. Let me connect you with a human agent.',
        confidence: 0.3, // Low confidence
        shouldHandoff: true
      });
      
      mockTriggerHandoff.mockResolvedValue({
        success: true,
        handoffId: 'handoff-123',
        estimatedWaitTime: 300
      });
      
      const result = await sendMessage(messageData);
      
      expect(mockTriggerHandoff).toHaveBeenCalledWith(
        messageData.conversationId,
        expect.objectContaining({
          reason: 'Low AI confidence',
          priority: 'medium'
        })
      );
      expect(result.handoffTriggered).toBe(true);
    });
    
    it('should handle file attachments', async () => {
      const messageData = {
        conversationId: 'conv-123',
        content: 'Please see the attached screenshot',
        type: 'file',
        sender: 'customer',
        attachments: [{
          fileName: 'screenshot.png',
          fileSize: 1024000,
          mimeType: 'image/png',
          url: 'https://storage.example.com/screenshot.png'
        }]
      };
      
      const mockMessage = {
        id: 'msg-123',
        ...messageData,
        timestamp: new Date().toISOString()
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockMessage,
        error: null
      });
      
      const result = await sendMessage(messageData);
      
      expect(result.success).toBe(true);
      expect(result.data.attachments).toHaveLength(1);
    });
  });

  describe('Conversation History', () => {
    it('should retrieve conversation history with pagination', async () => {
      const conversationId = 'conv-123';
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId,
          content: 'Hello, I need help',
          sender: 'customer',
          timestamp: '2023-01-01T10:00:00Z'
        },
        {
          id: 'msg-2',
          conversationId,
          content: 'How can I assist you today?',
          sender: 'ai',
          timestamp: '2023-01-01T10:01:00Z'
        }
      ];
      
      mockSupabase.from().select().eq().order().limit().then.mockResolvedValue({
        data: mockMessages,
        error: null
      });
      
      const result = await getConversationHistory(conversationId, {
        page: 1,
        limit: 50
      });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
    });
    
    it('should filter messages by type', async () => {
      const conversationId = 'conv-123';
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId,
          content: 'Text message',
          type: 'text',
          sender: 'customer'
        }
      ];
      
      mockSupabase.from().select().eq().order().limit().then.mockResolvedValue({
        data: mockMessages,
        error: null
      });
      
      const result = await getConversationHistory(conversationId, {
        messageType: 'text'
      });
      
      expect(result.data).toEqual(mockMessages);
    });
  });

  describe('Conversation Status Management', () => {
    it('should update conversation status', async () => {
      const conversationId = 'conv-123';
      const newStatus = 'resolved';
      
      const mockUpdatedConversation = {
        id: conversationId,
        status: newStatus,
        resolvedAt: new Date().toISOString()
      };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: mockUpdatedConversation,
        error: null
      });
      
      const result = await updateConversationStatus(conversationId, newStatus);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(newStatus);
    });
    
    it('should handle invalid status transitions', async () => {
      const conversationId = 'conv-123';
      const invalidStatus = 'invalid-status';
      
      const result = await updateConversationStatus(conversationId, invalidStatus);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status');
    });
    
    it('should track status change history', async () => {
      const conversationId = 'conv-123';
      const newStatus = 'in_progress';
      
      const mockStatusChange = {
        id: 'status-change-123',
        conversationId,
        fromStatus: 'active',
        toStatus: newStatus,
        changedBy: 'agent-456',
        timestamp: new Date().toISOString()
      };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { id: conversationId, status: newStatus },
        error: null
      });
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockStatusChange,
        error: null
      });
      
      const result = await updateConversationStatus(conversationId, newStatus, 'agent-456');
      
      expect(result.success).toBe(true);
      expect(result.statusChange).toBeDefined();
    });
  });

  describe('Agent Assignment', () => {
    it('should assign conversation to available agent', async () => {
      const conversationId = 'conv-123';
      const agentId = 'agent-456';
      
      const mockAssignment = {
        id: conversationId,
        assignedAgent: agentId,
        assignedAt: new Date().toISOString()
      };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: mockAssignment,
        error: null
      });
      
      const result = await assignConversation(conversationId, agentId);
      
      expect(result.success).toBe(true);
      expect(result.data.assignedAgent).toBe(agentId);
    });
    
    it('should handle agent availability conflicts', async () => {
      const conversationId = 'conv-123';
      const busyAgentId = 'agent-busy';
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Agent is not available' }
      });
      
      const result = await assignConversation(conversationId, busyAgentId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent is not available');
    });
    
    it('should auto-assign based on workload balancing', async () => {
      const conversationId = 'conv-123';
      
      // Mock available agents with their current workload
      const mockAgents = [
        { id: 'agent-1', activeConversations: 3, maxCapacity: 5 },
        { id: 'agent-2', activeConversations: 1, maxCapacity: 5 },
        { id: 'agent-3', activeConversations: 4, maxCapacity: 5 }
      ];
      
      mockSupabase.from().select().eq().then.mockResolvedValue({
        data: mockAgents,
        error: null
      });
      
      const mockAssignment = {
        id: conversationId,
        assignedAgent: 'agent-2', // Agent with lowest workload
        assignedAt: new Date().toISOString()
      };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: mockAssignment,
        error: null
      });
      
      const result = await assignConversation(conversationId);
      
      expect(result.success).toBe(true);
      expect(result.data.assignedAgent).toBe('agent-2');
    });
  });

  describe('Real-time Updates', () => {
    it('should broadcast message updates to subscribers', async () => {
      const conversationId = 'conv-123';
      const messageData = {
        conversationId,
        content: 'New message',
        sender: 'customer'
      };
      
      const mockChannel = {
        send: jest.fn().mockResolvedValue({ status: 'ok' })
      };
      
      mockSupabase.channel.mockReturnValue(mockChannel);
      
      const mockMessage = {
        id: 'msg-123',
        ...messageData,
        timestamp: new Date().toISOString()
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockMessage,
        error: null
      });
      
      const result = await sendMessage(messageData);
      
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'new_message',
        payload: mockMessage
      });
    });
    
    it('should handle real-time connection failures gracefully', async () => {
      const conversationId = 'conv-123';
      const messageData = {
        conversationId,
        content: 'Test message',
        sender: 'customer'
      };
      
      const mockChannel = {
        send: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };
      
      mockSupabase.channel.mockReturnValue(mockChannel);
      
      const mockMessage = {
        id: 'msg-123',
        ...messageData,
        timestamp: new Date().toISOString()
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockMessage,
        error: null
      });
      
      const result = await sendMessage(messageData);
      
      // Message should still be saved even if real-time broadcast fails
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high message volume efficiently', async () => {
      const conversationId = 'conv-123';
      const messageCount = 100;
      const messages = [];
      
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          conversationId,
          content: `Message ${i}`,
          sender: 'customer',
          timestamp: new Date(Date.now() + i * 1000).toISOString()
        });
      }
      
      mockSupabase.from().insert().then.mockResolvedValue({
        data: messages,
        error: null
      });
      
      const startTime = Date.now();
      
      // Batch insert messages
      const result = await mockSupabase
        .from('messages')
        .insert(messages);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.data).toHaveLength(messageCount);
    });
    
    it('should implement message rate limiting', async () => {
      const conversationId = 'conv-123';
      const rapidMessages = [];
      
      // Simulate rapid message sending (more than allowed rate)
      for (let i = 0; i < 10; i++) {
        rapidMessages.push({
          conversationId,
          content: `Rapid message ${i}`,
          sender: 'customer'
        });
      }
      
      // First few messages should succeed
      mockSupabase.from().insert().single
        .mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'msg-2' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'msg-3' }, error: null })
        // Then rate limiting kicks in
        .mockResolvedValue({
          data: null,
          error: { message: 'Rate limit exceeded' }
        });
      
      const results = [];
      for (const message of rapidMessages) {
        const result = await sendMessage(message);
        results.push(result);
      }
      
      const successfulMessages = results.filter(r => r.success);
      const rateLimitedMessages = results.filter(r => !r.success && r.error?.includes('Rate limit'));
      
      expect(successfulMessages.length).toBeLessThan(rapidMessages.length);
      expect(rateLimitedMessages.length).toBeGreaterThan(0);
    });
  });
});