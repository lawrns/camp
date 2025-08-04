import { useState, useCallback } from "react";
import type { Conversation, FileAttachment, AISuggestion } from "../types";
import { useBulkSelection } from "./useBulkSelection";

export interface UseInboxStateReturn {
  // Selected conversation
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;
  
  // UI panels
  showCustomerDetails: boolean;
  setShowCustomerDetails: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  showConvertDialog: boolean;
  setShowConvertDialog: (show: boolean) => void;
  showAssignmentPanel: boolean;
  setShowAssignmentPanel: (show: boolean) => void;
  showConversationManagement: boolean;
  setShowConversationManagement: (show: boolean) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  
  // Message composer
  newMessage: string;
  setNewMessage: (message: string) => void;
  attachments: FileAttachment[];
  setAttachments: (attachments: FileAttachment[]) => void;
  isSending: boolean;
  setIsSending: (sending: boolean) => void;
  
  // AI features
  isAIActive: boolean;
  setIsAIActive: (active: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  showAISuggestions: boolean;
  setShowAISuggestions: (show: boolean) => void;
  aiSuggestions: AISuggestion[];
  setAISuggestions: (suggestions: AISuggestion[]) => void;
  
  // Bulk selection
  selectedConversations: string[];
  selectedCount: number;
  hasSelection: boolean;
  toggleConversationSelection: (conversationId: string) => void;
  selectConversation: (conversationId: string) => void;
  deselectConversation: (conversationId: string) => void;
  selectAllConversations: (conversations: Array<{ id: string }>) => void;
  isConversationSelected: (conversationId: string) => boolean;
  
  // Drag and drop
  isDragOver: boolean;
  setIsDragOver: (dragOver: boolean) => void;
  
  // Actions
  handleSelectConversation: (conversation: Conversation) => void;
  toggleAIHandover: () => void;
  handleAssignConversation: () => void;
  handleConvertToTicket: () => void;
  clearBulkSelection: () => void;
}

/**
 * Hook for managing inbox UI state
 * Separates UI state management from the main component
 */
export function useInboxState(): UseInboxStateReturn {
  // Selected conversation
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // UI panels
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [showConversationManagement, setShowConversationManagement] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Message composer
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // AI features
  const [isAIActive, setIsAIActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  
  // Bulk selection using safe mutation-free hook
  const bulkSelection = useBulkSelection();
  
  // Drag and drop
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Actions
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowCustomerDetails(false); // Close sidebar when switching conversations
  }, []);
  
  const toggleAIHandover = useCallback(() => {
    if (!selectedConversation) return;
    setIsAIActive(!isAIActive);
    // TODO: Update conversation in database
  }, [selectedConversation, isAIActive]);
  
  const handleAssignConversation = useCallback(() => {
    setShowAssignmentPanel(true);
  }, []);
  
  const handleConvertToTicket = useCallback(() => {
    setShowConvertDialog(true);
  }, []);
  
  const clearBulkSelection = useCallback(() => {
    bulkSelection.clearSelection();
  }, [bulkSelection]);

  return {
    // Selected conversation
    selectedConversation,
    setSelectedConversation,
    
    // UI panels
    showCustomerDetails,
    setShowCustomerDetails,
    showShortcuts,
    setShowShortcuts,
    showConvertDialog,
    setShowConvertDialog,
    showAssignmentPanel,
    setShowAssignmentPanel,
    showConversationManagement,
    setShowConversationManagement,
    showAdvancedFilters,
    setShowAdvancedFilters,
    
    // Message composer
    newMessage,
    setNewMessage,
    attachments,
    setAttachments,
    isSending,
    setIsSending,
    
    // AI features
    isAIActive,
    setIsAIActive,
    showEmojiPicker,
    setShowEmojiPicker,
    showTemplates,
    setShowTemplates,
    showAISuggestions,
    setShowAISuggestions,
    aiSuggestions,
    setAISuggestions,
    
    // Bulk selection
    selectedConversations: bulkSelection.selectedConversations,
    selectedCount: bulkSelection.selectedCount,
    hasSelection: bulkSelection.hasSelection,
    toggleConversationSelection: bulkSelection.toggleConversation,
    selectConversation: bulkSelection.selectConversation,
    deselectConversation: bulkSelection.deselectConversation,
    selectAllConversations: bulkSelection.selectAll,
    isConversationSelected: bulkSelection.isSelected,
    
    // Drag and drop
    isDragOver,
    setIsDragOver,
    
    // Actions
    handleSelectConversation,
    toggleAIHandover,
    handleAssignConversation,
    handleConvertToTicket,
    clearBulkSelection,
  };
}
