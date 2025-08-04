/**
 * API Keys tRPC Router
 *
 * Handles API key management operations
 * Replaces direct fetch() calls in ApiKeysManagement component
 */

import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.date().optional(),
});

const updateApiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const apiKeysRouter = createTRPCRouter({
  // List all API keys for the organization
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

    // Fetch API keys for the organization
    const { data: apiKeys, error } = await supabase
      .from("api_keys")
      .select(
        `
        id,
        name,
        description,
        key_prefix,
        permissions,
        is_active,
        last_used_at,
        expires_at,
        created_at,
        updated_at
      `
      )
      .eq("organization_id", member.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }

    return {
      success: true,
      data: { apiKeys: apiKeys || [] },
    };
  }),

  // Create a new API key
  create: protectedProcedure.input(createApiKeySchema).mutation(async ({ ctx, input }) => {
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

    // Check if user has permission to create API keys
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to create API keys");
    }

    // Generate API key
    const keyPrefix = "ck_";
    const keySecret = generateSecureKey();
    const fullKey = `${keyPrefix}${keySecret}`;
    const hashedKey = await hashApiKey(keySecret);

    // Create API key record
    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .insert({
        organization_id: member.organization_id,
        name: input.name,
        description: input.description,
        key_prefix: keyPrefix,
        key_hash: hashedKey,
        permissions: input.permissions,
        expiresAt: input.expiresAt?.toISOString(),
        createdBy: ctx.user.id,
        isActive: true,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return {
      success: true,
      data: {
        apiKey: {
          ...apiKey,
          full_key: fullKey, // Only returned once during creation
        },
      },
    };
  }),

  // Update an API key
  update: protectedProcedure.input(updateApiKeySchema).mutation(async ({ ctx, input }) => {
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

    // Check if user has permission to update API keys
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to update API keys");
    }

    // Update API key
    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .update({
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.permissions && { permissions: input.permissions }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("organization_id", member.organization_id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }

    return {
      success: true,
      data: { apiKey },
    };
  }),

  // Delete an API key
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

    // Check if user has permission to delete API keys
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to delete API keys");
    }

    // Delete API key
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", input.id)
      .eq("organization_id", member.organization_id);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }

    return {
      success: true,
      data: { deleted: true },
    };
  }),

  // Regenerate an API key
  regenerate: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
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

    // Check if user has permission to regenerate API keys
    if (!["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions to regenerate API keys");
    }

    // Generate new API key
    const keyPrefix = "ck_";
    const keySecret = generateSecureKey();
    const fullKey = `${keyPrefix}${keySecret}`;
    const hashedKey = await hashApiKey(keySecret);

    // Update API key with new hash
    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .update({
        key_hash: hashedKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("organization_id", member.organization_id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to regenerate API key: ${error.message}`);
    }

    return {
      success: true,
      data: {
        apiKey: {
          ...apiKey,
          full_key: fullKey, // Only returned once during regeneration
        },
      },
    };
  }),
});

// Helper functions
function generateSecureKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashApiKey(key: string): Promise<string> {
  // In a real implementation, use a proper hashing library like bcrypt
  // For now, using a simple hash
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
