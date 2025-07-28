/**
 * Mailbox data operations
 * Provides functions for managing mailboxes and their integrations
 */

import { db } from "@/db/client";
import { createApiClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type Mailbox = Database["public"]["Tables"]["mailboxes"]["Row"];
export type MailboxMember = Database["public"]["Tables"]["mailbox_members"]["Row"];

/**
 * Get a mailbox by ID
 */
export async function getMailbox(mailboxId: string): Promise<Mailbox | null> {
  const supabase = createApiClient();

  const { data, error } = await supabase.from("mailboxes").select("*").eq("id", mailboxId).single();

  if (error) {

    return null;
  }

  return data;
}

/**
 * Alias for getMailbox for backward compatibility
 */
export const getMailboxById = getMailbox;

/**
 * Get mailbox by organization ID
 */
export async function getMailboxByOrganization(organizationId: string): Promise<Mailbox | null> {
  const supabase = createApiClient();

  const { data, error } = await supabase.from("mailboxes").select("*").eq("organization_id", organizationId).single();

  if (error) {

    return null;
  }

  return data;
}

/**
 * Update GitHub repository settings for a mailbox
 */
export async function updateGitHubRepo(mailboxId: string, repoOwner: string, repoName: string): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase
    .from("mailboxes")
    .update({
      github_repo_owner: repoOwner,
      github_repo_name: repoName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mailboxId);

  if (error) {
    throw new Error(`Failed to update GitHub repo: ${error.message}`);
  }
}

/**
 * Disconnect GitHub integration from a mailbox
 */
export async function disconnectGitHub(mailboxId: string): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase
    .from("mailboxes")
    .update({
      github_installation_id: null,
      github_repo_owner: null,
      github_repo_name: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mailboxId);

  if (error) {
    throw new Error(`Failed to disconnect GitHub: ${error.message}`);
  }
}

/**
 * Connect Slack to a mailbox
 */
export async function connectSlack(mailboxId: string, slackTeamId: string, slackChannelId: string): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase
    .from("mailboxes")
    .update({
      slack_team_id: slackTeamId,
      slack_channel_id: slackChannelId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mailboxId);

  if (error) {
    throw new Error(`Failed to connect Slack: ${error.message}`);
  }
}

/**
 * Disconnect Slack integration from a mailbox
 */
export async function disconnectSlack(mailboxId: string): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase
    .from("mailboxes")
    .update({
      slack_team_id: null,
      slack_channel_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mailboxId);

  if (error) {
    throw new Error(`Failed to disconnect Slack: ${error.message}`);
  }
}

/**
 * Get mailbox members
 */
export async function getMailboxMembers(mailboxId: string): Promise<MailboxMember[]> {
  const supabase = createApiClient();

  const { data, error } = await supabase.from("mailbox_members").select("*").eq("mailbox_id", mailboxId);

  if (error) {

    return [];
  }

  return data || [];
}

/**
 * Add a member to a mailbox
 */
export async function addMailboxMember(
  mailboxId: string,
  userId: string,
  role: "owner" | "member" = "member"
): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase.from("mailbox_members").insert({
    mailbox_id: mailboxId,
    user_id: userId,
    role,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to add mailbox member: ${error.message}`);
  }
}

/**
 * Remove a member from a mailbox
 */
export async function removeMailboxMember(mailboxId: string, userId: string): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase.from("mailbox_members").delete().eq("mailbox_id", mailboxId).eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to remove mailbox member: ${error.message}`);
  }
}

/**
 * Create a new mailbox for an organization
 */
export async function createMailbox(
  organizationId: string,
  data: {
    name: string;
    slug: string;
    email?: string;
  }
): Promise<Mailbox> {
  const supabase = createApiClient();

  const { data: mailbox, error } = await supabase
    .from("mailboxes")
    .insert({
      organization_id: organizationId,
      name: data.name,
      slug: data.slug,
      email: data.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create mailbox: ${error.message}`);
  }

  return mailbox;
}

/**
 * Update mailbox settings
 */
export async function updateMailboxSettings(
  mailboxId: string,
  settings: Partial<{
    name: string;
    email: string;
    auto_assign: boolean;
    auto_resolve_hours: number;
  }>
): Promise<void> {
  const supabase = createApiClient();

  const { error } = await supabase
    .from("mailboxes")
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mailboxId);

  if (error) {
    throw new Error(`Failed to update mailbox settings: ${error.message}`);
  }
}
