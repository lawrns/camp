import { useCallback, useContext, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "@/components/unified-ui/components/Toast";

// Mock InboxContext since it doesn't exist
const mockInboxContext = {
  selectedConversation: null as { assignee_type?: string } | null,
  setAssignmentMode: (_mode: string) => {},
  generateRAGResponse: async () => ({ response: "Mock response", confidence: 0.8 }),
};

interface UseAIModeReturn {
  isAIMode: boolean;
  confidence: number;
  hasRAGContext: boolean;
  hasSuggestion: boolean;
  hasEscalationAlert: boolean;
  lastModeChangeReason: string;
  toggleMode: () => Promise<void>;
  dismissEscalationAlert: () => void;
}

export function useAIMode(conversationId: string): UseAIModeReturn {
  const { selectedConversation, setAssignmentMode, generateRAGResponse } = mockInboxContext;

  const [confidence, setConfidence] = useState(0);
  const [hasRAGContext, setHasRAGContext] = useState(false);
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [hasEscalationAlert, setHasEscalationAlert] = useState(false);
  const [lastModeChangeReason, setLastModeChangeReason] = useState("Manual toggle");

  const isAIMode = selectedConversation?.assignee_type === "ai";

  // Mock RAG engine subscription - in real app, connect to actual service
  useEffect(() => {
    if (!conversationId || !isAIMode) return;

    // Simulate RAG updates
    const interval = setInterval(() => {
      // Mock confidence calculation based on conversation
      const mockConfidence = Math.floor(Math.random() * 40) + 60; // 60-100
      setConfidence(mockConfidence);

      // Mock RAG context availability
      setHasRAGContext(Math.random() > 0.3);

      // Mock suggestion availability
      setHasSuggestion(Math.random() > 0.5);

      // Mock escalation alert (low confidence)
      setHasEscalationAlert(mockConfidence < 70);
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId, isAIMode]);

  const toggleMode = useCallback(async () => {
    if (!selectedConversation) return;

    const newMode = isAIMode ? "human" : "ai";
    const reason = isAIMode ? "Switched to human agent" : "Enabled AI assistance";

    try {
      await setAssignmentMode(newMode);
      setLastModeChangeReason(reason);

      if (newMode === "ai") {
        // Generate initial AI response
        await generateRAGResponse();
        toast({
          title: "AI Mode Enabled",
          description: "AI assistant is now active for this conversation",
        });
      } else {
        toast({
          title: "Human Mode",
          description: "Conversation assigned to human agent",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change assignment mode",
        variant: "error",
      });
    }
  }, [conversationId, isAIMode, selectedConversation, setAssignmentMode, generateRAGResponse]);

  const dismissEscalationAlert = useCallback(() => {
    setHasEscalationAlert(false);
    setLastModeChangeReason("Escalation alert dismissed");
  }, []);

  // Keyboard shortcut
  useHotkeys(
    "shift+cmd+e",
    (e) => {
      e.preventDefault();
      toggleMode();
    },
    {
      enableOnFormTags: false,
    }
  );

  return {
    isAIMode,
    confidence,
    hasRAGContext,
    hasSuggestion,
    hasEscalationAlert,
    lastModeChangeReason,
    toggleMode,
    dismissEscalationAlert,
  };
}
