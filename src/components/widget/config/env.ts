export const config = {
  defaultOrganizationId: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || "b5e80170-004c-4e82-a88c-3e2166b169dd",
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "test-key",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  },
} as const;
