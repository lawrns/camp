import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { profiles } from "./profiles";

export const agents = pgTable("agents", {
    id: uuid("id").primaryKey().defaultRandom(),
    profile_id: uuid("profile_id")
        .notNull()
        .references(() => profiles.userId, { onDelete: "cascade" }),
    organization_id: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    status: text("status").default("available").notNull(), // available, busy, offline, away
    max_concurrent_conversations: integer("max_concurrent_conversations").default(5).notNull(),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    auto_accept: boolean("auto_accept").default(false).notNull(),
    skill_based_routing: boolean("skill_based_routing").default(true).notNull(),
    performance_score: integer("performance_score").default(100).notNull(),
    total_conversations_handled: integer("total_conversations_handled").default(0).notNull(),
    average_response_time_ms: integer("average_response_time_ms").default(0).notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentWorkload = pgTable("agent_workload", {
    id: uuid("id").primaryKey().defaultRandom(),
    agent_id: uuid("agent_id")
        .notNull()
        .references(() => agents.id, { onDelete: "cascade" }),
    organization_id: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
    active_conversations: integer("active_conversations").default(0).notNull(),
    max_capacity: integer("max_capacity").default(5).notNull(),
    utilization_rate: integer("utilization_rate").default(0).notNull(),
    is_available: boolean("is_available").default(true).notNull(),
    can_take_new_conversations: boolean("can_take_new_conversations").default(true).notNull(),
    last_activity_at: timestamp("last_activity_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}); 