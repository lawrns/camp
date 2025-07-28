/**
 * Global Type Extensions
 * Extensions for third-party libraries and missing types
 */

// Extend process.env types
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    NEXT_PUBLIC_API_URL?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_DB?: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    GOOGLE_API_KEY?: string;
  }
}

// Extend Window interface for widgets
declare global {
  interface Window {
    CampfireWidget?: any;
    CampfireConfig?: any;
    __campfire_widget__?: any;
    supabase?: any;
  }
}

// Common missing types
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

// Cost Management Service is implemented in /lib/ai/cost-management-service.ts
// AICostManagementService is implemented in /lib/ai/ai-cost-management-service.ts

// Declare missing modules
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

declare module "@/lib/auth/api-auth" {
  export function isValidOrganizationId(id: string | null | undefined): boolean;
}

// Export to make this a module
export {};
