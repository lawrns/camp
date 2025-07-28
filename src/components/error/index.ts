// Re-export domain-specific boundaries as deprecated aliases
import {
  AIErrorBoundary as UnifiedAIErrorBoundary,
  CriticalErrorBoundary as UnifiedCriticalErrorBoundary,
  DashboardErrorBoundary as UnifiedDashboardErrorBoundary,
  KnowledgeErrorBoundary as UnifiedKnowledgeErrorBoundary,
  NotificationErrorBoundary as UnifiedNotificationErrorBoundary,
  SupabaseErrorBoundary as UnifiedSupabaseErrorBoundary,
} from "./ErrorBoundaryProvider";

// Unified Error Boundary System Exports

// Main components
export {
  UnifiedErrorBoundary,
  withUnifiedErrorBoundary,
} from "@/components/unified-ui/components/PhoenixErrorBoundary";
export { useErrorBoundary } from "./UnifiedErrorBoundary";
export type {
  ErrorDomain,
  ErrorSeverity,
  ErrorHandler,
  ErrorContext,
  UnifiedErrorBoundaryProps,
  UnifiedErrorBoundaryState,
} from "./UnifiedErrorBoundary";

// Provider and context
export {
  ErrorBoundaryProvider,
  useErrorBoundaryContext,
  AIErrorBoundary,
  SupabaseErrorBoundary,
  KnowledgeErrorBoundary,
  DashboardErrorBoundary,
  CriticalErrorBoundary,
  NotificationErrorBoundary,
  AuthErrorBoundary,
} from "./ErrorBoundaryProvider";

// Legacy exports for backward compatibility
export { ErrorBoundary } from "./ErrorBoundary";
export { SimplifiedErrorBoundary } from "./SimplifiedErrorBoundary";

/**
 * @deprecated Use UnifiedErrorBoundary with domain="ai" or AIErrorBoundary from ErrorBoundaryProvider
 */
export { AIErrorBoundary as default } from "./AIErrorBoundary";

/**
 * @deprecated Use UnifiedErrorBoundary with domain="supabase" or SupabaseErrorBoundary from ErrorBoundaryProvider
 */
export { SupabaseRuntimeErrorBoundary as LegacySupabaseErrorBoundary } from "./SupabaseErrorBoundary";

/**
 * @deprecated Use UnifiedErrorBoundary with domain="knowledge" or KnowledgeErrorBoundary from ErrorBoundaryProvider
 */
export { KnowledgeErrorBoundary as LegacyKnowledgeErrorBoundary } from "./KnowledgeErrorBoundary";

/**
 * @deprecated Use UnifiedErrorBoundary with domain="dashboard" or DashboardErrorBoundary from ErrorBoundaryProvider
 */
export { DashboardErrorBoundary as LegacyDashboardErrorBoundary } from "./DashboardErrorBoundary";

/**
 * @deprecated Use UnifiedErrorBoundary with domain="critical" or CriticalErrorBoundary from ErrorBoundaryProvider
 */
export { CriticalErrorBoundary as LegacyCriticalErrorBoundary } from "./CriticalErrorBoundary";

/**
 * @deprecated Use UnifiedErrorBoundary with domain="notification" or NotificationErrorBoundary from ErrorBoundaryProvider
 */
export { NotificationErrorBoundary as LegacyNotificationErrorBoundary } from "./NotificationErrorBoundary";
