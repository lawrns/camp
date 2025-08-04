/**
 * SlackIntegrationAdapter - Handles Slack type chaos and eliminates `as unknown` casts
 */

export interface SlackConfig {
  slackBotToken?: string;
  slackAlertChannel?: string;
  slackUserId?: string;
  slackTeamId?: string;
}

export interface SlackUser {
  id: string;
  fullName: string;
  email?: string;
  slackUserId?: string;
  externalAccounts?: Array<{
    provider: string;
    externalId: string;
  }>;
}

export class SlackIntegrationAdapter {
  /**
   * Safely extracts Slack configuration from mailbox
   */
  static getSlackConfig(mailbox: unknown): SlackConfig {
    if (!mailbox || typeof mailbox !== "object") {
      return {};
    }

    return {
      slackBotToken: mailbox.slackBotToken ?? undefined,
      slackAlertChannel: mailbox.slackAlertChannel ?? undefined,
      slackUserId: mailbox.slackUserId ?? undefined,
      slackTeamId: mailbox.slackTeamId ?? undefined,
    };
  }

  /**
   * Safely extracts Slack user information
   */
  static getSlackUser(user: unknown): SlackUser {
    if (!user || typeof user !== "object") {
      return {
        id: "",
        fullName: "Unknown User",
      };
    }

    const externalAccounts = Array.isArray(user.externalAccounts) ? user.externalAccounts : [];
    const slackAccount = externalAccounts.find((account: unknown) => account?.provider === "oauth_slack");

    return {
      id: user.id ?? "",
      fullName: user.fullName ?? "Unknown User",
      email: user.email ?? undefined,
      slackUserId: slackAccount?.externalId ?? undefined,
      externalAccounts: externalAccounts,
    };
  }

  /**
   * Checks if Slack integration is properly configured
   */
  static isSlackConfigured(mailbox: unknown): boolean {
    const config = this.getSlackConfig(mailbox);
    return !!(config.slackBotToken && config.slackAlertChannel);
  }

  /**
   * Gets Slack user mention or fallback to full name
   */
  static getSlackMention(user: SlackUser): string {
    if (user.slackUserId) {
      return `<@${user.slackUserId}>`;
    }
    return user.fullName || "Unknown User";
  }

  /**
   * Formats Slack message heading
   */
  static formatSlackHeading(customerEmail: string, assignee: SlackUser, assignedBy?: SlackUser): string {
    const assigneeMention = this.getSlackMention(assignee);
    const assignedByText = assignedBy ? ` by ${assignedBy.fullName}` : "";

    return `_Message from ${customerEmail} assigned to *${assigneeMention}*${assignedByText}_`;
  }
}

/**
 * Type guards for Slack integration
 */
export class SlackTypeGuards {
  static isSlackConfigured(mailbox: unknown): mailbox is { slackBotToken: string; slackAlertChannel: string } {
    return (
      typeof mailbox === "object" &&
      mailbox !== null &&
      "slackBotToken" in mailbox &&
      "slackAlertChannel" in mailbox &&
      typeof (mailbox as unknown).slackBotToken === "string" &&
      typeof (mailbox as unknown).slackAlertChannel === "string"
    );
  }

  static hasSlackAccount(user: unknown): user is { externalAccounts: Array<{ provider: string; externalId: string }> } {
    return (
      typeof user === "object" &&
      user !== null &&
      "externalAccounts" in user &&
      Array.isArray((user as unknown).externalAccounts)
    );
  }
}
