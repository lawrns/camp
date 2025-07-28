import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/trpc";
import type { MailboxContext, MailboxProcedureContext } from "@/trpc/types";
import { getAuthorizedMailbox } from "@/trpc/utils/mailbox";

export const mailboxProcedure = protectedProcedure
  .input(z.object({ mailboxSlug: z.string() }))
  .use(async ({ ctx, input, next }) => {
    try {
      // Get mailbox from the authorization handler
      const mailbox = await getAuthorizedMailbox(ctx.user.organizationId, input.mailboxSlug);

      // In development mode, provide a fallback mailbox when none is found
      if (!mailbox && process.env.NODE_ENV === "development") {
        console.warn(`⚠️ Mailbox not found: ${input.mailboxSlug} - using development fallback`);

        // Create a comprehensive fallback development mailbox
        const devMailbox: MailboxContext = {
          id: 9999, // Using a proper number for bigint column
          slug: input.mailboxSlug,
          name: `Development Mailbox (${input.mailboxSlug})`,
          organizationId: ctx.user.organizationId,
          promptUpdatedAt: new Date(),
          widgetHMACSecret: "dev-secret",

          // Required fields that were causing 500 errors
          rag_enabled: true,
          promptPrefix: "You are a helpful assistant.",
          promptSuffix: "Be concise and helpful.",

          // GitHub integration fields
          githubInstallationId: null,
          githubRepoOwner: null,
          githubRepoName: null,

          // VIP configuration fields
          vipThreshold: null,
          vipExpectedResponseHours: null,
          vipChannelId: null,

          // Widget configuration
          widgetConfig: {
            theme: {
              primary: "#4F46E5",
              background: "#FFFFFF",
              foreground: "#111827",
              accent: "#6366F1",
              sidebarBackground: "#F9FAFB",
            },
          },

          // UI preferences
          preferences: {
            uiFeatures: {
              enhancedLayout: true,
              unifiedInbox: true,
            },
          },

          // System metadata
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Return with the fallback mailbox in context
        return next({
          ctx: {
            ...ctx,
            mailbox: devMailbox,
            validatedMailboxId: devMailbox.id.toString(),
          } as MailboxProcedureContext,
        });
      }

      // If no mailbox found, throw a 404 error
      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Mailbox not found: ${input.mailboxSlug}`,
        });
      }

      // Map database mailbox to context type
      const mailboxContext: MailboxContext = {
        ...mailbox,
        id: Number(mailbox.id), // Convert bigint to number
        vipThreshold: mailbox.vipThreshold ? Number(mailbox.vipThreshold) : null,
        rag_enabled: true, // Default value if not in database
        promptPrefix: mailbox.promptPrefix || "You are a helpful assistant.",
        promptSuffix: mailbox.promptSuffix || "Be concise and helpful.",
      };

      // Continue with the real mailbox
      return next({
        ctx: {
          ...ctx,
          mailbox: mailboxContext,
          dbMailbox: mailbox, // Add original DB mailbox for serialization
          validatedMailboxId: mailboxContext.id.toString(),
        } as MailboxProcedureContext,
      });
    } catch (error) {
      console.error("Error in mailbox procedure:", error);
      throw error;
    }
  });
