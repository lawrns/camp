import { widgetRouter } from "@/trpc/router/widget";
import { analyticsRouter } from "./router/ai/analytics";
import { fineTuningRouter } from "./router/ai/fine-tuning";
import { inferenceRouter } from "./router/ai/inference";
import { modelsRouter } from "./router/ai/models";
import { trainingDataRouter } from "./router/ai/training-data";
import { billingRouter } from "./router/billing";
import { gmailSupportEmailRouter } from "./router/gmailSupportEmail";
import { knowledgeRouter } from "./router/knowledge";
import { organizationRouter } from "./router/organization";
import { ticketsRouter } from "./router/tickets";
import { createTRPCRouter, publicProcedure } from "./trpc";

// Import missing routers (create placeholder if needed)
const apiKeysRouter = createTRPCRouter({});
const webhooksRouter = createTRPCRouter({});

// Import knowledge router

// Import realtime router from packages

export const appRouter = createTRPCRouter({
  // mailbox: mailboxRouter, // Temporarily disabled due to circular dependency
  organization: organizationRouter,
  // user: userRouter, // Temporarily disabled due to circular dependency
  widget: widgetRouter,
  gmailSupportEmail: gmailSupportEmailRouter,
  billing: billingRouter,
  tickets: ticketsRouter,
  apiKeys: apiKeysRouter,
  webhooks: webhooksRouter,
  knowledge: knowledgeRouter, // Re-enabled to fix schema compilation error
  // realtime: realtimeRouter, // TODO: Enable when packages/api-router integration is ready
  ai: createTRPCRouter({
    trainingData: trainingDataRouter,
    fineTuning: fineTuningRouter,
    models: modelsRouter,
    routing: inferenceRouter,
    analytics: analyticsRouter,
  }),
  isSignedIn: publicProcedure.query(({ ctx }) => !!ctx.user?.id),
});

// export type definition of API
export type AppRouter = typeof appRouter;
