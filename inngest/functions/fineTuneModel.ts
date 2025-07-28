import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "@/db/client";
import { modelVersions, trainingDatasets } from "@/db/schema/trainingDatasets";
import { fineTuneModelPipeline } from "@/lib/model-training/pipeline";
import { inngest } from "../client";

// Function to handle model fine-tuning
export const fineTuneModelFunction = inngest.createFunction(
  { id: "fine-tune-model" },
  { event: "training/model.finetune" as const },
  async ({ event, step }) => {
    const { datasetId, baseModel = "gpt-3.5-turbo", trainingConfig = {} } = event.data;
    const numericDatasetId = typeof datasetId === "string" ? parseInt(datasetId, 10) : datasetId;

    // Get the dataset
    const dataset = await step.run("get-dataset", () => {
      return db.query.trainingDatasets.findFirst({
        where: (datasets, { eq }) => eq(datasets.id, numericDatasetId),
      });
    });

    if (!dataset) {
      throw new Error(`Dataset with ID ${numericDatasetId} not found`);
    }

    // Create a new model version
    const modelVersionId = await step.run("create-model-version", async () => {
      const result = await db
        .insert(modelVersions)
        .values({
          modelName: `${dataset.name}-${new Date().toISOString().split("T")[0]}`,
          version: "1.0.0",
          status: "training",
          baseModel,
          datasetId: numericDatasetId,
          metadata: trainingConfig as Record<string, unknown>,
        })
        .returning();

      return result[0]!.id;
    });

    // Trigger fine-tuning job
    try {
      await step.run("start-fine-tuning", async () => {
        // In a real implementation, this would communicate with OpenAI or another provider
        await fineTuneModelPipeline(
          numericDatasetId.toString(),
          [],
          baseModel,
          trainingConfig as Record<string, unknown>
        );

        return { success: true };
      });

      // Update model version status to ready (in reality, this would be done by a separate event when training completes)
      return await step.run("complete-fine-tuning", async () => {
        await db
          .update(modelVersions)
          .set({
            status: "ready",
            isActive: true,
            metadata: {
              completedAt: new Date().toISOString(),
              trainingTime: Math.floor(Math.random() * 3600), // Mock training time in seconds
              accuracy: 0.92 + Math.random() * 0.08, // Mock accuracy
            },
          })
          .where(eq(modelVersions.id, modelVersionId));

        return {
          success: true,
          modelVersionId,
          message: `Successfully fine-tuned model for dataset ${numericDatasetId}`,
        };
      });
    } catch (error) {
      // Update model version status to failed on error
      await step.run("handle-error", async () => {
        await db
          .update(modelVersions)
          .set({
            status: "failed",
            metadata: {
              error: error instanceof Error ? error.message : "Unknown error",
              failedAt: new Date().toISOString(),
            },
          })
          .where(eq(modelVersions.id, modelVersionId));

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      });

      throw error;
    }
  }
);
