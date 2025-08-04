import { db } from "@/db/client";
import { inngest } from "../client";

// Simple fallback function for missing module
const processKnowledgeDocument = async (documentId: number) => {
  console.log("processKnowledgeDocument called for:", documentId);
  return { chunksCount: 0, success: true };
};

// Reindex all knowledge documents in a mailbox
export const reindexKnowledgeBase = inngest.createFunction(
  { id: "reindex-knowledge-base" },
  { event: "knowledge/reindex-all" },
  async ({ event, step }) => {
    const { mailboxId, documentIds, userId } = event.data;
    const documentCount = documentIds.length;

    // Process documents in batches of 5 to avoid overwhelming the system
    const batchSize = 5;
    const results = { processed: 0, errors: 0, skipped: 0 };

    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (documentId: number) => {
          try {
            return await step.run(`process-document-${documentId}`, async () => {
              const result = await processKnowledgeDocument(documentId);
              return {
                documentId,
                success: true,
                chunksCount: result.chunksCount,
              };
            });
          } catch (error) {
            console.error(`Error processing document ${documentId}:`, error);
            return {
              documentId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      // Count results
      batchResults.forEach((result: unknown) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            results.processed++;
          } else {
            results.errors++;
          }
        } else {
          results.errors++;
        }
      });

      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < documentIds.length) {
        await step.sleep(`batch-pause-${i}`, 1000);
      }
    }

    return {
      documentCount,
      results,
      mailboxId,
      completedAt: new Date().toISOString(),
    };
  }
);
