import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { organizations } from "./organizations";

export const webhooks = pgTable("webhooks", {
    id: uuid("id").primaryKey().defaultRandom(),
    organization_id: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    events: jsonb("events").$type<string[]>().notNull(),
    description: text("description"),
    secret: text("secret"),
    is_active: boolean("is_active").default(true).notNull(),
    last_triggered_at: timestamp("last_triggered_at", { withTimezone: true }),
    success_count: integer("success_count").default(0).notNull(),
    failure_count: integer("failure_count").default(0).notNull(),
    headers: jsonb("headers").$type<Record<string, any>>(),
    retry_count: integer("retry_count").default(0).notNull(),
    timeout_seconds: integer("timeout_seconds").default(30).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
    ...withTimestamps,
    id: uuid("id").primaryKey().defaultRandom(),
    webhook_id: uuid("webhook_id")
        .notNull()
        .references(() => webhooks.id, { onDelete: "cascade" }),
    event_type: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    response_status: integer("response_status"),
    response_body: text("response_body"),
    error_message: text("error_message"),
    delivery_time_ms: integer("delivery_time_ms"),
}); 