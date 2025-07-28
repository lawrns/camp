import { relations } from "drizzle-orm";
import { bigint, boolean, index, integer, json, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";
import { mailboxes } from "./mailboxes";
import { platformCustomers } from "./platformCustomers";

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "critical" | "high" | "medium" | "low" | "urgent";

// Ticket Types Table
export const ticketTypes = pgTable(
  "ticket_types",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    mailboxId: bigint({ mode: "number" })
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    icon: text(),
    color: text(),
    defaultPriority: text().$type<TicketPriority>().default("medium"),
    defaultStatus: text().$type<TicketStatus>().default("open"),
    fields: json(),
    autoAssign: boolean().default(false),
    slaHours: integer(),
  },
  (table) => {
    return {
      mailboxIdIdx: index("idx_ticket_types_mailbox_id").on(table.mailboxId),
    };
  }
);

// Tickets Table
export const tickets = pgTable(
  "tickets",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    ticketNumber: bigint({ mode: "number" }).notNull().generatedByDefaultAsIdentity(),
    conversationId: text().references(() => conversations.id, { onDelete: "set null" }),
    mailboxId: bigint({ mode: "number" })
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    ticketTypeId: bigint({ mode: "number" }).references(() => ticketTypes.id, { onDelete: "set null" }),
    title: text().notNull(),
    description: text(),
    status: text().notNull().$type<TicketStatus>().default("open"),
    priority: text().notNull().$type<TicketPriority>().default("medium"),
    assigneeId: text(),
    reporterId: text(),
    customerId: text().references(() => platformCustomers.id, { onDelete: "set null" }),
    dueDate: timestamp({ withTimezone: true }),
    tags: text().array(),
    metadata: json(),
    resolvedAt: timestamp({ withTimezone: true }),
    closedAt: timestamp({ withTimezone: true }),
  },
  (table) => {
    return {
      conversationIdIdx: index("idx_tickets_conversation_id").on(table.conversationId),
      mailboxIdIdx: index("idx_tickets_mailbox_id").on(table.mailboxId),
      ticketTypeIdIdx: index("idx_tickets_ticket_type_id").on(table.ticketTypeId),
      assigneeIdIdx: index("idx_tickets_assignee_id").on(table.assigneeId),
      customerIdIdx: index("idx_tickets_customer_id").on(table.customerId),
      statusIdx: index("idx_tickets_status").on(table.status),
      priorityIdx: index("idx_tickets_priority").on(table.priority),
      dueDateIdx: index("idx_tickets_due_date").on(table.dueDate),
      uniqueTicketNumber: unique("unique_ticket_mailbox_number").on(table.mailboxId, table.ticketNumber),
    };
  }
);

// Ticket Fields Table
export const ticketFields = pgTable(
  "ticket_fields",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    ticketId: bigint({ mode: "number" })
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    fieldName: text().notNull(),
    fieldValue: json(),
  },
  (table) => {
    return {
      ticketIdIdx: index("idx_ticket_fields_ticket_id").on(table.ticketId),
      uniqueField: unique("unique_ticket_field").on(table.ticketId, table.fieldName),
    };
  }
);

// Ticket Comments Table
export const ticketComments = pgTable(
  "ticket_comments",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    ticketId: bigint({ mode: "number" })
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    comment: text().notNull(),
    isInternal: boolean().default(true),
    attachments: json(),
  },
  (table) => {
    return {
      ticketIdIdx: index("idx_ticket_comments_ticket_id").on(table.ticketId),
      userIdIdx: index("idx_ticket_comments_user_id").on(table.userId),
    };
  }
);

// Ticket History Table
export const ticketHistory = pgTable(
  "ticket_history",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    ticketId: bigint({ mode: "number" })
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: text(),
    action: text().notNull(),
    fieldName: text(),
    oldValue: json(),
    newValue: json(),
  },
  (table) => {
    return {
      ticketIdIdx: index("idx_ticket_history_ticket_id").on(table.ticketId),
      userIdIdx: index("idx_ticket_history_user_id").on(table.userId),
      actionIdx: index("idx_ticket_history_action").on(table.action),
    };
  }
);

// Relations
export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  mailbox: one(mailboxes, {
    fields: [ticketTypes.mailboxId],
    references: [mailboxes.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [tickets.conversationId],
    references: [conversations.id],
  }),
  mailbox: one(mailboxes, {
    fields: [tickets.mailboxId],
    references: [mailboxes.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [tickets.ticketTypeId],
    references: [ticketTypes.id],
  }),
  customer: one(platformCustomers, {
    fields: [tickets.customerId],
    references: [platformCustomers.id],
  }),
  fields: many(ticketFields),
  comments: many(ticketComments),
  history: many(ticketHistory),
}));

export const ticketFieldsRelations = relations(ticketFields, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketFields.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketHistory.ticketId],
    references: [tickets.id],
  }),
}));
