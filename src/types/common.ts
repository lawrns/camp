/**
 * Common shared types for type safety improvements across Campfire
 */

// Generic utility types
export type AnyRecord = Record<string, unknown>;
export type StringRecord = Record<string, string>;
export type NumberRecord = Record<string, number>;

// React component utility types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export type EventHandler<T = Event> = (event: T) => void;
export type ChangeEventHandler = EventHandler<React.ChangeEvent<HTMLInputElement>>;
export type ClickEventHandler = EventHandler<React.MouseEvent<HTMLButtonElement>>;

// API Response wrapper types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

// AI and Tool Execution Types
export interface ToolCall {
  toolName: string;
  toolCallId: string;
  args: AnyRecord;
}

export interface AIStep {
  toolCalls: ToolCall[];
}

export interface ExperimentalProviderMetadata {
  reasoning?: string;
  openai?: {
    cachedPromptTokens?: number;
  };
  [key: string]: unknown;
}

// Tool execution result types
export interface ToolExecutionData {
  [key: string]: unknown;
}

export interface ToolExecutionError {
  message: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

// Guide Action Types
export interface GuideAction {
  type: "click_element" | "input_text" | "done";
  text?: string;
  success?: boolean;
  sideEffectDescription?: string;
  hasSideEffects?: boolean;
  [key: string]: unknown; // for additional action-specific parameters
}

export interface GuideContext {
  completed_steps?: Array<{
    description: string;
    completed: boolean;
  }>;
  current_step?: number;
  [key: string]: unknown; // for additional context data
}

export interface GuideToolResult {
  success: boolean;
  message: string;
  [key: string]: unknown; // for additional result data
}

// Animation and UI types
export interface AnimationConfig {
  duration?: number;
  ease?: string;
  [key: string]: unknown;
}

// API response types removed - use types/api.ts instead

// Theme and styling types
export interface ThemeConfig {
  colors?: StringRecord;
  fonts?: StringRecord;
  spacing?: NumberRecord;
  breakpoints?: NumberRecord;
}

// Modal and dialog types
export interface ModalProps extends ComponentWithChildren, ComponentWithClassName {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

// Tab and navigation types
export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

// Toast and notification types
export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// OpenAPI and tool types for better type safety
export interface OpenAPIParameter {
  name: string;
  description?: string;
  type: "string" | "number" | "boolean";
  in: "body" | "query" | "path" | "header";
  required: boolean;
}

// Conversation and messaging types - renamed to avoid conflict with entities/conversation.ts
export interface ConversationSummary {
  id: number;
  organizationId: string;
  status: "open" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  title?: string;
  customerEmail?: string;
  customerName?: string;
  assigneeId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastMessageAt?: Date | string;
  messageCount?: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationMember {
  id: string;
  name?: string;
  email?: string;
  role: "customer" | "agent" | "admin";
  isOnline?: boolean;
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: StringRecord;
  metadata?: AnyRecord;
}

// ApiError removed - use types/api.ts instead

// Metadata types
export interface UserMetadata {
  role?: string;
  permissions?: string[];
  preferences?: AnyRecord;
  [key: string]: unknown;
}

export interface OrganizationMetadata {
  plan?: string;
  features?: string[];
  settings?: AnyRecord;
  [key: string]: unknown;
}

// Event and message types
export interface EventData {
  type: string;
  timestamp: Date | string;
  data: AnyRecord;
  source?: string;
}

export interface MessageTraceMetadata {
  includesScreenshot?: boolean;
  trace_id?: string;
  reasoning?: string;
  tool?: {
    slug: string;
    name: string;
    result?: unknown;
    parameters?: AnyRecord;
  };
  [key: string]: unknown;
}

// Component prop types
export interface ComponentWithChildren {
  children?: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

export interface ComponentWithVariants<T extends string> {
  variant?: T;
  size?: "sm" | "default" | "lg";
}

// Form and input types
export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// Database and query types
// PaginationParams removed - use types/api.ts instead

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: unknown;
}

export interface QueryParams extends SortParams {
  page?: number;
  limit?: number;
  offset?: number;
  filters?: FilterParams;
  search?: string;
}

// File and upload types
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface FileMetadata {
  originalName: string;
  name: string; // Display name (alias for originalName)
  size: number;
  mimeType: string;
  type: string; // File type (alias for mimeType)
  uploadedAt: Date | string;
  uploadedBy?: string;
}

// Utility function to transform FileMetadata with computed properties
export function normalizeFileMetadata(
  metadata: Partial<FileMetadata> & { originalName: string; mimeType: string; size: number }
): FileMetadata {
  return {
    ...metadata,
    name: metadata.name || metadata.originalName,
    type: metadata.type || metadata.mimeType,
    uploadedAt: metadata.uploadedAt || new Date(),
  };
}

// Webhook and external integration types
export interface WebhookPayload {
  event: string;
  data: AnyRecord;
  timestamp: Date | string;
  source: string;
  signature?: string;
}

export interface ExternalApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: StringRecord;
}

// Search and retrieval types
export interface SearchResult<T = unknown> {
  id: string;
  score: number;
  data: T;
  metadata?: AnyRecord;
}

export interface SearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: FilterParams;
}

// Analytics and reporting types
export interface AnalyticsEvent {
  name: string;
  properties: AnyRecord;
  timestamp?: Date | string;
  userId?: string;
  sessionId?: string;
}

export interface Metric {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date | string;
  tags?: StringRecord;
}

// Re-export commonly used types from entities
export type { Conversation } from "./entities/conversation";

// Extended conversation types with relations
// Note: Use ConversationWithRelations from types/entities/conversation.ts instead
export interface ConversationWithRelationsLegacy extends ConversationSummary {
  messages?: Array<{
    id: string;
    content: string;
    sender_type: "customer" | "agent" | "system";
    created_at: Date | string;
    metadata?: Record<string, unknown>;
  }>;
  customer?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  assignee?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// Type guards and validation helpers
export function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringRecord(value: unknown): value is StringRecord {
  return isRecord(value) && Object.values(value).every((v) => typeof v === "string");
}

export function hasProperty<T extends string>(obj: unknown, prop: T): obj is Record<T, unknown> {
  return isRecord(obj) && prop in obj;
}

// Function types
export type AsyncFunction<T extends unknown[] = unknown[], R = unknown> = (...args: T) => Promise<R>;
export type SyncFunction<T extends unknown[] = unknown[], R = unknown> = (...args: T) => R;
export type AnyFunction<T extends unknown[] = unknown[], R = unknown> = AsyncFunction<T, R> | SyncFunction<T, R>;

// State management types
export interface ActionWithPayload<T = unknown> {
  type: string;
  payload: T;
}

export interface ActionWithoutPayload {
  type: string;
}

export type Action<T = unknown> = ActionWithPayload<T> | ActionWithoutPayload;

export interface State<T = unknown> {
  data: T;
  loading: boolean;
  error?: string | null;
}
