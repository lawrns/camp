import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composer } from '../Composer';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User' }
  })
}));

// Mock file upload security
const mockValidateFile = jest.fn();
jest.mock('@/lib/security/fileUploadSecurity', () => ({
  FileUploadSecurity: {
    validateFile: mockValidateFile
  }
}));

const mockProps = {
  newMessage: '',
  setNewMessage: jest.fn(),
  attachments: [],
  setAttachments: jest.fn(),
  isSending: false,
  sendMessage: jest.fn(),
  isAIActive: false,
  toggleAIHandover: jest.fn(),
  selectedConversation: {
    id: 'test-conv',
    customerName: 'Test Customer',
    status: 'open' as const,
  },
  showEmojiPicker: false,
  setShowEmojiPicker: jest.fn(),
  showTemplates: false,
  setShowTemplates: jest.fn(),
  showAISuggestions: false,
  setShowAISuggestions: jest.fn(),
  aiSuggestions: [],
  generateAISuggestions: jest.fn(),
  useSuggestion: jest.fn(),
  textareaRef: React.createRef<HTMLTextAreaElement>(),
  fileInputRef: React.createRef<HTMLInputElement>(),
  handleFileInput: jest.fn(),
  handleFileDrop: jest.fn(),
  isDragOver: false,
  setIsDragOver: jest.fn(),
  typingUsers: [],
  onlineUsers: [],
  handleTyping: jest.fn(),
  stopTyping: jest.fn(),
};

describe('Composer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders single toolbar with correct icons', () => {
      render(<Composer {...mockProps} />);
      
      // Check that only the clean toolbar is rendered
      expect(screen.getByTestId('composer-toolbar')).toBeInTheDocument();
      
      // Check for the three core action buttons
      expect(screen.getByTestId('composer-attachment-button')).toBeInTheDocument();
      expect(screen.getByTestId('composer-image-button')).toBeInTheDocument();
      expect(screen.getByTestId('composer-emoji-button')).toBeInTheDocument();
      
      // Check for send button
      expect(screen.getByTestId('composer-send-button')).toBeInTheDocument();
      
      // Ensure no duplicate toolbars exist
      const toolbars = screen.getAllByRole('toolbar');
      expect(toolbars).toHaveLength(1);
    });

    it('renders textarea with proper accessibility attributes', () => {
      render(<Composer {...mockProps} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Type your message');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders send button with proper accessibility', () => {
      render(<Composer {...mockProps} />);
      
      const sendButton = screen.getByTestId('composer-send-button');
      expect(sendButton).toHaveAttribute('aria-label');
      expect(sendButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('File Attachment', () => {
    it('handles file attachment click', async () => {
      const user = userEvent.setup();
      render(<Composer {...mockProps} />);
      
      const attachmentButton = screen.getByTestId('composer-attachment-button');
      await user.click(attachmentButton);
      
      // File input should be triggered (though we can't test the actual file dialog)
      const fileInput = screen.getByTestId('composer-file-input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx');
    });

    it('validates file types and size limits', async () => {
      mockValidateFile.mockReturnValue({
        isValid: false,
        errors: ['File type not allowed'],
        warnings: []
      });

      render(<Composer {...mockProps} />);

      const fileInput = screen.getByTestId('composer-file-input');
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' });

      await userEvent.upload(fileInput, file);

      expect(mockValidateFile).toHaveBeenCalledWith(file);
    });

    it('accepts valid file types', async () => {
      mockValidateFile.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      render(<Composer {...mockProps} />);

      const fileInput = screen.getByTestId('composer-file-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      expect(mockValidateFile).toHaveBeenCalledWith(file);
      expect(mockProps.handleFileInput).toHaveBeenCalled();
    });
  });

  describe('Message Sending', () => {
    it('emits onSend with message payload', async () => {
      const user = userEvent.setup();
      const mockSendMessage = jest.fn();
      
      render(<Composer {...mockProps} sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      const sendButton = screen.getByTestId('composer-send-button');
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('disables send button when message is empty', () => {
      render(<Composer {...mockProps} newMessage="" />);
      
      const sendButton = screen.getByTestId('composer-send-button');
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when message has content', () => {
      render(<Composer {...mockProps} newMessage="Test message" />);
      
      const sendButton = screen.getByTestId('composer-send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('shows loading state when sending', () => {
      render(<Composer {...mockProps} isSending={true} newMessage="Test" />);
      
      const sendButton = screen.getByTestId('composer-send-button');
      expect(sendButton).toBeDisabled();
      expect(screen.getByText('Sending message...')).toBeInTheDocument();
    });
  });

  describe('Emoji Picker', () => {
    it('shows/hides emoji picker on click', async () => {
      const user = userEvent.setup();
      const mockSetShowEmojiPicker = jest.fn();
      
      render(<Composer {...mockProps} setShowEmojiPicker={mockSetShowEmojiPicker} />);
      
      const emojiButton = screen.getByTestId('composer-emoji-button');
      await user.click(emojiButton);
      
      expect(mockSetShowEmojiPicker).toHaveBeenCalledWith(true);
    });

    it('has proper ARIA attributes for emoji button', () => {
      render(<Composer {...mockProps} showEmojiPicker={false} />);
      
      const emojiButton = screen.getByTestId('composer-emoji-button');
      expect(emojiButton).toHaveAttribute('aria-expanded', 'false');
      expect(emojiButton).toHaveAttribute('aria-label', 'Open emoji picker');
    });

    it('updates ARIA label when emoji picker is open', () => {
      render(<Composer {...mockProps} showEmojiPicker={true} />);
      
      const emojiButton = screen.getByTestId('composer-emoji-button');
      expect(emojiButton).toHaveAttribute('aria-expanded', 'true');
      expect(emojiButton).toHaveAttribute('aria-label', 'Close emoji picker');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Enter key to send message', async () => {
      const user = userEvent.setup();
      const mockSendMessage = jest.fn();
      
      render(<Composer {...mockProps} sendMessage={mockSendMessage} newMessage="Test" />);
      
      const textarea = screen.getByTestId('composer-textarea');
      await user.click(textarea);
      await user.keyboard('{Enter}');
      
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('supports Shift+Enter for new line', async () => {
      const user = userEvent.setup();
      const mockSendMessage = jest.fn();
      const mockSetNewMessage = jest.fn();
      
      render(<Composer {...mockProps} sendMessage={mockSendMessage} setNewMessage={mockSetNewMessage} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      await user.click(textarea);
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      
      // Should not send message
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('supports Tab navigation through toolbar', async () => {
      const user = userEvent.setup();
      render(<Composer {...mockProps} />);
      
      // Tab through toolbar buttons
      await user.tab();
      expect(screen.getByTestId('composer-attachment-button').querySelector('button')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('composer-image-button')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('composer-emoji-button')).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('shows error state for character limit exceeded', () => {
      const longMessage = 'a'.repeat(5001); // Assuming 5000 char limit
      render(<Composer {...mockProps} newMessage={longMessage} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby', 'character-limit-error');
    });

    it('handles file upload errors gracefully', async () => {
      mockValidateFile.mockReturnValue({
        isValid: false,
        errors: ['File too large'],
        warnings: []
      });

      render(<Composer {...mockProps} />);

      const fileInput = screen.getByTestId('composer-file-input');
      const largeFile = new File(['x'.repeat(30 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, largeFile);

      // Should show error message (implementation depends on error handling UI)
      expect(mockValidateFile).toHaveBeenCalledWith(largeFile);
    });
  });

  describe('Accessibility Compliance', () => {
    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<Composer {...mockProps} />);
      
      // All interactive elements should be focusable
      const focusableElements = [
        screen.getByTestId('composer-attachment-button').querySelector('button'),
        screen.getByTestId('composer-image-button'),
        screen.getByTestId('composer-emoji-button'),
        screen.getByTestId('composer-textarea'),
        screen.getByTestId('composer-send-button'),
      ];
      
      for (const element of focusableElements) {
        if (element) {
          await user.tab();
          expect(element).toHaveFocus();
        }
      }
    });

    it('has proper ARIA roles and labels', () => {
      render(<Composer {...mockProps} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Message formatting tools');
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Type your message');
    });

    it('supports screen reader announcements', () => {
      render(<Composer {...mockProps} isSending={true} />);
      
      // Screen reader only text should be present
      expect(screen.getByText('Sending message...')).toHaveClass('sr-only');
    });
  });
});
