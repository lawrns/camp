/**
 * Conversations Store Tests
 */

import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "@/types/entities";
import { useConversationsStore } from "../conversations-store";

// Mock the auth store
vi.mock("../../auth/auth-store", () => ({
  useAuthStore: {
    getState: () => ({
      session: { access_token: "mock-token" },
      user: { id: "user-123" },
    }),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe("ConversationsStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useConversationsStore.setState({
        conversations: new Map(),
        lastMessagePreviews: {},
        unreadCounts: {},
        selectedConversationId: null,
        activeFilter: "all",
        searchQuery: "",
        isLoading: false,
        isLoadingMessages: {},
        error: null,
        hasMore: true,
        nextCursor: null,
        totalCount: 0,
      });
    });

    // Reset fetch mock
    vi.mocked(fetch).mockReset();
  });

  describe("Data Operations", () => {
    it("should set conversations", () => {
      const conversations: Conversation[] = [
        {
          id: "conv1",
          organization_id: "org1",
          customer_id: "cust1",
          customer_email: "test@example.com",
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_count: 2,
          last_message_preview: "Hello",
        },
        {
          id: "conv2",
          organization_id: "org1",
          customer_id: "cust2",
          customer_email: "test2@example.com",
          status: "closed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_count: 0,
          last_message_preview: "Goodbye",
        },
      ];

      act(() => {
        useConversationsStore.getState().setConversations(conversations);
      });

      const state = useConversationsStore.getState();
      expect(state.conversations.size).toBe(2);
      expect(state.conversations.get("conv1")).toEqual(
        expect.objectContaining({
          id: "conv1",
          version: 1,
        })
      );
      expect(state.lastMessagePreviews).toEqual({
        conv1: "Hello",
        conv2: "Goodbye",
      });
      expect(state.unreadCounts).toEqual({
        conv1: 2,
        conv2: 0,
      });
      expect(state.totalCount).toBe(2);
    });

    it("should update a conversation", () => {
      // First set a conversation
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      // Update it
      act(() => {
        useConversationsStore.getState().updateConversation({
          ...conversation,
          status: "closed",
          last_message_preview: "Updated message",
        });
      });

      const state = useConversationsStore.getState();
      const updated = state.conversations.get("conv1");
      expect(updated?.status).toBe("closed");
      expect(updated?.version).toBe(2);
      expect(state.lastMessagePreviews["conv1"]).toBe("Updated message");
    });

    it("should remove a conversation", () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
        useConversationsStore.getState().setSelectedConversation("conv1");
      });

      act(() => {
        useConversationsStore.getState().removeConversation("conv1");
      });

      const state = useConversationsStore.getState();
      expect(state.conversations.has("conv1")).toBe(false);
      expect(state.selectedConversationId).toBeNull();
      expect(state.lastMessagePreviews["conv1"]).toBeUndefined();
      expect(state.unreadCounts["conv1"]).toBeUndefined();
    });
  });

  describe("Selection", () => {
    it("should select a conversation and mark it as read", () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 5,
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      act(() => {
        useConversationsStore.getState().setSelectedConversation("conv1");
      });

      const state = useConversationsStore.getState();
      expect(state.selectedConversationId).toBe("conv1");
      expect(state.conversations.get("conv1")?.unread_count).toBe(0);
      expect(state.unreadCounts["conv1"]).toBe(0);
    });
  });

  describe("Unread Management", () => {
    it("should increment unread count", () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 1,
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      act(() => {
        useConversationsStore.getState().incrementUnreadCount("conv1");
      });

      const state = useConversationsStore.getState();
      expect(state.unreadCounts["conv1"]).toBe(2);
      expect(state.conversations.get("conv1")?.unread_count).toBe(2);
    });

    it("should mark conversation as read", () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 5,
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      act(() => {
        useConversationsStore.getState().markConversationAsRead("conv1");
      });

      const state = useConversationsStore.getState();
      expect(state.unreadCounts["conv1"]).toBe(0);
      expect(state.conversations.get("conv1")?.unread_count).toBe(0);
    });
  });

  describe("Filtering", () => {
    it("should set active filter", () => {
      act(() => {
        useConversationsStore.getState().setActiveFilter("unread");
      });

      expect(useConversationsStore.getState().activeFilter).toBe("unread");
    });

    it("should set search query", () => {
      act(() => {
        useConversationsStore.getState().setSearchQuery("test query");
      });

      expect(useConversationsStore.getState().searchQuery).toBe("test query");
    });
  });

  describe("Async Operations", () => {
    it("should load conversations", async () => {
      const mockConversations = [
        {
          id: "conv1",
          organization_id: "org1",
          customer_id: "cust1",
          customer_email: "test@example.com",
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response);

      await act(async () => {
        await useConversationsStore.getState().loadConversations();
      });

      const state = useConversationsStore.getState();
      expect(state.conversations.size).toBe(1);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should handle load conversations error", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await act(async () => {
        await useConversationsStore.getState().loadConversations();
      });

      const state = useConversationsStore.getState();
      expect(state.error).toBe("Failed to load conversations");
      expect(state.isLoading).toBe(false);
    });

    it("should update conversation status with optimistic update", async () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...conversation, status: "closed", version: 2 },
        }),
      } as Response);

      await act(async () => {
        await useConversationsStore.getState().updateConversationStatus("conv1", "closed");
      });

      const state = useConversationsStore.getState();
      const updated = state.conversations.get("conv1");
      expect(updated?.status).toBe("closed");
      expect(updated?.version).toBeGreaterThan(1);
    });

    it("should rollback on status update failure", async () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Server error",
      } as Response);

      await expect(
        act(async () => {
          await useConversationsStore.getState().updateConversationStatus("conv1", "closed");
        })
      ).rejects.toThrow();

      const state = useConversationsStore.getState();
      const conv = state.conversations.get("conv1");
      expect(conv?.status).toBe("open"); // Should be rolled back
      expect(conv?.version).toBe(1); // Version should not change
    });
  });

  describe("Utility Functions", () => {
    it("should clear all conversations", () => {
      const conversations: Conversation[] = [
        {
          id: "conv1",
          organization_id: "org1",
          customer_id: "cust1",
          customer_email: "test@example.com",
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      act(() => {
        useConversationsStore.getState().setConversations(conversations);
        useConversationsStore.getState().setSelectedConversation("conv1");
      });

      act(() => {
        useConversationsStore.getState().clearConversations();
      });

      const state = useConversationsStore.getState();
      expect(state.conversations.size).toBe(0);
      expect(state.selectedConversationId).toBeNull();
      expect(state.lastMessagePreviews).toEqual({});
      expect(state.unreadCounts).toEqual({});
      expect(state.totalCount).toBe(0);
    });

    it("should update last message preview", () => {
      const conversation: Conversation = {
        id: "conv1",
        organization_id: "org1",
        customer_id: "cust1",
        customer_email: "test@example.com",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      act(() => {
        useConversationsStore.getState().addConversation(conversation);
      });

      const timestamp = new Date().toISOString();
      act(() => {
        useConversationsStore.getState().updateLastMessagePreview("conv1", "New message", timestamp);
      });

      const state = useConversationsStore.getState();
      expect(state.lastMessagePreviews["conv1"]).toBe("New message");

      const conv = state.conversations.get("conv1");
      expect(conv?.last_message_preview).toBe("New message");
      expect(conv?.last_message_at).toBe(timestamp);
      expect(conv?.version).toBe(2);
    });
  });
});
