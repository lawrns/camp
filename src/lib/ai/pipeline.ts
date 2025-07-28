// Improved pipeline for model training integration
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { modelVersions } from "@/db/schema/trainingDatasets";
import { inngest } from "@/inngest/client";

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

/**
 * Ingest and preprocess training data files.
 * @param paths Array of file paths in S3
 */
export async function ingestTrainingData(paths: string[]) {
  try {
    // Download files from S3
    const processedData: unknown[] = [];

    for (const path of paths) {
      try {
        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || "campfire-training-data",
            Key: path,
          })
        );

        // Read data from stream
        const bodyContents = await streamToString(response.Body);

        // Process data based on file type
        if (path.endsWith(".json")) {
          try {
            const jsonData = JSON.parse(bodyContents);
            processedData.push({
              type: "json",
              path,
              records: Array.isArray(jsonData) ? jsonData.length : 1,
              data: jsonData,
            });
          } catch (err) {
            processedData.push({
              type: "json",
              path,
              error: "Invalid JSON format",
            });
          }
        } else if (path.endsWith(".csv")) {
          // Mock CSV processing
          const lines = bodyContents.split("\n").filter((line: unknown) => line.trim());
          processedData.push({
            type: "csv",
            path,
            records: lines.length - 1, // Assuming first line is header
            sample: lines.slice(0, 2).join("\n"),
          });
        } else if (path.endsWith(".txt")) {
          processedData.push({
            type: "text",
            path,
            length: bodyContents.length,
            sample: bodyContents.substring(0, 100) + "...",
          });
        } else {
          processedData.push({
            type: "unknown",
            path,
            size: bodyContents.length,
          });
        }
      } catch (err) {
        processedData.push({
          path,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      processedFiles: paths.length,
      data: processedData,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Trigger model fine-tuning job with ingested data.
 * @param datasetId Identifier of the training dataset
 */
export async function fineTuneModel(datasetId: string) {
  try {
    // In a real implementation, this would communicate with OpenAI or another provider API
    // to start a fine-tuning job

    // For demonstration, we'll just queue an event to simulate the completion of training
    setTimeout(async () => {
      // Find the model version associated with this dataset
      const dataset = await db.query.trainingDatasets.findFirst({
        where: (datasets: any, { eq }: unknown) => eq(datasets.id, parseInt(datasetId)),
        with: {
          modelVersion: true,
        },
      });

      if (dataset?.modelVersionId) {
        // Update model version to ready
        await db
          .update(modelVersions)
          .set({
            status: "ready",
            isActive: true,
            metrics: {
              completedAt: new Date().toISOString(),
              trainingTime: Math.floor(Math.random() * 3600), // Mock training time in seconds
              accuracy: 0.92 + Math.random() * 0.08, // Mock accuracy
            },
          })
          .where(eq(modelVersions.id, dataset.modelVersionId));

        // Send event
        await inngest.send({
          name: "training/model.ready",
          data: {
            datasetId: parseInt(datasetId),
            modelVersionId: dataset.modelVersionId,
          },
        });
      }
    }, 10000); // Simulate 10-second training job

    return {
      success: true,
      message: `Fine-tuning job started for dataset ${datasetId}`,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List available custom model versions.
 */
export async function listModelVersions() {
  try {
    const versions = await db.query.modelVersions.findMany({
      orderBy: (versions: any, { desc }: unknown) => [desc(versions.createdAt)],
    });

    return versions;
  } catch (error) {
    return [];
  }
}

/**
 * Rollback to a previous model version.
 * @param versionId Identifier of the model version to rollback to
 */
export async function rollbackModel(versionId: string) {
  try {
    // First, deactivate all model versions
    await db.update(modelVersions).set({ isActive: false });

    // Then activate the specified version
    const updatedVersion = await db
      .update(modelVersions)
      .set({ isActive: true })
      .where(eq(modelVersions.id, parseInt(versionId, 10)))
      .returning();

    if (updatedVersion.length === 0) {
      throw new Error(`Model version ${versionId} not found`);
    }

    return {
      success: true,
      message: `Successfully rolled back to model version ${versionId}`,
      version: updatedVersion[0],
    };
  } catch (error) {
    throw error;
  }
}

// Helper function to convert a readable stream to a string
async function streamToString(stream: unknown): Promise<string> {
  if (!stream) return "";

  return new Promise((resolve, reject) => {
    const chunks: unknown[] = [];
    stream.on("data", (chunk: unknown) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
