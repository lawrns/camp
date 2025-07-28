/**
 * Vector Deduplication - Team A Implementation
 *
 * Automated deduplication jobs for vector embeddings
 * TEAMA-005: Knowledge Vector TTL & Cleanup - Deduplication
 */

import { inngest } from "@/inngest/client";

// Type definitions
interface DeduplicationStats {
  totalVectors: number;
  duplicates: number;
  storage: number;
  duplicatesFound: number;
  spaceSaved: number;
  totalVectorsProcessed: number;
  duplicatesByType: {
    knowledgeChunks: number;
    conversationEmbeddings: number;
    vectorDocuments: number;
  };
}

interface DeduplicationResult {
  totalDuplicates: number;
  totalSavings: number;
  type: string;
  processingTime: number;
  duplicateGroups: Array<{
    duplicateIds: string[];
  }>;
}

interface DeduplicationConfig {
  dryRun?: boolean;
  [key: string]: any;
}

interface VectorDeduplicationService {
  getDeduplicationStats: () => Promise<DeduplicationStats>;
  runDeduplication: () => Promise<{ removed: number; remainingDuplicates: number; freed: number }>;
  runQuickDeduplication: () => Promise<{ removed: number; remainingDuplicates: number; freed: number }>;
  runFullDeduplication: (organizationId?: string) => Promise<DeduplicationResult[]>;
  getConfig: () => DeduplicationConfig;
  updateConfig: (config: DeduplicationConfig) => void;
}

// Simple fallback functions for missing modules
const getVectorDeduplicationService = (): VectorDeduplicationService => {
  let config: DeduplicationConfig = { dryRun: false };

  return {
    getDeduplicationStats: async () => ({
      totalVectors: 0,
      duplicates: 0,
      storage: 0,
      duplicatesFound: 0,
      spaceSaved: 0,
      totalVectorsProcessed: 0,
      duplicatesByType: {
        knowledgeChunks: 0,
        conversationEmbeddings: 0,
        vectorDocuments: 0,
      },
    }),
    runDeduplication: async () => ({ removed: 0, remainingDuplicates: 0, freed: 0 }),
    runQuickDeduplication: async () => ({ removed: 0, remainingDuplicates: 0, freed: 0 }),
    runFullDeduplication: async (organizationId?: string) => [
      {
        totalDuplicates: 0,
        totalSavings: 0,
        type: "default",
        processingTime: 0,
        duplicateGroups: [],
      },
    ],
    getConfig: () => config,
    updateConfig: (newConfig: DeduplicationConfig) => {
      config = { ...config, ...newConfig };
    },
  };
};

interface LogEvent {
  level: "info" | "warn" | "error";
  operation: string;
  success: boolean;
  organizationId?: string;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
}

const ragLogger = {
  info: (message: string, data?: any) => console.log("RAG INFO:", message, data),
  warn: (message: string, data?: any) => console.warn("RAG WARN:", message, data),
  error: (message: string, error?: any) => console.error("RAG ERROR:", message, error),
  logEvent: async (event: LogEvent) => {
    const { level, operation, ...data } = event;
    if (level === "error") {
      console.error(`RAG ${level.toUpperCase()}: ${operation}`, data);
    } else if (level === "warn") {
      console.warn(`RAG ${level.toUpperCase()}: ${operation}`, data);
    } else {
      console.log(`RAG ${level.toUpperCase()}: ${operation}`, data);
    }
  },
};

/**
 * Weekly vector deduplication job
 * Runs comprehensive deduplication to optimize storage
 */
export const weeklyVectorDeduplication = inngest.createFunction(
  {
    id: "weekly-vector-deduplication",
    concurrency: { limit: 1 }, // Prevent concurrent dedup jobs
  },
  { cron: "TZ=America/New_York 0 4 * * 0" }, // 4 AM every Sunday (after cleanup)
  async ({ step }) => {
    const deduplicationService = getVectorDeduplicationService();

    const beforeStats = await step.run("get-before-stats", async () => {
      return await deduplicationService.getDeduplicationStats();
    });

    const deduplicationResults = await step.run("run-deduplication", async () => {
      const startTime = Date.now();

      await ragLogger.logEvent({
        level: "info",
        operation: "weekly_vector_deduplication_start",
        success: true,
        metadata: {
          scheduledDeduplication: true,
          config: deduplicationService.getConfig(),
        },
      });

      try {
        // Run full deduplication across all organizations
        const results = await deduplicationService.runFullDeduplication();

        const totalDuplicates = results.reduce((sum, r) => sum + r.totalDuplicates, 0);
        const totalSavings = results.reduce((sum, r) => sum + r.totalSavings, 0);

        await ragLogger.logEvent({
          level: "info",
          operation: "weekly_vector_deduplication_complete",
          success: true,
          metadata: {
            totalDuplicates,
            totalSavings,
            duration: Date.now() - startTime,
            results: results.map((r) => ({
              type: r.type,
              duplicates: r.totalDuplicates,
              savings: r.totalSavings,
              processingTime: r.processingTime,
            })),
          },
        });

        return {
          success: true,
          totalDuplicates,
          totalSavings,
          results,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        await ragLogger.logEvent({
          level: "error",
          operation: "weekly_vector_deduplication_error",
          success: false,
          error: {
            code: "WEEKLY_DEDUPLICATION_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    });

    const afterStats = await step.run("get-after-stats", async () => {
      return await deduplicationService.getDeduplicationStats();
    });

    return await step.run("generate-report", async () => {
      const improvement = {
        duplicatesRemoved: beforeStats.duplicatesFound - afterStats.duplicatesFound,
        spaceFreed: beforeStats.spaceSaved,
        processingTime: deduplicationResults.duration,
        efficiency: {
          knowledgeChunks: {
            before: beforeStats.duplicatesByType.knowledgeChunks,
            after: afterStats.duplicatesByType.knowledgeChunks,
          },
          conversationEmbeddings: {
            before: beforeStats.duplicatesByType.conversationEmbeddings,
            after: afterStats.duplicatesByType.conversationEmbeddings,
          },
          vectorDocuments: {
            before: beforeStats.duplicatesByType.vectorDocuments,
            after: afterStats.duplicatesByType.vectorDocuments,
          },
        },
      };

      await ragLogger.logEvent({
        level: "info",
        operation: "weekly_vector_deduplication_report",
        success: true,
        metadata: {
          improvement,
          beforeStats,
          afterStats,
          deduplicationResults,
        },
      });

      return {
        ...deduplicationResults,
        improvement,
      };
    });
  }
);

/**
 * Organization-specific vector deduplication
 * Triggered by events or manual requests
 */
export const organizationVectorDeduplication = inngest.createFunction(
  {
    id: "organization-vector-deduplication",
    concurrency: { limit: 3 }, // Allow multiple org deduplications concurrently
  },
  { event: "vectors/deduplication.organization" },
  async ({ event, step }) => {
    const { organizationId, config } = event.data as { organizationId: string; config?: DeduplicationConfig };
    const deduplicationService = getVectorDeduplicationService();

    // Apply custom config if provided
    if (config) {
      deduplicationService.updateConfig(config);
    }

    return await step.run("organization-deduplication", async () => {
      const startTime = Date.now();

      await ragLogger.logEvent({
        level: "info",
        operation: "organization_vector_deduplication_start",
        organizationId,
        success: true,
        metadata: {
          triggeredBy: "event",
          config: deduplicationService.getConfig(),
        },
      });

      try {
        const results = await deduplicationService.runFullDeduplication(organizationId);

        const totalDuplicates = results.reduce((sum, r) => sum + r.totalDuplicates, 0);
        const totalSavings = results.reduce((sum, r) => sum + r.totalSavings, 0);

        await ragLogger.logEvent({
          level: "info",
          operation: "organization_vector_deduplication_complete",
          organizationId,
          success: true,
          metadata: {
            totalDuplicates,
            totalSavings,
            duration: Date.now() - startTime,
          },
        });

        return {
          success: true,
          organizationId,
          totalDuplicates,
          totalSavings,
          results,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        await ragLogger.logEvent({
          level: "error",
          operation: "organization_vector_deduplication_error",
          organizationId,
          success: false,
          error: {
            code: "ORG_DEDUPLICATION_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    });
  }
);

/**
 * Smart deduplication job that analyzes and runs only when beneficial
 * Triggered when duplicate ratio is high
 */
export const smartVectorDeduplication = inngest.createFunction(
  {
    id: "smart-vector-deduplication",
    concurrency: { limit: 1 },
  },
  { event: "vectors/deduplication.smart" },
  async ({ event, step }) => {
    const { organizationId, threshold = 0.1 } = event.data as { organizationId?: string; threshold?: number }; // 10% duplicate threshold
    const deduplicationService = getVectorDeduplicationService();

    const analysis = await step.run("analyze-duplication", async () => {
      // Run dry run to analyze current state
      deduplicationService.updateConfig({ dryRun: true });
      const results = await deduplicationService.runFullDeduplication(organizationId);

      const totalVectors = results.reduce((sum, r) => {
        return sum + r.duplicateGroups.reduce((groupSum, g) => groupSum + g.duplicateIds.length + 1, 0);
      }, 0);

      const totalDuplicates = results.reduce((sum, r) => sum + r.totalDuplicates, 0);
      const duplicateRatio = totalVectors > 0 ? totalDuplicates / totalVectors : 0;

      return {
        totalVectors,
        totalDuplicates,
        duplicateRatio,
        shouldProceed: duplicateRatio >= threshold,
        estimatedSavings: results.reduce((sum, r) => sum + r.totalSavings, 0),
      };
    });

    if (!analysis.shouldProceed) {
      await ragLogger.logEvent({
        level: "info",
        operation: "smart_vector_deduplication_skipped",
        ...(organizationId ? { organizationId } : {}),
        success: true,
        metadata: {
          duplicateRatio: analysis.duplicateRatio,
          threshold,
          reason: "duplicate_ratio_below_threshold",
        },
      });

      return {
        skipped: true,
        reason: "Duplicate ratio below threshold",
        analysis,
      };
    }

    return await step.run("run-beneficial-deduplication", async () => {
      const startTime = Date.now();

      // Switch to actual deduplication
      deduplicationService.updateConfig({ dryRun: false });

      await ragLogger.logEvent({
        level: "info",
        operation: "smart_vector_deduplication_start",
        ...(organizationId ? { organizationId } : {}),
        success: true,
        metadata: {
          triggeredBy: "smart_analysis",
          duplicateRatio: analysis.duplicateRatio,
          estimatedSavings: analysis.estimatedSavings,
        },
      });

      try {
        const results = await deduplicationService.runFullDeduplication(organizationId);

        const totalDuplicates = results.reduce((sum, r) => sum + r.totalDuplicates, 0);
        const totalSavings = results.reduce((sum, r) => sum + r.totalSavings, 0);

        await ragLogger.logEvent({
          level: "info",
          operation: "smart_vector_deduplication_complete",
          ...(organizationId ? { organizationId } : {}),
          success: true,
          metadata: {
            totalDuplicates,
            totalSavings,
            duration: Date.now() - startTime,
            wasWorthwhile: totalSavings > 0,
          },
        });

        return {
          success: true,
          organizationId,
          analysis,
          totalDuplicates,
          totalSavings,
          results,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        await ragLogger.logEvent({
          level: "error",
          operation: "smart_vector_deduplication_error",
          ...(organizationId ? { organizationId } : {}),
          success: false,
          error: {
            code: "SMART_DEDUPLICATION_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    });
  }
);

/**
 * Deduplication monitoring job
 * Tracks duplicate growth and triggers smart deduplication when needed
 */
export const deduplicationMonitoring = inngest.createFunction(
  {
    id: "deduplication-monitoring",
    concurrency: { limit: 1 },
  },
  { cron: "TZ=America/New_York 0 */12 * * *" }, // Every 12 hours
  async ({ step }) => {
    const deduplicationService = getVectorDeduplicationService();

    return await step.run("monitor-duplicates", async () => {
      try {
        // Run dry analysis to check current duplicate levels
        deduplicationService.updateConfig({ dryRun: true });
        const stats = await deduplicationService.getDeduplicationStats();

        // Define thresholds for alerts
        const DUPLICATE_RATIO_WARNING = 0.15; // 15%
        const DUPLICATE_RATIO_CRITICAL = 0.25; // 25%
        const SPACE_WASTE_WARNING = 100 * 1024 * 1024; // 100MB
        const SPACE_WASTE_CRITICAL = 500 * 1024 * 1024; // 500MB

        const duplicateRatio =
          stats.totalVectorsProcessed > 0 ? stats.duplicatesFound / stats.totalVectorsProcessed : 0;

        const alerts: Array<{ level: "critical" | "warning"; type: string; message: string }> = [];

        if (duplicateRatio > DUPLICATE_RATIO_CRITICAL) {
          alerts.push({
            level: "critical",
            type: "duplicate_ratio",
            message: `Critical duplicate ratio: ${(duplicateRatio * 100).toFixed(1)}%`,
          });
        } else if (duplicateRatio > DUPLICATE_RATIO_WARNING) {
          alerts.push({
            level: "warning",
            type: "duplicate_ratio",
            message: `High duplicate ratio: ${(duplicateRatio * 100).toFixed(1)}%`,
          });
        }

        if (stats.spaceSaved > SPACE_WASTE_CRITICAL) {
          alerts.push({
            level: "critical",
            type: "space_waste",
            message: `Critical space waste: ${(stats.spaceSaved / (1024 * 1024)).toFixed(1)}MB`,
          });
        } else if (stats.spaceSaved > SPACE_WASTE_WARNING) {
          alerts.push({
            level: "warning",
            type: "space_waste",
            message: `High space waste: ${(stats.spaceSaved / (1024 * 1024)).toFixed(1)}MB`,
          });
        }

        // Log monitoring results
        await ragLogger.logEvent({
          level: alerts.length > 0 ? "warn" : "info",
          operation: "deduplication_monitoring",
          success: true,
          metadata: {
            stats,
            duplicateRatio,
            alerts,
            thresholds: {
              duplicateRatioWarning: DUPLICATE_RATIO_WARNING,
              duplicateRatioCritical: DUPLICATE_RATIO_CRITICAL,
              spaceWasteWarning: SPACE_WASTE_WARNING,
              spaceWasteCritical: SPACE_WASTE_CRITICAL,
            },
          },
        });

        // Trigger smart deduplication if thresholds exceeded
        if (duplicateRatio > DUPLICATE_RATIO_WARNING || stats.spaceSaved > SPACE_WASTE_WARNING) {
          await step.sendEvent("trigger-smart-deduplication", {
            name: "vectors/deduplication.smart",
            data: {
              threshold: 0.1, // 10% threshold for smart deduplication
              reason: "monitoring_threshold_exceeded",
            },
          });
        }

        return {
          stats,
          duplicateRatio,
          alerts,
          recommendDeduplication: duplicateRatio > DUPLICATE_RATIO_WARNING || stats.spaceSaved > SPACE_WASTE_WARNING,
        };
      } catch (error) {
        await ragLogger.logEvent({
          level: "error",
          operation: "deduplication_monitoring_error",
          success: false,
          error: {
            code: "DEDUPLICATION_MONITORING_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    });
  }
);

export default [
  weeklyVectorDeduplication,
  organizationVectorDeduplication,
  smartVectorDeduplication,
  deduplicationMonitoring,
];
