/**
 * AI System Startup
 * Initializes the AI processing system when the application starts
 */

import { isOpenAIConfigured } from "@/lib/infrastructure/openai/client";
import { env } from "@/lib/utils/env-config";
import { realtimeAIProcessor } from "./realtime-ai-processor";

let isInitialized = false;

/**
 * Initialize the AI processing system
 */
export async function initializeAISystem(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return;
    }

    // Only start in production or when explicitly enabled in development
    const shouldStart = env.NODE_ENV === "production" || env.AI_PROCESSOR_AUTO_START === "true";

    if (shouldStart) {
      // Start the real-time AI processor
      await realtimeAIProcessor.start();
    } else {
    }

    isInitialized = true;
  } catch (error) {
    throw error;
  }
}

/**
 * Shutdown the AI processing system
 */
export async function shutdownAISystem(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  try {
    await realtimeAIProcessor.stop();
    isInitialized = false;
  } catch (error) {}
}

/**
 * Get AI system status
 */
export function getAISystemStatus(): {
  initialized: boolean;
  processorRunning: boolean;
  openaiConfigured: boolean;
} {
  return {
    initialized: isInitialized,
    processorRunning: realtimeAIProcessor.isRunning(),
    openaiConfigured: isOpenAIConfigured(),
  };
}

/**
 * Restart the AI processing system
 */
export async function restartAISystem(): Promise<void> {
  await shutdownAISystem();
  await initializeAISystem();
}

// Auto-initialize when this module is imported (server-side only)
if (typeof window === "undefined" && env.NODE_ENV !== "test") {
  // Use setTimeout to avoid blocking the initial import
  setTimeout(() => {
    initializeAISystem().catch((error) => {});
  }, 1000); // 1 second delay to allow other systems to initialize
}

// Handle graceful shutdown
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    await shutdownAISystem();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await shutdownAISystem();
    process.exit(0);
  });
}
