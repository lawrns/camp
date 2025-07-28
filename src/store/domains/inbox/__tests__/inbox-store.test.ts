/**
 * Tests for the Inbox Domain Store
 */

import { act, renderHook } from "@testing-library/react-hooks";
import { useInboxStore } from "../inbox-store";

describe("Inbox Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    useInboxStore.setState({
      messageText: "",
      isSending: false,
      isFileUploading: false,
      selectedConversations: new Set(),
      conversationListWidth: 320,
      sidebarWidth: 320,
      showPreferences: false,
      showTicketDialog: false,
      showAssignmentPanel: false,
      showCustomerProfile: false,
    });
  });

  describe("Message Composition", () => {
    it("should update message text", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setMessageText("Hello world");
      });

      expect(result.current.messageText).toBe("Hello world");
    });

    it("should clear message text", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setMessageText("Hello world");
        result.current.clearMessage();
      });

      expect(result.current.messageText).toBe("");
    });

    it("should manage sending state", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setIsSending(true);
      });

      expect(result.current.isSending).toBe(true);
    });

    it("should manage file upload state", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setIsFileUploading(true);
      });

      expect(result.current.isFileUploading).toBe(true);
    });
  });

  describe("Bulk Selection", () => {
    it("should add conversations to selection", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.addSelectedConversation("conv1");
        result.current.addSelectedConversation("conv2");
      });

      expect(result.current.selectedConversations.has("conv1")).toBe(true);
      expect(result.current.selectedConversations.has("conv2")).toBe(true);
      expect(result.current.selectedConversations.size).toBe(2);
    });

    it("should remove conversations from selection", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setSelectedConversations(new Set(["conv1", "conv2"]));
        result.current.removeSelectedConversation("conv1");
      });

      expect(result.current.selectedConversations.has("conv1")).toBe(false);
      expect(result.current.selectedConversations.has("conv2")).toBe(true);
      expect(result.current.selectedConversations.size).toBe(1);
    });

    it("should toggle conversation selection", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.toggleConversationSelection("conv1");
      });
      expect(result.current.selectedConversations.has("conv1")).toBe(true);

      act(() => {
        result.current.toggleConversationSelection("conv1");
      });
      expect(result.current.selectedConversations.has("conv1")).toBe(false);
    });

    it("should select all conversations", () => {
      const { result } = renderHook(() => useInboxStore());
      const conversationIds = ["conv1", "conv2", "conv3"];

      act(() => {
        result.current.selectAllConversations(conversationIds);
      });

      expect(result.current.selectedConversations.size).toBe(3);
      conversationIds.forEach((id: any) => {
        expect(result.current.selectedConversations.has(id)).toBe(true);
      });
    });

    it("should clear all selections", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setSelectedConversations(new Set(["conv1", "conv2"]));
        result.current.clearSelectedConversations();
      });

      expect(result.current.selectedConversations.size).toBe(0);
    });
  });

  describe("Panel Sizing", () => {
    it("should update conversation list width with constraints", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setConversationListWidth(400);
      });
      expect(result.current.conversationListWidth).toBe(400);

      // Test minimum constraint
      act(() => {
        result.current.setConversationListWidth(100);
      });
      expect(result.current.conversationListWidth).toBe(280);

      // Test maximum constraint
      act(() => {
        result.current.setConversationListWidth(1000);
      });
      expect(result.current.conversationListWidth).toBe(600);
    });

    it("should update sidebar width with constraints", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setSidebarWidth(400);
      });
      expect(result.current.sidebarWidth).toBe(400);

      // Test minimum constraint
      act(() => {
        result.current.setSidebarWidth(100);
      });
      expect(result.current.sidebarWidth).toBe(280);

      // Test maximum constraint
      act(() => {
        result.current.setSidebarWidth(1000);
      });
      expect(result.current.sidebarWidth).toBe(600);
    });
  });

  describe("Panel Visibility", () => {
    it("should toggle preferences panel", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.togglePreferences();
      });
      expect(result.current.showPreferences).toBe(true);

      act(() => {
        result.current.togglePreferences();
      });
      expect(result.current.showPreferences).toBe(false);
    });

    it("should toggle ticket dialog", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.toggleTicketDialog();
      });
      expect(result.current.showTicketDialog).toBe(true);

      act(() => {
        result.current.toggleTicketDialog();
      });
      expect(result.current.showTicketDialog).toBe(false);
    });

    it("should clear all panels", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setShowPreferences(true);
        result.current.setShowTicketDialog(true);
        result.current.setShowAssignmentPanel(true);
        result.current.setShowCustomerProfile(true);
        result.current.clearAllPanels();
      });

      expect(result.current.showPreferences).toBe(false);
      expect(result.current.showTicketDialog).toBe(false);
      expect(result.current.showAssignmentPanel).toBe(false);
      expect(result.current.showCustomerProfile).toBe(false);
    });
  });

  describe("Utility Actions", () => {
    it("should reset inbox state while preserving panel sizes", () => {
      const { result } = renderHook(() => useInboxStore());

      act(() => {
        result.current.setMessageText("Hello");
        result.current.setIsSending(true);
        result.current.setConversationListWidth(400);
        result.current.setSidebarWidth(350);
        result.current.setShowPreferences(true);
        result.current.addSelectedConversation("conv1");
        result.current.resetInboxState();
      });

      // Should reset most state
      expect(result.current.messageText).toBe("");
      expect(result.current.isSending).toBe(false);
      expect(result.current.showPreferences).toBe(false);
      expect(result.current.selectedConversations.size).toBe(0);

      // Should preserve panel sizes
      expect(result.current.conversationListWidth).toBe(400);
      expect(result.current.sidebarWidth).toBe(350);
    });
  });
});
