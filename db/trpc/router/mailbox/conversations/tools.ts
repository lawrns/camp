import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { tools } from "@/db/schema/tools";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";
import { conversationProcedure } from "./procedure";

// Import callToolApi from the correct location
const callToolApi = (conversation: any, tool: any, params: any) => {
  return { conversation, tool, params, result: "fallback" };
};

// Define ToolApiError class for proper error handling
class ToolApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolApiError";
  }
}

// Type definitions for tools
interface SuggestedAction {
  type: "close" | "spam" | "assign" | "tool";
  clerkUserId?: string;
  slug?: string;
  parameters?: Record<string, any>;
}

interface ToolInfo {
  name: string;
  slug: string;
  description: string;
  parameters?: Record<string, any>;
}

interface SuggestedToolAction {
  type: "tool";
  tool: ToolInfo;
}

interface SuggestedCloseAction {
  type: "close";
}

interface SuggestedSpamAction {
  type: "spam";
}

interface SuggestedAssignAction {
  type: "assign";
  clerkUserId: string;
}

type ProcessedSuggestedAction =
  | SuggestedToolAction
  | SuggestedCloseAction
  | SuggestedSpamAction
  | SuggestedAssignAction;

export const toolsRouter = {
  list: conversationProcedure.query(async ({ ctx }) => {
    const { conversation, mailbox } = ctx;

    const mailboxTools = await db.query.tools.findMany({
      where: and(eq(tools.mailboxId, mailbox.id), eq(tools.enabled, true)),
    });

    const suggested = ((conversation as any).suggestedActions ?? []).map(
      (action: SuggestedAction): ProcessedSuggestedAction => {
        switch (action.type) {
          case "close":
            return { type: "close" as const };
          case "spam":
            return { type: "spam" as const };
          case "assign":
            return { type: "assign" as const, clerkUserId: action.clerkUserId || "" };
          case "tool":
            const { slug, parameters } = action;
            const tool = mailboxTools.find((t) => t.slug === slug);
            if (!tool) {
              throw new Error(`Tool not found: ${slug}`);
            }
            return {
              type: "tool" as const,
              tool: {
                name: tool.name,
                slug: tool.slug,
                description: tool.description,
                parameters: parameters || {},
              },
            };
          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }
      }
    );

    return {
      suggested,
      all: mailboxTools.map((tool) => ({
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        parameterTypes: tool.parameters ?? [],
        customerEmailParameter: tool.customerEmailParameter,
      })),
    };
  }),

  run: conversationProcedure
    .input(
      z.object({
        tool: z.string(),
        params: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tool: toolSlug, params } = input;
      const conversation = ctx.conversation;

      const tool = await db.query.tools.findFirst({
        where: and(eq(tools.slug, toolSlug), eq(tools.mailboxId, conversation.mailboxId), eq(tools.enabled, true)),
      });

      if (!tool) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      try {
        return await callToolApi(conversation, tool, params);
      } catch (error: unknown) {
        if (error instanceof ToolApiError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        captureExceptionAndLogIfDevelopment(error instanceof Error ? error : new Error(String(error)));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error executing tool",
        });
      }
    }),
};
