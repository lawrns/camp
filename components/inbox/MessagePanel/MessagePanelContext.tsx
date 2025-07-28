"use client";

import React, { createContext, ReactNode, useCallback, useContext, useReducer } from "react";
import { ConversationStatus, Message, TypingUser } from "./types";

interface MessagePanelState {
  messageText: string;
  isSending: boolean;
  isFileUploading: boolean;
  typingUsers: TypingUser[];
}

type MessagePanelAction =
  | { type: "SET_MESSAGE_TEXT"; payload: string }
  | { type: "SET_SENDING"; payload: boolean }
  | { type: "SET_FILE_UPLOADING"; payload: boolean }
  | { type: "SET_TYPING_USERS"; payload: TypingUser[] }
  | { type: "ADD_TYPING_USER"; payload: TypingUser }
  | { type: "REMOVE_TYPING_USER"; payload: string }
  | { type: "CLEAR_MESSAGE" }
  | { type: "RESET" };

const initialState: MessagePanelState = {
  messageText: "",
  isSending: false,
  isFileUploading: false,
  typingUsers: [],
};

function messagePanelReducer(state: MessagePanelState, action: MessagePanelAction): MessagePanelState {
  switch (action.type) {
    case "SET_MESSAGE_TEXT":
      return { ...state, messageText: action.payload };
    case "SET_SENDING":
      return { ...state, isSending: action.payload };
    case "SET_FILE_UPLOADING":
      return { ...state, isFileUploading: action.payload };
    case "SET_TYPING_USERS":
      return { ...state, typingUsers: action.payload };
    case "ADD_TYPING_USER":
      return {
        ...state,
        typingUsers: [...state.typingUsers.filter((u: any) => u.id !== action.payload.id), action.payload],
      };
    case "REMOVE_TYPING_USER":
      return {
        ...state,
        typingUsers: state.typingUsers.filter((u: any) => u.id !== action.payload),
      };
    case "CLEAR_MESSAGE":
      return { ...state, messageText: "" };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface MessagePanelContextValue extends MessagePanelState {
  // Actions
  setMessageText: (text: string) => void;
  setSending: (sending: boolean) => void;
  setFileUploading: (uploading: boolean) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string) => void;
  clearMessage: () => void;
  reset: () => void;

  // Callbacks passed from parent - all optional
  onSendMessage?: (() => void) | undefined;
  onStatusChange?: ((status: ConversationStatus, reason?: string) => void) | undefined;
  onConvertToTicket?: (() => void) | undefined;
  onAssignConversation?: (() => void) | undefined;
  onMessageObserve?: ((element: HTMLElement | null) => void) | undefined;
}

const MessagePanelContext = createContext<MessagePanelContextValue | undefined>(undefined);

export function useMessagePanelContext() {
  const context = useContext(MessagePanelContext);
  if (!context) {
    throw new Error("useMessagePanelContext must be used within MessagePanelProvider");
  }
  return context;
}

interface MessagePanelProviderProps {
  children: ReactNode;
  onSendMessage?: () => void;
  onStatusChange?: (status: ConversationStatus, reason?: string) => void;
  onConvertToTicket?: () => void;
  onAssignConversation?: () => void;
  onMessageObserve?: (element: HTMLElement | null) => void;
}

export function MessagePanelProvider({
  children,
  onSendMessage,
  onStatusChange,
  onConvertToTicket,
  onAssignConversation,
  onMessageObserve,
}: MessagePanelProviderProps) {
  const [state, dispatch] = useReducer(messagePanelReducer, initialState);

  const setMessageText = useCallback((text: string) => {
    dispatch({ type: "SET_MESSAGE_TEXT", payload: text });
  }, []);

  const setSending = useCallback((sending: boolean) => {
    dispatch({ type: "SET_SENDING", payload: sending });
  }, []);

  const setFileUploading = useCallback((uploading: boolean) => {
    dispatch({ type: "SET_FILE_UPLOADING", payload: uploading });
  }, []);

  const addTypingUser = useCallback((user: TypingUser) => {
    dispatch({ type: "ADD_TYPING_USER", payload: user });
  }, []);

  const removeTypingUser = useCallback((userId: string) => {
    dispatch({ type: "REMOVE_TYPING_USER", payload: userId });
  }, []);

  const clearMessage = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGE" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value: MessagePanelContextValue = {
    ...state,
    setMessageText,
    setSending,
    setFileUploading,
    addTypingUser,
    removeTypingUser,
    clearMessage,
    reset,
    onSendMessage,
    onStatusChange,
    onConvertToTicket,
    onAssignConversation,
    onMessageObserve,
  };

  return <MessagePanelContext.Provider value={value}>{children}</MessagePanelContext.Provider>;
}
