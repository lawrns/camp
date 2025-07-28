// components/ai/__tests__/AIMessageComposer.test.tsx
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { AIMessageComposer, AISuggestion, TypingStatus } from "../AIMessageComposer";

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: (props: any) => {
      const { children, ...otherProps } = props;
      return React.createElement("div", otherProps, children);
    },
  },
  AnimatePresence: (props: any) => props.children,
}));

// Mock feature flags
jest.mock("@/lib/features", () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true),
}));

describe("AIMessageComposer", () => {
  const mockOnSend = jest.fn();
  const mockOnTyping = jest.fn();
  const mockOnUseSuggestion = jest.fn();
  const mockOnEditSuggestion = jest.fn();
  const mockOnGenerateNew = jest.fn();

  const mockSuggestions: AISuggestion[] = [
    {
      id: "1",
      text: "Thank you for your patience. I understand your concern.",
      confidence: 0.9,
      intent: "empathy",
      category: "quick",
    },
    {
      id: "2",
      text: "Let me help you resolve this issue step by step.",
      confidence: 0.8,
      intent: "solution",
      category: "detailed",
    },
    {
      id: "3",
      text: "Is there anything else I can help you with today?",
      confidence: 0.7,
      intent: "followup",
      category: "followup",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders basic composer elements", () => {
    render(<AIMessageComposer onSend={mockOnSend} onTyping={mockOnTyping} />);

    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    expect(screen.getByTitle("Attach file")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("handles text input and calls onTyping", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} onTyping={mockOnTyping} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "Hello world");

    expect(mockOnTyping).toHaveBeenCalled();
    expect(textarea).toHaveValue("Hello world");
  });

  it("sends message on Enter key", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} onTyping={mockOnTyping} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "Test message");
    await user.keyboard("{Enter}");

    expect(mockOnSend).toHaveBeenCalledWith("Test message", undefined);
  });

  it("adds new line on Shift+Enter", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} onTyping={mockOnTyping} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "Line 1");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(textarea, "Line 2");

    expect(textarea).toHaveValue("Line 1\nLine 2");
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("displays AI suggestions when provided", () => {
    render(
      <AIMessageComposer
        onSend={mockOnSend}
        suggestions={mockSuggestions}
        onUseSuggestion={mockOnUseSuggestion}
        onEditSuggestion={mockOnEditSuggestion}
        onGenerateNew={mockOnGenerateNew}
      />
    );

    expect(screen.getByText("AI Suggestions")).toBeInTheDocument();
    expect(screen.getByText("Thank you for your patience. I understand your concern.")).toBeInTheDocument();
    expect(screen.getByText("Let me help you resolve this issue step by step.")).toBeInTheDocument();
  });

  it("shows high confidence indicator for suggestions above threshold", () => {
    render(
      <AIMessageComposer
        onSend={mockOnSend}
        suggestions={mockSuggestions}
        confidenceThreshold={0.8}
        onUseSuggestion={mockOnUseSuggestion}
      />
    );

    expect(screen.getByText("High confidence")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("handles suggestion selection and usage", async () => {
    const user = userEvent.setup();

    render(
      <AIMessageComposer onSend={mockOnSend} suggestions={mockSuggestions} onUseSuggestion={mockOnUseSuggestion} />
    );

    const useButton = screen.getAllByText("Use")[0];
    await user.click(useButton);

    expect(mockOnUseSuggestion).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it("navigates suggestions with keyboard", async () => {
    const user = userEvent.setup();

    render(
      <AIMessageComposer onSend={mockOnSend} suggestions={mockSuggestions} onUseSuggestion={mockOnUseSuggestion} />
    );

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.click(textarea);

    // Navigate down
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(mockOnUseSuggestion).toHaveBeenCalledWith(mockSuggestions[1]);
  });

  it("displays AI typing status", () => {
    const typingStatus: TypingStatus = {
      isTyping: true,
      progress: 50,
      phase: "typing",
      estimatedTimeRemaining: 3000,
    };

    render(<AIMessageComposer onSend={mockOnSend} aiTypingStatus={typingStatus} showAIIndicators={true} />);

    expect(screen.getByText("AI is typing...")).toBeInTheDocument();
    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("shows smart formatting preview", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} enableSmartFormatting={true} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "- First item\n- Second item\n*important* text");

    await waitFor(() => {
      expect(screen.getByText("Smart formatting detected")).toBeInTheDocument();
    });
  });

  it("handles file attachment", async () => {
    const user = userEvent.setup();
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    render(<AIMessageComposer onSend={mockOnSend} enableFileUpload={true} />);

    const fileInput = screen.getByTitle("Attach file");
    await user.click(fileInput);

    // Simulate file selection
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, "files", {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });
  });

  it("disables send button when message is empty", () => {
    render(<AIMessageComposer onSend={mockOnSend} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("enables send button when message has content", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "Test");

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeEnabled();
  });

  it("expands when message is long", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} enableQuickActions={true} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    const longMessage = "This is a very long message that should trigger the expanded state of the composer";
    await user.type(textarea, longMessage);

    // Quick actions should appear when expanded
    await waitFor(() => {
      expect(screen.getByTitle("Quick reply")).toBeInTheDocument();
      expect(screen.getByTitle("AI assist")).toBeInTheDocument();
    });
  });

  it("handles template usage", async () => {
    const user = userEvent.setup();
    const mockOnUseTemplate = jest.fn();
    const templates = [
      { id: "1", label: "Greeting", content: "Hello! How can I help you today?" },
      { id: "2", label: "Closing", content: "Thank you for contacting us!" },
    ];

    render(
      <AIMessageComposer
        onSend={mockOnSend}
        templates={templates}
        onUseTemplate={mockOnUseTemplate}
        enableQuickActions={true}
      />
    );

    // Focus to expand
    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.click(textarea);
    await user.type(textarea, "Long enough message to trigger expansion and show templates");

    await waitFor(() => {
      const greetingTemplate = screen.getByText("Greeting");
      expect(greetingTemplate).toBeInTheDocument();
    });

    const greetingTemplate = screen.getByText("Greeting");
    await user.click(greetingTemplate);

    expect(mockOnUseTemplate).toHaveBeenCalledWith("Hello! How can I help you today?");
  });

  it("shows loading state for suggestions", () => {
    render(<AIMessageComposer onSend={mockOnSend} suggestions={[]} isGeneratingSuggestions={true} />);

    expect(screen.getByText("AI Suggestions")).toBeInTheDocument();

    // Should show loading skeleton
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("handles voice recording state", async () => {
    const user = userEvent.setup();

    render(<AIMessageComposer onSend={mockOnSend} enableVoiceInput={true} />);

    const voiceButton = screen.getByTitle("Voice input");
    await user.click(voiceButton);

    expect(screen.getByTitle("Stop recording")).toBeInTheDocument();
  });

  it("respects disabled state", () => {
    render(<AIMessageComposer onSend={mockOnSend} disabled={true} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByRole("button", { name: /send/i });
    const fileButton = screen.getByTitle("Attach file");

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
    expect(fileButton).toBeDisabled();
  });
});
