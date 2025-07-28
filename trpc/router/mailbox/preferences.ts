import { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { mailboxes } from "@/db/schema";
import { assertDefined } from "@/lib/utils/assert";
import { mailboxProcedure } from "./procedure";

// Define UI feature flags schema
const uiFeaturesSchema = z
  .object({
    enhancedLayout: z.boolean().default(true),
    enhancedAnimations: z.boolean().default(true),
    enhancedMessageDelivery: z.boolean().default(true),
    enhancedTypingIndicators: z.boolean().default(true),
  })
  .optional();

export const preferencesRouter = {
  get: mailboxProcedure.query(async ({ ctx }) => {
    return assertDefined(
      await db.query.mailboxes.findFirst({
        where: eq(mailboxes.id, ctx.mailbox.id),
        columns: {
          preferences: true,
        },
      })
    );
  }),

  update: mailboxProcedure
    .input(
      z.object({
        preferences: z.object({
          confetti: z.boolean(),
          theme: z
            .object({
              background: z.string().regex(/^#([0-9a-f]{6})$/i),
              foreground: z.string().regex(/^#([0-9a-f]{6})$/i),
              primary: z.string().regex(/^#([0-9a-f]{6})$/i),
              accent: z.string().regex(/^#([0-9a-f]{6})$/i),
              sidebarBackground: z.string().regex(/^#([0-9a-f]{6})$/i),
            })
            .optional(),
          uiFeatures: uiFeaturesSchema,
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Handle exactOptionalPropertyTypes - construct preferences object properly
      const preferences: {
        confetti: boolean;
        theme?: {
          background?: string;
          foreground?: string;
          primary?: string;
          accent?: string;
          sidebarBackground?: string;
        };
        uiFeatures?: {
          enhancedLayout?: boolean;
          enhancedAnimations?: boolean;
          enhancedMessageDelivery?: boolean;
          enhancedTypingIndicators?: boolean;
        };
      } = {
        confetti: input.preferences.confetti,
      };

      // Only add theme if it's defined
      if (input.preferences.theme !== undefined) {
        preferences.theme = input.preferences.theme;
      }

      // Only add uiFeatures if it's defined
      if (input.preferences.uiFeatures !== undefined) {
        preferences.uiFeatures = input.preferences.uiFeatures;
      }

      await db
        .update(mailboxes)
        .set({
          preferences,
        })
        .where(eq(mailboxes.id, ctx.mailbox.id));
    }),

  // Add a dedicated endpoint for UI features
  list: mailboxProcedure.query(async ({ ctx }) => {
    const result = await db.query.mailboxes.findFirst({
      where: eq(mailboxes.id, ctx.mailbox.id),
      columns: {
        preferences: true,
      },
    });

    // Extract UI features with defaults if they don't exist
    const preferences = result?.preferences || { confetti: false };
    const uiFeatures = (preferences as any).uiFeatures || {
      enhancedLayout: true,
      enhancedAnimations: true,
      enhancedMessageDelivery: true,
      enhancedTypingIndicators: true,
    };

    return { preferences, uiFeatures };
  }),
} satisfies TRPCRouterRecord;
