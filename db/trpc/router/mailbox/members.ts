import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { subHours } from "date-fns";
import { z } from "zod";
import { getTeamMemberStats } from "@/lib/data/stats";
import { getUsersWithMailboxAccess, updateUserMailboxData } from "@/lib/data/user";
import { captureExceptionAndLog } from "@/lib/shared/sentry";
import { mailboxProcedure } from "./procedure";

export const membersRouter = {
  update: mailboxProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["core", "nonCore", "afk"]),
        keywords: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Handle exactOptionalPropertyTypes - only pass keywords if defined
        const updates: {
          role: "core" | "nonCore" | "afk";
          keywords?: string[];
        } = {
          role: input.role,
        };
        if (input.keywords !== undefined) {
          updates.keywords = input.keywords;
        }

        const user = await updateUserMailboxData(input.userId, ctx.mailbox.id, updates);

        return user;
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            userId: input.userId,
            mailboxId: ctx.mailbox.id,
            role: input.role,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update team member",
        });
      }
    }),

  list: mailboxProcedure.query(async ({ ctx }) => {
    try {
      return await getUsersWithMailboxAccess(ctx.mailbox.organizationId, ctx.mailbox.id);
    } catch (error) {
      captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
        tags: { route: "mailbox.members.list" },
        extra: {
          mailboxId: ctx.mailbox.id,
          organizationId: ctx.mailbox.organizationId,
          mailboxSlug: ctx.mailbox.slug,
        },
      });
      return [];
    }
  }),

  stats: mailboxProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d", "1y"]),
        customDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const periodInHours = {
        "24h": 24,
        "7d": 24 * 7,
        "30d": 24 * 30,
        "1y": 24 * 365,
      } as const;

      const startDate = input.customDate || subHours(now, periodInHours[input.period]);
      return await getTeamMemberStats(ctx.mailbox.id.toString(), startDate);
    }),
} satisfies TRPCRouterRecord;
