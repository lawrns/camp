import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { WidgetMessage } from "@/app/types";
import { db } from "@/db/client";
import { widgetSettings } from "@/db/schema";
import type { WidgetConfig } from "@/types/widget-config";
import { tenantMiddleware } from "../middleware/tenant";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Define missing types locally
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  views?: number;
  isActive?: boolean;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  views?: number;
  helpful?: number;
  notHelpful?: number;
  publishedAt?: Date;
  updatedAt?: Date;
}

interface WidgetAnalytics {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalSessions: number;
    uniqueVisitors: number;
    totalMessages: number;
    avgSessionDuration: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
  topFAQs: FAQItem[];
  topArticles: KnowledgeBaseArticle[];
}

interface WidgetSession {
  id: string;
  userId?: string;
  visitorId?: string;
  organizationId?: string;
  startTime?: Date;
  startedAt?: Date;
  endTime?: Date;
  lastActiveAt?: Date;
  metadata?: Record<string, any>;
}

// Input validation schemas
const widgetConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  mailboxId: z.string(),
  organizationId: z.string(),
  domain: z.string(),
  allowedOrigins: z.array(z.string()),
  enabled: z.boolean(),
  appearance: z.object({
    theme: z.enum(["light", "dark", "auto"]),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
    borderRadius: z.number(),
    fontFamily: z.string(),
    iconUrl: z.string().optional(),
    logoUrl: z.string().optional(),
    customCSS: z.string().optional(),
  }),
  features: z.object({
    fileUpload: z.boolean(),
    emojiReactions: z.boolean(),
    typingIndicators: z.boolean(),
    readReceipts: z.boolean(),
    offlineMessage: z.boolean(),
    knowledgeBase: z.boolean(),
    faq: z.boolean(),
    conversationHistory: z.boolean(),
    aiAssistant: z.boolean(),
    agentHandoff: z.boolean(),
    customFields: z.boolean(),
    satisfaction: z.boolean(),
    analytics: z.boolean(),
  }),
  content: z.object({
    welcomeMessage: z.string(),
    placeholderText: z.string(),
    offlineMessage: z.string(),
    thankYouMessage: z.string(),
    errorMessage: z.string(),
  }),
  operatingHours: z
    .object({
      timezone: z.string(),
      schedule: z.array(
        z.object({
          day: z.string(),
          start: z.string(),
          end: z.string(),
          enabled: z.boolean(),
        })
      ),
    })
    .optional(),
  customCSS: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const sessionSchema = z.object({
  id: z.string(),
  widgetId: z.string(),
  conversationId: z.number().optional(),
  visitor: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  context: z.object({
    userAgent: z.string(),
    referrer: z.string(),
    pageUrl: z.string(),
    ipAddress: z.string().optional(),
    location: z
      .object({
        country: z.string(),
        city: z.string(),
        timezone: z.string(),
      })
      .optional(),
  }),
  isActive: z.boolean(),
  startedAt: z.date(),
  lastActivity: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

const messageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  conversationId: z.number().optional(),
  role: z.enum(["visitor", "agent", "ai", "system"]),
  content: z.string(),
  timestamp: z.date(),
  status: z.enum(["sending", "sent", "delivered", "read", "failed"]),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional(),
  metadata: z
    .object({
      fileAttachments: z
        .array(
          z.object({
            name: z.string(),
            url: z.string(),
            type: z.string(),
            size: z.number(),
          })
        )
        .optional(),
      aiGenerated: z.boolean().optional(),
      confidence: z.number().optional(),
      agentId: z.string().optional(),
      customData: z.record(z.unknown()).optional(),
    })
    .optional(),
});

// Mock data for development
const mockWidgetConfig: WidgetConfig = {
  workspaceId: "campfire-org",
  publicKey: "pk_test_123",
  apiEndpoint: "https://api.campfire.com/v1",
  realtimeEndpoint: "wss://realtime.campfire.com",
  supabase: {
    url: "https://supabase.campfire.com",
    anonKey: "anon_key_123",
    realtimeConfig: {
      channels: {
        conversation: "conversation",
        global: "global",
      },
      events: ["message", "typing", "presence"],
    },
  },
  appearance: {
    primaryColor: "#3B82F6",
    position: "bottom-right",
    size: "medium",
  },
  features: {
    fileUpload: true,
    search: true,
    businessHours: true,
    aiResponses: true,
    readReceipts: true,
    allowFileUploads: true,
    showTypingIndicator: true,
    enableSoundNotifications: true,
    enableEmailCapture: true,
    allowScreenshots: true,
    enableRealtime: true,
  },
  security: {
    allowedOrigins: ["*"],
    rateLimits: {
      messagesPerMinute: 30,
      uploadsPerHour: 10,
      searchesPerMinute: 20,
    },
  },
};

const mockFAQItems: FAQItem[] = [
  {
    id: "1",
    question: "How do I get started with Campfire?",
    answer:
      "Getting started with Campfire is easy! Simply sign up for an account, create your first workspace, and start inviting team members.",
    category: "Getting Started",
    order: 1,
    views: 1250,
    isActive: true,
  },
  {
    id: "2",
    question: "What integrations does Campfire support?",
    answer:
      "Campfire integrates with popular tools like Slack, Discord, Microsoft Teams, Zoom, and many more. Check our integrations page for the full list.",
    category: "Integrations",
    order: 2,
    views: 890,
    isActive: true,
  },
  {
    id: "3",
    question: "How do I customize my widget?",
    answer:
      "You can customize your widget appearance, behavior, and content through the Widget Settings page in your dashboard.",
    category: "Customization",
    order: 3,
    views: 765,
    isActive: true,
  },
];

const mockKnowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: "1",
    title: "Setting up your first workspace",
    content: "Learn how to create and configure your first Campfire workspace...",
    category: "Getting Started",
    tags: ["workspace", "setup"],
    views: 1250,
    helpful: 45,
    notHelpful: 3,
    publishedAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Advanced widget customization",
    content: "Discover advanced techniques for customizing your Campfire widget...",
    category: "Customization",
    tags: ["widget", "advanced", "css"],
    views: 890,
    helpful: 32,
    notHelpful: 1,
    publishedAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Integrating with third-party services",
    content: "Learn how to connect Campfire with your existing tools and services...",
    category: "Integrations",
    tags: ["integrations", "api", "webhooks"],
    views: 675,
    helpful: 28,
    notHelpful: 2,
    publishedAt: new Date(),
    updatedAt: new Date(),
  },
];

export const widgetRouter = createTRPCRouter({
  // Get widget configuration
  getConfig: publicProcedure.input(z.object({ widgetId: z.string() })).query(async ({ input }) => {
    // In a real implementation, this would fetch from database
    return mockWidgetConfig;
  }),

  // Create a new widget session
  createSession: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        visitorData: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          metadata: z.record(z.unknown()).optional(),
        }),
        context: z.object({
          userAgent: z.string(),
          referrer: z.string(),
          pageUrl: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would create a session in the database
      const session: WidgetSession = {
        id: `session_${Date.now()}`,
        visitorId: `visitor_${Date.now()}`,
        organizationId: "campfire-org",
        startedAt: new Date(),
        lastActiveAt: new Date(),
        metadata: {
          ...input.visitorData,
          ...input.context,
          source: "widget",
          version: "2.0",
        },
      };

      return session;
    }),

  // Send a message
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string(),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              type: z.string(),
              size: z.number(),
              data: z.any(), // In real implementation, this would be a file upload
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would save the message and trigger AI/agent response
      const message: WidgetMessage = {
        id: `msg_${Date.now()}`,
        sessionId: input.sessionId,
        content: input.content,
        senderType: "visitor",
        timestamp: new Date(),
        metadata: input.attachments
          ? {
              fileAttachments: input.attachments.map((att: unknown) => ({
                name: att.name,
                url: `/uploads/${att.name}`, // Would be actual upload URL
                type: att.type,
                size: att.size,
              })),
            }
          : undefined,
      };

      // Simulate AI response after a delay
      setTimeout(() => {
        // This would trigger a realtime event in a real implementation
      }, 1000);

      return message;
    }),

  // Get FAQ items
  getFAQ: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // In a real implementation, this would fetch from database
      let items = mockFAQItems;

      if (input.category) {
        items = items.filter((item) => item.category === input.category);
      }

      return items.filter((item) => item.isActive);
    }),

  // Get knowledge base articles
  getKnowledgeBase: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      // In a real implementation, this would fetch from database with search
      let articles = mockKnowledgeBaseArticles;

      if (input.category) {
        articles = articles.filter((article) => article.category === input.category);
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        articles = articles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchLower) ||
            article.content.toLowerCase().includes(searchLower) ||
            article.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      return articles.filter((article) => article.publishedAt).slice(0, input.limit);
    }),

  // Get conversation history
  getHistory: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      // In a real implementation, this would fetch conversation history
      return [];
    }),

  // Track analytics event
  trackEvent: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        sessionId: z.string().optional(),
        event: z.string(),
        properties: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would save analytics data
      return { success: true };
    }),

  // Get widget analytics
  getAnalytics: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        timeRange: z.string(),
      })
    )
    .query(async ({ input }) => {
      // In a real implementation, this would fetch analytics data
      const analytics: WidgetAnalytics = {
        organizationId: "campfire-org",
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date(),
        },
        metrics: {
          totalSessions: 1250,
          uniqueVisitors: 800,
          totalMessages: 4500,
          avgSessionDuration: 180, // seconds
          avgResponseTime: 45, // seconds
          satisfactionScore: 4.2,
        },
        topFAQs: mockFAQItems.slice(0, 3),
        topArticles: mockKnowledgeBaseArticles.slice(0, 3),
      };

      return analytics;
    }),

  // Update widget configuration
  updateConfig: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        updates: widgetConfigSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would update the database
      return { success: true };
    }),

  // End session
  endSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would mark session as ended
      return { success: true };
    }),

  // Rate conversation
  rateConversation: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would save the rating
      return { success: true };
    }),

  // Search knowledge base
  searchKnowledgeBase: publicProcedure
    .input(
      z.object({
        widgetId: z.string(),
        query: z.string(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      // In a real implementation, this would use full-text search
      const searchLower = input.query.toLowerCase();
      const results = mockKnowledgeBaseArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );

      return results.filter((article) => article.publishedAt).slice(0, input.limit);
    }),

  // Get widget status (online/offline)
  getStatus: publicProcedure.input(z.object({ widgetId: z.string() })).query(async ({ input }) => {
    // In a real implementation, this would check agent availability
    return {
      isOnline: true,
      agentsAvailable: 3,
      averageResponseTime: 45,
      queueLength: 0,
    };
  }),

  // === NEW WIDGET SETTINGS ENDPOINTS ===

  // Get widget settings for mailbox (authenticated)
  getSettings: publicProcedure
    .use(tenantMiddleware)
    .input(
      z.object({
        mailboxId: z.number().optional(), // If not provided, use user's default mailbox
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO: Get user's default mailbox if not provided
      const mailboxId = input.mailboxId || 1; // Fallback to mailbox 1

      const settings = await db.select().from(widgetSettings).where(eq(widgetSettings.mailboxId, mailboxId)).limit(1);

      if (settings.length === 0) {
        // Create default settings if none exist
        const [newSettings] = await db
          .insert(widgetSettings)
          .values({
            mailboxId,
          })
          .returning();

        return newSettings;
      }

      return settings[0];
    }),

  // Update widget settings
  updateSettings: publicProcedure
    .use(tenantMiddleware)
    .input(
      z.object({
        mailboxId: z.number(),
        // Branding & Appearance
        primaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        backgroundColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        textColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        borderRadius: z.number().min(0).max(50).optional(),
        fontFamily: z.string().min(1).max(100).optional(),

        // Widget Behavior
        welcomeMessage: z.string().min(1).max(500).optional(),
        placeholderText: z.string().min(1).max(100).optional(),
        autoOpenDelay: z.number().min(0).max(30000).optional(),
        showTypingIndicator: z.boolean().optional(),
        enableSoundNotifications: z.boolean().optional(),

        // Positioning & Size
        position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).optional(),
        offsetX: z.number().min(0).max(200).optional(),
        offsetY: z.number().min(0).max(200).optional(),
        width: z.number().min(300).max(800).optional(),
        height: z.number().min(400).max(1000).optional(),

        // Business Hours
        businessHours: z
          .object({
            enabled: z.boolean(),
            timezone: z.string(),
            schedule: z.record(
              z.object({
                enabled: z.boolean(),
                start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
                end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
              })
            ),
          })
          .optional(),

        offlineMessage: z.string().min(1).max(500).optional(),

        // AI Settings
        enableAI: z.boolean().optional(),
        aiWelcomeMessage: z.string().min(1).max(500).optional(),

        // GDPR & Privacy
        showGDPRNotice: z.boolean().optional(),
        gdprNoticeText: z.string().max(1000).optional(),
        privacyPolicyUrl: z.string().url().optional().or(z.literal("")),

        // File Uploads
        allowFileUploads: z.boolean().optional(),
        maxFileSize: z.number().min(1).max(100).optional(),

        // Advanced
        customCSS: z.string().max(10000).optional(),
        webhookUrl: z.string().url().optional().or(z.literal("")),

        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { mailboxId, ...settingsData } = input;

      const [updatedSettings] = await db
        .update(widgetSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(widgetSettings.mailboxId, mailboxId))
        .returning();

      if (!updatedSettings) {
        // Create if doesn't exist
        const [newSettings] = await db
          .insert(widgetSettings)
          .values({
            mailboxId,
            ...settingsData,
          })
          .returning();

        return newSettings;
      }

      return updatedSettings;
    }),

  // Public endpoint for widget to fetch settings (no auth required)
  getPublicSettings: publicProcedure
    .input(
      z.object({
        mailboxId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const settings = await db
        .select({
          // Only return public-safe fields
          primaryColor: widgetSettings.primaryColor,
          backgroundColor: widgetSettings.backgroundColor,
          textColor: widgetSettings.textColor,
          borderRadius: widgetSettings.borderRadius,
          fontFamily: widgetSettings.fontFamily,
          welcomeMessage: widgetSettings.welcomeMessage,
          placeholderText: widgetSettings.placeholderText,
          autoOpenDelay: widgetSettings.autoOpenDelay,
          showTypingIndicator: widgetSettings.showTypingIndicator,
          enableSoundNotifications: widgetSettings.enableSoundNotifications,
          position: widgetSettings.position,
          offsetX: widgetSettings.offsetX,
          offsetY: widgetSettings.offsetY,
          width: widgetSettings.width,
          height: widgetSettings.height,
          businessHours: widgetSettings.businessHours,
          offlineMessage: widgetSettings.offlineMessage,
          enableAI: widgetSettings.enableAI,
          aiWelcomeMessage: widgetSettings.aiWelcomeMessage,
          showGDPRNotice: widgetSettings.showGDPRNotice,
          gdprNoticeText: widgetSettings.gdprNoticeText,
          privacyPolicyUrl: widgetSettings.privacyPolicyUrl,
          allowFileUploads: widgetSettings.allowFileUploads,
          maxFileSize: widgetSettings.maxFileSize,
          customCSS: widgetSettings.customCSS,
          isActive: widgetSettings.isActive,
        })
        .from(widgetSettings)
        .where(and(eq(widgetSettings.mailboxId, input.mailboxId), eq(widgetSettings.isActive, true)))
        .limit(1);

      return settings[0] || null;
    }),
});
