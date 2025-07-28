// Export everything from the messages store
export * from "./messages-store";

// Export Message type from entities
export type { Message } from "@/types/entities/message";

// Create aliases for missing exports that the store index expects
export {
  messagesActions as useMessageActions,
  useMessagesStore as useMessageState,
  useMessages as useMessageThread,
} from "./messages-store";

// Create MessageThread type alias
export type MessageThread = ReturnType<typeof import("./messages-store").useMessages>;

// Create useMessageById function
export const useMessageById = (conversationId: string, messageId: string) => {
  const { useMessages } = require("./messages-store");
  const messages = useMessages(conversationId);
  return messages.find((m: any) => m.id === messageId);
};
