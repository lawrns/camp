"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AISuggestion,
  ComposerActions,
  ComposerError,
  ComposerState,
  FileUpload,
  Tag,
  UltimateMessageComposerProps,
  User,
} from "@/components/inbox/ULTIMATE_SPEC";

export function useMessageComposer({
  conversationId,
  organizationId,
  customerId,
  features,
  onMessageSent,
  onTypingStart,
  onTypingStop,
}: Pick<
  UltimateMessageComposerProps,
  "conversationId" | "organizationId" | "customerId" | "features" | "onMessageSent" | "onTypingStart" | "onTypingStop"
>) {
  // State management
  const initialState: ComposerState = {
    content: "",
    isTyping: false,
    isSending: false,
    isRecording: false,
    attachments: [] as FileUpload[],
    mentions: [] as User[],
    tags: [] as Tag[],
    aiSuggestions: [] as AISuggestion[],
    errors: [] as ComposerError[],
    focus: false,
    dirty: false,
  };

  const [state, setState] = useState<ComposerState>(initialState);

  // Actions
  const actions: ComposerActions = {
    setContent: useCallback((content: string) => {
      setState((prev) => ({ ...prev, content, dirty: true }));
    }, []),

    insertText: useCallback((text: string, position?: number) => {
      setState((prev) => {
        const pos = position ?? prev.content.length;
        const newContent = prev.content.slice(0, pos) + text + prev.content.slice(pos);
        return { ...prev, content: newContent, dirty: true };
      });
    }, []),

    addAttachment: useCallback((file: File) => {
      const attachment = {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "pending" as const,
      };
      setState((prev) => ({
        ...prev,
        attachments: [...prev.attachments, attachment],
      }));
    }, []),

    removeAttachment: useCallback((id: string) => {
      setState((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a: unknown) => a.id !== id),
      }));
    }, []),

    addMention: useCallback((user: User) => {
      setState((prev: ComposerState) => ({
        ...prev,
        mentions: [...prev.mentions, user],
      }));
    }, []),

    removeMention: useCallback((userId: string) => {
      setState((prev: ComposerState) => ({
        ...prev,
        mentions: prev.mentions.filter((m: unknown) => m.id !== userId),
      }));
    }, []),

    addTag: useCallback((tag: Tag) => {
      setState((prev: ComposerState) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }, []),

    removeTag: useCallback((tagId: string) => {
      setState((prev: ComposerState) => ({
        ...prev,
        tags: prev.tags.filter((t: unknown) => t.id !== tagId),
      }));
    }, []),

    applyTemplate: useCallback((template: unknown, variables: unknown) => {
      // Template application logic
      setState((prev: ComposerState) => ({ ...prev, selectedTemplate: template }));
    }, []),

    applySuggestion: useCallback((suggestion: AISuggestion) => {
      setState((prev: ComposerState) => ({ ...prev, content: suggestion.content }));
    }, []),

    send: useCallback(async () => {
      if (!state.content.trim()) return;

      setState((prev: ComposerState) => ({ ...prev, isSending: true }));

      try {
        // Send logic here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

        onMessageSent?.({
          id: crypto.randomUUID(),
          content: state.content,
          conversationId,
          senderId: "current-user",
          senderType: "agent",
          timestamp: new Date(),
          attachments: state.attachments,
          mentions: state.mentions.map((m: unknown) => m.id),
          tags: state.tags.map((t: unknown) => t.id),
          status: "sent",
        });

        // Clear composer
        setState((prev: ComposerState) => ({
          ...prev,
          content: "",
          attachments: [],
          mentions: [],
          tags: [],
          isSending: false,
          dirty: false,
        }));
      } catch (error) {
        setState((prev: ComposerState) => ({
          ...prev,
          isSending: false,
          errors: [
            {
              id: crypto.randomUUID(),
              type: "network",
              message: "Failed to send message",
              recoverable: true,
              timestamp: new Date(),
            },
          ],
        }));
      }
    }, [state.content, state.attachments, state.mentions, state.tags, conversationId, onMessageSent]),

    clear: useCallback(() => {
      setState((prev: ComposerState) => ({
        ...prev,
        content: "",
        attachments: [],
        mentions: [],
        tags: [],
        errors: [],
        dirty: false,
      }));
    }, []),

    focus: useCallback(() => {
      setState((prev: ComposerState) => ({ ...prev, focus: true }));
    }, []),

    blur: useCallback(() => {
      setState((prev: ComposerState) => ({ ...prev, focus: false }));
    }, []),
  };

  return {
    state,
    actions,
    aiSuggestions: state.aiSuggestions,
    mentions: state.mentions,
    tags: state.tags,
    fileUpload: {
      upload: async (file: File) => {
        // File upload implementation
        return { id: "", file, progress: 100, status: "completed" as const };
      },
      cancel: (id: string) => actions.removeAttachment(id),
      retry: (id: string) => {},
      getProgress: (id: string) => 100,
    },
    voiceRecording: {
      start: async () => {},
      stop: async () => ({
        id: "",
        duration: 0,
        status: "completed" as const,
      }),
      pause: () => {},
      resume: () => {},
      cancel: () => {},
      getWaveform: () => [],
      getTranscription: async () => "",
    },
    templates: [],
    accessibility: {},
  };
}
