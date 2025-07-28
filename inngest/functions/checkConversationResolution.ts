import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { conversationEvents, conversationMessages, conversations, subscriptions } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { assertDefinedOrRaiseNonRetriableError } from "@/inngest/utils";
import { runAIQuery } from "@/lib/ai";
import { loadPreviousMessages } from "@/lib/ai/chat";
import { GPT_4O_MINI_MODEL } from "@/lib/ai/core";
import { SUBSCRIPTION_FREE_TRIAL_USAGE_LIMIT } from "@/lib/constants";
import {
  getClerkOrganization,
  getOrganizationAdminUsers,
  isFreeTrial,
  setOrganizationPrivateMetadata,
} from "@/lib/data/organization";
// import { sendEmail } from "@/lib/infrastructure/email"; // Module not found
// import { stripe } from "@/lib/stripe/client"; // Module not found
import { assertDefined } from "@/lib/utils/assert";
import { env } from "@/lib/utils/env-config";

// import AutomatedRepliesLimitExceededEmail from "@/lib/emails/automatedRepliesLimitExceeded"; // Module not found

// Placeholder functions until real implementations are available
const sendEmail = async (email: any): Promise<void> => {
  console.log("sendEmail called - not implemented yet", email);
};

const stripe = {
  subscriptions: {
    list: async (params: any) => {
      console.log("stripe.subscriptions.list called - not implemented yet", params);
      return { data: [] };
    },
  },
};

const AutomatedRepliesLimitExceededEmail = (props: any) => {
  console.log("AutomatedRepliesLimitExceededEmail called - not implemented yet", props);
  return null;
};

const RESOLUTION_CHECK_PROMPT = `You are analyzing a customer service conversation to determine if the customer's issue was addressed.

Respond with one of:
- 'bad: [reason]' if the customer explicitly expresses dissatisfaction or frustration, or if the response is unrelated to the customer's question
- 'ok: [reason]' otherwise

Where [reason] is a brief explanation of your decision.

Just check if the assistant has provided information generally relevant to the customer's issue - it doesn't need to be an exact match.`;

const checkAIBasedResolution = async (conversationId: string) => {
  const messages = await loadPreviousMessages(conversationId);

  const aiResponse = await runAIQuery({
    system: RESOLUTION_CHECK_PROMPT,
    prompt: messages.map((msg) => `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.content}`).join("\n"),
    model: GPT_4O_MINI_MODEL,
  });

  const [isResolved, reason] = aiResponse.trim().toLowerCase().split(": ");
  return { isResolved: isResolved !== "bad", reason };
};

const skipCheck = async (conversationId: string, messageId: number) => {
  const newerMessage = await db.query.conversationMessages.findFirst({
    where: and(eq(conversationMessages.conversationId, conversationId), gt(conversationMessages.id, messageId)),
  });

  if (newerMessage) return `Has newer message: ${newerMessage.id}`;

  const event = await db.query.conversationEvents.findFirst({
    where: and(
      eq(conversationEvents.conversationId, conversationId),
      inArray(conversationEvents.type, ["resolved_by_ai", "request_human_support"])
    ),
  });

  if (event) return `Has event: ${event.type}`;

  const humanResponse = await db.query.conversationMessages.findFirst({
    columns: { id: true },
    where: and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.senderType, "agent")),
  });

  if (humanResponse) return `Has human response: ${humanResponse.id}`;

  return undefined;
};

export const checkConversationResolution = async (conversationId: string, messageId: number) => {
  const skipReason = await skipCheck(conversationId, messageId);
  if (skipReason) return { skipped: true, reason: skipReason };

  const conversation = assertDefined(
    await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: { mailbox: true },
    })
  );
  const mailbox = assertDefinedOrRaiseNonRetriableError(conversation.mailbox);

  const lastReaction = await db.query.conversationMessages.findFirst({
    where: and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.senderType, "system")),
    orderBy: [desc(conversationMessages.id)],
  }); // Note: reactionType property doesn't exist in schema

  // Note: reaction functionality not available - skipping reaction check
  /*
  if (lastReaction === "thumbs-up") {
    await db.insert(conversationEvents).values({
      conversationId,
      type: "resolved_by_ai",
      changes: {},
      reason: "Positive reaction with no follow-up questions.",
    });
    await billAIResolution(conversationId, mailbox.id, mailbox.organization_id);
    return { isResolved: true, reason: "Positive reaction" };
  } else if (lastReaction === "thumbs-down") {
    return { isResolved: false, reason: "Negative reaction" };
  }
  */

  const { isResolved, reason } = await checkAIBasedResolution(conversationId);

  if (isResolved) {
    await db.insert(conversationEvents).values({
      conversationId,
      type: "resolved_by_ai",
      changes: {},
      reason: "No customer follow-up after 24 hours.",
    });
    await billAIResolution(conversationId, mailbox.id, mailbox.organization_id);
  }

  return { isResolved, reason };
};

const billAIResolution = async (conversationId: string, mailboxId: number, organizationId: string) => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    columns: {
      stripeCustomerId: true,
    },
  });

  if (subscription?.stripeCustomerId) {
    // Note: stripe billing not implemented
    console.log("Would bill AI resolution for:", {
      conversationId,
      customerId: subscription.stripeCustomerId,
    });
    return;
  }

  const organization = await getClerkOrganization(organizationId);
  const updatedOrganization = await setOrganizationPrivateMetadata(organization.id, {
    automatedRepliesCount: Math.min(
      SUBSCRIPTION_FREE_TRIAL_USAGE_LIMIT,
      (organization.privateMetadata?.automatedRepliesCount ?? 0) + 1
    ),
  });

  const automatedRepliesCount = assertDefined(updatedOrganization.privateMetadata?.automatedRepliesCount);
  if (
    isFreeTrial(organization) &&
    !organization.privateMetadata?.automatedRepliesLimitExceededAt &&
    automatedRepliesCount >= SUBSCRIPTION_FREE_TRIAL_USAGE_LIMIT
  ) {
    for (const admin of await getOrganizationAdminUsers(organization.id)) {
      await sendEmail({
        from: "Helper <help@campfire.ai>",
        to: [admin.emailAddresses?.[0]?.emailAddress || admin.email || "admin@example.com"],
        subject: "Automated replies limit exceeded",
        react: AutomatedRepliesLimitExceededEmail({ mailboxSlug: "unknown" }), //TODO: get mailbox slug
      });
    }
    await setOrganizationPrivateMetadata(organization.id, { automatedRepliesLimitExceededAt: new Date().toISOString() });
  }
};

export default inngest.createFunction(
  { id: "check-conversation-resolution" },
  { event: "conversations/check-resolution" },
  async ({ event, step }) => {
    const { conversationId, messageId } = event.data;

    if (env.NODE_ENV === "development") {
      await step.sleepUntil("wait-5-minutes", new Date(Date.now() + 5 * 60 * 1000));
    } else {
      await step.sleepUntil("wait-24-hours", new Date(Date.now() + 24 * 60 * 60 * 1000));
    }

    const result = await step.run("check-resolution", async () => {
      return await checkConversationResolution(conversationId, messageId);
    });

    return result;
  }
);
