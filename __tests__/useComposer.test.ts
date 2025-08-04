import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useComposer } from '../hooks/useComposer';

// Mock dependencies
vi.mock('@/lib/data/note', () => ({
  addNote: vi.fn()
}));

describe('useComposer Hook', () => {
  const mockProps = {
    selectedConversation: {
      id: 'test-conversation-id',
      organization_id: 'test-org-id'
    },
    user: { id: 'test-user-id', organizationId: 'test-org-id' },
    sendMessage: vi.fn(),
    setNewMessage: vi.fn(),
    handleTyping: vi.fn(),
    stopTyping: vi.fn(),
    autoResizeTextarea: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      expect(result.current.composerMode).toBe('reply');
      expect(result.current.showMentions).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.showHelp).toBe(false);
    });

    it('provides all required handlers and utilities', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      expect(typeof result.current.setComposerMode).toBe('function');
      expect(typeof result.current.setShowMentions).toBe('function');
      expect(typeof result.current.setShowHelp).toBe('function');
      expect(typeof result.current.handleKeyDown).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.handleNoteSubmit).toBe('function');
      expect(typeof result.current.handleForwardMessage).toBe('function');
      expect(typeof result.current.handleContentChange).toBe('function');
      expect(typeof result.current.handleMentionSelect).toBe('function');
      expect(typeof result.current.getPlaceholder).toBe('function');
      expect(typeof result.current.getSendButtonText).toBe('function');
      expect(typeof result.current.getCharacterLimit).toBe('function');
    });
  });

  describe('Mode Management', () => {
    it('changes composer mode correctly', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      act(() => {
        result.current.setComposerMode('note');
      });

      expect(result.current.composerMode).toBe('note');
    });

    it('updates placeholder based on mode', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      // Default reply mode
      expect(result.current.getPlaceholder()).toBe('Type your message...');

      act(() => {
        result.current.setComposerMode('note');
      });

      expect(result.current.getPlaceholder()).toBe('Add internal note...');

      act(() => {
        result.current.setComposerMode('forward');
      });

      expect(result.current.getPlaceholder()).toBe('Forward message...');
    });

    it('updates send button text based on mode', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      // Default reply mode
      expect(result.current.getSendButtonText()).toBe('Send');

      act(() => {
        result.current.setComposerMode('note');
      });

      expect(result.current.getSendButtonText()).toBe('Add Note');

      act(() => {
        result.current.setComposerMode('forward');
      });

      expect(result.current.getSendButtonText()).toBe('Forward');
    });

    it('updates character limit based on mode', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      // Default reply mode
      expect(result.current.getCharacterLimit()).toBe(2000);

      act(() => {
        result.current.setComposerMode('note');
      });

      expect(result.current.getCharacterLimit()).toBe(5000);
    });
  });

  describe('Mentions System', () => {
    it('shows mentions when @ is typed', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        target: { value: 'Hello @' }
      } as React.ChangeEvent<HTMLTextAreaElement>;

      act(() => {
        result.current.handleContentChange(mockEvent);
      });

      expect(result.current.showMentions).toBe(true);
    });

    it('hides mentions when @ is removed', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      // First show mentions
      act(() => {
        result.current.setShowMentions(true);
      });

      expect(result.current.showMentions).toBe(true);

      // Then remove @
      const mockEvent = {
        target: { value: 'Hello world' }
      } as React.ChangeEvent<HTMLTextAreaElement>;

      act(() => {
        result.current.handleContentChange(mockEvent);
      });

      expect(result.current.showMentions).toBe(false);
    });

    it('handles mention selection', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      act(() => {
        result.current.setShowMentions(true);
      });

      expect(result.current.showMentions).toBe(true);

      act(() => {
        result.current.handleMentionSelect({ id: 'user-1', name: 'John Doe' });
      });

      expect(result.current.showMentions).toBe(false);
    });

    it('resets mentions when mode changes', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      act(() => {
        result.current.setShowMentions(true);
      });

      expect(result.current.showMentions).toBe(true);

      act(() => {
        result.current.setComposerMode('note');
      });

      expect(result.current.showMentions).toBe(false);
    });
  });

  describe('Keyboard Handling', () => {
    it('handles Enter key for submission', async () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn()
      } as unknown as React.KeyboardEvent;

      await act(async () => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles @ key for mentions', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        key: '@',
        preventDefault: vi.fn()
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(result.current.showMentions).toBe(true);
    });

    it('allows Shift+Enter for new lines', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        key: 'Enter',
        shiftKey: true,
        preventDefault: vi.fn()
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Content Change Handling', () => {
    it('updates message and triggers typing', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        target: { value: 'Hello world' }
      } as React.ChangeEvent<HTMLTextAreaElement>;

      act(() => {
        result.current.handleContentChange(mockEvent);
      });

      expect(mockProps.setNewMessage).toHaveBeenCalledWith('Hello world');
      expect(mockProps.handleTyping).toHaveBeenCalled();
      expect(mockProps.autoResizeTextarea).toHaveBeenCalled();
    });
  });

  describe('Note Submission', () => {
    it('submits note successfully', async () => {
      const { addNote } = await import('@/lib/data/note');
      vi.mocked(addNote).mockResolvedValueOnce({} as any);

      const { result } = renderHook(() => useComposer(mockProps));

      await act(async () => {
        await result.current.handleNoteSubmit('Test note content');
      });

      expect(addNote).toHaveBeenCalledWith({
        conversationId: 'test-conversation-id',
        message: 'Test note content',
        user: mockProps.user
      });
      expect(mockProps.setNewMessage).toHaveBeenCalledWith('');
    });

    it('handles note submission errors', async () => {
      const { addNote } = await import('@/lib/data/note');
      const error = new Error('Note submission failed');
      vi.mocked(addNote).mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useComposer(mockProps));

      await act(async () => {
        await expect(result.current.handleNoteSubmit('Test note')).rejects.toThrow('Note submission failed');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error adding note:', error);

      consoleSpy.mockRestore();
    });

    it('does not submit note without conversation or user', async () => {
      const { addNote } = await import('@/lib/data/note');

      const { result } = renderHook(() => useComposer({
        ...mockProps,
        selectedConversation: null,
        user: null
      }));

      await act(async () => {
        await result.current.handleNoteSubmit('Test note');
      });

      expect(addNote).not.toHaveBeenCalled();
    });
  });

  describe('Forward Message', () => {
    it('handles forward message', async () => {
      const { result } = renderHook(() => useComposer(mockProps));

      await act(async () => {
        await result.current.handleForwardMessage('Forward content');
      });

      expect(mockProps.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Submit Handling', () => {
    it('handles submit in reply mode', async () => {
      const { result } = renderHook(() => useComposer(mockProps));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockProps.sendMessage).toHaveBeenCalled();
    });

    it('handles submit in forward mode', async () => {
      const { result } = renderHook(() => useComposer(mockProps));

      act(() => {
        result.current.setComposerMode('forward');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockProps.sendMessage).toHaveBeenCalled();
    });

    it('prevents multiple submissions', async () => {
      const { result } = renderHook(() => useComposer(mockProps));

      // First submission
      await act(async () => {
        await result.current.handleSubmit();
      });

      // Second submission should be prevented
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockProps.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        preventDefault: vi.fn()
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles drag leave events', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        preventDefault: vi.fn(),
        relatedTarget: document.createElement('div')
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragLeave(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles file drop events', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      const mockEvent = {
        preventDefault: vi.fn()
      } as unknown as React.DragEvent;

      act(() => {
        result.current.onFileDrop(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Help System', () => {
    it('toggles help visibility', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      expect(result.current.showHelp).toBe(false);

      act(() => {
        result.current.setShowHelp(true);
      });

      expect(result.current.showHelp).toBe(true);

      act(() => {
        result.current.setShowHelp(false);
      });

      expect(result.current.showHelp).toBe(false);
    });
  });

  describe('Refs', () => {
    it('provides composer ref', () => {
      const { result } = renderHook(() => useComposer(mockProps));

      expect(result.current.composerRef).toBeDefined();
      expect(result.current.composerRef.current).toBeNull();
    });
  });
}); 