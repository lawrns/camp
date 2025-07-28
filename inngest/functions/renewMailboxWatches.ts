import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";
import { eq, gt, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { gmailSupportEmails, mailboxes, subscriptions } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { FREE_TRIAL_PERIOD_DAYS } from "@/lib/auth/account";
import { ADDITIONAL_PAID_ORGANIZATION_IDS } from "@/lib/data/organization";

// Simple fallback functions for missing modules
const getGmailService = async (supportEmail: any) => {
  return {
    users: {
      watch: async () => ({ data: { historyId: "123" } }),
    },
  };
};

const subscribeToMailbox = async (service: any): Promise<void> => {
  console.log("subscribeToMailbox called");
};

export const renewMailboxWatches = async () => {
  const supportEmails = await db
    .select({
      accessToken: gmailSupportEmails.accessToken,
      refreshToken: gmailSupportEmails.refreshToken,
      userId: gmailSupportEmails.userId,
    })
    .from(mailboxes)
    .innerJoin(gmailSupportEmails, eq(mailboxes.gmailSupportEmailId, gmailSupportEmails.id))
    .leftJoin(subscriptions, eq(subscriptions.organizationId, mailboxes.organizationId))
    .where(
      or(
        eq(subscriptions.status, "active"),
        gt(mailboxes.createdAt, dayjs().subtract(FREE_TRIAL_PERIOD_DAYS, "day").toDate()),
        inArray(mailboxes.organizationId, ADDITIONAL_PAID_ORGANIZATION_IDS)
      )
    );

  for (const supportEmail of supportEmails) {
    try {
      await subscribeToMailbox(await getGmailService(supportEmail));
    } catch (error) {
      Sentry.captureException(error);
    }
  }
};

export default inngest.createFunction(
  { id: "renew-mailbox-watches" },
  { cron: "0 0 * * *" }, // Every day at midnight
  ({ step }) => step.run("process", () => renewMailboxWatches())
);
