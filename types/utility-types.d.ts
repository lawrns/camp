/**
 * Utility Type Definitions
 * Common utility types to reduce type errors
 */

// Common utility types
export type AnyFunction = (...args: any[]) => any;
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;

// React component types
export type ReactComponent<P = {}> = React.ComponentType<P>;
export type ReactFunctionComponent<P = {}> = React.FunctionComponent<P>;
export type ReactElement = React.ReactElement;
export type ReactNode = React.ReactNode;

// Event handler types
export type EventHandler<T = any> = (event: T) => void;
export type ChangeHandler = (value: string) => void;
export type ClickHandler = () => void;
export type SubmitHandler = (event: React.FormEvent) => void;

// API types
export type ApiResponse<T = any> = {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
};

export type ApiError = {
  message: string;
  code?: string | number;
  details?: any;
};

// Database types
export type DatabaseRecord = {
  id: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
};

export type PaginatedResponse<T = any> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// Common object types
export type StringRecord = Record<string, string>;
export type AnyRecord = Record<string, any>;
export type NumberRecord = Record<string, number>;
export type BooleanRecord = Record<string, boolean>;

// Optional and Nullable types
export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

// Array types
export type NonEmptyArray<T> = [T, ...T[]];
export type ReadonlyArray<T> = readonly T[];

// Promise types
export type PromiseOr<T> = T | Promise<T>;
export type Awaitable<T> = T | Promise<T>;

// Supabase-related types
export type SupabaseResponse<T = any> = {
  data: T | null;
  error: any | null;
};

export type SupabaseQueryBuilder = {
  from: (table: string) => any;
  select: (...args: any[]) => any;
  insert: (data: any) => any;
  update: (data: any) => any;
  delete: () => any;
  eq: (column: string, value: any) => any;
  neq: (column: string, value: any) => any;
  gt: (column: string, value: any) => any;
  gte: (column: string, value: any) => any;
  lt: (column: string, value: any) => any;
  lte: (column: string, value: any) => any;
  like: (column: string, pattern: string) => any;
  ilike: (column: string, pattern: string) => any;
  in: (column: string, values: any[]) => any;
  contains: (column: string, value: any) => any;
  containedBy: (column: string, value: any) => any;
  rangeGt: (column: string, value: any) => any;
  rangeGte: (column: string, value: any) => any;
  rangeLt: (column: string, value: any) => any;
  rangeLte: (column: string, value: any) => any;
  rangeAdjacent: (column: string, value: any) => any;
  overlaps: (column: string, value: any) => any;
  textSearch: (column: string, query: string) => any;
  match: (query: AnyRecord) => any;
  not: (column: string, operator: string, value: any) => any;
  or: (filters: string) => any;
  filter: (column: string, operator: string, value: any) => any;
  order: (column: string, options?: { ascending?: boolean }) => any;
  limit: (count: number) => any;
  range: (from: number, to: number) => any;
  single: () => any;
  maybeSingle: () => any;
};

// Widget types
export type WidgetMessage = {
  id: string;
  content: string;
  sender_type: "visitor" | "agent" | "system" | "ai";
  created_at: string;
  sender_id?: string;
  metadata?: AnyRecord;
};

export type WidgetConversation = {
  id: string;
  status: "open" | "closed" | "pending";
  created_at: string;
  updated_at?: string;
  visitor_id: string;
  organization_id: string;
  metadata?: AnyRecord;
};

// Form types
export type FormField<T = any> = {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
};

export type FormData<T = AnyRecord> = {
  [K in keyof T]: FormField<T[K]>;
};

export type ValidationRule<T = any> = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
};

// State management types
export type StateAction<T = any> = {
  type: string;
  payload?: T;
};

export type StateReducer<T = any> = (state: T, action: StateAction) => T;

export type StoreGetters<T = any> = {
  [K in keyof T]: () => T[K];
};

export type StoreSetters<T = any> = {
  [K in keyof T]: (value: T[K]) => void;
};

// Error types
export type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

export type ErrorWithCode = Error & {
  code?: string | number;
  statusCode?: number;
};

// Loading states
export type LoadingState = "idle" | "loading" | "success" | "error";

export type AsyncState<T = any> = {
  state: LoadingState;
  data?: T;
  error?: string;
};

// Component prop helpers
export type PropsWithClassName<P = {}> = P & {
  className?: string;
};

export type PropsWithChildren<P = {}> = P & {
  children?: ReactNode;
};

export type PropsWithRef<T, P = {}> = P & {
  ref?: React.Ref<T>;
};

// Conditional types
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;

// Deep utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// String manipulation types (simplified)
export type UppercaseString<T extends string> = string;
export type LowercaseString<T extends string> = string;
export type CapitalizedString<T extends string> = string;

// Type guards
export type TypeGuard<T> = (value: any) => value is T;
export type AsyncTypeGuard<T> = (value: any) => Promise<boolean>;

// Branding types
export type Brand<T, B> = T & { __brand: B };
export type UserId = Brand<string, "UserId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type ConversationId = Brand<string, "ConversationId">;
export type MessageId = Brand<string, "MessageId">;

// Export as global augmentation
declare global {
  // Additional globals for type safety
  type TODO = any; // Temporary type for items that need proper typing
  type FIXME = any; // Type for items that need fixing
  type Unknown = unknown; // Better than any for truly unknown values

  // Common component props
  interface ComponentProps {
    className?: string;
    children?: React.ReactNode;
    id?: string;
    "data-testid"?: string;
  }

  // Common event handlers
  interface StandardEventHandlers {
    onClick?: () => void;
    onSubmit?: (event: React.FormEvent) => void;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
  }
}

export {};
