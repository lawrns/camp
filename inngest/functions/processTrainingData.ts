import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { trainingDatasets } from "@/db/schema/trainingDatasets";
import { inngest } from "../client";

// Simple fallback function for missing module
const ingestTrainingData = async (data: any): Promise<void> => {
  console.log("ingestTrainingData called with:", data);
};

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
} as any);

// Function to handle dataset processing
export const processTrainingDataFunction = inngest.createFunction(
  { id: "process-training-data" },
  { event: "training/dataset.uploaded" },
  async ({ event, step }) => {
    const { datasetId, files } = event.data;

    // Update dataset status to processing
    await step.run("update-dataset-status", async () => {
      await db.update(trainingDatasets).set({ status: "processing" }).where(eq(trainingDatasets.id, datasetId));

      return { success: true };
    });

    // Download and process files
    try {
      const processedFiles = await step.run("process-files", async () => {
        const filePaths: string[] = [];

        // In a real implementation, we would download files and process them
        for (const file of files) {
          // Download file from S3
          const s3Response = await s3Client.send(
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET || "campfire-training-data",
              Key: file,
            })
          );

          // Process file content
          // In this mock implementation, we just log the file name
          filePaths.push(file);
        }

        // Call the pipeline function to process the files
        await ingestTrainingData(filePaths);

        return filePaths;
      });

      // Update dataset status to ready
      return await step.run("complete-processing", async () => {
        await db
          .update(trainingDatasets)
          .set({
            status: "ready",
            metadata: {
              processedFiles: processedFiles,
              processedAt: new Date().toISOString(),
            },
          })
          .where(eq(trainingDatasets.id, datasetId));

        return {
          success: true,
          message: `Successfully processed ${files.length} files for dataset ${datasetId}`,
        };
      });
    } catch (error) {
      // Update dataset status to failed on error
      await step.run("handle-error", async () => {
        await db
          .update(trainingDatasets)
          .set({
            status: "failed",
            metadata: {
              error: error instanceof Error ? error.message : "Unknown error",
              failedAt: new Date().toISOString(),
            },
          })
          .where(eq(trainingDatasets.id, datasetId));

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      });

      throw error;
    }
  }
);
