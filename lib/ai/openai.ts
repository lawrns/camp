import OpenAI from "openai";

// Initialize OpenAI client with lazy loading
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    try {
      _openai = new OpenAI({ apiKey });
    } catch (error) {
      throw error;
    }
  }
  return _openai;
}

export const openai = getOpenAIClient;

// Helper functions for common OpenAI operations
export const openaiService = {
  /**
   * Generate chat completion
   */
  createChatCompletion: async (messages: OpenAI.ChatCompletionMessageParam[], model = "gpt-3.5-turbo") => {
    try {
      const client = getOpenAIClient();
      const startTime = Date.now();

      const completion = await client.chat.completions.create({
        model,
        messages,
      });

      const duration = Date.now() - startTime;
      return completion;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generate embeddings
   */
  createEmbedding: async (text: string, model = "text-embedding-ada-002") => {
    try {
      const client = getOpenAIClient();
      const embedding = await client.embeddings.create({
        model,
        input: text,
      });
      return embedding;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create fine-tuning job
   */
  createFineTuningJob: async (trainingFileId: string, model = "gpt-3.5-turbo") => {
    try {
      const client = getOpenAIClient();
      const job = await client.fineTuning.jobs.create({
        training_file: trainingFileId,
        model,
      });
      return job;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload file for fine-tuning
   */
  uploadFile: async (file: File, purpose = "fine-tune") => {
    try {
      const client = getOpenAIClient();
      const upload = await client.files.create({
        file,
        purpose,
      });
      return upload;
    } catch (error) {
      throw error;
    }
  },
};

// Default export for compatibility
export default getOpenAIClient;
