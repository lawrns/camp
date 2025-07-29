/**
 * Enhanced Slack Integration Service
 * 
 * Provides comprehensive Slack integration including notifications,
 * team collaboration, and conversation synchronization.
 */

export interface SlackConfig {
  botToken: string;
  signingSecret: string;
  appToken?: string;
  defaultChannel: string;
  alertChannel?: string;
  teamId?: string;
}

export interface SlackNotification {
  type: 'new_conversation' | 'escalation' | 'assignment' | 'ai_handover' | 'urgent_message';
  conversationId: string;
  organizationId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  actionButtons?: Array<{
    text: string;
    value: string;
    style?: 'primary' | 'danger';
  }>;
}

export interface SlackUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  timezone?: string;
  isOnline: boolean;
}

export class EnhancedSlackService {
  private config: SlackConfig | null = null;
  private isInitialized = false;

  constructor(config?: SlackConfig) {
    if (config) {
      this.initialize(config);
    }
  }

  /**
   * Initialize the Slack service with configuration
   */
  initialize(config: SlackConfig): void {
    this.config = config;
    this.isInitialized = true;
  }

  /**
   * Send a notification to Slack
   */
  async sendNotification(notification: SlackNotification): Promise<boolean> {
    if (!this.isInitialized || !this.config) {
      console.warn('Slack service not initialized');
      return false;
    }

    try {
      const channel = this.getChannelForNotification(notification);
      const blocks = this.buildMessageBlocks(notification);

      // In production, this would use the Slack Web API
      const response = await this.mockSlackAPI('chat.postMessage', {
        channel,
        blocks,
        text: notification.title, // Fallback text
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      return false;
    }
  }

  /**
   * Send conversation assignment notification
   */
  async notifyAssignment(
    conversationId: string,
    assignedTo: string,
    assignedBy: string,
    reason: string,
    priority: string
  ): Promise<boolean> {
    const notification: SlackNotification = {
      type: 'assignment',
      conversationId,
      organizationId: 'current-org', // Would be passed in
      title: '📋 New Conversation Assignment',
      message: `A conversation has been assigned to <@${assignedTo}> by <@${assignedBy}>`,
      priority: priority as any,
      metadata: { reason },
      actionButtons: [
        { text: 'View Conversation', value: `view_${conversationId}`, style: 'primary' },
        { text: 'Accept', value: `accept_${conversationId}`, style: 'primary' },
      ],
    };

    return this.sendNotification(notification);
  }

  /**
   * Send AI handover notification
   */
  async notifyAIHandover(
    conversationId: string,
    confidence: number,
    reason: string,
    customerSentiment: string
  ): Promise<boolean> {
    const urgency = confidence < 0.3 ? 'urgent' : confidence < 0.6 ? 'high' : 'medium';
    
    const notification: SlackNotification = {
      type: 'ai_handover',
      conversationId,
      organizationId: 'current-org',
      title: '🤖➡️👤 AI Handover Required',
      message: `AI confidence is low (${Math.round(confidence * 100)}%). Human intervention needed.`,
      priority: urgency as any,
      metadata: { confidence, reason, customerSentiment },
      actionButtons: [
        { text: 'Take Over', value: `takeover_${conversationId}`, style: 'primary' },
        { text: 'View Details', value: `details_${conversationId}` },
      ],
    };

    return this.sendNotification(notification);
  }

  /**
   * Send escalation notification
   */
  async notifyEscalation(
    conversationId: string,
    escalatedBy: string,
    reason: string,
    customerInfo: { name?: string; email?: string; tier?: string }
  ): Promise<boolean> {
    const priority = customerInfo.tier === 'enterprise' ? 'urgent' : 'high';
    
    const notification: SlackNotification = {
      type: 'escalation',
      conversationId,
      organizationId: 'current-org',
      title: '🚨 Conversation Escalated',
      message: `Conversation escalated by <@${escalatedBy}>: ${reason}`,
      priority: priority as any,
      metadata: { reason, customerInfo },
      actionButtons: [
        { text: 'Handle Escalation', value: `escalate_${conversationId}`, style: 'danger' },
        { text: 'View Conversation', value: `view_${conversationId}` },
      ],
    };

    return this.sendNotification(notification);
  }

  /**
   * Get team members from Slack
   */
  async getTeamMembers(): Promise<SlackUser[]> {
    if (!this.isInitialized || !this.config) {
      return [];
    }

    try {
      // In production, this would use the Slack Web API
      const response = await this.mockSlackAPI('users.list', {
        team_id: this.config.teamId,
      });

      if (!response.ok || !response.members) {
        return [];
      }

      return response.members.map((member: any) => ({
        id: member.id,
        name: member.real_name || member.name,
        email: member.profile?.email,
        avatar: member.profile?.image_72,
        timezone: member.tz,
        isOnline: member.presence === 'active',
      }));
    } catch (error) {
      console.error('Error fetching Slack team members:', error);
      return [];
    }
  }

  /**
   * Create a Slack thread for a conversation
   */
  async createConversationThread(
    conversationId: string,
    customerName: string,
    initialMessage: string
  ): Promise<string | null> {
    if (!this.isInitialized || !this.config) {
      return null;
    }

    try {
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `💬 New Conversation: ${customerName}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Customer:* ${customerName}\n*Message:* ${initialMessage}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View in Dashboard' },
              value: `view_${conversationId}`,
              action_id: 'view_conversation',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Assign to Me' },
              value: `assign_${conversationId}`,
              action_id: 'assign_conversation',
              style: 'primary',
            },
          ],
        },
      ];

      const response = await this.mockSlackAPI('chat.postMessage', {
        channel: this.config.defaultChannel,
        blocks,
        text: `New conversation from ${customerName}`,
      });

      return response.ok ? response.ts : null;
    } catch (error) {
      console.error('Error creating Slack conversation thread:', error);
      return null;
    }
  }

  /**
   * Update conversation thread with new messages
   */
  async updateConversationThread(
    threadTs: string,
    message: string,
    senderType: 'customer' | 'agent' | 'ai'
  ): Promise<boolean> {
    if (!this.isInitialized || !this.config) {
      return false;
    }

    try {
      const emoji = senderType === 'customer' ? '👤' : senderType === 'agent' ? '👨‍💼' : '🤖';
      const text = `${emoji} ${message}`;

      const response = await this.mockSlackAPI('chat.postMessage', {
        channel: this.config.defaultChannel,
        thread_ts: threadTs,
        text,
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating Slack conversation thread:', error);
      return false;
    }
  }

  private getChannelForNotification(notification: SlackNotification): string {
    if (!this.config) return '#general';

    switch (notification.type) {
      case 'escalation':
      case 'urgent_message':
        return this.config.alertChannel || this.config.defaultChannel;
      default:
        return this.config.defaultChannel;
    }
  }

  private buildMessageBlocks(notification: SlackNotification): any[] {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: notification.title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: notification.message,
        },
      },
    ];

    // Add priority indicator
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🔴 *${notification.priority.toUpperCase()} PRIORITY*`,
          },
        ],
      });
    }

    // Add action buttons
    if (notification.actionButtons && notification.actionButtons.length > 0) {
      blocks.push({
        type: 'actions',
        elements: notification.actionButtons.map(button => ({
          type: 'button',
          text: { type: 'plain_text', text: button.text },
          value: button.value,
          action_id: button.value,
          style: button.style,
        })),
      });
    }

    return blocks;
  }

  private async mockSlackAPI(method: string, params: any): Promise<any> {
    // Mock implementation for development
    console.log(`[Slack API] ${method}:`, params);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock successful responses
    switch (method) {
      case 'chat.postMessage':
        return { ok: true, ts: `${Date.now()}.000100` };
      case 'users.list':
        return {
          ok: true,
          members: [
            {
              id: 'U123456',
              name: 'john.doe',
              real_name: 'John Doe',
              profile: { email: 'john@company.com', image_72: 'https://example.com/avatar.jpg' },
              tz: 'America/New_York',
              presence: 'active',
            },
          ],
        };
      default:
        return { ok: true };
    }
  }
}

export const slackService = new EnhancedSlackService();
