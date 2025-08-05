/**
 * Shared Constants
 *
 * Application-wide constants used across all Campfire V2 projects
 */
// ============================================================================
// API CONSTANTS
// ============================================================================
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        REGISTER: '/api/auth/register',
        RESET_PASSWORD: '/api/auth/reset-password',
    },
    // Conversations
    CONVERSATIONS: {
        LIST: '/api/conversations',
        CREATE: '/api/conversations',
        GET: (id) => `/api/conversations/${id}`,
        UPDATE: (id) => `/api/conversations/${id}`,
        DELETE: (id) => `/api/conversations/${id}`,
        MESSAGES: (id) => `/api/conversations/${id}/messages`,
        ASSIGN: (id) => `/api/conversations/${id}/assign`,
        CLOSE: (id) => `/api/conversations/${id}/close`,
    },
    // Messages
    MESSAGES: {
        CREATE: '/api/messages',
        GET: (id) => `/api/messages/${id}`,
        UPDATE: (id) => `/api/messages/${id}`,
        DELETE: (id) => `/api/messages/${id}`,
    },
    // Widget
    WIDGET: {
        CONFIG: '/api/widget/config',
        CONVERSATIONS: '/api/widget/conversations',
        MESSAGES: '/api/widget/messages',
        UPLOAD: '/api/widget/upload',
    },
    // Dashboard
    DASHBOARD: {
        STATS: '/api/dashboard/stats',
        ANALYTICS: '/api/dashboard/analytics',
        USERS: '/api/dashboard/users',
        SETTINGS: '/api/dashboard/settings',
    },
    // Organizations
    ORGANIZATIONS: {
        LIST: '/api/organizations',
        CREATE: '/api/organizations',
        GET: (id) => `/api/organizations/${id}`,
        UPDATE: (id) => `/api/organizations/${id}`,
        DELETE: (id) => `/api/organizations/${id}`,
        MEMBERS: (id) => `/api/organizations/${id}/members`,
    },
    // Files
    FILES: {
        UPLOAD: '/api/files/upload',
        GET: (id) => `/api/files/${id}`,
        DELETE: (id) => `/api/files/${id}`,
    },
};
// ============================================================================
// REALTIME CONSTANTS
// ============================================================================
export const REALTIME_EVENTS = {
    // Connection events
    CONNECTED: 'realtime:connected',
    DISCONNECTED: 'realtime:disconnected',
    ERROR: 'realtime:error',
    // Message events
    MESSAGE_CREATED: 'message:created',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_DELETED: 'message:deleted',
    // Conversation events
    CONVERSATION_CREATED: 'conversation:created',
    CONVERSATION_UPDATED: 'conversation:updated',
    CONVERSATION_CLOSED: 'conversation:closed',
    CONVERSATION_ASSIGNED: 'conversation:assigned',
    // Typing events
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    // Presence events
    USER_ONLINE: 'presence:online',
    USER_OFFLINE: 'presence:offline',
    USER_AWAY: 'presence:away',
    USER_BUSY: 'presence:busy',
    // Agent events
    AGENT_JOINED: 'agent:joined',
    AGENT_LEFT: 'agent:left',
    AGENT_TYPING: 'agent:typing',
    // AI events
    AI_RESPONSE_START: 'ai:response:start',
    AI_RESPONSE_CHUNK: 'ai:response:chunk',
    AI_RESPONSE_END: 'ai:response:end',
    AI_HANDOVER: 'ai:handover',
};
export const REALTIME_CHANNELS = {
    ORGANIZATION: (orgId) => `org:${orgId}`,
    CONVERSATION: (orgId, convId) => `org:${orgId}:conv:${convId}`,
    USER: (userId) => `user:${userId}`,
    GLOBAL: 'global',
};
// ============================================================================
// UI CONSTANTS
// ============================================================================
export const THEME_COLORS = {
    PRIMARY: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#1e3a8a',
    },
    SECONDARY: {
        50: '#f8fafc',
        100: '#f1f5f9',
        500: '#64748b',
        600: '#475569',
        900: '#0f172a',
    },
    SUCCESS: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        900: '#14532d',
    },
    WARNING: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        900: '#78350f',
    },
    ERROR: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        900: '#7f1d1d',
    },
};
export const BREAKPOINTS = {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
};
export const Z_INDEX = {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
    WIDGET: 2147483647, // Maximum z-index for widget
};
// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
export const VALIDATION_RULES = {
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        MAX_LENGTH: 254,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    NAME: {
        MIN_LENGTH: 1,
        MAX_LENGTH: 100,
        PATTERN: /^[a-zA-Z\s'-]+$/,
    },
    ORGANIZATION_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        PATTERN: /^[a-zA-Z0-9\s'-]+$/,
    },
    MESSAGE: {
        MAX_LENGTH: 4000,
    },
    FILE: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
    },
};
// ============================================================================
// PAGINATION CONSTANTS
// ============================================================================
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1,
};
// ============================================================================
// CACHE CONSTANTS
// ============================================================================
export const CACHE_KEYS = {
    USER_PROFILE: 'user:profile',
    ORGANIZATION: (id) => `org:${id}`,
    CONVERSATIONS: (orgId) => `conversations:${orgId}`,
    CONVERSATION: (id) => `conversation:${id}`,
    MESSAGES: (convId) => `messages:${convId}`,
    WIDGET_CONFIG: (orgId) => `widget:config:${orgId}`,
};
export const CACHE_TTL = {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
};
// ============================================================================
// ERROR CODES
// ============================================================================
export const ERROR_CODES = {
    // Authentication errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',
    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    // Business logic errors
    CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
    AGENT_UNAVAILABLE: 'AGENT_UNAVAILABLE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
};
// ============================================================================
// FEATURE FLAGS
// ============================================================================
export const FEATURE_FLAGS = {
    AI_RESPONSES: 'ai_responses',
    FILE_UPLOADS: 'file_uploads',
    VOICE_MESSAGES: 'voice_messages',
    VIDEO_CALLS: 'video_calls',
    SCREEN_SHARING: 'screen_sharing',
    EMOJI_REACTIONS: 'emoji_reactions',
    MESSAGE_THREADING: 'message_threading',
    CUSTOM_BRANDING: 'custom_branding',
    ANALYTICS: 'analytics',
    INTEGRATIONS: 'integrations',
};
// ============================================================================
// WIDGET CONSTANTS
// ============================================================================
export const WIDGET_CONFIG = {
    DEFAULT_POSITION: 'bottom-right',
    DEFAULT_THEME: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        fontFamily: 'Inter, sans-serif',
    },
    DEFAULT_GREETING: 'Hi! How can we help you today?',
    DEFAULT_OFFLINE_MESSAGE: 'We\'re currently offline. Leave us a message and we\'ll get back to you soon!',
    MAX_MESSAGE_LENGTH: 4000,
    TYPING_INDICATOR_TIMEOUT: 3000,
    RECONNECT_INTERVAL: 5000,
    MAX_RECONNECT_ATTEMPTS: 5,
};
// ============================================================================
// ANALYTICS CONSTANTS
// ============================================================================
export const ANALYTICS_EVENTS = {
    // Widget events
    WIDGET_LOADED: 'widget_loaded',
    WIDGET_OPENED: 'widget_opened',
    WIDGET_CLOSED: 'widget_closed',
    MESSAGE_SENT: 'message_sent',
    FILE_UPLOADED: 'file_uploaded',
    // Dashboard events
    DASHBOARD_LOADED: 'dashboard_loaded',
    CONVERSATION_VIEWED: 'conversation_viewed',
    CONVERSATION_ASSIGNED: 'conversation_assigned',
    CONVERSATION_CLOSED: 'conversation_closed',
    // Agent events
    AGENT_LOGIN: 'agent_login',
    AGENT_LOGOUT: 'agent_logout',
    AGENT_STATUS_CHANGED: 'agent_status_changed',
    // AI events
    AI_RESPONSE_GENERATED: 'ai_response_generated',
    AI_HANDOVER_TRIGGERED: 'ai_handover_triggered',
};
// ============================================================================
// NOTIFICATION CONSTANTS
// ============================================================================
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};
export const NOTIFICATION_DURATION = {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 8000,
    PERSISTENT: 0, // Don't auto-dismiss
};
// ============================================================================
// EXPORT ALL
// ============================================================================
export * from './types';
//# sourceMappingURL=index.js.map