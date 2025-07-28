/**
 * Campfire API Route Registry
 *
 * Centralized registry of all API endpoints with typed constants and validation.
 * Prioritizes pluralized patterns and provides migration utilities.
 */

// Base API paths
export const API_BASE = "/api";
export const WIDGET_BASE = `${API_BASE}/widget`;
export const DASHBOARD_BASE = `${API_BASE}/dashboard`;
export const ADMIN_BASE = `${API_BASE}/admin`;

// Widget API Routes (Canonical - Pluralized)
export const WIDGET_ROUTES = {
  // Conversations (Canonical)
  CONVERSATIONS: `${WIDGET_BASE}/conversations`,
  CONVERSATION: (conversationId: string) => `${WIDGET_BASE}/conversations/${conversationId}`,
  CONVERSATION_MESSAGES: (conversationId: string) => `${WIDGET_BASE}/conversations/${conversationId}/messages`,
  CONVERSATION_HANDOVERS: (conversationId: string) => `${WIDGET_BASE}/conversations/${conversationId}/handovers`,
  CONVERSATION_PARTICIPANTS: (conversationId: string) => `${WIDGET_BASE}/conversations/${conversationId}/participants`,
  CONVERSATION_METADATA: (conversationId: string) => `${WIDGET_BASE}/conversations/${conversationId}/metadata`,

  // Messages (Canonical)
  MESSAGES: `${WIDGET_BASE}/messages`,
  MESSAGE: (messageId: string) => `${WIDGET_BASE}/messages/${messageId}`,
  MESSAGE_REACTIONS: (messageId: string) => `${WIDGET_BASE}/messages/${messageId}/reactions`,
  MESSAGE_ATTACHMENTS: (messageId: string) => `${WIDGET_BASE}/messages/${messageId}/attachments`,

  // Handovers (Canonical)
  HANDOVERS: `${WIDGET_BASE}/handovers`,
  HANDOVER: (handoverId: string) => `${WIDGET_BASE}/handovers/${handoverId}`,
  HANDOVER_ACCEPT: (handoverId: string) => `${WIDGET_BASE}/handovers/${handoverId}/accept`,
  HANDOVER_REJECT: (handoverId: string) => `${WIDGET_BASE}/handovers/${handoverId}/reject`,

  // Organizations
  ORGANIZATIONS: `${WIDGET_BASE}/organizations`,
  ORGANIZATION: (orgId: string) => `${WIDGET_BASE}/organizations/${orgId}`,
  ORGANIZATION_CONFIG: (orgId: string) => `${WIDGET_BASE}/organizations/${orgId}/config`,

  // AI and Knowledge Base
  AI_SUGGESTIONS: `${WIDGET_BASE}/ai/suggestions`,
  AI_RESPONSES: `${WIDGET_BASE}/ai/responses`,
  KNOWLEDGE_SEARCH: `${WIDGET_BASE}/knowledge/search`,
  KNOWLEDGE_ARTICLES: `${WIDGET_BASE}/knowledge/articles`,

  // Utilities
  HEALTH: `${WIDGET_BASE}/health`,
  CONFIG: `${WIDGET_BASE}/config`,
  UPLOAD: `${WIDGET_BASE}/upload`,
  WEBHOOKS: `${WIDGET_BASE}/webhooks`,
} as const;

// Dashboard API Routes
export const DASHBOARD_ROUTES = {
  // Organizations
  ORGANIZATIONS: `${DASHBOARD_BASE}/organizations`,
  ORGANIZATION: (orgId: string) => `${DASHBOARD_BASE}/organizations/${orgId}`,
  ORGANIZATION_MEMBERS: (orgId: string) => `${DASHBOARD_BASE}/organizations/${orgId}/members`,
  ORGANIZATION_SETTINGS: (orgId: string) => `${DASHBOARD_BASE}/organizations/${orgId}/settings`,
  ORGANIZATION_ANALYTICS: (orgId: string) => `${DASHBOARD_BASE}/organizations/${orgId}/analytics`,

  // Conversations
  CONVERSATIONS: `${DASHBOARD_BASE}/conversations`,
  CONVERSATION: (conversationId: string) => `${DASHBOARD_BASE}/conversations/${conversationId}`,
  CONVERSATION_MESSAGES: (conversationId: string) => `${DASHBOARD_BASE}/conversations/${conversationId}/messages`,
  CONVERSATION_ANALYTICS: (conversationId: string) => `${DASHBOARD_BASE}/conversations/${conversationId}/analytics`,

  // Team Members
  TEAM_MEMBERS: `${DASHBOARD_BASE}/team-members`,
  TEAM_MEMBER: (memberId: string) => `${DASHBOARD_BASE}/team-members/${memberId}`,
  TEAM_MEMBER_PERMISSIONS: (memberId: string) => `${DASHBOARD_BASE}/team-members/${memberId}/permissions`,

  // Knowledge Base
  KNOWLEDGE_ARTICLES: `${DASHBOARD_BASE}/knowledge/articles`,
  KNOWLEDGE_ARTICLE: (articleId: string) => `${DASHBOARD_BASE}/knowledge/articles/${articleId}`,
  KNOWLEDGE_CATEGORIES: `${DASHBOARD_BASE}/knowledge/categories`,
  KNOWLEDGE_SEARCH: `${DASHBOARD_BASE}/knowledge/search`,

  // Analytics
  ANALYTICS_OVERVIEW: `${DASHBOARD_BASE}/analytics/overview`,
  ANALYTICS_CONVERSATIONS: `${DASHBOARD_BASE}/analytics/conversations`,
  ANALYTICS_PERFORMANCE: `${DASHBOARD_BASE}/analytics/performance`,
  ANALYTICS_AI_USAGE: `${DASHBOARD_BASE}/analytics/ai-usage`,

  // Integrations
  INTEGRATIONS: `${DASHBOARD_BASE}/integrations`,
  INTEGRATION: (integrationId: string) => `${DASHBOARD_BASE}/integrations/${integrationId}`,
  INTEGRATION_CONFIG: (integrationId: string) => `${DASHBOARD_BASE}/integrations/${integrationId}/config`,

  // Utilities
  PROFILE: `${DASHBOARD_BASE}/profile`,
  NOTIFICATIONS: `${DASHBOARD_BASE}/notifications`,
  INVITATIONS: `${DASHBOARD_BASE}/invitations`,
  UPLOAD: `${DASHBOARD_BASE}/upload`,
} as const;

// Admin API Routes
export const ADMIN_ROUTES = {
  ORGANIZATIONS: `${ADMIN_BASE}/organizations`,
  ORGANIZATION: (orgId: string) => `${ADMIN_BASE}/organizations/${orgId}`,
  USERS: `${ADMIN_BASE}/users`,
  USER: (userId: string) => `${ADMIN_BASE}/users/${userId}`,
  SYSTEM_HEALTH: `${ADMIN_BASE}/system/health`,
  SYSTEM_METRICS: `${ADMIN_BASE}/system/metrics`,
  MIGRATIONS: `${ADMIN_BASE}/migrations`,
  PERFORMANCE: `${ADMIN_BASE}/performance`,
} as const;

// Legacy API Routes (Deprecated - Singular patterns)
export const LEGACY_ROUTES = {
  // Widget Legacy (Deprecated)
  WIDGET_CONVERSATION: (conversationId: string) => `${WIDGET_BASE}/conversation/${conversationId}`,
  WIDGET_CONVERSATION_MESSAGES: (conversationId: string) => `${WIDGET_BASE}/conversation/${conversationId}/messages`,
  WIDGET_CONVERSATION_HANDOVER: (conversationId: string) => `${WIDGET_BASE}/conversation/${conversationId}/handover`,
  WIDGET_MESSAGE: (messageId: string) => `${WIDGET_BASE}/message/${messageId}`,
  WIDGET_HANDOVER: (handoverId: string) => `${WIDGET_BASE}/handover/${handoverId}`,

  // Dashboard Legacy (Deprecated)
  DASHBOARD_CONVERSATION: (conversationId: string) => `${DASHBOARD_BASE}/conversation/${conversationId}`,
  DASHBOARD_CONVERSATION_MESSAGE: (conversationId: string) =>
    `${DASHBOARD_BASE}/conversation/${conversationId}/message`,
  DASHBOARD_TEAM_MEMBER: (memberId: string) => `${DASHBOARD_BASE}/team-member/${memberId}`,
  DASHBOARD_KNOWLEDGE_ARTICLE: (articleId: string) => `${DASHBOARD_BASE}/knowledge/article/${articleId}`,
} as const;

// Consolidated API endpoints registry
export const API_ENDPOINTS = {
  WIDGET: WIDGET_ROUTES,
  DASHBOARD: DASHBOARD_ROUTES,
  ADMIN: ADMIN_ROUTES,
  LEGACY: LEGACY_ROUTES,
} as const;

// Route validation
export function isCanonicalRoute(route: string): boolean {
  const canonicalPatterns = [
    ...Object.values(WIDGET_ROUTES),
    ...Object.values(DASHBOARD_ROUTES),
    ...Object.values(ADMIN_ROUTES),
  ];

  return canonicalPatterns.some((pattern) => {
    if (typeof pattern === "string") {
      return route === pattern;
    }
    // For function patterns, check if route matches the pattern structure
    return false;
  });
}

export function isLegacyRoute(route: string): boolean {
  const legacyPatterns = Object.values(LEGACY_ROUTES);

  return legacyPatterns.some((pattern) => {
    if (typeof pattern === "string") {
      return route === pattern;
    }
    return false;
  });
}

export function isDeprecatedRoute(route: string): boolean {
  return isLegacyRoute(route);
}

// Route migration utilities
export function migrateToCanonicalRoute(legacyRoute: string): string | null {
  const migrations: Record<string, string> = {
    // Widget migrations
    "/api/widget/conversation/": "/api/widget/conversations/",
    "/api/widget/message/": "/api/widget/messages/",
    "/api/widget/handover/": "/api/widget/handovers/",

    // Dashboard migrations
    "/api/dashboard/conversation/": "/api/dashboard/conversations/",
    "/api/dashboard/team-member/": "/api/dashboard/team-members/",
    "/api/dashboard/knowledge/article/": "/api/dashboard/knowledge/articles/",
  };

  for (const [legacy, canonical] of Object.entries(migrations)) {
    if (legacyRoute.includes(legacy)) {
      return legacyRoute.replace(legacy, canonical);
    }
  }

  return null;
}

// Route builders with validation
export class RouteBuilder {
  static widget = {
    conversation: (conversationId: string) => {
      if (!conversationId) throw new Error("conversationId is required");
      return WIDGET_ROUTES.CONVERSATION(conversationId);
    },

    conversationMessages: (conversationId: string) => {
      if (!conversationId) throw new Error("conversationId is required");
      return WIDGET_ROUTES.CONVERSATION_MESSAGES(conversationId);
    },

    conversationHandovers: (conversationId: string) => {
      if (!conversationId) throw new Error("conversationId is required");
      return WIDGET_ROUTES.CONVERSATION_HANDOVERS(conversationId);
    },

    message: (messageId: string) => {
      if (!messageId) throw new Error("messageId is required");
      return WIDGET_ROUTES.MESSAGE(messageId);
    },

    handover: (handoverId: string) => {
      if (!handoverId) throw new Error("handoverId is required");
      return WIDGET_ROUTES.HANDOVER(handoverId);
    },
  };

  static dashboard = {
    organization: (orgId: string) => {
      if (!orgId) throw new Error("organizationId is required");
      return DASHBOARD_ROUTES.ORGANIZATION(orgId);
    },

    conversation: (conversationId: string) => {
      if (!conversationId) throw new Error("conversationId is required");
      return DASHBOARD_ROUTES.CONVERSATION(conversationId);
    },

    teamMember: (memberId: string) => {
      if (!memberId) throw new Error("memberId is required");
      return DASHBOARD_ROUTES.TEAM_MEMBER(memberId);
    },

    knowledgeArticle: (articleId: string) => {
      if (!articleId) throw new Error("articleId is required");
      return DASHBOARD_ROUTES.KNOWLEDGE_ARTICLE(articleId);
    },
  };
}

// URL parameter validation
export function validateRouteParams(
  route: string,
  params: Record<string, string>
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Extract parameter placeholders from route
  const paramMatches = route.match(/\[([^\]]+)\]/g);

  if (paramMatches) {
    for (const match of paramMatches) {
      const paramName = match.slice(1, -1); // Remove brackets

      if (!params[paramName]) {
        errors.push(`Missing required parameter: ${paramName}`);
      } else if (typeof params[paramName] !== "string") {
        errors.push(`Parameter ${paramName} must be a string`);
      } else if (params[paramName].trim() === "") {
        errors.push(`Parameter ${paramName} cannot be empty`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// RESTful patterns documentation
export const REST_PATTERNS = {
  COLLECTION: "GET /api/resource - List all resources",
  ITEM: "GET /api/resource/{id} - Get specific resource",
  CREATE: "POST /api/resource - Create new resource",
  UPDATE: "PUT /api/resource/{id} - Update specific resource",
  PATCH: "PATCH /api/resource/{id} - Partially update specific resource",
  DELETE: "DELETE /api/resource/{id} - Delete specific resource",
  SUB_COLLECTION: "GET /api/resource/{id}/sub-resource - List sub-resources",
  SUB_ITEM: "GET /api/resource/{id}/sub-resource/{sub-id} - Get specific sub-resource",
} as const;

// Migration guidance
export const MIGRATION_GUIDE = {
  SINGULAR_TO_PLURAL: {
    description: "Migrate from singular to pluralized endpoints",
    examples: {
      "/api/widget/conversation/{id}": "/api/widget/conversations/{id}",
      "/api/widget/message/{id}": "/api/widget/messages/{id}",
      "/api/dashboard/team-member/{id}": "/api/dashboard/team-members/{id}",
    },
  },
  PARAMETER_NAMING: {
    description: "Use consistent parameter naming",
    examples: {
      conversationId: "Use full name instead of convId or cId",
      organizationId: "Use full name instead of orgId",
      messageId: "Use full name instead of msgId",
    },
  },
  ROUTE_BUILDERS: {
    description: "Use RouteBuilder class for type-safe route construction",
    example: "RouteBuilder.widget.conversation(conversationId)",
  },
} as const;

// Development utilities
export function logDeprecationWarning(route: string): void {
  if (process.env.NODE_ENV === "development") {
    const canonical = migrateToCanonicalRoute(route);

  }
}

export function validateApiUsage(route: string): {
  isValid: boolean;
  isDeprecated: boolean;
  canonicalRoute?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const isDeprecated = isDeprecatedRoute(route);
  const canonicalRoute = isDeprecated ? migrateToCanonicalRoute(route) : undefined;

  if (isDeprecated) {
    warnings.push(`Route ${route} is deprecated`);
    if (canonicalRoute) {
      warnings.push(`Use ${canonicalRoute} instead`);
    }
  }

  if (!isCanonicalRoute(route) && !isDeprecated) {
    warnings.push(`Route ${route} is not in the canonical registry`);
  }

  return {
    isValid: isCanonicalRoute(route) || isDeprecated,
    isDeprecated,
    canonicalRoute,
    warnings,
  };
}

// Type exports for external usage
export type WidgetRoute = keyof typeof WIDGET_ROUTES;
export type DashboardRoute = keyof typeof DASHBOARD_ROUTES;
export type AdminRoute = keyof typeof ADMIN_ROUTES;
export type LegacyRoute = keyof typeof LEGACY_ROUTES;
export type ApiEndpoint = typeof API_ENDPOINTS;
