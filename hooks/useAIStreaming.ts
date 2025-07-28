import { useCallback, useEffect, useRef, useState } from "react";

interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
  timestamp: Date;
  metadata?: {
    model: string;
    temperature: number;
    tokensGenerated?: number;
    finishReason?: string;
  };
}

interface StreamingOptions {
  conversationId: string;
  maxTokens?: number;
  temperature?: number;
  onChunk?: (chunk: string) => void;
  onComplete?: (message: StreamingMessage) => void;
  onError?: (error: string) => void;
}

interface UseAIStreamingReturn {
  sendMessage: (message: string, options?: Partial<StreamingOptions>) => Promise<void>;
  currentMessage: StreamingMessage | null;
  isStreaming: boolean;
  error: string | null;
  cancelStream: () => void;
}

export function useAIStreaming(): UseAIStreamingReturn {
  const [currentMessage, setCurrentMessage] = useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (message: string, options: Partial<StreamingOptions> = {}) => {
      if (isStreaming) {
        cancelStream();
      }

      setError(null);
      setIsStreaming(true);
      setCurrentMessage(null);

      const { conversationId = "default", maxTokens = 500, temperature = 0.7, onChunk, onComplete, onError } = options;

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Start the streaming request
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            message,
            maxTokens,
            temperature,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Check if response is SSE
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("text/event-stream")) {
          throw new Error("Expected SSE response but got: " + contentType);
        }

        // Handle Server-Sent Events manually
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No readable stream available");
        }

        let accumulatedContent = "";
        const messageId = `msg-${Date.now()}`;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                // Stream completed
                const finalMessage: StreamingMessage = {
                  id: messageId,
                  content: accumulatedContent,
                  isComplete: true,
                  timestamp: new Date(),
                };

                setCurrentMessage(finalMessage);
                onComplete?.(finalMessage);
                setIsStreaming(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.text) {
                  accumulatedContent += parsed.text;

                  const partialMessage: StreamingMessage = {
                    id: messageId,
                    content: accumulatedContent,
                    isComplete: false,
                    timestamp: new Date(),
                  };

                  setCurrentMessage(partialMessage);
                  onChunk?.(parsed.text);
                }
              } catch (parseError) {}
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown streaming error";

        setError(errorMessage);
        onError?.(errorMessage);
        setIsStreaming(false);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [isStreaming, cancelStream]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelStream();
    };
  }, [cancelStream]);

  return {
    sendMessage,
    currentMessage,
    isStreaming,
    error,
    cancelStream,
  };
}
