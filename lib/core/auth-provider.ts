/**
 * Re-export file to redirect to the correct auth provider location
 * This file exists to maintain compatibility with existing imports
 */

// Re-export everything from the actual auth provider
export * from "../../src/lib/core/auth-provider";
export { AuthProvider as default } from "../../src/lib/core/auth-provider";
