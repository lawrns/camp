/**
 * UNIFIED STORE SELECTORS
 *
 * This file now re-exports the memoized selectors for backward compatibility.
 * All selectors have been moved to memoized-selectors-improved.ts for better performance.
 */

// Re-export all memoized selectors
export * from "./memoized-selectors-improved";

// Additional exports for backward compatibility
export { useCurrentUser as useAuthUser } from "./memoized-selectors-improved";
export { useCurrentOrganization as useOrganization } from "./domains/auth/auth-store";
