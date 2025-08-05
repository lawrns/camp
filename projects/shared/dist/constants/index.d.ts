/**
 * Shared Constants
 *
 * Application-wide constants used across all Campfire V2 projects
 */
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/api/auth/login";
        readonly LOGOUT: "/api/auth/logout";
        readonly REFRESH: "/api/auth/refresh";
        readonly REGISTER: "/api/auth/register";
        readonly RESET_PASSWORD: "/api/auth/reset-password";
    };
    readonly CONVERSATIONS: {
        readonly LIST: "/api/conversations";
        readonly CREATE: "/api/conversations";
        readonly GET: (id: string) => string;
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
        readonly MESSAGES: (id: string) => string;
        readonly ASSIGN: (id: string) => string;
        readonly CLOSE: (id: string) => string;
    };
    readonly MESSAGES: {
        readonly CREATE: "/api/messages";
        readonly GET: (id: string) => string;
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
    };
    readonly WIDGET: {
        readonly CONFIG: "/api/widget/config";
        readonly CONVERSATIONS: "/api/widget/conversations";
        readonly MESSAGES: "/api/widget/messages";
        readonly UPLOAD: "/api/widget/upload";
    };
    readonly DASHBOARD: {
        readonly STATS: "/api/dashboard/stats";
        readonly ANALYTICS: "/api/dashboard/analytics";
        readonly USERS: "/api/dashboard/users";
        readonly SETTINGS: "/api/dashboard/settings";
    };
    readonly ORGANIZATIONS: {
        readonly LIST: "/api/organizations";
        readonly CREATE: "/api/organizations";
        readonly GET: (id: string) => string;
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
        readonly MEMBERS: (id: string) => string;
    };
    readonly FILES: {
        readonly UPLOAD: "/api/files/upload";
        readonly GET: (id: string) => string;
        readonly DELETE: (id: string) => string;
    };
};
export declare const REALTIME_EVENTS: {
    readonly CONNECTED: "realtime:connected";
    readonly DISCONNECTED: "realtime:disconnected";
    readonly ERROR: "realtime:error";
    readonly MESSAGE_CREATED: "message:created";
    readonly MESSAGE_UPDATED: "message:updated";
    readonly MESSAGE_DELETED: "message:deleted";
    readonly CONVERSATION_CREATED: "conversation:created";
    readonly CONVERSATION_UPDATED: "conversation:updated";
    readonly CONVERSATION_CLOSED: "conversation:closed";
    readonly CONVERSATION_ASSIGNED: "conversation:assigned";
    readonly TYPING_START: "typing:start";
    readonly TYPING_STOP: "typing:stop";
    readonly USER_ONLINE: "presence:online";
    readonly USER_OFFLINE: "presence:offline";
    readonly USER_AWAY: "presence:away";
    readonly USER_BUSY: "presence:busy";
    readonly AGENT_JOINED: "agent:joined";
    readonly AGENT_LEFT: "agent:left";
    readonly AGENT_TYPING: "agent:typing";
    readonly AI_RESPONSE_START: "ai:response:start";
    readonly AI_RESPONSE_CHUNK: "ai:response:chunk";
    readonly AI_RESPONSE_END: "ai:response:end";
    readonly AI_HANDOVER: "ai:handover";
};
export declare const REALTIME_CHANNELS: {
    readonly ORGANIZATION: (orgId: string) => string;
    readonly CONVERSATION: (orgId: string, convId: string) => string;
    readonly USER: (userId: string) => string;
    readonly GLOBAL: "global";
};
export declare const THEME_COLORS: {
    readonly PRIMARY: {
        readonly 50: "#eff6ff";
        readonly 100: "#dbeafe";
        readonly 500: "#3b82f6";
        readonly 600: "#2563eb";
        readonly 900: "#1e3a8a";
    };
    readonly SECONDARY: {
        readonly 50: "#f8fafc";
        readonly 100: "#f1f5f9";
        readonly 500: "#64748b";
        readonly 600: "#475569";
        readonly 900: "#0f172a";
    };
    readonly SUCCESS: {
        readonly 50: "#f0fdf4";
        readonly 100: "#dcfce7";
        readonly 500: "#22c55e";
        readonly 600: "#16a34a";
        readonly 900: "#14532d";
    };
    readonly WARNING: {
        readonly 50: "#fffbeb";
        readonly 100: "#fef3c7";
        readonly 500: "#f59e0b";
        readonly 600: "#d97706";
        readonly 900: "#78350f";
    };
    readonly ERROR: {
        readonly 50: "#fef2f2";
        readonly 100: "#fee2e2";
        readonly 500: "#ef4444";
        readonly 600: "#dc2626";
        readonly 900: "#7f1d1d";
    };
};
export declare const BREAKPOINTS: {
    readonly SM: "640px";
    readonly MD: "768px";
    readonly LG: "1024px";
    readonly XL: "1280px";
    readonly '2XL': "1536px";
};
export declare const Z_INDEX: {
    readonly DROPDOWN: 1000;
    readonly STICKY: 1020;
    readonly FIXED: 1030;
    readonly MODAL_BACKDROP: 1040;
    readonly MODAL: 1050;
    readonly POPOVER: 1060;
    readonly TOOLTIP: 1070;
    readonly TOAST: 1080;
    readonly WIDGET: 2147483647;
};
export declare const VALIDATION_RULES: {
    readonly EMAIL: {
        readonly PATTERN: RegExp;
        readonly MAX_LENGTH: 254;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly MAX_LENGTH: 128;
        readonly PATTERN: RegExp;
    };
    readonly NAME: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 100;
        readonly PATTERN: RegExp;
    };
    readonly ORGANIZATION_NAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 100;
        readonly PATTERN: RegExp;
    };
    readonly MESSAGE: {
        readonly MAX_LENGTH: 4000;
    };
    readonly FILE: {
        readonly MAX_SIZE: number;
        readonly ALLOWED_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    };
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly DEFAULT_PAGE: 1;
};
export declare const CACHE_KEYS: {
    readonly USER_PROFILE: "user:profile";
    readonly ORGANIZATION: (id: string) => string;
    readonly CONVERSATIONS: (orgId: string) => string;
    readonly CONVERSATION: (id: string) => string;
    readonly MESSAGES: (convId: string) => string;
    readonly WIDGET_CONFIG: (orgId: string) => string;
};
export declare const CACHE_TTL: {
    readonly SHORT: number;
    readonly MEDIUM: number;
    readonly LONG: number;
};
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly CONFLICT: "CONFLICT";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly CONVERSATION_CLOSED: "CONVERSATION_CLOSED";
    readonly AGENT_UNAVAILABLE: "AGENT_UNAVAILABLE";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE";
};
export declare const FEATURE_FLAGS: {
    readonly AI_RESPONSES: "ai_responses";
    readonly FILE_UPLOADS: "file_uploads";
    readonly VOICE_MESSAGES: "voice_messages";
    readonly VIDEO_CALLS: "video_calls";
    readonly SCREEN_SHARING: "screen_sharing";
    readonly EMOJI_REACTIONS: "emoji_reactions";
    readonly MESSAGE_THREADING: "message_threading";
    readonly CUSTOM_BRANDING: "custom_branding";
    readonly ANALYTICS: "analytics";
    readonly INTEGRATIONS: "integrations";
};
export declare const WIDGET_CONFIG: {
    readonly DEFAULT_POSITION: "bottom-right";
    readonly DEFAULT_THEME: {
        readonly primaryColor: "#3b82f6";
        readonly secondaryColor: "#64748b";
        readonly textColor: "#1f2937";
        readonly backgroundColor: "#ffffff";
        readonly borderRadius: 8;
        readonly fontFamily: "Inter, sans-serif";
    };
    readonly DEFAULT_GREETING: "Hi! How can we help you today?";
    readonly DEFAULT_OFFLINE_MESSAGE: "We're currently offline. Leave us a message and we'll get back to you soon!";
    readonly MAX_MESSAGE_LENGTH: 4000;
    readonly TYPING_INDICATOR_TIMEOUT: 3000;
    readonly RECONNECT_INTERVAL: 5000;
    readonly MAX_RECONNECT_ATTEMPTS: 5;
};
export declare const ANALYTICS_EVENTS: {
    readonly WIDGET_LOADED: "widget_loaded";
    readonly WIDGET_OPENED: "widget_opened";
    readonly WIDGET_CLOSED: "widget_closed";
    readonly MESSAGE_SENT: "message_sent";
    readonly FILE_UPLOADED: "file_uploaded";
    readonly DASHBOARD_LOADED: "dashboard_loaded";
    readonly CONVERSATION_VIEWED: "conversation_viewed";
    readonly CONVERSATION_ASSIGNED: "conversation_assigned";
    readonly CONVERSATION_CLOSED: "conversation_closed";
    readonly AGENT_LOGIN: "agent_login";
    readonly AGENT_LOGOUT: "agent_logout";
    readonly AGENT_STATUS_CHANGED: "agent_status_changed";
    readonly AI_RESPONSE_GENERATED: "ai_response_generated";
    readonly AI_HANDOVER_TRIGGERED: "ai_handover_triggered";
};
export declare const NOTIFICATION_TYPES: {
    readonly SUCCESS: "success";
    readonly ERROR: "error";
    readonly WARNING: "warning";
    readonly INFO: "info";
};
export declare const NOTIFICATION_DURATION: {
    readonly SHORT: 3000;
    readonly MEDIUM: 5000;
    readonly LONG: 8000;
    readonly PERSISTENT: 0;
};
export * from './types';
//# sourceMappingURL=index.d.ts.map