import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageComposer } from "../phoenix-ui/MessageComposer";
// Mock types since the actual types file doesn't exist
interface UltimateMessageComposerProps {
  conversationId: string;
  features: any;
  onMessageSent?: (message: any) => void;
  maxLength?: number;
  disabled?: boolean;
}

const defaultProps: UltimateMessageComposerProps = {
  conversationId: "test-conversation",
  features: {
    ai: { enabled: true },
    attachments: { enabled: true },
    voice: { enabled: true },
    emoji: { enabled: true },
    mentions: { enabled: true },
    tagging: { enabled: true },
    templates: { enabled: true },
    realtime: { enabled: true },
    keyboard: { enabled: true },
    accessibility: { enabled: true },
  },
};

describe("MessageComposer", () => {
  it("renders without crashing", () => {
    render(<MessageComposer {...defaultProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("handles text input correctly", async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Hello world");

    expect(textarea).toHaveValue("Hello world");
  });

  it("sends message on Enter key", async () => {
    const onMessageSent = jest.fn();
    const user = userEvent.setup();

    render(<MessageComposer {...defaultProps} onMessageSent={onMessageSent} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Test message");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(onMessageSent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Test message",
        })
      );
    });
  });

  it("creates new line on Shift+Enter", async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Line 1");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(textarea, "Line 2");

    expect(textarea).toHaveValue("Line 1\nLine 2");
  });

  it("handles file attachments", async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const fileInput = screen.getByRole("button", { name: /attach file/i });

    // Simulate file selection
    fireEvent.click(fileInput);
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });
  });

  it("respects character limit", async () => {
    const user = userEvent.setup();
    const maxLength = 10;

    render(<MessageComposer {...defaultProps} maxLength={maxLength} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "This is a very long message");

    expect(textarea.value.length).toBeLessThanOrEqual(maxLength);
  });

  it("shows AI suggestions when enabled", async () => {
    render(
      <MessageComposer
        {...defaultProps}
        features={{
          ...defaultProps.features,
          ai: {
            enabled: true,
            suggestions: { enabled: true },
          },
        }}
      />
    );

    // Mock AI suggestions would appear here
    // This would require mocking the useMessageComposer hook
  });

  it("is accessible with keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<MessageComposer {...defaultProps} />);

    // Tab through interactive elements
    await user.tab();
    expect(screen.getByRole("button", { name: /attach file/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: /voice recording/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: /add emoji/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("supports disabled state", () => {
    render(<MessageComposer {...defaultProps} disabled />);

    const textarea = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: /send message/i });

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});
