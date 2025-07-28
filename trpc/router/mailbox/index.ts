import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import {
  getLatestMailboxEvents,
  getMailboxDetails,
  getOpenConversationCounts,
  getSessionsPaginated,
  listMailboxes,
  reorderMailboxes,
  sendAutoCloseJob,
  updateMailbox,
} from "@/services/mailboxService";
import { protectedProcedure } from "@/trpc/trpc";
import { conversationsRouter } from "./conversations/index";
import { customersRouter } from "./customers";
import { faqsRouter } from "./faqs";
import { githubRouter } from "./github";
import { membersRouter } from "./members";
import { metadataEndpointRouter } from "./metadataEndpoint";
import { preferencesRouter } from "./preferences";
import { mailboxProcedure } from "./procedure";
import { slackRouter } from "./slack";
import { toolsRouter } from "./tools";
import { websitesRouter } from "./websites";

export { mailboxProcedure };

export const mailboxRouter = {
  list: protectedProcedure.query(({ ctx }) => listMailboxes(ctx.user.organizationId)),
  openCount: mailboxProcedure.query(({ ctx }) => getOpenConversationCounts(ctx.mailbox.id, ctx.user.id)),
  get: mailboxProcedure.query(({ ctx }) => getMailboxDetails(ctx.dbMailbox || ctx.mailbox)),
  update: mailboxProcedure
    .input(
      z.object({
        slackAlertChannel: z.string().optional(),
        githubRepoOwner: z.string().optional(),
        githubRepoName: z.string().optional(),
        widgetDisplayMode: z.enum(["off", "always", "revenue_based"]).optional(),
        widgetDisplayMinValue: z.number().optional(),
        autoRespondEmailToChat: z.boolean().optional(),
        widgetHost: z.string().optional(),
        vipThreshold: z.number().optional(),
        vipChannelId: z.string().optional(),
        vipExpectedResponseHours: z.number().optional(),
        autoCloseEnabled: z.boolean().optional(),
        autoCloseDaysOfInactivity: z.number().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      // Transform input to handle exactOptionalPropertyTypes
      const cleanInput: {
        name?: string | undefined;
        slackAlertChannel?: string | undefined;
        githubRepoOwner?: string | undefined;
        githubRepoName?: string | undefined;
        widgetDisplayMode?: "off" | "always" | "revenue_based" | undefined;
        widgetDisplayMinValue?: number | undefined;
        autoRespondEmailToChat?: boolean | undefined;
        widgetHost?: string | undefined;
        vipThreshold?: number | undefined;
        vipChannelId?: string | undefined;
        vipExpectedResponseHours?: number | undefined;
        autoCloseEnabled?: boolean | undefined;
        autoCloseDaysOfInactivity?: number | undefined;
      } = {};

      // Only include defined properties
      if (input.name !== undefined) cleanInput.name = input.name;
      if (input.slackAlertChannel !== undefined) cleanInput.slackAlertChannel = input.slackAlertChannel;
      if (input.githubRepoOwner !== undefined) cleanInput.githubRepoOwner = input.githubRepoOwner;
      if (input.githubRepoName !== undefined) cleanInput.githubRepoName = input.githubRepoName;
      if (input.widgetDisplayMode !== undefined) cleanInput.widgetDisplayMode = input.widgetDisplayMode;
      if (input.widgetDisplayMinValue !== undefined) cleanInput.widgetDisplayMinValue = input.widgetDisplayMinValue;
      if (input.autoRespondEmailToChat !== undefined) cleanInput.autoRespondEmailToChat = input.autoRespondEmailToChat;
      if (input.widgetHost !== undefined) cleanInput.widgetHost = input.widgetHost;
      if (input.vipThreshold !== undefined) cleanInput.vipThreshold = input.vipThreshold;
      if (input.vipChannelId !== undefined) cleanInput.vipChannelId = input.vipChannelId;
      if (input.vipExpectedResponseHours !== undefined)
        cleanInput.vipExpectedResponseHours = input.vipExpectedResponseHours;
      if (input.autoCloseEnabled !== undefined) cleanInput.autoCloseEnabled = input.autoCloseEnabled;
      if (input.autoCloseDaysOfInactivity !== undefined)
        cleanInput.autoCloseDaysOfInactivity = input.autoCloseDaysOfInactivity;

      return updateMailbox(ctx.mailbox.id, cleanInput);
    }),

  latestEvents: mailboxProcedure
    .input(z.object({ cursor: z.date().optional() }))
    .query(({ ctx, input }) => getLatestMailboxEvents(ctx.dbMailbox || ctx.mailbox, input.cursor)),

  getSessionsPaginated: mailboxProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().nullish(),
      })
    )
    .query(({ ctx, input }) => getSessionsPaginated(ctx.mailbox.id, input.cursor || 1, input.limit)),
  conversations: conversationsRouter,
  faqs: faqsRouter,
  members: membersRouter,
  slack: slackRouter,
  github: githubRouter,
  tools: toolsRouter,
  customers: customersRouter,
  websites: websitesRouter,
  metadataEndpoint: metadataEndpointRouter,
  autoClose: mailboxProcedure.input(z.object({ mailboxId: z.number() })).mutation(async ({ input }) => {
    await sendAutoCloseJob(input.mailboxId);
    return { success: true, message: "Auto-close job triggered successfully" };
  }),
  /** Reorder mailboxes within the organization */
  reorder: protectedProcedure.input(z.array(z.string())).mutation(async ({ ctx, input }) => {
    const reordered = await reorderMailboxes(ctx.user.organizationId, input);
    return reordered;
  }),
  preferences: preferencesRouter,
} satisfies TRPCRouterRecord;
