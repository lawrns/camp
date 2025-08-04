import { db } from "@/db/client";
import { mailboxes, ticketComments, ticketHistory, tickets } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Input validation schemas
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]).default("open"),
  assigneeId: z.string().optional(),
  customerId: z.string().optional(),
  conversationId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateTicketSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const addCommentSchema = z.object({
  ticketId: z.number(),
  comment: z.string().min(1, "Comment is required"),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.unknown()).optional(),
});

const getTicketsSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
});

export const ticketsRouter = createTRPCRouter({
  // Get all tickets with filtering
  getTickets: protectedProcedure.input(getTicketsSchema).query(async ({ ctx, input }) => {
    const { user } = ctx;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      // Build where conditions
      const conditions = [eq(tickets.mailboxId, mailbox.id)];

      if (input.status) {
        conditions.push(eq(tickets.status, input.status));
      }
      if (input.assigneeId) {
        conditions.push(eq(tickets.assigneeId, input.assigneeId));
      }
      if (input.priority) {
        conditions.push(eq(tickets.priority, input.priority));
      }

      const ticketsList = await db.query.tickets.findMany({
        where: conditions.length > 1 ? and(...conditions) : conditions[0],
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(tickets.createdAt),
        with: {
          conversation: {
            columns: {
              id: true,
              subject: true,
              customerEmail: true,
              customerDisplayName: true,
            },
          },
        },
      });

      return {
        tickets: ticketsList,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          total: ticketsList.length,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tickets",
        cause: error,
      });
    }
  }),

  // Get a single ticket by ID
  getTicket: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const { user } = ctx;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      const ticket = await db.query.tickets.findFirst({
        where: and(eq(tickets.id, input.id), eq(tickets.mailboxId, mailbox.id)),
        with: {
          conversation: {
            columns: {
              id: true,
              subject: true,
              customerEmail: true,
              customerDisplayName: true,
            },
          },
          comments: {
            orderBy: desc(ticketComments.createdAt),
          },
          history: {
            orderBy: desc(ticketHistory.createdAt),
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      return ticket;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch ticket",
        cause: error,
      });
    }
  }),

  // Create a new ticket
  createTicket: protectedProcedure.input(createTicketSchema).mutation(async ({ ctx, input }) => {
    const { user } = ctx;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      // Create the ticket
      const [newTicket] = await db
        .insert(tickets)
        .values({
          mailboxId: mailbox.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: input.status,
          assigneeId: input.assigneeId,
          customerId: input.customerId,
          conversationId: input.conversationId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          tags: input.tags,
          metadata: input.metadata,
          reporterId: user.id,
        })
        .returning();

      // Log the creation in ticket history
      await db.insert(ticketHistory).values({
        ticketId: newTicket.id,
        action: "created",
        userId: user.id,
        newValue: `Ticket created: ${input.title}`,
      });

      return newTicket;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create ticket",
        cause: error,
      });
    }
  }),

  // Update a ticket
  updateTicket: protectedProcedure.input(updateTicketSchema).mutation(async ({ ctx, input }) => {
    const { user } = ctx;
    const { id, ...updateData } = input;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      // Get the current ticket
      const currentTicket = await db.query.tickets.findFirst({
        where: and(eq(tickets.id, id), eq(tickets.mailboxId, mailbox.id)),
      });

      if (!currentTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Update the ticket
      const [updatedTicket] = await db
        .update(tickets)
        .set({
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, id))
        .returning();

      // Log changes in ticket history
      for (const [field, newValue] of Object.entries(updateData)) {
        if (newValue !== undefined) {
          const oldValue = (currentTicket as unknown)[field];
          if (oldValue !== newValue) {
            await db.insert(ticketHistory).values({
              ticketId: id,
              action: "updated",
              userId: user.id,
              fieldName: field,
              oldValue: oldValue,
              newValue: newValue,
            });
          }
        }
      }

      return updatedTicket;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update ticket",
        cause: error,
      });
    }
  }),

  // Delete a ticket
  deleteTicket: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const { user } = ctx;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      // Check if ticket exists
      const ticket = await db.query.tickets.findFirst({
        where: and(eq(tickets.id, input.id), eq(tickets.mailboxId, mailbox.id)),
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Delete the ticket (cascade will handle comments and history)
      await db.delete(tickets).where(eq(tickets.id, input.id));

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete ticket",
        cause: error,
      });
    }
  }),

  // Add a comment to a ticket
  addComment: protectedProcedure.input(addCommentSchema).mutation(async ({ ctx, input }) => {
    const { user } = ctx;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      // Check if ticket exists
      const ticket = await db.query.tickets.findFirst({
        where: and(eq(tickets.id, input.ticketId), eq(tickets.mailboxId, mailbox.id)),
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Add the comment
      const [newComment] = await db
        .insert(ticketComments)
        .values({
          ticketId: input.ticketId,
          userId: user.id,
          comment: input.comment,
          attachments: input.attachments,
        })
        .returning();

      // Log the comment in ticket history
      await db.insert(ticketHistory).values({
        ticketId: input.ticketId,
        action: "comment_added",
        fieldName: "comment",
        newValue: input.isInternal ? "Internal comment added" : "Comment added",
      });

      return newComment;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add comment",
        cause: error,
      });
    }
  }),

  // Get ticket statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    try {
      // Get organization's mailbox
      const mailbox = await db.query.mailboxes.findFirst({
        where: eq(mailboxes.organizationId, user.organizationId),
      });

      if (!mailbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization mailbox not found",
        });
      }

      // Get ticket counts by status
      const allTickets = await db.query.tickets.findMany({
        where: eq(tickets.mailboxId, mailbox.id),
        columns: {
          status: true,
          priority: true,
          createdAt: true,
        },
      });

      const stats = {
        total: allTickets.length,
        open: allTickets.filter((t) => t.status === "open").length,
        inProgress: allTickets.filter((t) => t.status === "in_progress").length,
        waiting: allTickets.filter((t) => t.status === "waiting").length,
        resolved: allTickets.filter((t) => t.status === "resolved").length,
        closed: allTickets.filter((t) => t.status === "closed").length,
        urgent: allTickets.filter((t) => t.priority === "urgent").length,
        high: allTickets.filter((t) => t.priority === "high").length,
        medium: allTickets.filter((t) => t.priority === "medium").length,
        low: allTickets.filter((t) => t.priority === "low").length,
      };

      return stats;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch ticket statistics",
        cause: error,
      });
    }
  }),
});
