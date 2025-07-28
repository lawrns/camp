import { NonRetriableError } from "inngest";
import { inngest } from "@/inngest/client";
import { createConversationEmbedding, PromptTooLongError } from "@/lib/ai/conversationEmbedding";
import { getConversationBySlug } from "@/lib/data/conversation";

const CONCURRENCY_LIMIT = 10;

export default inngest.createFunction(
  { id: "embedding-conversation", concurrency: CONCURRENCY_LIMIT, retries: 1 },
  { event: "conversations/embedding.create" },
  async ({ event, step }) => {
    const { conversationSlug } = event.data;

    const conversation = await step.run("create-embedding", async () => {
      const conversation = await getConversationBySlug(conversationSlug);
      if (!conversation) {
        throw new NonRetriableError("Conversation not found");
      }
      try {
        return await createConversationEmbedding(Number(conversation.id));
      } catch (error: unknown) {
        if (error instanceof PromptTooLongError) return { message: error.message };
        throw error;
      }
    });

    if ("status" in conversation && conversation.status === "open" && "id" in conversation) {
      await step.sendEvent("update-suggested-actions", {
        name: "conversations/update-suggested-actions",
        data: { conversationId: conversation.id as number },
      });
    }

    return { success: true };
  }
);
