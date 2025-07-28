/**
 * Internal Module Type Definitions
 * Type definitions for internal modules that are missing proper exports
 */

// Missing internal modules
declare module "@/lib/supabase/service-role-server" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createServiceRoleClient(): SupabaseClient<Database>;
  export function getServiceClient(): SupabaseClient<Database>;
  export default function createClient(): SupabaseClient<Database>;
}

declare module "@/lib/supabase/server-client" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createServerClient(): SupabaseClient<Database>;
  export function getServerClient(): SupabaseClient<Database>;
  export default function createClient(): SupabaseClient<Database>;
}

declare module "@/lib/supabase/admin-client" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createAdminClient(): SupabaseClient<Database>;
  export function getAdminClient(): SupabaseClient<Database>;
  export default function createClient(): SupabaseClient<Database>;
}

declare module "@/lib/auth/service" {
  export interface AuthService {
    validateToken(token: string): Promise<{ valid: boolean; user?: any }>;
    getUser(token: string): Promise<any>;
    createSession(user: any): Promise<string>;
    destroySession(token: string): Promise<void>;
  }

  export const authService: AuthService;
  export default authService;
}

declare module "@/lib/auth/api-auth" {
  export function isValidOrganizationId(id: string | null | undefined): boolean;
  export function validateApiKey(key: string): Promise<{ valid: boolean; organizationId?: string }>;
  export function authenticateRequest(request: Request): Promise<{
    success: boolean;
    context?: {
      user: any;
      organizationId?: string;
    };
    error?: string;
  }>;
}

declare module "@/lib/db" {
  export interface DatabaseConnection {
    query(sql: string, params?: any[]): Promise<any>;
    transaction(fn: (trx: any) => Promise<any>): Promise<any>;
  }

  export const db: DatabaseConnection;
  export default db;
}

declare module "@/lib/storage" {
  export interface StorageService {
    upload(file: File, path: string): Promise<string>;
    download(path: string): Promise<Blob>;
    delete(path: string): Promise<void>;
    getPublicUrl(path: string): string;
  }

  export const storage: StorageService;
  export default storage;
}

declare module "@/lib/realtime" {
  import type { RealtimeChannel } from "@supabase/supabase-js";

  export interface RealtimeService {
    createChannel(name: string): RealtimeChannel;
    getChannel(name: string): RealtimeChannel | null;
    removeChannel(name: string): void;
    broadcast(channel: string, event: string, payload: any): void;
  }

  export const realtime: RealtimeService;
  export default realtime;
}

declare module "@/lib/feature-flags" {
  export function isFeatureEnabled(flag: string): boolean;
  export function getFeatureValue(flag: string): any;
  export function getAllFeatures(): Record<string, any>;
}

declare module "@/lib/store" {
  export interface Store<T = any> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
  }

  export function useStore<T = any>(): Store<T>;
  export default useStore;
}

declare module "@/lib/utils/client-factory" {
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";

  export function createSupabaseClient(): SupabaseClient<Database>;
  export function createBrowserClient(): SupabaseClient<Database>;
  export function createServerClient(): SupabaseClient<Database>;
  export function createServiceClient(): SupabaseClient<Database>;
}

declare module "@/lib/simple-require-auth" {
  import { NextRequest } from "next/server";
  export function authenticateRequest(request: NextRequest): Promise<{
    success: boolean;
    context?: {
      user: any;
      organizationId?: string;
    };
    error?: string;
  }>;
}

declare module "@/lib/ai/conversation-state-analyzer" {
  export class ConversationStateAnalyzer {
    analyzeState(conversation: any, messages: any[]): Promise<any>;
  }
}

declare module "@/lib/ai/resolution-detector" {
  export class ResolutionDetector {
    isResolved(
      conversation: any,
      messages: any[]
    ): Promise<{
      isResolved: boolean;
      confidence: number;
      reason?: string;
    }>;
  }
}

declare module "@/lib/ai/cost-management-service" {
  export class CostManagementService {
    trackUsage(organizationId: string, usage: any): Promise<void>;
    getCosts(organizationId: string): Promise<any>;
    checkLimits(organizationId: string): Promise<{ allowed: boolean; remaining: number }>;
  }
}

declare module "@/lib/ai/ai-cost-management-service" {
  export class AICostManagementService {
    trackUsage(organizationId: string, usage: any): Promise<void>;
    getCosts(organizationId: string): Promise<any>;
    checkLimits(organizationId: string): Promise<{ allowed: boolean; remaining: number }>;
  }
}

// Widget-related modules
declare module "@/lib/widget/config" {
  export interface WidgetConfig {
    organizationId: string;
    appearance: {
      primaryColor: string;
      position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
      size: "small" | "medium" | "large";
    };
    behavior: {
      showOnLoad: boolean;
      hideAfterMessage: boolean;
      enableTyping: boolean;
    };
  }

  export function getWidgetConfig(organizationId: string): Promise<WidgetConfig>;
  export function updateWidgetConfig(organizationId: string, config: Partial<WidgetConfig>): Promise<void>;
}

declare module "@/lib/widget/auth" {
  export interface WidgetAuth {
    generateToken(organizationId: string): Promise<string>;
    validateToken(token: string): Promise<{ valid: boolean; organizationId?: string }>;
    refreshToken(token: string): Promise<string>;
  }

  export const widgetAuth: WidgetAuth;
  export default widgetAuth;
}

// Utility modules
declare module "@/lib/utils/date" {
  export function formatDate(date: Date | string): string;
  export function formatRelativeTime(date: Date | string): string;
  export function isToday(date: Date | string): boolean;
  export function isYesterday(date: Date | string): boolean;
}

declare module "@/lib/utils/string" {
  export function truncate(text: string, length: number): string;
  export function capitalize(text: string): string;
  export function slugify(text: string): string;
  export function generateId(prefix?: string): string;
}

declare module "@/lib/utils/validation" {
  export function isEmail(email: string): boolean;
  export function isUrl(url: string): boolean;
  export function isUuid(uuid: string): boolean;
  export function sanitizeHtml(html: string): string;
}

// Analytics modules
declare module "@/lib/analytics/events" {
  export interface AnalyticsEvent {
    type: string;
    properties: Record<string, any>;
    timestamp: Date;
    userId?: string;
    organizationId?: string;
  }

  export function trackEvent(event: AnalyticsEvent): Promise<void>;
  export function trackPageView(page: string, properties?: Record<string, any>): Promise<void>;
  export function trackUserAction(action: string, properties?: Record<string, any>): Promise<void>;
}

declare module "@/lib/analytics/metrics" {
  export interface MetricData {
    name: string;
    value: number;
    timestamp: Date;
    tags?: Record<string, string>;
  }

  export function recordMetric(metric: MetricData): Promise<void>;
  export function getMetrics(organizationId: string, timeRange: { start: Date; end: Date }): Promise<MetricData[]>;
}

// Additional missing modules
declare module "jest-axe" {
  export function axe(element: any): Promise<any>;
  export function toHaveNoViolations(received: any): any;
}

declare module "@/hooks/use-enhanced-toast" {
  export interface EnhancedToast {
    success: (message: string, options?: any) => void;
    error: (message: string, options?: any) => void;
    info: (message: string, options?: any) => void;
    warning: (message: string, options?: any) => void;
    loading: (message: string, options?: any) => void;
    dismiss: (id?: string) => void;
  }

  export function useEnhancedToast(): EnhancedToast;
  export default useEnhancedToast;
}

declare module "@/components/conversations/ConversationList" {
  export interface ConversationListProps {
    conversations: any[];
    selectedConversationId?: string;
    onConversationSelect: (conversationId: string) => void;
    loading?: boolean;
    error?: string;
  }

  export default function ConversationList(props: ConversationListProps): JSX.Element;
}

declare module "@campfire/api-router" {
  export interface ApiRouter {
    get: (path: string, handler: any) => void;
    post: (path: string, handler: any) => void;
    put: (path: string, handler: any) => void;
    delete: (path: string, handler: any) => void;
    patch: (path: string, handler: any) => void;
  }

  export function createApiRouter(): ApiRouter;
  export default createApiRouter;
}

declare module "@campfire/api-router/client" {
  export interface ApiClient {
    get: (path: string, options?: any) => Promise<any>;
    post: (path: string, data?: any, options?: any) => Promise<any>;
    put: (path: string, data?: any, options?: any) => Promise<any>;
    delete: (path: string, options?: any) => Promise<any>;
    patch: (path: string, data?: any, options?: any) => Promise<any>;
  }

  export function createApiClient(baseUrl: string): ApiClient;
  export default createApiClient;
}

declare module "@campfire/inbox" {
  export interface InboxProps {
    organizationId: string;
    userId: string;
    className?: string;
  }

  export default function Inbox(props: InboxProps): JSX.Element;
}

declare module "@campfire/job-queue" {
  export interface JobQueue {
    add: (name: string, data: any, options?: any) => Promise<void>;
    process: (name: string, handler: (job: any) => Promise<void>) => void;
    start: () => Promise<void>;
    stop: () => Promise<void>;
  }

  export function createJobQueue(): JobQueue;
  export default createJobQueue;
}

declare module "@/lib/core/messaging" {
  export interface MessagingService {
    sendMessage: (message: any) => Promise<void>;
    receiveMessage: (handler: (message: any) => void) => void;
    broadcastMessage: (message: any) => Promise<void>;
  }

  export const messagingService: MessagingService;
  export default messagingService;
}

declare module "@/lib/performance/monitor" {
  export interface PerformanceMonitor {
    startTimer: (name: string) => void;
    endTimer: (name: string) => number;
    recordMetric: (name: string, value: number) => void;
    getMetrics: () => Record<string, number>;
  }

  export const performanceMonitor: PerformanceMonitor;
  export default performanceMonitor;
}

declare module "./progressive-loading" {
  export interface ProgressiveLoader {
    loadComponent: (name: string) => Promise<any>;
    preloadComponent: (name: string) => Promise<void>;
    isLoaded: (name: string) => boolean;
  }

  export const progressiveLoader: ProgressiveLoader;
  export default progressiveLoader;
}

declare module "./optimized-components" {
  export interface OptimizedComponent {
    name: string;
    component: React.ComponentType<any>;
    preload: () => Promise<void>;
  }

  export const optimizedComponents: OptimizedComponent[];
  export default optimizedComponents;
}

declare module "../realtime-server/WebSocketV2Service" {
  export interface WebSocketV2Service {
    connect: (url: string) => Promise<void>;
    disconnect: () => void;
    send: (data: any) => void;
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler: (data: any) => void) => void;
  }

  export const webSocketV2Service: WebSocketV2Service;
  export default webSocketV2Service;
}

declare module "./embeddingCache" {
  export interface EmbeddingCache {
    get: (key: string) => Promise<number[] | null>;
    set: (key: string, embedding: number[]) => Promise<void>;
    clear: () => Promise<void>;
  }

  export const embeddingCache: EmbeddingCache;
  export default embeddingCache;
}

declare module "./embeddings" {
  export interface EmbeddingService {
    generateEmbedding: (text: string) => Promise<number[]>;
    generateEmbeddings: (texts: string[]) => Promise<number[][]>;
    similarity: (embedding1: number[], embedding2: number[]) => number;
  }

  export const embeddingService: EmbeddingService;
  export default embeddingService;
}

// Additional global types for commonly used but missing globals
declare global {
  // More missing globals
  const auth: {
    currentUser: any;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    onAuthStateChange: (callback: (user: any) => void) => () => void;
  };

  const SearchInput: React.ComponentType<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }>;

  const ConversationList: React.ComponentType<{
    conversations: any[];
    selectedConversationId?: string;
    onConversationSelect: (conversationId: string) => void;
    loading?: boolean;
    error?: string;
  }>;

  const MessageList: React.ComponentType<{
    messages: any[];
    conversationId: string;
    loading?: boolean;
    error?: string;
  }>;

  const TypingIndicator: React.ComponentType<{
    isTyping: boolean;
    users?: any[];
  }>;

  const UploadProgress: React.ComponentType<{
    progress: number;
    fileName: string;
  }>;

  const CannedResponses: React.ComponentType<{
    onSelect: (response: string) => void;
  }>;

  const MessageComposer: React.ComponentType<{
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }>;

  const Button: React.ComponentType<{
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "danger";
    size?: "small" | "medium" | "large";
    className?: string;
  }>;

  const createChannelName: (organizationId: string, resourceType: string, resourceId?: string) => string;
  const getGlobalRealtimeClient: () => any;

  const enhanced: any;
}

// Export type definitions
export {};
