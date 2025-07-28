/**
 * Main tRPC App Router
 *
 * This is the primary router that combines all feature routers.
 * All API endpoints are accessible through this router.
 */

import { createTRPCRouter } from './trpc';
import { conversationsRouter } from './routers/conversations';
import { ticketsRouter } from './routers/tickets';
import { analyticsRouter } from './routers/analytics';

/**
 * Main application router
 *
 * Add new routers here as they are created:
 * - conversations: Chat and conversation management ✅
 * - tickets: Support ticket system ✅
 * - analytics: Metrics and reporting ✅
 * - widget: Widget embedding and configuration (TODO)
 * - ai: AI-powered features and RAG (TODO)
 */
export const appRouter = createTRPCRouter({
  conversations: conversationsRouter,
  tickets: ticketsRouter,
  analytics: analyticsRouter,
  // TODO: Add more routers as they are implemented
  // widget: widgetRouter,
  // ai: aiRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
