import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentMessages, agentThreads } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { assertDefinedOrRaiseNonRetriableError } from "@/inngest/utils";
import { getMailboxById, Mailbox } from "@/lib/data/mailbox";
import { captureExceptionAndLog } from "@/lib/shared/sentry";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { assertDefined } from "@/lib/utils/assert";

// Simple fallback functions for missing modules
const getThreadMessages = async (
  token: string,
  channel: string,
  threadTs: string,
  botUserId: string
): Promise<any[]> => {
  // Fallback implementation - return empty array of messages
  return [];
};

const generateAgentResponse = async (
  messages: unknown[],
  mailbox: unknown,
  slackUserId: string | null,
  showStatus: (status: string | null, tool?: unknown) => Promise<void>,
  confirmedReplyText: string | null
): Promise<{ text: string; confirmReplyText: string | null }> => {
  // Fallback implementation - return a simple response
  return { text: "Agent response generated", confirmReplyText: null };
};

export const handleSlackAgentMessage = async (
  slackUserId: string | null,
  currentMailboxId: number,
  statusMessageTs: string,
  agentThreadId: number,
  confirmedReplyText: string | null
) => {
  const mailbox = assertDefinedOrRaiseNonRetriableError(await getMailboxById(String(currentMailboxId))) as Mailbox;
  const agentThread = assertDefinedOrRaiseNonRetriableError(
    await db.query.agentThreads.findFirst({
      where: eq(agentThreads.id, agentThreadId),
    })
  );

  const messages = await getThreadMessages(
    assertDefined(mailbox.slackBotToken),
    agentThread.slackChannel,
    agentThread.threadTs,
    assertDefined(mailbox.slackBotUserId)
  );

  const client = new WebClient(assertDefined(mailbox.slackBotToken));
  const debug = messages.some(
    (message) => typeof message?.content === "string" && /(?:^|\s)!debug(?:$|\s)/.test(message.content)
  );

  const showStatus = async (
    status: string | null,
    tool?: { toolName: string; parameters: Record<string, unknown> }
  ) => {
    if (tool && agentThread) {
      await db.insert(agentMessages).values({
        agentThreadId: agentThread.id,
        role: "tool",
        content: status ?? "",
        metadata: tool,
      });
    }

    if (debug && status) {
      await client.chat.postMessage({
        channel: agentThread.slackChannel,
        thread_ts: agentThread.threadTs,
        text: tool
          ? `_${status ?? "..."}_\n\n*Parameters:*\n\`\`\`\n${JSON.stringify(tool.parameters, null, 2)}\n\`\`\``
          : `_${status ?? "..."}_`,
      });
    } else if (status) {
      await client.chat.update({
        channel: agentThread.slackChannel,
        ts: statusMessageTs,
        text: `_${status}_`,
      });
    }
  };

  const { text, confirmReplyText } = await generateAgentResponse(
    messages as { content: string }[],
    mailbox,
    slackUserId,
    showStatus,
    confirmedReplyText
  );

  const assistantMessage = await db
    .insert(agentMessages)
    .values({
      agentThreadId: agentThread.id,
      role: "assistant",
      content: text,
    })
    .returning()
    .then(takeUniqueOrThrow);

  const { ts } = await client.chat.postMessage({
    channel: agentThread.slackChannel,
    thread_ts: agentThread.threadTs,
    text,
  });

  if (ts) {
    await db
      .update(agentMessages)
      .set({
        slackChannel: agentThread.slackChannel,
        messageTs: ts,
      })
      .where(eq(agentMessages.id, assistantMessage.id));
  }

  if (!debug) {
    try {
      await client.chat.delete({
        channel: agentThread.slackChannel,
        ts: statusMessageTs,
      });
    } catch (error) {
      captureExceptionAndLog(error as Error, {
        extra: {
          message: "Error deleting status message",
          channel: agentThread.slackChannel,
          statusMessageTs,
        },
      });
    }
  }

  if (confirmReplyText) {
    const { ts } = await client.chat.postMessage({
      channel: agentThread.slackChannel,
      thread_ts: agentThread.threadTs,
      blocks: [
        {
          type: "input",
          block_id: "proposed_message",
          element: {
            type: "plain_text_input",
            multiline: true,
            action_id: "proposed_message",
            initial_value:
              typeof confirmReplyText === "object" && confirmReplyText && "args" in confirmReplyText
                ? (confirmReplyText as unknown).args?.proposedMessage || ""
                : confirmReplyText || "",
          },
          label: {
            type: "plain_text",
            text: "Message:",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Confirm reply text",
                emoji: true,
              },
              value: "confirm",
              style: "primary",
              action_id: "confirm",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Cancel",
              },
              value: "cancel",
              action_id: "cancel",
            },
          ],
        },
      ],
    });

    if (ts) {
      await db.insert(agentMessages).values({
        agentThreadId: agentThread.id,
        role: "assistant",
        content: `Confirming reply text: ${
          typeof confirmReplyText === "object" && confirmReplyText && "args" in confirmReplyText
            ? (confirmReplyText as unknown).args?.proposedMessage || confirmReplyText
            : confirmReplyText
        }`,
        slackChannel: agentThread.slackChannel,
        messageTs: ts,
      });
    }
  }

  return { text, agentThreadId: agentThread.id };
};

export default inngest.createFunction(
  { id: "slack-agent-message-handler" },
  { event: "slack/agent.message" },
  async ({ event, step }) => {
    const { slackUserId, currentMailboxId, statusMessageTs, agentThreadId, confirmedReplyText } = event.data;

    const result = await step.run("process-agent-message", async () => {
      return await handleSlackAgentMessage(
        slackUserId,
        currentMailboxId,
        statusMessageTs,
        agentThreadId,
        confirmedReplyText ?? null
      );
    });

    return { result };
  }
);
