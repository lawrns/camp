import { eq } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { db } from "@/db/client";
import { conversationMessages } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { publishBatchedRealtimeEvents } from "@/inngest/lib/realtime";
import { serializeMessage } from "@/lib/data/conversationMessage";
// import { createMessageEventPayload } from "@/lib/data/dashboardEvent"; // Module not found
import { getClerkUser } from "@/lib/data/user";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";

export default inngest.createFunction(
  {
    id: "publish-new-conversation-event",
    batchEvents: {
      maxSize: 30,
      timeout: "60s",
    },
    retries: 0,
  },
  { event: "conversations/message.created" },
  async ({ events, step }) => {
    // Process messages serially to ensure consistency on the frontend.
    const messageIds = events.map((event: unknown) => event.data.messageId).toSorted((a, b) => a - b);

    await step.run("publish", async () => {
      const failedIds: number[] = [];
      for (const messageId of messageIds) {
        try {
          await publish(messageId);
        } catch (error) {
          captureExceptionAndLogIfDevelopment(error as Error);
          failedIds.push(messageId);
        }
      }
      if (failedIds.length > 0) {
        throw new NonRetriableError(`Failed to publish messages: ${failedIds.join(", ")}`);
      }
    });
  }
);

const publish = async (messageId: number) => {
  const message = await db.query.conversationMessages.findFirst({
    where: eq(conversationMessages.id, messageId),
    with: {
      conversation: {
        with: {
          platformCustomer: true,
          mailbox: true,
        },
      },
    },
  });

  if (!message) {
    return `Message ${messageId} not found`;
  }

  const events: { resourceType: string; resourceId: string; organizationId: string; event: string; payload: unknown }[] =
    [];
  const published: string[] = [];

  // RILL-compliant: Publish conversation message update (except AI assistant messages)
  if (message.role !== "assistant") {
    const serializedMessage = await serializeMessage(
      message as unknown,
      message.conversation.id,
      message.conversation.mailbox,
      message.clerkUserId ? ((await getClerkUser(message.clerkUserId)) as unknown) : null
    );

    events.push({
      resourceType: "conversation",
      resourceId: message.conversation.id,
      organizationId: message.conversation.mailbox.organizationId,
      event: "conversation.message",
      payload: serializedMessage,
    });
    published.push("conversation.message");
  }

  // RILL-compliant: Publish new conversation notification for user messages in open status
  if (message.role === "user" && message.conversation.status === "open") {
    events.push({
      resourceType: "mailbox",
      resourceId: String(message.conversation.mailbox.id),
      organizationId: message.conversation.mailbox.organizationId,
      event: "conversation.new",
      payload: message.conversation,
    });
    published.push("conversation.new");
  }

  // RILL-compliant: Publish dashboard event for all messages
  // TODO: Implement createMessageEventPayload function
  // const messageEventPayload = createMessageEventPayload(message, message.conversation.mailbox);
  /*
  events.push({
    resourceType: "organization",
    resourceId: message.conversation.mailbox.organizationId,
    organizationId: message.conversation.mailbox.organizationId,
    event: "dashboard.event",
    payload: messageEventPayload,
  });
  published.push("dashboard.event");
  */

  // Batch publish all events
  if (events.length > 0) {
    await publishBatchedRealtimeEvents(events as unknown);
  }

  return `Message ${message.id} published: ${published.join(", ") || "none"}`;
};
