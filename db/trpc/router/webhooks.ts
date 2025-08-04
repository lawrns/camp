/**
 * Webhooks tRPC Router
 *
 * Handles webhook management operations
 * Replaces direct fetch() calls in WebhookManagement component
 */

import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  description: z.string().optional(),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateWebhookSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").optional(),
  url: z.string().url("Valid URL is required").optional(),
  events: z.array(z.string()).optional(),
  description: z.string().optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const webhooksRouter = createTRPCRouter({
  // List all webhooks for the organization
  list: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createClient();

    // Get user's organization
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", ctx.user.id)
      .single();

    if (memberError || !member) {
      throw new Error("No organization access");
    }

    // Fetch webhooks for the organization
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select(
        `
        id,
        name,
        url,
        events,
        description,
        is_active,
        last_triggered_at,
        success_count,
        failure_count,
        created_at,
        updated_at
      `
      )
      .eq("organization_id", member.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch webhooks: ${error.message}`);
    }

    return {
      success: true,
      data: { webhooks: webhooks || [] },
    };
  }),

  // Create a new webhook
  create: protectedProcedure.input(createWebhookSchema).mutation(async ({ ctx, input }) => {
    const supabase = createClient();

    // Get user's organization
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", ctx.user.id)
      .single();

    if (memberError || !member) {
      throw new Error("No organization access");
    }

    // Check if user has permission to create webhooks
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to create webhooks");
    }

    // Generate webhook secret if not provided
    const webhookSecret = input.secret || generateWebhookSecret();

    // Create webhook record
    const { data: webhook, error } = await supabase
      .from("webhooks")
      .insert({
        organization_id: member.organization_id,
        name: input.name,
        url: input.url,
        events: input.events,
        description: input.description,
        secret: webhookSecret,
        isActive: input.isActive,
        createdBy: ctx.user.id,
        success_count: 0,
        failure_count: 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }

    return {
      success: true,
      data: { webhook },
    };
  }),

  // Update a webhook
  update: protectedProcedure.input(updateWebhookSchema).mutation(async ({ ctx, input }) => {
    const supabase = createClient();

    // Get user's organization
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", ctx.user.id)
      .single();

    if (memberError || !member) {
      throw new Error("No organization access");
    }

    // Check if user has permission to update webhooks
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to update webhooks");
    }

    // Update webhook
    const { data: webhook, error } = await supabase
      .from("webhooks")
      .update({
        ...(input.name && { name: input.name }),
        ...(input.url && { url: input.url }),
        ...(input.events && { events: input.events }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.secret && { secret: input.secret }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("organization_id", member.organization_id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update webhook: ${error.message}`);
    }

    return {
      success: true,
      data: { webhook },
    };
  }),

  // Delete a webhook
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const supabase = createClient();

    // Get user's organization
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", ctx.user.id)
      .single();

    if (memberError || !member) {
      throw new Error("No organization access");
    }

    // Check if user has permission to delete webhooks
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to delete webhooks");
    }

    // Delete webhook
    const { error } = await supabase
      .from("webhooks")
      .delete()
      .eq("id", input.id)
      .eq("organization_id", member.organization_id);

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }

    return {
      success: true,
      data: { deleted: true },
    };
  }),

  // Test a webhook
  test: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const supabase = createClient();

    // Get user's organization
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", ctx.user.id)
      .single();

    if (memberError || !member) {
      throw new Error("No organization access");
    }

    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", input.id)
      .eq("organization_id", member.organization_id)
      .single();

    if (webhookError || !webhook) {
      throw new Error("Webhook not found");
    }

    // Send test payload
    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from Campfire",
        organization_id: member.organization_id,
      },
    };

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": generateWebhookSignature(testPayload, webhook.secret),
          "User-Agent": "Campfire-Webhooks/1.0",
        },
        body: JSON.stringify(testPayload),
      });

      const success = response.ok;
      const statusCode = response.status;
      const responseText = await response.text();

      // Update webhook stats
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          [success ? "success_count" : "failure_count"]: webhook[success ? "success_count" : "failure_count"] + 1,
        })
        .eq("id", input.id);

      return {
        success: true,
        data: {
          success,
          statusCode,
          response: responseText.substring(0, 500), // Limit response size
        },
      };
    } catch (error) {
      // Update failure count
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: webhook.failure_count + 1,
        })
        .eq("id", input.id);

      throw new Error(`Webhook test failed: ${(error as Error).message}`);
    }
  }),

  // Get webhook delivery logs
  logs: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = createClient();

      // Get user's organization
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", ctx.user.id)
        .single();

      if (memberError || !member) {
        throw new Error("No organization access");
      }

      // Fetch webhook delivery logs
      const { data: logs, error } = await supabase
        .from("webhook_deliveries")
        .select(
          `
          id,
          event_type,
          status_code,
          success,
          response_body,
          error_message,
          delivered_at,
          created_at
        `
        )
        .eq("webhook_id", input.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new Error(`Failed to fetch webhook logs: ${error.message}`);
      }

      return {
        success: true,
        data: { logs: logs || [] },
      };
    }),
});

// Helper functions
function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateWebhookSignature(payload: unknown, secret: string): string {
  // In a real implementation, use HMAC-SHA256
  // For now, using a simple signature
  const payloadString = JSON.stringify(payload);
  return `sha256=${Buffer.from(payloadString + secret).toString("base64")}`;
}
