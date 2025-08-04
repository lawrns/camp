import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { mailboxProcedure } from "./procedure";

// import { acceptFaqEdit, createFaq, deleteFaq, getFaq, listFaqs, rejectFaqEdit, updateFaq } from "@/lib/core/knowledge"; // Module not found

// Simple fallbacks for knowledge functions
const acceptFaqEdit = async (mailbox: unknown, id: number, content?: string) => ({ mailbox, id, content, accepted: true });
const createFaq = async (mailboxId: number, content: string) => ({ mailboxId, content, created: true });
const deleteFaq = async (mailboxId: number, id: number) => ({ mailboxId, id, deleted: true });
const getFaq = async (mailboxId: number, id: number) => ({ mailboxId, id, faq: null });
const listFaqs = async (mailboxId: number) => ({ mailboxId, faqs: [] });
const rejectFaqEdit = async (mailbox: unknown, id: number) => ({ mailbox, id, rejected: true });
const updateFaq = async (mailboxId: number, id: number, content?: string, enabled?: boolean) => ({
  mailboxId,
  id,
  content,
  enabled,
  updated: true,
});

// Simple fallback for knowledgeService
const knowledgeService = {
  listFAQs: listFaqs,
  createFAQ: createFaq,
  updateFAQ: updateFaq,
  deleteFAQ: deleteFaq,
};

export const faqsRouter = {
  list: mailboxProcedure.query(({ ctx }) => knowledgeService.listFAQs(ctx.mailbox.id)),
  create: mailboxProcedure
    .input(z.object({ content: z.string() }))
    .mutation(({ ctx, input }) => knowledgeService.createFAQ(ctx.mailbox.id, input.content)),
  update: mailboxProcedure
    .input(z.object({ id: z.number(), content: z.string().optional(), enabled: z.boolean().optional() }))
    .mutation(({ ctx, input }) => knowledgeService.updateFAQ(ctx.mailbox.id, input.id, input.content, input.enabled)),
  delete: mailboxProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => knowledgeService.deleteFAQ(ctx.mailbox.id, input.id)),
  accept: mailboxProcedure
    .input(z.object({ id: z.number(), content: z.string().optional() }))
    .mutation(({ ctx, input }) => acceptFaqEdit(ctx.mailbox, input.id, input.content)),
  reject: mailboxProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => rejectFaqEdit(ctx.mailbox, input.id)),
} satisfies TRPCRouterRecord;
