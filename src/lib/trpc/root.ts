/**
 * Main tRPC Router
 * Combines all sub-routers following Helper.ai's approach
 */

import { createTRPCRouter } from "./server";

// import { conversationsRouter } from './routers/conversations'; // Module not found
// import { dashboardRouter } from './routers/dashboard'; // Module not found

/**
 * Main application router
 * Add new routers here as we migrate from API routes
 */
export const appRouter = createTRPCRouter({
  // conversations: conversationsRouter, // Module not found
  // dashboard: dashboardRouter, // Module not found
});

// Export type definition of API
export type AppRouter = typeof appRouter;
