/**
 * Slack Agent Mailbox Finder
 * Determines which mailbox should handle a Slack event
 */

import type { SlackEvent } from "../client";

export interface Mailbox {
  id: string;
  name: string;
  organizationId: string;
  slackChannelId?: string;
  slackTeamId?: string;
  isActive: boolean;
  settings: {
    autoRespond: boolean;
    escalateToHuman: boolean;
    businessHours?: {
      enabled: boolean;
      timezone: string;
      schedule: {
        [key: string]: { start: string; end: string } | null;
      };
    };
  };
}

export interface MailboxMapping {
  slackChannelId: string;
  slackTeamId: string;
  mailboxId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindMailboxResult {
  mailbox: Mailbox | null;
  mapping: MailboxMapping | null;
  reason: string;
}

export class MailboxFinder {
  private mailboxes: Map<string, Mailbox> = new Map();
  private mappings: Map<string, MailboxMapping> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock mailboxes
    const mailbox1: Mailbox = {
      id: "mailbox_1",
      name: "General Support",
      organizationId: "org_123",
      slackChannelId: "C123456",
      slackTeamId: "T123456",
      isActive: true,
      settings: {
        autoRespond: true,
        escalateToHuman: false,
        businessHours: {
          enabled: true,
          timezone: "America/New_York",
          schedule: {
            monday: { start: "09:00", end: "17:00" },
            tuesday: { start: "09:00", end: "17:00" },
            wednesday: { start: "09:00", end: "17:00" },
            thursday: { start: "09:00", end: "17:00" },
            friday: { start: "09:00", end: "17:00" },
            saturday: null,
            sunday: null,
          },
        },
      },
    };

    const mailbox2: Mailbox = {
      id: "mailbox_2",
      name: "Technical Support",
      organizationId: "org_123",
      slackChannelId: "C789012",
      slackTeamId: "T123456",
      isActive: true,
      settings: {
        autoRespond: true,
        escalateToHuman: true,
        businessHours: {
          enabled: false,
          timezone: "UTC",
          schedule: {},
        },
      },
    };

    this.mailboxes.set(mailbox1.id, mailbox1);
    this.mailboxes.set(mailbox2.id, mailbox2);

    // Mock mappings
    const mapping1: MailboxMapping = {
      slackChannelId: "C123456",
      slackTeamId: "T123456",
      mailboxId: "mailbox_1",
      organizationId: "org_123",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    const mapping2: MailboxMapping = {
      slackChannelId: "C789012",
      slackTeamId: "T123456",
      mailboxId: "mailbox_2",
      organizationId: "org_123",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    this.mappings.set(this.getMappingKey("C123456", "T123456"), mapping1);
    this.mappings.set(this.getMappingKey("C789012", "T123456"), mapping2);
  }

  async findMailboxForEvent(event: SlackEvent): Promise<FindMailboxResult> {
    try {
      // Extract channel and team from event
      const channelId = event.channel;
      const teamId = event.team;

      if (!channelId) {
        return {
          mailbox: null,
          mapping: null,
          reason: "No channel ID in event",
        };
      }

      if (!teamId) {
        return {
          mailbox: null,
          mapping: null,
          reason: "No team ID in event",
        };
      }

      // Look for direct mapping
      const mappingKey = this.getMappingKey(channelId, teamId);
      const mapping = this.mappings.get(mappingKey);

      if (!mapping) {
        return {
          mailbox: null,
          mapping: null,
          reason: `No mapping found for channel ${channelId} in team ${teamId}`,
        };
      }

      // Get the mailbox
      const mailbox = this.mailboxes.get(mapping.mailboxId);

      if (!mailbox) {
        return {
          mailbox: null,
          mapping,
          reason: `Mailbox ${mapping.mailboxId} not found`,
        };
      }

      if (!mailbox.isActive) {
        return {
          mailbox: null,
          mapping,
          reason: `Mailbox ${mailbox.name} is inactive`,
        };
      }

      return {
        mailbox,
        mapping,
        reason: `Found mailbox ${mailbox.name} for channel ${channelId}`,
      };
    } catch (error) {
      return {
        mailbox: null,
        mapping: null,
        reason: `Error finding mailbox: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async findMailboxByChannel(channelId: string, teamId: string): Promise<FindMailboxResult> {
    const event: SlackEvent = {
      type: "message",
      event_ts: Date.now().toString(),
      channel: channelId,
      team: teamId,
    };

    return this.findMailboxForEvent(event);
  }

  async createMapping(
    channelId: string,
    teamId: string,
    mailboxId: string,
    organizationId: string
  ): Promise<MailboxMapping> {
    const mapping: MailboxMapping = {
      slackChannelId: channelId,
      slackTeamId: teamId,
      mailboxId,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mappingKey = this.getMappingKey(channelId, teamId);
    this.mappings.set(mappingKey, mapping);

    return mapping;
  }

  async updateMapping(
    channelId: string,
    teamId: string,
    updates: Partial<Pick<MailboxMapping, "mailboxId" | "organizationId">>
  ): Promise<MailboxMapping | null> {
    const mappingKey = this.getMappingKey(channelId, teamId);
    const mapping = this.mappings.get(mappingKey);

    if (!mapping) return null;

    const updatedMapping: MailboxMapping = {
      ...mapping,
      ...updates,
      updatedAt: new Date(),
    };

    this.mappings.set(mappingKey, updatedMapping);
    return updatedMapping;
  }

  async deleteMapping(channelId: string, teamId: string): Promise<boolean> {
    const mappingKey = this.getMappingKey(channelId, teamId);
    return this.mappings.delete(mappingKey);
  }

  async getMappingsByOrganization(organizationId: string): Promise<MailboxMapping[]> {
    return Array.from(this.mappings.values()).filter((mapping: unknown) => mapping.organizationId === organizationId);
  }

  async getMappingsByMailbox(mailboxId: string): Promise<MailboxMapping[]> {
    return Array.from(this.mappings.values()).filter((mapping: unknown) => mapping.mailboxId === mailboxId);
  }

  async getMailbox(mailboxId: string): Promise<Mailbox | null> {
    return this.mailboxes.get(mailboxId) || null;
  }

  async getMailboxesByOrganization(organizationId: string): Promise<Mailbox[]> {
    return Array.from(this.mailboxes.values()).filter(
      (mailbox) => mailbox.organizationId === organizationId && mailbox.isActive
    );
  }

  async isBusinessHours(mailbox: Mailbox): Promise<boolean> {
    if (!mailbox.settings.businessHours?.enabled) {
      return true; // Always available if business hours not enabled
    }

    const now = new Date();
    const timezone = mailbox.settings.businessHours.timezone;

    // Simple business hours check (in production, use a proper timezone library)
    const dayOfWeek = now
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: timezone,
      })
      .toLowerCase() as keyof typeof mailbox.settings.businessHours.schedule;

    const schedule = mailbox.settings.businessHours.schedule[dayOfWeek];

    if (!schedule) {
      return false; // No schedule for this day
    }

    const currentTime = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });

    return currentTime >= schedule.start && currentTime <= schedule.end;
  }

  async shouldAutoRespond(mailbox: Mailbox): Promise<boolean> {
    if (!mailbox.settings.autoRespond) {
      return false;
    }

    // Check business hours if enabled
    const isBusinessHours = await this.isBusinessHours(mailbox);

    // Auto-respond during business hours, or always if business hours not enabled
    return isBusinessHours;
  }

  async shouldEscalateToHuman(mailbox: Mailbox): Promise<boolean> {
    if (!mailbox.settings.escalateToHuman) {
      return false;
    }

    // Check business hours for escalation
    return this.isBusinessHours(mailbox);
  }

  private getMappingKey(channelId: string, teamId: string): string {
    return `${teamId}:${channelId}`;
  }
}

// Default instance
export const mailboxFinder = new MailboxFinder();

// Utility functions
export async function findMailboxForEvent(event: SlackEvent): Promise<FindMailboxResult> {
  return mailboxFinder.findMailboxForEvent(event);
}

export async function findMailboxByChannel(channelId: string, teamId: string): Promise<FindMailboxResult> {
  return mailboxFinder.findMailboxByChannel(channelId, teamId);
}

export async function createSlackMailboxMapping(
  channelId: string,
  teamId: string,
  mailboxId: string,
  organizationId: string
): Promise<MailboxMapping> {
  return mailboxFinder.createMapping(channelId, teamId, mailboxId, organizationId);
}

export async function shouldAutoRespond(mailbox: Mailbox): Promise<boolean> {
  return mailboxFinder.shouldAutoRespond(mailbox);
}

export async function shouldEscalateToHuman(mailbox: Mailbox): Promise<boolean> {
  return mailboxFinder.shouldEscalateToHuman(mailbox);
}
