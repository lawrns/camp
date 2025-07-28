import { sentryMiddleware } from "@inngest/middleware-sentry";
import { EventSchemas, Inngest } from "inngest";
import type Stripe from "stripe";
import { z } from "zod";

// Search schema handled inline
const searchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["open", "closed", "spam"]).optional(),
  assignedTo: z.string().optional(),
});

export const assignEventSchema = z.object({
  assignedToId: z.string().nullable(),
  message: z.string().nullable(),
  assignedById: z.string().nullable(),
});

export type AssignEvent = z.infer<typeof assignEventSchema>;

type StripeWebhookEvent = {
  name: "stripe/webhook";
  data: {
    stripeEvent: Stripe.Event;
  };
};

// Chain non-Zod events here like X | Y | Z
type NonZodEvents = StripeWebhookEvent;

export const inngest = new Inngest({
  id: "helper",
  schemas: new EventSchemas()
    .fromZod({
      "files/preview.generate": {
        data: z.object({
          fileId: z.number(),
        }),
      },
      "conversations/embedding.create": {
        data: z.object({
          conversationSlug: z.string(),
        }),
      },

      "conversations/message.created": {
        data: z.object({
          messageId: z.number(),
        }),
      },
      "conversations/bulk-index-messages": {
        data: z.object({
          fromMessageId: z.number(),
          toMessageId: z.number(),
        }),
      },
      "conversations/email.enqueued": {
        data: z.object({
          messageId: z.number(),
        }),
      },
      "conversations/auto-response.create": {
        data: z.object({
          messageId: z.number(),
        }),
      },
      "conversations/bulk-update": {
        data: z.object({
          mailboxId: z.number(),
          userId: z.string(),
          conversationFilter: z.union([z.array(z.number()), searchSchema]),
          status: z.enum(["open", "closed", "spam"]),
        }),
      },
      "conversations/update-suggested-actions": {
        data: z.object({
          conversationId: z.number(),
        }),
      },
      "gmail/webhook.received": {
        data: z.object({
          body: z.any(),
          headers: z.any(),
        }),
      },
      "faqs/embedding.create": {
        data: z.object({
          faqId: z.number(),
        }),
      },
      "conversations/draft.refresh": {
        data: z.object({
          conversationSlug: z.string(),
        }),
      },
      "conversations/assigned": {
        data: z.object({
          conversationId: z.number(),
          assignEvent: assignEventSchema,
        }),
      },
      "gmail/import-recent-threads": {
        data: z.object({
          gmailSupportEmailId: z.number(),
        }),
      },
      "gmail/import-gmail-threads": {
        data: z.object({
          gmailSupportEmailId: z.number(),
          fromInclusive: z.string().datetime(),
          toInclusive: z.string().datetime(),
        }),
      },
      "organization/created": {
        data: z.object({
          organizationId: z.string(),
        }),
      },
      "reports/weekly": {
        data: z.object({
          mailboxId: z.number(),
        }),
      },
      "reports/daily": {
        data: z.object({
          mailboxId: z.number(),
        }),
      },
      "websites/crawl.create": {
        data: z.object({
          websiteId: z.number(),
          crawlId: z.number(),
        }),
      },
      "conversations/check-resolution": {
        data: z.object({
          conversationId: z.number(),
          messageId: z.number(),
        }),
      },
      "messages/flagged.bad": {
        data: z.object({
          messageId: z.number(),
          reason: z.string().nullable(),
        }),
      },
      "conversations/auto-close.check": {
        data: z.object({
          mailboxId: z.number().optional(),
        }),
      },
      "conversations/auto-close.process-mailbox": {
        data: z.object({
          mailboxId: z.number(),
        }),
      },
      "conversations/human-support-requested": {
        data: z.object({
          mailboxSlug: z.string(),
          conversationId: z.number(),
        }),
      },
      "slack/agent.message": {
        data: z.object({
          slackUserId: z.string().nullable(),
          currentMailboxId: z.number(),
          statusMessageTs: z.string(),
          agentThreadId: z.number(),
          confirmedReplyText: z.string().optional(),
        }),
      },
      "vectors/deduplication.smart": {
        data: z.object({
          threshold: z.number(),
          reason: z.string(),
        }),
      },
      "vectors/cleanup.organization": {
        data: z.object({
          organizationId: z.string(),
          config: z
            .object({
              ttlHours: z.number(),
              minRetentionDays: z.number(),
              batchSize: z.number(),
            })
            .optional(),
        }),
      },
      "vectors/cleanup.emergency": {
        data: z.object({
          organizationId: z.string(),
          aggressiveMode: z.boolean().optional(),
        }),
      },
      "automation/trigger": {
        data: z.object({
          triggerType: z.string(),
          organizationId: z.string(),
          data: z.record(z.unknown()),
        }),
      },
      "training/model.finetune": {
        data: z.object({
          datasetId: z.union([z.string(), z.number()]),
          baseModel: z.string().optional(),
          trainingConfig: z.record(z.unknown()).optional(),
        }),
      },
      "training/dataset.uploaded": {
        data: z.object({
          datasetId: z.string(),
          files: z.array(z.string()),
        }),
      },
      "ai/fine-tuning-job-created": {
        data: z.object({
          jobId: z.string(),
          config: z.record(z.unknown()),
          userId: z.string(),
        }),
      },
      "ai/monitor-fine-tuning-job": {
        data: z.object({
          jobId: z.string(),
          openaiJobId: z.string(),
        }),
      },
      "ai/cleanup-old-fine-tuning-jobs": {
        data: z.object({
          olderThanDays: z.number(),
          keepSuccessful: z.boolean(),
        }),
      },
      "knowledge/reindex-all": {
        data: z.object({
          organizationId: z.string(),
        }),
      },
      "vectors/deduplication.organization": {
        data: z.object({
          organizationId: z.string(),
          config: z.record(z.unknown()).optional(),
        }),
      },
    })
    .fromUnion<NonZodEvents>(),
  middleware: [sentryMiddleware()],
});
