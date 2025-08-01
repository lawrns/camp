/**
 * Application Constants
 * Centralized constants and configuration values used throughout the application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  MAX_CONNECTIONS: 10,
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 15000,
  POOL_SIZE: 5,
} as const;

// Authentication Constants
export const AUTH_CONFIG = {
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_TOKEN_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  JWT_EXPIRY: "24h",
  REFRESH_JWT_EXPIRY: "7d",
} as const;

// File Upload Constants
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  UPLOAD_PATH: "/uploads",
  TEMP_PATH: "/tmp",
} as const;

// Pagination Constants
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  SHORT_TTL: 1 * 60 * 1000, // 1 minute
  LONG_TTL: 60 * 60 * 1000, // 1 hour
  REDIS_KEY_PREFIX: "campfire:",
} as const;

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_HOUR: 1000,
  REQUESTS_PER_DAY: 10000,
  WINDOW_SIZE: 60 * 1000, // 1 minute
} as const;

// AI Configuration
export const AI_CONFIG = {
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  FREQUENCY_PENALTY: 0.0,
  PRESENCE_PENALTY: 0.0,
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  CONFIDENCE_THRESHOLD: 0.7,
  SAFETY_THRESHOLD: 0.8,
} as const;

// Conversation Constants
export const CONVERSATION_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_MESSAGES_PER_CONVERSATION: 1000,
  AUTO_ARCHIVE_DAYS: 30,
  TYPING_INDICATOR_TIMEOUT: 3000,
  MESSAGE_BATCH_SIZE: 50,
} as const;

// Notification Constants
export const NOTIFICATION_CONFIG = {
  MAX_NOTIFICATIONS_PER_USER: 100,
  DEFAULT_EXPIRY_DAYS: 30,
  BATCH_SIZE: 25,
  RETRY_ATTEMPTS: 3,
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 10,
  PING_INTERVAL: 30000, // 30 seconds
  PONG_TIMEOUT: 5000, // 5 seconds
  MESSAGE_QUEUE_SIZE: 100,
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  FROM_ADDRESS: process.env.EMAIL_FROM || "noreply@campfire.ai",
  REPLY_TO: process.env.EMAIL_REPLY_TO || "support@campfire.ai",
  MAX_RECIPIENTS: 50,
  TEMPLATE_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  MAX_RESULTS: 50,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200,
  DEBOUNCE_DELAY: 300, // milliseconds
  HIGHLIGHT_TAGS: ["<mark>", "</mark>"],
} as const;

// Organization Constants
export const ORGANIZATION_CONFIG = {
  MAX_USERS_PER_ORG: 1000,
  MAX_TEAMS_PER_ORG: 50,
  MAX_PROJECTS_PER_ORG: 100,
  DEFAULT_ROLE: "member",
  ADMIN_ROLE: "admin",
  OWNER_ROLE: "owner",
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_RESPONSES: true,
  ENABLE_FILE_UPLOADS: true,
  ENABLE_REAL_TIME: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_INTEGRATIONS: true,
  ENABLE_WEBHOOKS: true,
  ENABLE_API_RATE_LIMITING: true,
} as const;

// Environment Constants
export const ENVIRONMENT = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_NOT_VERIFIED: "ACCOUNT_NOT_VERIFIED",

  // Authorization Errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ORGANIZATION_ACCESS_DENIED: "ORGANIZATION_ACCESS_DENIED",
  RESOURCE_ACCESS_DENIED: "RESOURCE_ACCESS_DENIED",

  // Validation Errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  REQUIRED_FIELD_MISSING: "REQUIRED_FIELD_MISSING",
  INVALID_FORMAT: "INVALID_FORMAT",
  VALUE_OUT_OF_RANGE: "VALUE_OUT_OF_RANGE",

  // Resource Errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",

  // System Errors
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // File Errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // AI Errors
  AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",
  AI_RESPONSE_ERROR: "AI_RESPONSE_ERROR",
  CONFIDENCE_TOO_LOW: "CONFIDENCE_TOO_LOW",
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ORGANIZATION_ID: /^org_[a-zA-Z0-9_-]+$/,
  USER_ID: /^user_[a-zA-Z0-9_-]+$/,
} as const;

// Time Constants (in milliseconds)
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Default Values
export const DEFAULTS = {
  AVATAR_URL: "/images/default-avatar.png",
  ORGANIZATION_LOGO: "/images/default-org-logo.png",
  PLACEHOLDER_IMAGE: "/images/placeholder.png",
  THEME: "light",
  LANGUAGE: "en",
  TIMEZONE: "UTC",
  DATE_FORMAT: "YYYY-MM-DD",
  TIME_FORMAT: "HH:mm:ss",
  DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    VERIFY: "/auth/verify",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  USERS: {
    BASE: "/users",
    PROFILE: "/users/profile",
    PREFERENCES: "/users/preferences",
    AVATAR: "/users/avatar",
  },
  ORGANIZATIONS: {
    BASE: "/organizations",
    MEMBERS: "/organizations/:id/members",
    SETTINGS: "/organizations/:id/settings",
    BILLING: "/organizations/:id/billing",
  },
  CONVERSATIONS: {
    BASE: "/conversations",
    MESSAGES: "/conversations/:id/messages",
    PARTICIPANTS: "/conversations/:id/participants",
    ARCHIVE: "/conversations/:id/archive",
  },
  FILES: {
    BASE: "/files",
    UPLOAD: "/files/upload",
    DOWNLOAD: "/files/:id/download",
    DELETE: "/files/:id",
  },
  AI: {
    CHAT: "/ai/chat",
    GENERATE: "/ai/generate",
    ANALYZE: "/ai/analyze",
    SUMMARIZE: "/ai/summarize",
  },
} as const;

// Event Types
export const EVENT_TYPES = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",

  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
  ORGANIZATION_DELETED: "organization.deleted",

  CONVERSATION_CREATED: "conversation.created",
  CONVERSATION_UPDATED: "conversation.updated",
  CONVERSATION_ARCHIVED: "conversation.archived",

  MESSAGE_SENT: "message.sent",
  MESSAGE_RECEIVED: "message.received",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",

  FILE_UPLOADED: "file.uploaded",
  FILE_DELETED: "file.deleted",

  AI_RESPONSE_GENERATED: "ai.response.generated",
  AI_ANALYSIS_COMPLETED: "ai.analysis.completed",
} as const;

// WebSocket Event Types
export const WS_EVENT_TYPES = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  MESSAGE: "message",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  NOTIFICATION: "notification",
  ERROR: "error",
} as const;

// Logging Levels
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
  TRACE: "trace",
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
  CRITICAL: "critical",
} as const;

// Status Types
export const STATUS_TYPES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

// Role Types
export const ROLE_TYPES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
  GUEST: "guest",
  VIEWER: "viewer",
} as const;

// Permission Types
export const PERMISSION_TYPES = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  ADMIN: "admin",
  OWNER: "owner",
} as const;

// Theme Constants
export const THEME_CONFIG = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
  AUTO: "auto",
} as const;

// Currency Constants
export const CURRENCY_CONFIG = {
  DEFAULT: "USD",
  SUPPORTED: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"],
  SYMBOL_MAP: {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
  },
} as const;

// Specific constants that were missing
export const SUBSCRIPTION_FREE_TRIAL_USAGE_LIMIT = 100;
export const EMAIL_UNDO_COUNTDOWN_SECONDS = 10;

// Export all constants as a single object for convenience
export const CONSTANTS = {
  API_CONFIG,
  DATABASE_CONFIG,
  AUTH_CONFIG,
  FILE_UPLOAD_CONFIG,
  PAGINATION_CONFIG,
  CACHE_CONFIG,
  RATE_LIMIT_CONFIG,
  AI_CONFIG,
  CONVERSATION_CONFIG,
  NOTIFICATION_CONFIG,
  WEBSOCKET_CONFIG,
  EMAIL_CONFIG,
  SEARCH_CONFIG,
  ORGANIZATION_CONFIG,
  FEATURE_FLAGS,
  ENVIRONMENT,
  HTTP_STATUS,
  ERROR_CODES,
  REGEX_PATTERNS,
  TIME_CONSTANTS,
  DEFAULTS,
  API_ENDPOINTS,
  EVENT_TYPES,
  WS_EVENT_TYPES,
  LOG_LEVELS,
  PRIORITY_LEVELS,
  STATUS_TYPES,
  ROLE_TYPES,
  PERMISSION_TYPES,
  THEME_CONFIG,
  CURRENCY_CONFIG,
} as const;

// Helper Functions
export function getBaseUrl(): string {
  // In production, use the APP_URL from environment
  // In development, use localhost
  if (typeof window !== "undefined") {
    // Client-side
    return window.location.origin;
  }
  // Server-side
  return ENVIRONMENT.APP_URL;
}
