import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Types
interface ComposerState {
  draftText: string;
  noteMode: boolean;
  isRichTextEnabled: boolean;
  setDraftText: (text: string) => void;
  setNoteMode: (enabled: boolean) => void;
  setRichTextEnabled: (enabled: boolean) => void;
  clearDraft: () => void;
}

interface ConversationState {
  selectedConversationId: string | null;
  setSelectedConversation: (id: string | null) => void;
}

interface UIState {
  showAIAssist: boolean;
  isSending: boolean;
  isLoadingMessages: boolean;
  setShowAIAssist: (show: boolean) => void;
  setIsSending: (sending: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
}

interface AIState {
  suggestions: Array<{
    id: string;
    content: string;
    confidence: number;
  }>;
  isLoadingSuggestions: boolean;
  setSuggestions: (suggestions: AIState["suggestions"]) => void;
  setIsLoadingSuggestions: (loading: boolean) => void;
  clearSuggestions: () => void;
}

// Combined store type
interface InboxStore extends ComposerState, ConversationState, UIState, AIState {}

// Create the store with slices
export const useInboxStore = create<InboxStore>()(
  devtools(
    (set) => ({
      // Composer slice
      draftText: "",
      noteMode: false,
      isRichTextEnabled: true,
      setDraftText: (text) => set({ draftText: text }),
      setNoteMode: (enabled) => set({ noteMode: enabled }),
      setRichTextEnabled: (enabled) => set({ isRichTextEnabled: enabled }),
      clearDraft: () => set({ draftText: "", noteMode: false }),

      // Conversation slice
      selectedConversationId: null,
      setSelectedConversation: (id) => set({ selectedConversationId: id }),

      // UI slice
      showAIAssist: false,
      isSending: false,
      isLoadingMessages: false,
      setShowAIAssist: (show) => set({ showAIAssist: show }),
      setIsSending: (sending) => set({ isSending: sending }),
      setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

      // AI slice
      suggestions: [],
      isLoadingSuggestions: false,
      setSuggestions: (suggestions) => set({ suggestions }),
      setIsLoadingSuggestions: (loading) => set({ isLoadingSuggestions: loading }),
      clearSuggestions: () => set({ suggestions: [] }),
    }),
    {
      name: "inbox-store",
    }
  )
);

// Selectors for better performance
// Individual property selectors to avoid infinite loops
export const useDraftText = () => useInboxStore((state) => state.draftText);
export const useNoteMode = () => useInboxStore((state) => state.noteMode);
export const useIsRichTextEnabled = () => useInboxStore((state) => state.isRichTextEnabled);
export const useSetDraftText = () => useInboxStore((state) => state.setDraftText);
export const useSetNoteMode = () => useInboxStore((state) => state.setNoteMode);
export const useClearDraft = () => useInboxStore((state) => state.clearDraft);

export const useSelectedConversationId = () => useInboxStore((state) => state.selectedConversationId);
export const useSetSelectedConversation = () => useInboxStore((state) => state.setSelectedConversation);

export const useShowAIAssist = () => useInboxStore((state) => state.showAIAssist);
export const useIsSending = () => useInboxStore((state) => state.isSending);
export const useIsLoadingMessages = () => useInboxStore((state) => state.isLoadingMessages);
export const useSetShowAIAssist = () => useInboxStore((state) => state.setShowAIAssist);
export const useSetIsSending = () => useInboxStore((state) => state.setIsSending);
export const useSetIsLoadingMessages = () => useInboxStore((state) => state.setIsLoadingMessages);

export const useSuggestions = () => useInboxStore((state) => state.suggestions);
export const useIsLoadingSuggestions = () => useInboxStore((state) => state.isLoadingSuggestions);
export const useSetSuggestions = () => useInboxStore((state) => state.setSuggestions);
export const useSetIsLoadingSuggestions = () => useInboxStore((state) => state.setIsLoadingSuggestions);
export const useClearSuggestions = () => useInboxStore((state) => state.clearSuggestions);

// Composite selectors (use these sparingly and only when needed)
export const useComposerState = () => {
  const draftText = useDraftText();
  const noteMode = useNoteMode();
  const isRichTextEnabled = useIsRichTextEnabled();
  const setDraftText = useSetDraftText();
  const setNoteMode = useSetNoteMode();
  const clearDraft = useClearDraft();

  return {
    draftText,
    noteMode,
    isRichTextEnabled,
    setDraftText,
    setNoteMode,
    clearDraft,
  };
};

export const useUIState = () => {
  const showAIAssist = useShowAIAssist();
  const isSending = useIsSending();
  const isLoadingMessages = useIsLoadingMessages();
  const setShowAIAssist = useSetShowAIAssist();
  const setIsSending = useSetIsSending();
  const setIsLoadingMessages = useSetIsLoadingMessages();

  return {
    showAIAssist,
    isSending,
    isLoadingMessages,
    setShowAIAssist,
    setIsSending,
    setIsLoadingMessages,
  };
};

export const useAIState = () => {
  const suggestions = useSuggestions();
  const isLoadingSuggestions = useIsLoadingSuggestions();
  const setSuggestions = useSetSuggestions();
  const setIsLoadingSuggestions = useSetIsLoadingSuggestions();
  const clearSuggestions = useClearSuggestions();

  return {
    suggestions,
    isLoadingSuggestions,
    setSuggestions,
    setIsLoadingSuggestions,
    clearSuggestions,
  };
};
