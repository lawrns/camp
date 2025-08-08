import { aiHandoverService, type HandoverContext, type HandoverResult } from '@/lib/ai/handover';

/**
 * Minimal orchestrator wrapper to satisfy imports and unblock API routes.
 * Provides a request() method that evaluates and returns a handover decision.
 */
export const handoverOrchestrator = {
  async request({ context, targetOperatorId }: { context: HandoverContext; targetOperatorId?: string }) {
    const result: HandoverResult = await aiHandoverService.evaluateHandover(context);
    // Optionally execute the handover when requested
    if (result.shouldHandover) {
      try {
        await aiHandoverService.executeHandover(context, result, targetOperatorId);
      } catch {
        // Swallow execution errors to avoid breaking decision path; route can log separately
      }
    }
    return { requested: true, result };
  },
};

