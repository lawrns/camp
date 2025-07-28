import { bigint, index, integer, jsonb, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { mailboxes } from "./mailboxes";

export const subscriptions = pgTable(
  "mailboxes_subscription",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    organizationId: uuid("organization_id").notNull(),
    mailboxId: integer("mailbox_id").references(() => mailboxes.id, { onDelete: "cascade" }),
    stripeSubscriptionId: varchar("stripe_subscription_id"),
    stripeCustomerId: varchar("stripe_customer_id"),
    stripePriceId: varchar("stripe_price_id"),
    status: varchar(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: "date" }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: "date" }),
    canceledAt: timestamp("canceled_at", { withTimezone: true, mode: "date" }),
    trialStart: timestamp("trial_start", { withTimezone: true, mode: "date" }),
    trialEnd: timestamp("trial_end", { withTimezone: true, mode: "date" }),
    metadata: jsonb().default({}),
  },
  (table) => {
    return {
      organizationIdIdx: index("idx_subscriptions_organization_id").on(table.organizationId),
      statusIdx: index("idx_subscriptions_status").on(table.status),
      stripeCustomerIdx: index("idx_subscriptions_stripe_customer").on(table.stripeCustomerId),
      organizationIdUnique: unique("mailboxes_subscription_organization_id_key").on(table.organizationId),
    };
  }
);
