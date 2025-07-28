import { act, renderHook, waitFor } from "@testing-library/react";
import { useAISuggestions } from "../useAISuggestions";

// Mock the underlying useAISuggestions hook
vi.mock("../useAISuggestions", () => ({
  useAISuggestions: () => ({
    suggestions: [],
    isGenerating: false,
    confidence: 0,
    error: null,
    generateSuggestions: vi.fn().mockResolvedValue(undefined),
    clearSuggestions: vi.fn(),
    selectSuggestion: vi.fn(),
    applySuggestion: vi.fn(),
  }),
}));

describe("useDebouncedAISuggestions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce suggestion generation", async () => {
    const { result } = renderHook(() =>
      useDebouncedAISuggestions({
        conversationId: "test",
        lastCustomerMessage: "help",
        debounceMs: 300,
      })
    );

    // Initial state
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.suggestions).toEqual([]);

    // Change input - should not generate immediately
    act(() => {
      result.current.generateSuggestions({ conversationId: "test", lastMessage: "help me" });
    });

    expect(result.current.isGenerating).toBe(false);

    // Advance timer but not enough
    vi.advanceTimersByTime(200);
    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    // Advance full debounce time
    vi.advanceTimersByTime(100);
    await waitFor(() => expect(result.current.isGenerating).toBe(true));
  });

  it("should cancel previous generation on new input", async () => {
    const generateSuggestionsMock = vi.fn();
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      ...useAISuggestions(),
      generateSuggestions: generateSuggestionsMock,
    });

    const { result } = renderHook(() =>
      useDebouncedAISuggestions({
        conversationId: "test",
        lastCustomerMessage: "initial",
        debounceMs: 300,
      })
    );

    // First change
    act(() => {
      result.current.generateSuggestions({ conversationId: "test", lastMessage: "first" });
    });

    vi.advanceTimersByTime(200);

    // Second change before debounce
    act(() => {
      result.current.generateSuggestions({ conversationId: "test", lastMessage: "second" });
    });

    vi.advanceTimersByTime(300);

    await waitFor(() => expect(generateSuggestionsMock).toHaveBeenCalledTimes(1));
    expect(generateSuggestionsMock).toHaveBeenCalledWith(expect.objectContaining({ lastMessage: "second" }));
  });

  it("should not generate when disabled", async () => {
    const generateSuggestionsMock = vi.fn();
    vi.mocked(useAISuggestions).mockReturnValueOnce({
      ...useAISuggestions(),
      generateSuggestions: generateSuggestionsMock,
    });

    renderHook(() =>
      useDebouncedAISuggestions({
        conversationId: "test",
        lastCustomerMessage: "help",
        enabled: false,
      })
    );

    vi.advanceTimersByTime(1000);
    expect(generateSuggestionsMock).not.toHaveBeenCalled();
  });

  it("should handle missing context gracefully", async () => {
    const { result } = renderHook(() =>
      useDebouncedAISuggestions({
        conversationId: undefined,
        lastCustomerMessage: undefined,
      })
    );

    vi.advanceTimersByTime(1000);
    expect(result.current.error).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });
});
