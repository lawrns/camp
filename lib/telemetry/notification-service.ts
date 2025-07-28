import { env } from "@/lib/utils/env-config";
import { type AlertInstance } from "./alert-rules";

export type NotificationChannelType = "email" | "slack" | "webhook" | "sms" | "teams";

export interface NotificationChannel {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  config: Record<string, any>;
  rateLimitMinutes?: number;
  lastSentAt?: Date;
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  html?: string;
}

export interface NotificationResult {
  success: boolean;
  channelId: string;
  error?: string;
  sentAt: Date;
}

export class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();
  private rateLimitTracker: Map<string, Date> = new Map();

  constructor() {
    this.loadDefaultChannels();
  }

  private loadDefaultChannels() {
    const defaultChannels: NotificationChannel[] = [
      {
        id: "email-default",
        name: "Default Email",
        type: "email",
        enabled: true,
        config: {
          recipients: ["admin@example.com"],
          smtpHost: "smtp.example.com",
          smtpPort: 587,
          username: "alerts@example.com",
          password: "password", // In real implementation, use environment variables
        },
        rateLimitMinutes: 10,
      },
      {
        id: "slack-support",
        name: "Support Team Slack",
        type: "slack",
        enabled: true,
        config: {
          webhookUrl: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
          channel: "#support-alerts",
          username: "Campfire Alerts",
        },
        rateLimitMinutes: 5,
      },
      {
        id: "slack-engineering",
        name: "Engineering Team Slack",
        type: "slack",
        enabled: true,
        config: {
          webhookUrl: "https://hooks.slack.com/services/T00000000/B00000000/YYYYYYYYYYYYYYYYYYYYYYYY",
          channel: "#engineering-alerts",
          username: "Campfire Alerts",
        },
        rateLimitMinutes: 5,
      },
    ];

    defaultChannels.forEach((channel: any) => {
      this.channels.set(channel.id, channel);
    });
  }

  async sendAlert(channelId: string, alert: AlertInstance): Promise<NotificationResult> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return {
        success: false,
        channelId,
        error: "Channel not found",
        sentAt: new Date(),
      };
    }

    if (!channel.enabled) {
      return {
        success: false,
        channelId,
        error: "Channel is disabled",
        sentAt: new Date(),
      };
    }

    // Check rate limit
    if (this.isRateLimited(channelId)) {
      return {
        success: false,
        channelId,
        error: "Rate limited",
        sentAt: new Date(),
      };
    }

    try {
      const template = this.generateAlertTemplate(alert);

      switch (channel.type) {
        case "email":
          await this.sendEmailNotification(channel, alert, template);
          break;
        case "slack":
          await this.sendSlackNotification(channel, alert, template);
          break;
        case "webhook":
          await this.sendWebhookNotification(channel, alert, template);
          break;
        case "sms":
          await this.sendSmsNotification(channel, alert, template);
          break;
        case "teams":
          await this.sendTeamsNotification(channel, alert, template);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      // Update rate limit tracker
      this.rateLimitTracker.set(channelId, new Date());

      return {
        success: true,
        channelId,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        channelId,
        error: error instanceof Error ? error.message : "Unknown error",
        sentAt: new Date(),
      };
    }
  }

  private isRateLimited(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel?.rateLimitMinutes) return false;

    const lastSent = this.rateLimitTracker.get(channelId);
    if (!lastSent) return false;

    const rateLimitEnd = new Date(lastSent.getTime() + channel.rateLimitMinutes * 60 * 1000);
    return new Date() < rateLimitEnd;
  }

  private generateAlertTemplate(alert: AlertInstance): NotificationTemplate {
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    const statusEmoji = this.getStatusEmoji(alert.status);

    const subject = `${severityEmoji} ${alert.severity.toUpperCase()} Alert: ${alert.ruleName}`;

    const body = `
Alert Details:
${statusEmoji} Status: ${alert.status.toUpperCase()}
📊 Metric: ${alert.metric}
📈 Current Value: ${alert.value}
🎯 Threshold: ${alert.threshold}
⚠️ Condition: ${alert.condition.replace("_", " ")}
🕐 Triggered At: ${alert.triggeredAt.toLocaleString()}

Message: ${alert.message}

Take action at: ${env.NEXT_PUBLIC_APP_URL}/monitoring/alerts
    `.trim();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: ${this.getSeverityColor(alert.severity)};">
    ${severityEmoji} ${alert.severity.toUpperCase()} Alert: ${alert.ruleName}
  </h2>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3>Alert Details</h3>
    <p><strong>${statusEmoji} Status:</strong> ${alert.status.toUpperCase()}</p>
    <p><strong>📊 Metric:</strong> ${alert.metric}</p>
    <p><strong>📈 Current Value:</strong> ${alert.value}</p>
    <p><strong>🎯 Threshold:</strong> ${alert.threshold}</p>
    <p><strong>⚠️ Condition:</strong> ${alert.condition.replace("_", " ")}</p>
    <p><strong>🕐 Triggered At:</strong> ${alert.triggeredAt.toLocaleString()}</p>
  </div>
  
  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <strong>Message:</strong> ${alert.message}
  </div>
  
  <p>
    <a href="${env.NEXT_PUBLIC_APP_URL}/monitoring/alerts" 
       style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      View in Dashboard
    </a>
  </p>
</div>
    `.trim();

    return { subject, body, html };
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "low":
        return "🔵";
      case "medium":
        return "🟡";
      case "high":
        return "🟠";
      case "critical":
        return "🔴";
      default:
        return "⚪";
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case "active":
        return "🚨";
      case "acknowledged":
        return "👀";
      case "resolved":
        return "✅";
      case "silenced":
        return "🔇";
      default:
        return "❓";
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "low":
        return "#007bff";
      case "medium":
        return "#ffc107";
      case "high":
        return "#fd7e14";
      case "critical":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  }

  private async sendEmailNotification(
    channel: NotificationChannel,
    alert: AlertInstance,
    template: NotificationTemplate
  ): Promise<void> {
    // Mock email sending - in real implementation, use nodemailer or similar
    // }`);
    // // // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async sendSlackNotification(
    channel: NotificationChannel,
    alert: AlertInstance,
    template: NotificationTemplate
  ): Promise<void> {
    const webhookUrl = channel.config.webhookUrl;
    const slackMessage = {
      channel: channel.config.channel,
      username: channel.config.username || "Campfire Alerts",
      icon_emoji: ":warning:",
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          title: template.subject,
          text: alert.message,
          fields: [
            {
              title: "Metric",
              value: alert.metric,
              short: true,
            },
            {
              title: "Current Value",
              value: alert.value.toString(),
              short: true,
            },
            {
              title: "Threshold",
              value: alert.threshold.toString(),
              short: true,
            },
            {
              title: "Triggered At",
              value: alert.triggeredAt.toLocaleString(),
              short: true,
            },
          ],
          actions: [
            {
              type: "button",
              text: "View Alert",
              url: `${env.NEXT_PUBLIC_APP_URL}/monitoring/alerts`,
            },
          ],
        },
      ],
    };

    // Mock Slack webhook call - in real implementation, use fetch or axios
    // // );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  private async sendWebhookNotification(
    channel: NotificationChannel,
    alert: AlertInstance,
    template: NotificationTemplate
  ): Promise<void> {
    const payload = {
      event: "alert.triggered",
      alert: {
        id: alert.id,
        ruleName: alert.ruleName,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        triggeredAt: alert.triggeredAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Mock webhook call
    // // );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  private async sendSmsNotification(
    channel: NotificationChannel,
    alert: AlertInstance,
    template: NotificationTemplate
  ): Promise<void> {
    const smsMessage = `${template.subject}\n\n${alert.message}\n\nView: ${env.NEXT_PUBLIC_APP_URL}/monitoring/alerts`;

    // Mock SMS sending - in real implementation, use Twilio or similar
    // }`);
    // // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  private async sendTeamsNotification(
    channel: NotificationChannel,
    alert: AlertInstance,
    template: NotificationTemplate
  ): Promise<void> {
    const teamsMessage = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: this.getSeverityColor(alert.severity),
      summary: template.subject,
      sections: [
        {
          activityTitle: template.subject,
          activitySubtitle: alert.message,
          facts: [
            {
              name: "Metric",
              value: alert.metric,
            },
            {
              name: "Current Value",
              value: alert.value.toString(),
            },
            {
              name: "Threshold",
              value: alert.threshold.toString(),
            },
            {
              name: "Triggered At",
              value: alert.triggeredAt.toLocaleString(),
            },
          ],
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Alert",
          targets: [
            {
              os: "default",
              uri: `${env.NEXT_PUBLIC_APP_URL}/monitoring/alerts`,
            },
          ],
        },
      ],
    };

    // Mock Teams webhook call
    // // );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  // Channel management methods
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  updateChannel(id: string, updates: Partial<NotificationChannel>): boolean {
    const channel = this.channels.get(id);
    if (!channel) return false;

    const updatedChannel = { ...channel, ...updates };
    this.channels.set(id, updatedChannel);
    return true;
  }

  removeChannel(id: string): boolean {
    return this.channels.delete(id);
  }

  getChannel(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  getAllChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  async testChannel(id: string): Promise<NotificationResult> {
    const testAlert: AlertInstance = {
      id: "test-alert",
      ruleId: "test-rule",
      ruleName: "Test Alert",
      message: "This is a test notification to verify channel configuration.",
      severity: "low",
      status: "active",
      value: 100,
      threshold: 50,
      condition: "greater_than",
      metric: "test_metric",
      triggeredAt: new Date(),
      notificationsSent: [],
    };

    return this.sendAlert(id, testAlert);
  }
}

// Singleton instance
export const notificationService = new NotificationService();
