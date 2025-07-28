import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSlackService, getSlackService } from "@/lib/integrations/slack";
import { createTRPCRouter, protectedProcedure } from "@/trpc/trpc";

// Input validation schemas
const slackCredentialsSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  signingSecret: z.string().min(1, "Signing secret is required"),
  appToken: z.string().optional(),
});

const slackConfigSchema = z.object({
  credentials: slackCredentialsSchema,
  selectedChannels: z.array(z.string()).optional().default([]),
  settings: z
    .object({
      enableBidirectionalSync: z.boolean().default(true),
      enableRichFormatting: z.boolean().default(true),
      enableNotifications: z.boolean().default(true),
      notificationChannels: z.array(z.string()).default([]),
    })
    .optional(),
});

export const slackRouter = createTRPCRouter({
  /**
   * Get Slack integration status
   */
  getStatus: protectedProcedure.input(z.object({ organizationId: z.string() })).query(async ({ input, ctx }) => {
    try {
      const service = await getSlackService(input.organizationId);
      const status = await service.getStatus();

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      console.error("Error getting Slack status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get Slack integration status",
      });
    }
  }),

  /**
   * Test Slack connection
   */
  testConnection: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        credentials: slackCredentialsSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createSlackService(input.organizationId, input.credentials);
        const isConnected = await service.testConnection();

        if (!isConnected) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to connect to Slack. Please check your credentials.",
          });
        }

        const status = await service.getStatus();

        return {
          success: true,
          message: "Connection successful",
          data: status,
        };
      } catch (error) {
        console.error("Error testing Slack connection:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to test Slack connection",
        });
      }
    }),

  /**
   * Save Slack configuration
   */
  saveConfiguration: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        config: slackConfigSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createSlackService(input.organizationId, input.config.credentials);

        // Test connection first
        const isConnected = await service.testConnection();
        if (!isConnected) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid credentials. Please check your Slack app configuration.",
          });
        }

        // Store integration in database
        await service.storeIntegration(input.config.credentials);

        return {
          success: true,
          message: "Slack integration configured successfully",
        };
      } catch (error) {
        console.error("Error saving Slack configuration:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save Slack configuration",
        });
      }
    }),

  /**
   * Get list of Slack channels
   */
  getChannels: protectedProcedure.input(z.object({ organizationId: z.string() })).query(async ({ input, ctx }) => {
    try {
      const service = await getSlackService(input.organizationId);

      if (!service.isInitialized()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Slack integration not configured",
        });
      }

      const channels = await service.listChannels();

      return {
        success: true,
        data: channels,
      };
    } catch (error) {
      console.error("Error getting Slack channels:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get Slack channels",
      });
    }
  }),

  /**
   * Send message to Slack channel
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        channel: z.string(),
        message: z.string(),
        options: z
          .object({
            conversationId: z.string().optional(),
            urgency: z.enum(["low", "medium", "high"]).default("medium"),
            includeActions: z.boolean().default(true),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = await getSlackService(input.organizationId);

        if (!service.isInitialized()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Slack integration not configured",
          });
        }

        const result = await service.sendNotification(input.channel, input.message, input.options);

        return {
          success: true,
          message: "Message sent successfully",
          data: result,
        };
      } catch (error) {
        console.error("Error sending Slack message:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message to Slack",
        });
      }
    }),

  /**
   * Send conversation to Slack
   */
  sendConversation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        channel: z.string(),
        conversationId: z.string(),
        message: z.string(),
        includeMessages: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = await getSlackService(input.organizationId);

        if (!service.isInitialized()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Slack integration not configured",
          });
        }

        const result = await service.postConversationToThread(
          input.channel,
          input.message,
          input.conversationId,
          input.includeMessages
        );

        return {
          success: true,
          message: "Conversation sent successfully",
          data: result,
        };
      } catch (error) {
        console.error("Error sending conversation to Slack:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send conversation to Slack",
        });
      }
    }),

  /**
   * Sync messages from Slack channel
   */
  syncMessages: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        channel: z.string(),
        since: z.date().optional(),
        limit: z.number().min(1).max(1000).default(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = await getSlackService(input.organizationId);

        if (!service.isInitialized()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Slack integration not configured",
          });
        }

        const result = await service.syncChannelMessages(input.channel, {
          since: input.since,
          limit: input.limit,
        });

        return {
          success: true,
          message: `Synced ${result.messageCount} messages`,
          data: result,
        };
      } catch (error) {
        console.error("Error syncing Slack messages:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync messages from Slack",
        });
      }
    }),

  /**
   * Remove Slack integration
   */
  removeIntegration: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = await getSlackService(input.organizationId);
        await service.removeIntegration();

        return {
          success: true,
          message: "Slack integration removed successfully",
        };
      } catch (error) {
        console.error("Error removing Slack integration:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove Slack integration",
        });
      }
    }),

  /**
   * Get integration configuration
   */
  getConfiguration: protectedProcedure.input(z.object({ organizationId: z.string() })).query(async ({ input, ctx }) => {
    try {
      // Import database dependencies inline since imports at top aren't working
      const { db } = await import("@/db");
      const { mailboxes } = await import("@/db/schema/mailboxes");
      const { eq } = await import("drizzle-orm");

      // Fetch real Slack configuration from database
      const mailboxConfig = await db
        .select({
          slackBotToken: mailboxes.slackBotToken,
          slackBotUserId: mailboxes.slackBotUserId,
          slackTeamId: mailboxes.slackTeamId,
          slackAlertChannel: mailboxes.slackAlertChannel,
        })
        .from(mailboxes)
        .where(eq(mailboxes.organizationId, input.organizationId))
        .limit(1);

      const config = mailboxConfig[0];
      const isConfigured = !!(config?.slackBotToken && config?.slackTeamId);

      return {
        success: true,
        data: {
          isConfigured,
          selectedChannels: config?.slackAlertChannel ? [config.slackAlertChannel] : [],
          settings: {
            enableBidirectionalSync: true,
            enableRichFormatting: true,
            enableNotifications: true,
            notificationChannels: config?.slackAlertChannel ? [config.slackAlertChannel] : [],
          },
          teamId: config?.slackTeamId,
          botUserId: config?.slackBotUserId,
        },
      };
    } catch (error) {
      console.error("Error getting Slack configuration:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get Slack configuration",
      });
    }
  }),

  /**
   * Update integration settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        settings: z.object({
          enableBidirectionalSync: z.boolean(),
          enableRichFormatting: z.boolean(),
          enableNotifications: z.boolean(),
          notificationChannels: z.array(z.string()),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Import database dependencies inline
        const { db } = await import("@/db");
        const { mailboxes } = await import("@/db/schema/mailboxes");
        const { eq } = await import("drizzle-orm");

        // Update Slack settings in database
        const primaryNotificationChannel = input.settings.notificationChannels[0] || null;

        await db
          .update(mailboxes)
          .set({
            slackAlertChannel: primaryNotificationChannel,
            updatedAt: new Date(),
          })
          .where(eq(mailboxes.organizationId, input.organizationId));

        return {
          success: true,
          message: "Settings updated successfully",
        };
      } catch (error) {
        console.error("Error updating Slack settings:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Slack settings",
        });
      }
    }),
});
