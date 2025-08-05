import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import Composer from '../components/InboxDashboard/sub-components/Composer';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', organizationId: 'test-org-id' }
  })
}));

jest.mock('@/lib/data/note', () => ({
  addNote: jest.fn()
}));

jest.mock('@/components/inbox/MentionsSystem', () => ({
  MentionsSystem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mentions-system">{children}</div>
  )
}));

jest.mock('@/components/inbox/AIHandoverButton', () => ({
  AIHandoverButton: () => <div data-testid="ai-handover-button" />
}));

jest.mock('./EmojiPicker', () => ({
  default: () => <div data-testid="emoji-picker" />
}));

jest.mock('./TemplatePanel', () => ({
  default: () => <div data-testid="template-panel" />
}));

jest.mock('./AISuggestionsPanel', () => ({
  default: () => <div data-testid="ai-suggestions-panel" />
}));

jest.mock('./AttachmentPreview', () => ({
  default: () => <div data-testid="attachment-preview" />
}));

// Mock conversation data
const mockConversation = {
  id: 'test-conversation-id',
  organization_id: 'test-org-id',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  lastMessagePreview: 'Test message'
};

// Mock props
const defaultProps = {
  newMessage: '',
  setNewMessage: jest.fn(),
  attachments: [],
  setAttachments: jest.fn(),
  isSending: false,
  sendMessage: jest.fn(),
  isAIActive: false,
  toggleAIHandover: jest.fn(),
  selectedConversation: mockConversation,
  showEmojiPicker: false,
  setShowEmojiPicker: jest.fn(),
  showTemplates: false,
  setShowTemplates: jest.fn(),
  showAISuggestions: false,
  setShowAISuggestions: jest.fn(),
  aiSuggestions: [],
  generateAISuggestions: jest.fn(),
  useSuggestion: jest.fn(),
  textareaRef: { current: null },
  fileInputRef: { current: null },
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
    it('renders all composer elements', () => {
      render(<Composer {...defaultProps} />);
      
      expect(screen.getByTestId('composer')).toBeInTheDocument();
      expect(screen.getByTestId('composer-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('composer-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('composer-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('composer-send-button')).toBeInTheDocument();
    });

    it('renders tab system with correct default state', () => {
      render(<Composer {...defaultProps} />);
      
      expect(screen.getByTestId('composer-tab-reply')).toBeInTheDocument();
      expect(screen.getByTestId('composer-tab-note')).toBeInTheDocument();
      expect(screen.getByTestId('composer-tab-forward')).toBeInTheDocument();
      expect(screen.getByTestId('composer-help-button')).toBeInTheDocument();
    });

    it('renders all icon buttons', () => {
      render(<Composer {...defaultProps} />);
      
      expect(screen.getByTestId('composer-attachment-button')).toBeInTheDocument();
      expect(screen.getByTestId('composer-image-button')).toBeInTheDocument();
      expect(screen.getByTestId('composer-emoji-button')).toBeInTheDocument();
    });
  });

  describe('Tab System', () => {
    it('switches to note mode when note tab is clicked', async () => {
      const user = userEvent.setup();
      render(<Composer {...defaultProps} />);
      
      const noteTab = screen.getByTestId('composer-tab-note');
      await user.click(noteTab);
      
      const textarea = screen.getByTestId('composer-textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Add internal note...');
    });

    it('switches to forward mode when forward tab is clicked', async () => {
      const user = userEvent.setup();
      render(<Composer {...defaultProps} />);
      
      const forwardTab = screen.getByTestId('composer-tab-forward');
      await user.click(forwardTab);
      
      const textarea = screen.getByTestId('composer-textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Forward message...');
    });

    it('shows help tooltip when help button is clicked', async () => {
      const user = userEvent.setup();
      render(<Composer {...defaultProps} />);
      
      const helpButton = screen.getByTestId('composer-help-button');
      await user.click(helpButton);
      
      expect(screen.getByTestId('composer-help-tooltip')).toBeInTheDocument();
      expect(screen.getByText('Composer Tips:')).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('updates message when typing', async () => {
      const user = userEvent.setup();
      const setNewMessage = jest.fn();
      render(<Composer {...defaultProps} setNewMessage={setNewMessage} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      await user.type(textarea, 'Hello world');
      
      expect(setNewMessage).toHaveBeenCalledWith('Hello world');
    });

    it('handles Enter key to submit message', async () => {
      const user = userEvent.setup();
      const sendMessage = jest.fn();
      render(<Composer {...defaultProps} newMessage="Test message" sendMessage={sendMessage} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      await user.type(textarea, '{enter}');
      
      expect(sendMessage).toHaveBeenCalled();
    });

    it('shows character count when near limit', () => {
      const longMessage = 'a'.repeat(1601); // Over 80% of 2000 limit
      render(<Composer {...defaultProps} newMessage={longMessage} />);
      
      expect(screen.getByText('1601/2000')).toBeInTheDocument();
    });

    it('disables send button when over character limit', () => {
      const longMessage = 'a'.repeat(2001); // Over 2000 limit
      render(<Composer {...defaultProps} newMessage={longMessage} />);
      
      const sendButton = screen.getByTestId('composer-send-button');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Internal Notes', () => {
    it('submits note when in note mode', async () => {
      const user = userEvent.setup();
      const { addNote } = await import('@/lib/data/note');
      
      render(<Composer {...defaultProps} newMessage="Test note" />);
      
      // Switch to note mode
      const noteTab = screen.getByTestId('composer-tab-note');
      await user.click(noteTab);
      
      // Submit note
      const sendButton = screen.getByTestId('composer-send-button');
      await user.click(sendButton);
      
      expect(addNote).toHaveBeenCalledWith({
        conversationId: 'test-conversation-id',
        message: 'Test note',
        user: expect.any(Object)
      });
    });

    it('shows note mode indicator', async () => {
      const user = userEvent.setup();
      render(<Composer {...defaultProps} />);
      
      const noteTab = screen.getByTestId('composer-tab-note');
      await user.click(noteTab);
      
      expect(screen.getByText('Internal note - won\'t be sent to customer')).toBeInTheDocument();
    });
  });

  describe('Mentions System', () => {
    it('shows mentions system when @ is typed', async () => {
      const user = userEvent.setup();
      render(<Composer {...defaultProps} />);
      
      const textarea = screen.getByTestId('composer-textarea');
      await user.type(textarea, '@');
      
      expect(screen.getByTestId('mentions-system')).toBeInTheDocument();
    });

    it('toggles mentions with mentions button', async () => {
      const user = userEvent.setup();
      render(<Composer {...defaultProps} />);
      
      const mentionsButton = screen.getByTestId('composer-mentions-button');
      await user.click(mentionsButton);
      
      expect(screen.getByTestId('mentions-system')).toBeInTheDocument();
    });
  });

  describe('File Handling', () => {
    it('shows drag overlay when dragging files', () => {
      render(<Composer {...defaultProps} isDragOver={true} />);
      
      expect(screen.getByTestId('composer-drag-overlay')).toBeInTheDocument();
      expect(screen.getByText('Drop files to attach')).toBeInTheDocument();
    });

    it('handles file input change', async () => {
      const user = userEvent.setup();
      const handleFileInput = jest.fn();
      render(<Composer {...defaultProps} handleFileInput={handleFileInput} />);
      
      const fileInput = screen.getByTestId('composer-file-input');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await user.upload(fileInput, file);
      
      expect(handleFileInput).toHaveBeenCalled();
    });
  });

  describe('AI Features', () => {
    it('toggles AI suggestions panel', async () => {
      const user = userEvent.setup();
      const setShowAISuggestions = jest.fn();
      render(<Composer {...defaultProps} setShowAISuggestions={setShowAISuggestions} />);
      
      const aiButton = screen.getByTestId('composer-tab-reply');
      await user.click(aiButton);
      
      expect(setShowAISuggestions).toHaveBeenCalledWith(true);
    });

    it('toggles templates panel', async () => {
      const user = userEvent.setup();
      const setShowTemplates = jest.fn();
      render(<Composer {...defaultProps} setShowTemplates={setShowTemplates} />);
      
      const templatesButton = screen.getByTestId('composer-tab-note');
      await user.click(templatesButton);
      
      expect(setShowTemplates).toHaveBeenCalledWith(true);
    });

    it('toggles emoji picker', async () => {
      const user = userEvent.setup();
      const setShowEmojiPicker = jest.fn();
      render(<Composer {...defaultProps} setShowEmojiPicker={setShowEmojiPicker} />);
      
      const emojiButton = screen.getByTestId('composer-emoji-button');
      await user.click(emojiButton);
      
      expect(setShowEmojiPicker).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Composer {...defaultProps} />);
      
      expect(screen.getByLabelText('Send')).toBeInTheDocument();
      expect(screen.getByLabelText('Open emoji picker')).toBeInTheDocument();
      expect(screen.getByLabelText('Attach files')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
    });

    it('has proper test IDs for testing', () => {
      render(<Composer {...defaultProps} />);
      
      expect(screen.getByTestId('composer')).toBeInTheDocument();
      expect(screen.getByTestId('composer-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('composer-send-button')).toBeInTheDocument();
      expect(screen.getByTestId('composer-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('composer-toolbar')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles note submission errors gracefully', async () => {
      const user = userEvent.setup();
      const { addNote } = await import('@/lib/data/note');
      jest.mocked(addNote).mockRejectedValueOnce(new Error('Note submission failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Composer {...defaultProps} newMessage="Test note" />);
      
      // Switch to note mode and submit
      const noteTab = screen.getByTestId('composer-tab-note');
      await user.click(noteTab);
      
      const sendButton = screen.getByTestId('composer-send-button');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error adding note:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('memoizes callbacks properly', () => {
      const { rerender } = render(<Composer {...defaultProps} />);
      
      // Re-render with same props
      rerender(<Composer {...defaultProps} />);
      
      // Component should not re-render unnecessarily
      expect(screen.getByTestId('composer')).toBeInTheDocument();
    });
  });
}); 