export interface SlackCredentials {
  botToken: string;
  signingSecret: string;
  appToken?: string | undefined;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
  botUserId?: string;
  scopes?: string[];
  lastChecked: Date;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
  purpose?: string;
}

export interface SlackMessage {
  id: string;
  text: string;
  user: string;
  timestamp: string;
  channel: string;
  threadTs?: string;
}

export interface SlackNotificationOptions {
  conversationId?: string | undefined;
  urgency?: "low" | "medium" | "high" | undefined;
  includeActions?: boolean | undefined;
}

export interface SlackSyncResult {
  messageCount: number;
  lastSyncTime: Date;
  errors: string[];
}

export interface SlackSyncOptions {
  since?: Date | undefined;
  limit?: number | undefined;
}

class SlackService {
  private organizationId: string;
  private credentials?: SlackCredentials;

  constructor(organizationId: string, credentials?: SlackCredentials) {
    this.organizationId = organizationId;
    if (credentials !== undefined) {
      this.credentials = credentials;
    }
  }

  isInitialized(): boolean {
    return !!this.credentials?.botToken;
  }

  async testConnection(): Promise<boolean> {
    if (!this.credentials?.botToken) return false;

    try {
      const response = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.botToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      return false;
    }
  }

  async getStatus(): Promise<SlackStatus> {
    if (!this.credentials?.botToken) {
      return {
        connected: false,
        lastChecked: new Date(),
      };
    }

    try {
      const response = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.botToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = await response.json();

      if (data.ok) {
        return {
          connected: true,
          teamName: data.team,
          botUserId: data.user_id,
          lastChecked: new Date(),
        };
      } else {
        return {
          connected: false,
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      return {
        connected: false,
        lastChecked: new Date(),
      };
    }
  }

  async storeIntegration(credentials: SlackCredentials): Promise<void> {
    // Get team info first
    const status = await this.getStatus();

    // Store in database
    // Use consolidated supabase client
    const supabaseClient = supabase.admin();

    const { error } = await supabase.from("slack_integrations").upsert({
      organization_id: this.organizationId,
      bot_token_encrypted: credentials.botToken, // TODO: Encrypt properly
      signing_secret_encrypted: credentials.signingSecret, // TODO: Encrypt properly
      app_token_encrypted: credentials.appToken || null,
      team_id: status.teamName,
      team_name: status.teamName,
      bot_user_id: status.botUserId,
      status: "active",
    });

    if (error) {
      throw new Error(`Failed to store Slack integration: ${error.message}`);
    }

    this.credentials = credentials;
  }

  async listChannels(): Promise<SlackChannel[]> {
    if (!this.credentials?.botToken) return [];

    try {
      const response = await fetch("https://slack.com/api/conversations.list", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.botToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "types=public_channel,private_channel",
      });

      const data = await response.json();

      if (data.ok && data.channels) {
        return data.channels.map((channel: unknown) => ({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private,
          isMember: channel.is_member,
          purpose: channel.purpose?.value,
        }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  async sendNotification(channel: string, message: string, options?: SlackNotificationOptions): Promise<SlackMessage> {
    if (!this.credentials?.botToken) {
      throw new Error("Slack not configured");
    }

    try {
      const payload = {
        channel,
        text: message,
        ...(options?.conversationId && {
          attachments: [
            {
              color: options.urgency === "high" ? "danger" : options.urgency === "medium" ? "warning" : "good",
              fields: [
                {
                  title: "Conversation ID",
                  value: options.conversationId,
                  short: true,
                },
              ],
              ...(options.includeActions && {
                actions: [
                  {
                    type: "button",
                    text: "View Conversation",
                    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inbox?conversation=${options.conversationId}`,
                  },
                ],
              }),
            },
          ],
        }),
      };

      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ok) {
        return {
          id: data.ts,
          text: message,
          user: data.message.user,
          timestamp: data.ts,
          channel,
        };
      } else {
        throw new Error(`Slack API error: ${data.error}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async postConversationToThread(
    channel: string,
    message: string,
    conversationId: string,
    includeMessages: boolean = false
  ): Promise<SlackMessage> {
    // TODO: Implement actual conversation posting
    return {
      id: "mock-conversation-id",
      text: message,
      user: "bot",
      timestamp: new Date().toISOString(),
      channel,
    };
  }

  async syncChannelMessages(channel: string, options?: SlackSyncOptions): Promise<SlackSyncResult> {
    // TODO: Implement actual message syncing
    return {
      messageCount: 0,
      lastSyncTime: new Date(),
      errors: [],
    };
  }

  async removeIntegration(): Promise<void> {
    // TODO: Remove integration from database
    delete this.credentials;
  }
}

export function createSlackService(organizationId: string, credentials?: SlackCredentials): SlackService {
  return new SlackService(organizationId, credentials);
}

export async function getSlackService(organizationId: string): Promise<SlackService> {
  // Load credentials from database
  // Use consolidated supabase client
  const supabaseClient = supabase.admin();

  const { data: integration, error } = await supabase
    .from("slack_integrations")
    .select("bot_token_encrypted, signing_secret_encrypted, app_token_encrypted")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .single();

  if (error || !integration) {
    return new SlackService(organizationId);
  }

  // TODO: Decrypt tokens properly
  const credentials = {
    botToken: integration.bot_token_encrypted,
    signingSecret: integration.signing_secret_encrypted,
    appToken: integration.app_token_encrypted || undefined,
  };

  return new SlackService(organizationId, credentials);
}
