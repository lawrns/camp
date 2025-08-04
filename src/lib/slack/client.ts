/**
 * Slack Client Functions
 * Provides Slack integration utilities
 */

export interface SlackUser {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  isActive: boolean;
  isBot: boolean;
  timezone?: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  user?: string;
  ts: string;
  thread_ts?: string;
  attachments?: unknown[];
}

export interface SlackModal {
  type: "modal";
  title: {
    type: "plain_text";
    text: string;
  };
  blocks: unknown[];
  submit?: {
    type: "plain_text";
    text: string;
  };
  close?: {
    type: "plain_text";
    text: string;
  };
}

export interface SlackEvent {
  type: string;
  event_ts: string;
  channel: string;
  team: string;
  user?: string;
  text?: string;
  thread_ts?: string;
}

/**
 * List Slack channels
 */
export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  topic?: {
    value: string;
  };
  purpose?: {
    value: string;
  };
}

export async function listSlackChannels(token: string): Promise<SlackChannel[]> {
  // Mock implementation - in real app, this would call Slack API
  return [
    {
      id: "C1234567890",
      name: "general",
      is_private: false,
      is_member: true,
      topic: { value: "General discussion" },
      purpose: { value: "Company-wide announcements and general discussion" },
    },
    {
      id: "C0987654321",
      name: "support",
      is_private: false,
      is_member: true,
      topic: { value: "Customer support" },
      purpose: { value: "Customer support and help desk" },
    },
  ];
}

/**
 * Get Slack user by email - alias for backward compatibility
 */
export async function getSlackUser(email: string): Promise<SlackUser | null> {
  const users = await getSlackUsersByEmail([email]);
  return users?.[0] || null;
}

/**
 * Update Slack message - alias for backward compatibility
 */
export async function updateSlackMessage(
  channel: string,
  messageTs: string,
  text: string,
  options: {
    blocks?: unknown[];
    attachments?: unknown[];
  } = {}
): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - in real app, this would call Slack API
  try {
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Slack users by email
 */
export async function getSlackUsersByEmail(emails: string[]): Promise<SlackUser[]> {
  // Mock implementation - in real app, this would call Slack API
  return emails.map((email, index) => ({
    id: `U${String(index + 1).padStart(10, "0")}`,
    email,
    name: email.split("@")[0],
    displayName: email.split("@")[0]?.replace(".", " ") ?? email,
    isActive: true,
    isBot: false,
    timezone: "America/New_York",
  }));
}

/**
 * Get Slack users by email as a Map (for quick lookup)
 */
export async function getSlackUsersByEmailMap(botToken: string): Promise<Map<string, string>> {
  // Mock implementation - in real app, this would call Slack API with bot token
  // Returns a Map of email -> Slack user ID
  return new Map<string, string>();
}

/**
 * Post a direct message to a Slack user
 */
export async function postSlackDM(
  userId: string,
  message: string,
  options: {
    blocks?: unknown[];
    attachments?: unknown[];
    thread_ts?: string;
  } = {}
): Promise<{ success: boolean; ts?: string; error?: string }> {
  // Mock implementation - in real app, this would call Slack API
  try {
    return {
      success: true,
      ts: `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Post a message to a Slack channel
 */
export async function postSlackMessage(
  botToken: string,
  options: {
    channel: string;
    text: string;
    blocks?: unknown[];
    attachments?: unknown[];
    thread_ts?: string;
  }
): Promise<{ success: boolean; ts?: string; error?: string }> {
  // Mock implementation - in real app, this would call Slack API
  try {
    return {
      success: true,
      ts: `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get permalink for a Slack message
 */
export async function getSlackPermalink(
  channel: string,
  messageTs: string
): Promise<{ success: boolean; permalink?: string; error?: string }> {
  // Mock implementation - in real app, this would call Slack API
  try {
    const permalink = `https://workspace.slack.com/archives/${channel}/p${messageTs.replace(".", "")}`;

    return {
      success: true,
      permalink,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Open a modal in Slack
 */
export async function openSlackModal(
  triggerId: string,
  modal: SlackModal
): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - in real app, this would call Slack API
  try {
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Uninstall Slack app from workspace
 */
export async function uninstallSlackApp(teamId: string): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - in real app, this would call Slack API
  try {
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  options: {
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: unknown[];
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Mock implementation - in real app, this would use email service
  try {
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Slack API configuration
 */
export interface SlackConfig {
  botToken?: string;
  signingSecret?: string;
  clientId?: string;
  clientSecret?: string;
  workspaceUrl?: string;
}

/**
 * Get Slack configuration
 */
export function getSlackConfig(): SlackConfig {
  const config: SlackConfig = {};

  if (process.env.SLACK_BOT_TOKEN) {
    config.botToken = process.env.SLACK_BOT_TOKEN;
  }

  if (process.env.SLACK_SIGNING_SECRET) {
    config.signingSecret = process.env.SLACK_SIGNING_SECRET;
  }

  if (process.env.SLACK_CLIENT_ID) {
    config.clientId = process.env.SLACK_CLIENT_ID;
  }

  if (process.env.SLACK_CLIENT_SECRET) {
    config.clientSecret = process.env.SLACK_CLIENT_SECRET;
  }

  if (process.env.SLACK_WORKSPACE_URL) {
    config.workspaceUrl = process.env.SLACK_WORKSPACE_URL;
  }

  return config;
}

/**
 * Check if Slack is configured
 */
export function isSlackConfigured(): boolean {
  const config = getSlackConfig();
  return !!(config.botToken && config.signingSecret);
}

/**
 * Format Slack message blocks
 */
export function formatSlackBlocks(
  message: string,
  options: {
    title?: string;
    color?: "good" | "warning" | "danger";
    fields?: Array<{ title: string; value: string; short?: boolean }>;
    actions?: Array<{ type: string; text: string; url?: string; value?: string }>;
  } = {}
): unknown[] {
  const blocks: unknown[] = [];

  if (options.title) {
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: options.title,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: message,
    },
  });

  if (options.fields && options.fields.length > 0) {
    blocks.push({
      type: "section",
      fields: options.fields.map((field) => ({
        type: "mrkdwn",
        text: `*${field.title}*\n${field.value}`,
      })),
    });
  }

  if (options.actions && options.actions.length > 0) {
    blocks.push({
      type: "actions",
      elements: options.actions.map((action) => ({
        type: "button",
        text: {
          type: "plain_text",
          text: action.text,
        },
        url: action.url,
        value: action.value,
      })),
    });
  }

  return blocks;
}
