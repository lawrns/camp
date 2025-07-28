/**
 * Deno type definitions for Supabase Edge Functions
 */

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
      toObject(): { [key: string]: string };
    };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
  };
}

export {};
