import type { CoreAssistantMessage, CoreMessage, CoreToolMessage } from "ai";
import { conversationMessages } from "@/db/schema";
import type { ToolMetadata } from "@/db/schema/conversationMessages";
import { HELPER_TO_AI_ROLES_MAPPING } from "@/lib/ai/constants";

export function buildToolMessages(
  message: typeof conversationMessages.$inferSelect,
  content: string
): [CoreAssistantMessage, CoreToolMessage] | [] {
  const metadata = message.metadata as ToolMetadata;
  if (!metadata.success) return [];

  const toolUseMessage: CoreAssistantMessage = {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: `tool_${message.id}`,
        toolName: metadata?.tool?.slug,
        args: metadata?.parameters,
      },
    ],
  };

  const toolMessage: CoreToolMessage = {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: `tool_${message.id}`,
        toolName: metadata?.tool?.slug,
        result: {
          formatted: content,
          raw: metadata?.result,
        },
      },
    ],
  };

  return [toolUseMessage, toolMessage];
}

export function buildMessagesFromHistory(messages: (typeof conversationMessages.$inferSelect)[]): CoreMessage[] {
  return messages
    .filter((message: unknown) => message.cleanedUpText?.trim())
    .flatMap((message): CoreMessage | CoreMessage[] => {
      const content = message.cleanedUpText?.trim() || message.body?.trim();
      if (!content) return [];

      const role =
        message.role && HELPER_TO_AI_ROLES_MAPPING[message.role]
          ? HELPER_TO_AI_ROLES_MAPPING[message.role]
          : "assistant";

      if (role === "tool") {
        return buildToolMessages(message, content);
      }

      return [
        {
          role,
          content,
        },
      ];
    });
}
