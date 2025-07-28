import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversations } from "@/db/schema";
import type { ConversationContext, ConversationProcedureContext } from "@/trpc/types";
import { mailboxProcedure } from "../procedure";

export const conversationProcedure = mailboxProcedure
  .input(z.object({ conversationSlug: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.uid, input.conversationSlug), eq(conversations.mailboxId, ctx.mailbox.id)),
    });

    if (!conversation) throw new TRPCError({ code: "NOT_FOUND" });

    // Map database conversation to context type
    const conversationContext: ConversationContext = {
      id: Number(conversation.id),
      uid: conversation.uid,
      subject: conversation.subject,
      mailboxId: Number(conversation.mailboxId),
      status: conversation.status || "open",
      embedding: conversation.embedding as number[] | null,
      organizationId: conversation.organizationId,

      // Customer info
      customerEmail: conversation.customerEmail,
      customerId: conversation.customerEmail || "",
      customerName: conversation.customerDisplayName,
      customerAvatar: null,

      // Assignment
      assignedToId: conversation.assignedToUserId,
      assignedToUserId: conversation.assignedToUserId,
      assignedOperatorId: conversation.assignedToUserId,

      // Metadata
      lastMessageAt: conversation.lastReplyAt,
      lastActiveAt: conversation.lastActiveAt || conversation.updatedAt,
      tags: conversation.tags || [],
      priority: conversation.priority?.toString() || null,
      source: (conversation.source as any) || "email",

      // GitHub integration
      githubIssueNumber: conversation.githubIssueNumber,
      githubIssueUrl: conversation.githubIssueUrl,
      githubRepoOwner: conversation.githubRepoOwner,
      githubRepoName: conversation.githubRepoName,

      // RAG
      lastRagResponseId: conversation.lastRagResponseId,

      // Timestamps
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return next({
      ctx: {
        ...ctx,
        conversation: conversationContext,
        dbConversation: conversation, // Add original DB conversation for serialization
        validatedConversationId: conversationContext.id.toString(),
      } as ConversationProcedureContext,
    });
  });
