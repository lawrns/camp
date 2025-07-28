import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useConversationRealtime } from "../useConversationRealtime";

// Mock Supabase
describe("useConversationRealtime", () => {
  const mockSupabase = {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
  };

  vi.mock("@supabase/supabase-js", () => ({
    createClient: () => mockSupabase,
  }));

  it("should subscribe to conversation channel", () => {
    const { result } = renderHook(() => useConversationRealtime("org1", "conv1"));

    expect(mockSupabase.channel).toHaveBeenCalledWith("org:org1:conversation:conv1");
    expect(result.current.connectionStatus).toBe("connecting");
  });

  it("should handle new messages", async () => {
    let onMessageCallback;
    mockSupabase.channel().on.mockImplementation((type, filter, callback) => {
      if (type === "postgres_changes" && filter.event === "INSERT") {
        onMessageCallback = callback;
      }
      return mockSupabase.channel();
    });

    const { result } = renderHook(() => useConversationRealtime("org1", "conv1"));

    const mockPayload = { new: { id: "msg1", content: "Hello" } };
    act(() => {
      onMessageCallback(mockPayload);
    });

    // Add assertions based on what the hook does with new messages
  });

  it("should handle typing indicators", async () => {
    let onBroadcastCallback;
    mockSupabase.channel().on.mockImplementation((type, filter, callback) => {
      if (type === "broadcast" && filter.event === "typing") {
        onBroadcastCallback = callback;
      }
      return mockSupabase.channel();
    });

    const { result } = renderHook(() => useConversationRealtime("org1", "conv1"));

    const mockTyping = { userId: "user1", typing: true };
    act(() => {
      onBroadcastCallback({ payload: mockTyping });
    });

    // Add assertions for typing state
  });
});
