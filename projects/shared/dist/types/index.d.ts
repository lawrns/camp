/**
 * Shared Types
 *
 * Common type definitions used across all Campfire V2 projects
 */
export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}
export interface User extends BaseEntity {
    email: string;
    name?: string;
    avatar_url?: string;
    role: UserRole;
    organization_id: string;
    user_metadata?: Record<string, any>;
}
export type UserRole = 'admin' | 'agent' | 'viewer';
export interface Organization extends BaseEntity {
    name: string;
    slug: string;
    settings: OrganizationSettings;
    subscription_tier: SubscriptionTier;
}
export interface OrganizationSettings {
    widget_enabled: boolean;
    ai_enabled: boolean;
    custom_branding: boolean;
    max_agents: number;
    retention_days: number;
}
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export interface Conversation extends BaseEntity {
    organization_id: string;
    customer_name?: string;
    customer_email?: string;
    status: ConversationStatus;
    priority: ConversationPriority;
    assigned_to_user_id?: string;
    ai_handover_active: boolean;
    last_message_at?: string;
    message_count: number;
    tags: string[];
    metadata?: Record<string, any>;
}
export type ConversationStatus = 'open' | 'closed' | 'pending';
export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface Message extends BaseEntity {
    conversation_id: string;
    organization_id: string;
    content: string;
    sender_type: MessageSenderType;
    sender_id?: string;
    sender_name?: string;
    sender_email?: string;
    message_type: MessageType;
    metadata?: MessageMetadata;
}
export type MessageSenderType = 'visitor' | 'agent' | 'ai' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'ai_response';
export interface MessageMetadata {
    ai_confidence?: number;
    ai_model?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    image_url?: string;
    system_event?: string;
}
export interface WidgetConfig {
    organization_id: string;
    theme: WidgetTheme;
    position: WidgetPosition;
    greeting_message: string;
    offline_message: string;
    branding: WidgetBranding;
    features: WidgetFeatures;
}
export interface WidgetTheme {
    primary_color: string;
    secondary_color: string;
    text_color: string;
    background_color: string;
    border_radius: number;
    font_family: string;
}
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export interface WidgetBranding {
    show_logo: boolean;
    logo_url?: string;
    company_name?: string;
    powered_by_visible: boolean;
}
export interface WidgetFeatures {
    file_upload: boolean;
    emoji_picker: boolean;
    typing_indicators: boolean;
    read_receipts: boolean;
    agent_avatars: boolean;
}
export interface ApiResponse<T = any> {
    data?: T;
    error?: ApiError;
    success: boolean;
    message?: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
export interface RealtimeEvent<T = any> {
    type: string;
    payload: T;
    timestamp: string;
    organization_id: string;
    conversation_id?: string;
    user_id?: string;
}
export interface TypingIndicator {
    conversation_id: string;
    organization_id: string;
    user_id: string;
    user_name: string;
    is_typing: boolean;
    timestamp: string;
}
export interface PresenceState {
    user_id: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    last_seen: string;
}
export interface SearchParams {
    query: string;
    filters?: SearchFilters;
    pagination?: PaginationParams;
}
export interface SearchFilters {
    conversation_status?: ConversationStatus[];
    priority?: ConversationPriority[];
    assigned_to?: string[];
    date_range?: {
        start: string;
        end: string;
    };
    tags?: string[];
}
export interface AnalyticsMetrics {
    total_conversations: number;
    active_conversations: number;
    response_time_avg: number;
    resolution_time_avg: number;
    customer_satisfaction: number;
    agent_utilization: number;
}
export interface FileUpload {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploaded_at: string;
    uploaded_by: string;
}
export interface Notification extends BaseEntity {
    user_id: string;
    organization_id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    action_url?: string;
    metadata?: Record<string, any>;
}
export type NotificationType = 'new_message' | 'conversation_assigned' | 'conversation_closed' | 'system_alert' | 'billing_update';
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
    required?: boolean;
    placeholder?: string;
    options?: {
        label: string;
        value: string;
    }[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}
export interface ComponentProps {
    className?: string;
    children?: React.ReactNode;
}
export interface Theme {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        foreground: string;
        muted: string;
        border: string;
        destructive: string;
        success: string;
        warning: string;
        info: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    typography: {
        fontFamily: string;
        fontSize: Record<string, string>;
        fontWeight: Record<string, string>;
        lineHeight: Record<string, string>;
    };
    borderRadius: Record<string, string>;
    shadows: Record<string, string>;
}
//# sourceMappingURL=index.d.ts.map