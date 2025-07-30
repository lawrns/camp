/**
 * tRPC API Route Handler for Next.js App Router
 * 
 * This handles all tRPC requests at /api/trpc/*
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { appRouter } from '@/trpc/root';
import { createTRPCContext } from '@/trpc/trpc';

// Force dynamic rendering to ensure headers are preserved
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

const handler = (req: NextRequest) => {
  // Debug: Log authorization header
  const authHeader = req.headers.get('authorization')
  console.log('[tRPC Route] Authorization header:', authHeader ? `${authHeader.substring(0, 50)}...` : 'none')

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });
}

export { handler as GET, handler as POST };
