import { env } from "@/lib/utils/env-config";

/**
 * Application constants
 */

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side
    return window.location.origin;
  }

  // Server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback for development
  return "http://localhost:3010";
}

// Email configuration
export const CAMPFIRE_SUPPORT_EMAIL_FROM = "support@comrad.ai";
