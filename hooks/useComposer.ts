import { useState, useCallback, useRef, useEffect } from 'react';
import { addNote } from '@/lib/data/note';
import type { AuthenticatedUser } from '@/lib/core/auth';

export type ComposerMode = 'reply' | 'note' | 'forward';

export interface UseComposerProps {
  selectedConversation?: any;
  user?: AuthenticatedUser;
  sendMessage: () => Promise<void>;
  setNewMessage: (message: string) => void;
  handleTyping: () => void;
  stopTyping: () => void;
  autoResizeTextarea: () => void;
}

export interface UseComposerReturn {
  // State
  composerMode: ComposerMode;
  showMentions: boolean;
  isSubmitting: boolean;
  showHelp: boolean;
  
  // Refs
  composerRef: React.RefObject<HTMLDivElement>;
  
  // Handlers
  setComposerMode: (mode: ComposerMode) => void;
  setShowMentions: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSubmit: () => Promise<void>;
  handleNoteSubmit: (content: string) => Promise<void>;
  handleForwardMessage: (content: string) => Promise<void>;
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleMentionSelect: (member: any) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  onFileDrop: (e: React.DragEvent) => void;
  
  // Utilities
  getPlaceholder: () => string;
  getSendButtonText: () => string;
  getCharacterLimit: () => number;
}

export function useComposer({
  selectedConversation,
  user,
  sendMessage,
  setNewMessage,
  handleTyping,
  stopTyping,
  autoResizeTextarea,
}: UseComposerProps): UseComposerReturn {
  // State
  const [composerMode, setComposerMode] = useState<ComposerMode>('reply');
  const [showMentions, setShowMentions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Refs
  const composerRef = useRef<HTMLDivElement>(null);
  
  // Character limits by mode
  const getCharacterLimit = useCallback(() => {
    return composerMode === 'note' ? 5000 : 2000;
  }, [composerMode]);
  
  // Mode-specific placeholders
  const getPlaceholder = useCallback(() => {
    switch (composerMode) {
      case 'note':
        return 'Add internal note...';
      case 'forward':
        return 'Forward message...';
      default:
        return 'Type your message...';
    }
  }, [composerMode]);
  
  // Mode-specific send button text
  const getSendButtonText = useCallback(() => {
    switch (composerMode) {
      case 'note':
        return 'Add Note';
      case 'forward':
        return 'Forward';
      default:
        return 'Send';
    }
  }, [composerMode]);
  
  // Enhanced submit handler with mode support
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      switch (composerMode) {
        case 'note':
          // Note submission is handled separately
          break;
        case 'forward':
          await handleForwardMessage('');
          break;
        default:
          await sendMessage();
          break;
      }
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [composerMode, isSubmitting, sendMessage]);
  
  // Internal notes submission
  const handleNoteSubmit = useCallback(async (content: string) => {
    if (!selectedConversation || !user) return;
    
    try {
      await addNote({
        conversationId: selectedConversation.id,
        message: content,
        user: user as any,
      });
      setNewMessage('');
      console.log('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }, [selectedConversation, user, setNewMessage]);
  
  // Forward message handler
  const handleForwardMessage = useCallback(async (content: string) => {
    // TODO: Implement forward functionality
    console.log('Forwarding message:', content);
    await sendMessage();
  }, [sendMessage]);
  
  // Enhanced content change handler with mentions
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    handleTyping();
    autoResizeTextarea();
    
    // Handle @ mentions
    if (value.includes('@')) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [setNewMessage, handleTyping, autoResizeTextarea]);
  
  // Handle mention selection
  const handleMentionSelect = useCallback((member: any) => {
    setShowMentions(false);
    // The MentionsSystem will handle the actual insertion
  }, []);
  
  // Handle Enter key with mode awareness
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Handle @ mentions
    if (e.key === "@") {
      setShowMentions(true);
    }
  }, [handleSubmit]);
  
  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // This will be handled by the parent component
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!composerRef.current?.contains(e.relatedTarget as Node)) {
      // This will be handled by the parent component
    }
  }, []);
  
  const onFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // This will be handled by the parent component
  }, []);
  
  // Reset mentions when mode changes
  useEffect(() => {
    setShowMentions(false);
  }, [composerMode]);
  
  return {
    // State
    composerMode,
    showMentions,
    isSubmitting,
    showHelp,
    
    // Refs
    composerRef,
    
    // Handlers
    setComposerMode,
    setShowMentions,
    setShowHelp,
    handleKeyDown,
    handleSubmit,
    handleNoteSubmit,
    handleForwardMessage,
    handleContentChange,
    handleMentionSelect,
    handleDragOver,
    handleDragLeave,
    onFileDrop,
    
    // Utilities
    getPlaceholder,
    getSendButtonText,
    getCharacterLimit,
  };
} 