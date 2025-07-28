import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { faqs } from "./faqs";
import { gmailSupportEmails } from "./gmailSupportEmails";
import { mailboxesMetadataApi } from "./mailboxesMetadataApi";

type OnboardingMetadata = {
  completed: boolean;
};

export const mailboxes = pgTable(
  "mailboxes",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    name: text().notNull(),
    slug: varchar({ length: 50 }).notNull(),
    organizationId: uuid("organization_id").notNull(),
    gmailSupportEmailId: bigint({ mode: "number" }),
    slackAlertChannel: text("slack_escalation_channel"),
    slackBotToken: text(),
    slackBotUserId: text(),
    slackTeamId: text(),
    githubInstallationId: text(),
    githubRepoOwner: text(),
    githubRepoName: text(),
    promptUpdatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    widgetHMACSecret: varchar({ length: 255 }).notNull(),
    widgetDisplayMode: text().$type<"always" | "revenue_based" | "off">().notNull().default("always"),
    widgetDisplayMinValue: bigint({ mode: "number" }),
    autoRespondEmailToChat: boolean().notNull().default(false),
    widgetHost: text(),
    vipThreshold: bigint({ mode: "number" }),
    vipChannelId: text(),
    vipExpectedResponseHours: integer(),
    isWhitelabel: boolean().notNull().default(false),
    onboardingMetadata: jsonb().$type<OnboardingMetadata>().default({
      completed: false,
    }),
    autoCloseEnabled: boolean().notNull().default(false),
    autoCloseDaysOfInactivity: integer().notNull().default(14),
    unused_disableAutoResponseForVips: boolean("disable_auto_response_for_vips").notNull().default(false),
    unused_responseGeneratorPrompt: jsonb("response_generator_prompt").$type<string[]>(),
    unused_escalationEmailBody: text("escalation_email_body"),
    unused_escalationExpectedResolutionHours: integer("escalation_expected_resolution_hours"),

    // RAG configuration fields
    rag_enabled: boolean("rag_enabled").notNull().default(true),
    promptPrefix: text("prompt_prefix"),
    promptSuffix: text("prompt_suffix"),

    preferences: jsonb()
      .$type<{
        confetti: boolean;
        theme?: {
          background: string;
          foreground: string;
          primary: string;
          accent: string;
          sidebarBackground: string;
        };
      }>()
      .default({
        confetti: false,
      }),
  },
  (table) => {
    return {
      createdAtIdx: index("idx_mailboxes_created_at").on(table.createdAt),
      organizationIdIdx: index("idx_mailboxes_organization_id").on(table.organizationId),
      slugIdx: index("idx_mailboxes_slug").on(table.slug),
      orgSlugUnique: unique("idx_mailboxes_org_slug").on(table.organizationId, table.slug),
      gmailSupportEmailIdUnique: unique("mailboxes_mailbox_support_email_id_key").on(table.gmailSupportEmailId),
    };
  }
);

export const mailboxesRelations = relations(mailboxes, ({ one, many }) => ({
  mailboxesMetadataApi: one(mailboxesMetadataApi),
  gmailSupportEmail: one(gmailSupportEmails, {
    fields: [mailboxes.gmailSupportEmailId],
    references: [gmailSupportEmails.id],
  }),
  faqs: many(faqs),
}));
