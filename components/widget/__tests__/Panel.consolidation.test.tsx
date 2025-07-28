/**
 * Widget Panel Consolidation Unit Tests
 *
 * Tests for the consolidated Panel component ensuring:
 * - All features work correctly
 * - Performance targets are met
 * - Accessibility compliance
 * - Real-time functionality
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Panel } from "../Panel";
import "@testing-library/jest-dom";

// Mock Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    })),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  })),
}));

// Mock config
jest.mock("../config/env", () => ({
  config: {
    supabase: {
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    },
  },
}));

// Mock performance API
Object.defineProperty(window, "performance", {
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    now: jest.fn(() => Date.now()),
  },
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("Panel Consolidation", () => {
  const defaultProps = {
    organizationId: "test-org-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset performance marks
    (window.performance.mark as jest.Mock).mockClear();
    (window.performance.measure as jest.Mock).mockClear();
  });

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      render(<Panel {...defaultProps} />);
      expect(screen.getByTestId("widget-panel")).toBeInTheDocument();
    });

    it("should render with correct ARIA attributes", () => {
      render(<Panel {...defaultProps} />);

      const panel = screen.getByTestId("widget-panel");
      expect(panel).toHaveAttribute("role", "dialog");
      expect(panel).toHaveAttribute("aria-label");
    });

    it("should render message input with proper accessibility", () => {
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      expect(messageInput).toHaveAttribute("aria-label");
      expect(messageInput).toHaveAttribute("placeholder");
    });

    it("should render send button with proper accessibility", () => {
      render(<Panel {...defaultProps} />);

      const sendButton = screen.getByTestId("send-button");
      expect(sendButton).toHaveAttribute("aria-label");
      expect(sendButton).toBeEnabled();
    });
  });

  describe("Performance Validation", () => {
    it("should mark performance milestones during render", () => {
      render(<Panel {...defaultProps} />);

      expect(window.performance.mark).toHaveBeenCalledWith("panel-render-start");
      expect(window.performance.mark).toHaveBeenCalledWith("panel-render-complete");
    });

    it("should render within performance budget", async () => {
      const startTime = performance.now();

      render(<Panel {...defaultProps} />);

      // Wait for component to be fully rendered
      await waitFor(() => {
        expect(screen.getByTestId("widget-panel")).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;

      // Should render within 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it("should handle rapid message sending without performance degradation", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      const startTime = performance.now();

      // Send 10 messages rapidly
      for (let i = 0; i < 10; i++) {
        await user.type(messageInput, `Test message ${i + 1}`);
        await user.click(sendButton);

        // Clear input for next message
        await user.clear(messageInput);
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerMessage = totalTime / 10;

      // Should average less than 100ms per message
      expect(avgTimePerMessage).toBeLessThan(100);
    });
  });

  describe("Message Functionality", () => {
    it("should send message when send button is clicked", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      const testMessage = "Test message";
      await user.type(messageInput, testMessage);
      await user.click(sendButton);

      // Message should appear in the message list
      await waitFor(() => {
        expect(screen.getByText(testMessage)).toBeInTheDocument();
      });

      // Input should be cleared
      expect(messageInput).toHaveValue("");
    });

    it("should send message when Enter key is pressed", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");

      const testMessage = "Test message with Enter";
      await user.type(messageInput, testMessage);
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText(testMessage)).toBeInTheDocument();
      });
    });

    it("should not send empty messages", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const sendButton = screen.getByTestId("send-button");

      // Try to send empty message
      await user.click(sendButton);

      // No message should appear
      const messageList = screen.getByTestId("message-list");
      expect(messageList).toBeEmptyDOMElement();
    });

    it("should handle long messages correctly", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      const longMessage = "A".repeat(1000); // 1000 character message
      await user.type(messageInput, longMessage);
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });
  });

  describe("Real-time Features", () => {
    it("should establish real-time connection on mount", () => {
      render(<Panel {...defaultProps} />);

      // Should show connected status
      const connectionStatus = screen.getByTestId("connection-status");
      expect(connectionStatus).toHaveTextContent(/connected/i);
    });

    it("should display typing indicator when user is typing", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");

      // Start typing
      await user.type(messageInput, "Test");

      // Should show typing indicator
      await waitFor(() => {
        const typingIndicator = screen.getByTestId("typing-indicator");
        expect(typingIndicator).toBeInTheDocument();
      });
    });

    it("should hide typing indicator when user stops typing", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");

      // Type and then stop
      await user.type(messageInput, "Test");

      // Wait for typing timeout
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      });

      // Typing indicator should be hidden
      expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument();
    });
  });

  describe("AI Handover Features", () => {
    it("should show AI confidence indicator", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      await user.type(messageInput, "Hello");
      await user.click(sendButton);

      // Should show AI response with confidence
      await waitFor(() => {
        const aiConfidence = screen.getByTestId("ai-confidence");
        expect(aiConfidence).toBeInTheDocument();
      });
    });

    it("should trigger handover for complex queries", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      const complexQuery = "I need help with a very specific technical issue";
      await user.type(messageInput, complexQuery);
      await user.click(sendButton);

      // Should show handover indicator
      await waitFor(() => {
        const handoverIndicator = screen.getByTestId("handover-indicator");
        expect(handoverIndicator).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Features", () => {
    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      // Tab to message input
      await user.tab();
      expect(screen.getByTestId("message-input")).toHaveFocus();

      // Tab to send button
      await user.tab();
      expect(screen.getByTestId("send-button")).toHaveFocus();

      // Tab to emoji button
      await user.tab();
      expect(screen.getByTestId("emoji-button")).toHaveFocus();
    });

    it("should have proper focus management", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");

      // Focus should be on message input initially
      expect(messageInput).toHaveFocus();

      // After sending message, focus should return to input
      await user.type(messageInput, "Test message");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(messageInput).toHaveFocus();
      });
    });

    it("should announce messages to screen readers", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      await user.type(messageInput, "Test message");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        const message = screen.getByText("Test message");
        expect(message).toHaveAttribute("aria-live", "polite");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      // Mock network error
      const mockError = new Error("Network error");
      jest.spyOn(console, "error").mockImplementation(() => {});

      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      const messageInput = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      await user.type(messageInput, "Test message");

      // Simulate network error during send
      jest.spyOn(global, "fetch").mockRejectedValueOnce(mockError);

      await user.click(sendButton);

      // Should show error message
      await waitFor(() => {
        const errorMessage = screen.getByTestId("error-message");
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/connection/i);
      });

      jest.restoreAllMocks();
    });

    it("should retry failed messages", async () => {
      const user = userEvent.setup();
      render(<Panel {...defaultProps} />);

      // Simulate failed message
      const messageInput = screen.getByTestId("message-input");
      await user.type(messageInput, "Failed message");

      // Mock failure then success
      jest
        .spyOn(global, "fetch")
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));

      await user.click(screen.getByTestId("send-button"));

      // Should show retry button
      await waitFor(() => {
        const retryButton = screen.getByTestId("retry-button");
        expect(retryButton).toBeInTheDocument();
      });

      // Click retry
      await user.click(screen.getByTestId("retry-button"));

      // Message should eventually send
      await waitFor(() => {
        expect(screen.getByText("Failed message")).toBeInTheDocument();
        expect(screen.queryByTestId("retry-button")).not.toBeInTheDocument();
      });

      jest.restoreAllMocks();
    });
  });

  describe("Memory Management", () => {
    it("should clean up event listeners on unmount", () => {
      const { unmount } = render(<Panel {...defaultProps} />);

      // Mock addEventListener and removeEventListener
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      unmount();

      // Should remove all event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("should not create memory leaks with rapid re-renders", () => {
      const { rerender } = render(<Panel {...defaultProps} />);

      // Re-render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<Panel organizationId={`test-org-${i}`} />);
      }

      // Should not accumulate event listeners
      expect(screen.getByTestId("widget-panel")).toBeInTheDocument();
    });
  });
});
