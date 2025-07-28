"use client";

import { useCallback, useMemo, useState } from "react";
import { filterConversations } from "../utils/conversationHelpers";

export function useInboxState() {
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());

  // Dialog states
  const [showPreferences, setShowPreferences] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);

  // Panel states
  const [sidebarWidth, setSidebarWidth] = useState(384); // 24rem = 384px
  const [conversationListWidth, setConversationListWidth] = useState(320);

  // Callbacks
  const handleMultiSelect = useCallback(
    (conversationId: string, isCtrlKey: boolean) => {
      if (isCtrlKey) {
        const newSelected = new Set(selectedConversations);
        if (newSelected.has(conversationId)) {
          newSelected.delete(conversationId);
        } else {
          newSelected.add(conversationId);
        }
        setSelectedConversations(newSelected);
        return true;
      }
      setSelectedConversations(new Set());
      return false;
    },
    [selectedConversations]
  );

  const clearSelection = useCallback(() => {
    setSelectedConversations(new Set());
  }, []);

  return {
    // Search and filter
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,

    // Message input
    messageText,
    setMessageText,
    isSending,
    setIsSending,

    // Selection
    selectedConversations,
    setSelectedConversations,
    handleMultiSelect,
    clearSelection,

    // Dialogs
    showPreferences,
    setShowPreferences,
    showTicketDialog,
    setShowTicketDialog,
    showAssignmentPanel,
    setShowAssignmentPanel,
    showCustomerProfile,
    setShowCustomerProfile,

    // Panels
    sidebarWidth,
    setSidebarWidth,
    conversationListWidth,
    setConversationListWidth,
  };
}
