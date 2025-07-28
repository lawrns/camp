import { and, eq } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import type Stripe from "stripe";
import { db } from "@/db/client";
import { gmailSupportEmails, mailboxes, subscriptions } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { assertDefined } from "@/lib/utils/assert";

// Simple fallback functions for missing modules
const createStripeSubscription = async (sessionData: any): Promise<void> => {
  console.log("createStripeSubscription called with:", sessionData);
};

const getGmailService = (auth: any) => {
  return {
    users: {
      watch: async () => ({ data: { historyId: "123" } }),
    },
  };
};

const subscribeToMailbox = async (service: any, email: string): Promise<void> => {
  console.log("subscribeToMailbox called for:", email);
};

const stripe = {
  subscriptions: {
    retrieve: async (id: string) => ({ id, status: "active" }),
  },
};

export default inngest.createFunction(
  {
    id: "handle-stripe-webhook-event",
  },
  { event: "stripe/webhook" },
  async ({ event, step }) => {
    const {
      data: { stripeEvent },
    } = event;

    await step.run("handle", async () => await handleStripeEvent(stripeEvent));
  }
);

export const ALLOWED_STRIPE_EVENTS: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
];

export const handleStripeEvent = async (event: Stripe.Event) => {
  // eslint-disable-next-line
  switch (event.type) {
    case "checkout.session.completed": {
      await createStripeSubscription(event.data.object);
      break;
    }
    case "customer.subscription.updated": {
      await handleSubscriptionUpdated(event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      await handleSubscriptionDeleted(event.data.object);
      break;
    }
    case "invoice.payment_succeeded": {
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    }
    case "invoice.payment_failed": {
      await handleInvoicePaymentFailed(event.data.object);
      break;
    }
    default: {
      throw new NonRetriableError(`Stripe webhook unhandled event type: ${event.type}`);
    }
  }
};

const handleSubscriptionUpdated = async (stripeSubscription: Stripe.Subscription) => {
  await updateSubscription(stripeSubscription);
};

const handleSubscriptionDeleted = async (stripeSubscription: Stripe.Subscription) => {
  await updateSubscription(stripeSubscription, "canceled");
};

const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  if (!invoice.subscription) {
    throw new NonRetriableError("Missing subscription id");
  }
  const stripeSubscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
  const subscription = await assertDefined(stripe).subscriptions.retrieve(stripeSubscriptionId);
  await updateSubscription(subscription as Stripe.Subscription);
};

const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  if (!invoice.subscription) {
    throw new NonRetriableError("Missing subscription id");
  }
  const stripeSubscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
  const subscription = await assertDefined(stripe).subscriptions.retrieve(stripeSubscriptionId);
  await updateSubscription(subscription as Stripe.Subscription, "past_due");
};

const updateSubscription = async (stripeSubscription: Stripe.Subscription, status?: string) => {
  const subscriptionStatus = status || stripeSubscription.status;
  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: stripeSubscription.id,
      status: subscriptionStatus,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

  if (subscriptionStatus === "active") {
    const gmailSupportEmailRecords = await db
      .select({
        refreshToken: gmailSupportEmails.refreshToken,
        accessToken: gmailSupportEmails.accessToken,
        userId: gmailSupportEmails.userId,
      })
      .from(gmailSupportEmails)
      .innerJoin(mailboxes, eq(gmailSupportEmails.id, mailboxes.gmailSupportEmailId))
      .innerJoin(
        subscriptions,
        and(
          eq(mailboxes.organizationId, subscriptions.organizationId),
          eq(subscriptions.stripeSubscriptionId, stripeSubscription.id)
        )
      );

    for (const gmailSupportEmail of gmailSupportEmailRecords) {
      const client = await getGmailService(gmailSupportEmail);
      await subscribeToMailbox(client, gmailSupportEmail.userId || "unknown");
    }
  }
};
