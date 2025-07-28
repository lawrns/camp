// Re-export the consolidated auth system
export { AuthProvider, useAuth, useAuthLoading, useUser } from "@/lib/core/auth-provider";

// Export types for convenience
export type { AuthenticatedUser as AuthUser } from "@/lib/core/auth";
