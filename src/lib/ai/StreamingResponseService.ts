/**
 * AI Streaming Response Service
 * Handles streaming AI responses with proper TypeScript types
 */

export interface StreamingMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  isComplete: boolean;
  tokenCount?: number;
  metadata?: {
    reasoning?: string;
    confidence?: number;
    tokensGenerated?: number;
    tool?: {
      name: string;
      parameters: Record<string, unknown>;
      result?: unknown;
    };
  };
}

export interface StreamingOptions {
  onMessage?: (message: StreamingMessage) => void;
  onComplete?: (finalMessage: StreamingMessage) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export class StreamingResponseService {
  private activeStreams = new Map<string, AbortController>();

  /**
   * Create a streaming response
   */
  async createStreamingResponse(prompt: string, options: StreamingOptions = {}): Promise<StreamingMessage> {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const controller = new AbortController();
    this.activeStreams.set(streamId, controller);

    const initialMessage: StreamingMessage = {
      id: streamId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isComplete: false,
    };

    try {
      // Mock streaming implementation
      // In a real implementation, this would connect to OpenAI or another AI service
      const chunks = this.simulateStreamingChunks(prompt);

      for (const chunk of chunks) {
        if (controller.signal.aborted) {
          throw new Error("Stream aborted");
        }

        initialMessage.content += chunk;
        options.onMessage?.(initialMessage);

        // Simulate delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      initialMessage.isComplete = true;
      options.onComplete?.(initialMessage);

      return initialMessage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      options.onError?.(new Error(`Streaming failed: ${errorMessage}`));
      throw error;
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Cancel a streaming response
   */
  cancelStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams(): void {
    for (const [streamId, controller] of this.activeStreams) {
      controller.abort();
    }
    this.activeStreams.clear();
  }

  /**
   * Simulate streaming chunks for demo purposes
   */
  private simulateStreamingChunks(prompt: string): string[] {
    const response = `Thank you for your message: "${prompt}". I'm here to help you with your question. Let me provide you with a detailed response that addresses your concerns.`;

    const words = response.split(" ");
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += 2) {
      const chunk = words.slice(i, i + 2).join(" ");
      chunks.push(chunk + (i + 2 < words.length ? " " : ""));
    }

    return chunks;
  }

  /**
   * Get active stream count
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Get active stream IDs
   */
  getActiveStreamIds(): string[] {
    return Array.from(this.activeStreams.keys());
  }
}

// Export singleton instance
export const streamingResponseService = new StreamingResponseService();
