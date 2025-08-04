import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMessages, sendMessage, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage } from '../useMessages';
import type { Message } from '../../types';

// Mock Supabase
const mockSupabase = {
  browser: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(() => Promise.resolve()),
    })),
    removeChannel: vi.fn(),
  })),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('useMessages', () => {
  const mockConversationId = 'test-conversation-id';
  const mockOrganizationId = 'test-org-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('CRITICAL-001: sender_type/senderType consistency', () => {
    it('should handle database sender_type field correctly', async () => {
      const mockMessage = {
        id: 'test-message-1',
        conversation_id: mockConversationId,
        organization_id: mockOrganizationId,
        content: 'Test message',
        sender_type: 'agent', // Database uses snake_case
        senderName: 'Test Agent',
        created_at: new Date().toISOString(),
        attachments: [],
      };

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [mockMessage],
                error: null,
              })),
            })),
          })),
        })),
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn(),
          unsubscribe: vi.fn(() => Promise.resolve()),
        })),
        removeChannel: vi.fn(),
      };

      mockSupabase.browser.mockReturnValue(mockClient);

      const { result } = renderHook(() => useMessages(mockConversationId, mockOrganizationId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify that messages are processed correctly with sender_type
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender_type).toBe('agent');
    });

    it('should handle invalid sender_type gracefully', async () => {
      const mockMessage = {
        id: 'test-message-2',
        conversation_id: mockConversationId,
        organization_id: mockOrganizationId,
        content: 'Test message',
        sender_type: 'invalid_type', // Invalid type
        senderName: 'Test User',
        created_at: new Date().toISOString(),
        attachments: [],
      };

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [mockMessage],
                error: null,
              })),
            })),
          })),
        })),
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn(),
          unsubscribe: vi.fn(() => Promise.resolve()),
        })),
        removeChannel: vi.fn(),
      };

      mockSupabase.browser.mockReturnValue(mockClient);

      const { result } = renderHook(() => useMessages(mockConversationId, mockOrganizationId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should default to 'visitor' for invalid sender types
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender_type).toBe('visitor');
    });
  });

  describe('sendMessage function', () => {
    it('should send message with correct sender_type field', async () => {
      const mockInsertedMessage = {
        id: 'new-message-id',
        conversation_id: mockConversationId,
        organization_id: mockOrganizationId,
        content: 'New test message',
        sender_type: 'agent',
        senderName: 'Test Agent',
        created_at: new Date().toISOString(),
        attachments: [],
      };

      const mockClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockInsertedMessage,
                error: null,
              })),
            })),
          })),
        })),
      };

      mockSupabase.browser.mockReturnValue(mockClient);

      const result = await sendMessage(
        mockConversationId,
        'New test message',
        'agent',
        'Test Agent',
        mockOrganizationId
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'new-message-id',
        sender_type: 'agent',
        content: 'New test message',
      }));

      // Verify that the insert was called with sender_type (snake_case)
      expect(mockClient.from).toHaveBeenCalledWith('messages');
      const insertCall = mockClient.from().insert.mock.calls[0][0][0];
      expect(insertCall).toHaveProperty('sender_type', 'agent');
      expect(insertCall).not.toHaveProperty('senderType'); // Should not have camelCase
    });
  });

  describe('optimistic message helpers', () => {
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        conversation_id: mockConversationId,
        organization_id: mockOrganizationId,
        content: 'Existing message',
        sender_type: 'visitor',
        senderName: 'User',
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: 'sent',
      },
    ];

    it('should add optimistic message correctly', () => {
      const tempMessage = {
        conversation_id: mockConversationId,
        organization_id: mockOrganizationId,
        content: 'Optimistic message',
        sender_type: 'agent' as const,
        senderName: 'Agent',
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: 'sent' as const,
        tempId: 'temp-123',
      };

      const result = addOptimisticMessage(mockMessages, tempMessage);

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('temp-123');
      expect(result[1].sender_type).toBe('agent');
    });

    it('should replace optimistic message correctly', () => {
      const messagesWithOptimistic = [
        ...mockMessages,
        {
          id: 'temp-123',
          conversation_id: mockConversationId,
          organization_id: mockOrganizationId,
          content: 'Optimistic message',
          sender_type: 'agent' as const,
          senderName: 'Agent',
          created_at: new Date().toISOString(),
          attachments: [],
          read_status: 'sent' as const,
        },
      ];

      const realMessage: Message = {
        id: 'real-123',
        conversation_id: mockConversationId,
        organization_id: mockOrganizationId,
        content: 'Real message',
        sender_type: 'agent',
        senderName: 'Agent',
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: 'sent',
      };

      const result = replaceOptimisticMessage(messagesWithOptimistic, 'temp-123', realMessage);

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('real-123');
      expect(result[1].sender_type).toBe('agent');
    });

    it('should remove optimistic message correctly', () => {
      const messagesWithOptimistic = [
        ...mockMessages,
        {
          id: 'temp-123',
          conversation_id: mockConversationId,
          organization_id: mockOrganizationId,
          content: 'Failed optimistic message',
          sender_type: 'agent' as const,
          senderName: 'Agent',
          created_at: new Date().toISOString(),
          attachments: [],
          read_status: 'sent' as const,
        },
      ];

      const result = removeOptimisticMessage(messagesWithOptimistic, 'temp-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('msg-1');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: null,
                error: { message: 'Database error' },
              })),
            })),
          })),
        })),
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn(),
          unsubscribe: vi.fn(() => Promise.resolve()),
        })),
        removeChannel: vi.fn(),
      };

      mockSupabase.browser.mockReturnValue(mockClient);

      const { result } = renderHook(() => useMessages(mockConversationId, mockOrganizationId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });
});
