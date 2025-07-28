import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { conversationEvents, mailboxes } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { publishToSupabaseRealtime } from "@/inngest/lib/realtime";
import { assertDefinedOrRaiseNonRetriableError } from "@/inngest/utils";

// Simple fallback function for missing module
const createHumanSupportRequestEventPayload = (event: any, mailbox: any) => {
  return {
    eventId: event.id,
    conversationId: event.conversation.id,
    conversationSlug: event.conversation.slug,
    customerEmail: event.conversation.email_from,
    subject: event.conversation.subject,
    mailboxName: mailbox.name,
    mailboxSlug: mailbox.id,
    timestamp: new Date().toISOString(),
  };
};

export default inngest.createFunction(
  { id: "publish-request-human-support" },
  { event: "conversations/human-support-requested" },
  async ({ event: { data }, step }) => {
    const { mailboxSlug, conversationId } = data;

    await step.run("publish", async () => {
      const mailbox = assertDefinedOrRaiseNonRetriableError(
        await db.query.mailboxes.findFirst({
          where: eq(mailboxes.slug, mailboxSlug),
        })
      );

      const event = assertDefinedOrRaiseNonRetriableError(
        await db.query.conversationEvents.findFirst({
          where: eq(conversationEvents.conversationId, conversationId),
          with: {
            conversation: {
              columns: { id: true, slug: true, email_from: true, subject: true },
              with: {
                platformCustomer: { columns: { value: true } },
              },
            },
          },
          orderBy: desc(conversationEvents.createdAt),
        })
      );

      // RILL-compliant: Publish human support request to realtime
      await publishToSupabaseRealtime({
        channelType: "notifications",
        resourceId: mailbox.organizationId,
        organizationId: mailbox.organizationId,
        event: "human_support_requested",
        payload: createHumanSupportRequestEventPayload(event, mailbox),
      });
    });

    return { success: true };
  }
);
