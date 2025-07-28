import { createDataStreamResponse, DataStreamWriter, formatDataStreamPart, type TextStreamPart, type Tool } from "ai";

/**
 * Stream transformation utilities for AI responses
 */

// Interfaces for stream handling
export interface StreamHeaders {
  "Access-Control-Allow-Origin"?: string;
  "Access-Control-Allow-Headers"?: string;
  "Access-Control-Allow-Methods"?: string;
  [key: string]: string | undefined;
}

export interface StreamOptions {
  headers?: StreamHeaders;
  onError?: (error: unknown) => string;
}

export interface TextStreamOptions extends StreamOptions {
  messageId: string;
  text: string;
}

export interface StreamTransformOptions<TOOLS extends Record<string, Tool>> {
  tools: TOOLS;
}

/**
 * Creates a transform stream that filters out tool-result chunks from the stream
 * This is useful for hiding internal tool execution results from the client
 *
 * @returns A function that creates a TransformStream for filtering tool results
 */
export function hideToolResults<TOOLS extends Record<string, Tool>>(): (
  options: StreamTransformOptions<TOOLS>
) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>> {
  return () => {
    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        // Only pass through chunks that are not tool results
        if (chunk.type !== "tool-result") {
          controller.enqueue(chunk);
        }
      },
    });
  };
}

/**
 * Creates a data stream response with a simple text message
 * Includes proper CORS headers and message annotation
 *
 * @param text - The text content to stream
 * @param messageId - The ID of the message for annotation
 * @param options - Optional stream configuration
 * @returns A Response object with the streaming text
 */
export function createTextResponse(text: string, messageId: string, options?: Partial<StreamOptions>) {
  const defaultHeaders: StreamHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  return createDataStreamResponse({
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
    execute: (dataStream: unknown) => {
      const textStream = new ReadableStream({
        start(controller) {
          controller.enqueue(formatDataStreamPart("text", text));
          controller.close();
        },
      });

      dataStream.merge(textStream);
      dataStream.writeMessageAnnotation({
        id: messageId,
      });
    },
    onError: options?.onError,
  });
}

/**
 * Utility to write error data to a data stream
 *
 * @param dataStream - The data stream writer instance
 * @param error - The error to write
 * @param context - Additional context for the error
 */
export function writeStreamError(dataStream: DataStreamWriter, error: unknown, context?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Filter out undefined values to ensure JSONValue compatibility
  const errorData: Record<string, any> = {
    event: "error",
    message: errorMessage,
    timestamp: new Date().toISOString(),
  };

  if (errorStack !== undefined) {
    errorData.stack = errorStack;
  }

  if (context !== undefined) {
    errorData.context = context;
  }

  dataStream.writeData(errorData);
}

/**
 * Utility to write progress updates to a data stream
 *
 * @param dataStream - The data stream writer instance
 * @param progress - Progress information
 */
export function writeStreamProgress(
  dataStream: DataStreamWriter,
  progress: {
    stage: string;
    message?: string;
    percentage?: number;
    metadata?: Record<string, any>;
  }
) {
  // Filter out undefined values to ensure JSONValue compatibility
  const progressData: Record<string, any> = {
    event: "progress",
    stage: progress.stage,
    timestamp: new Date().toISOString(),
  };

  if (progress.message !== undefined) {
    progressData.message = progress.message;
  }

  if (progress.percentage !== undefined) {
    progressData.percentage = progress.percentage;
  }

  if (progress.metadata !== undefined) {
    progressData.metadata = progress.metadata;
  }

  dataStream.writeData(progressData);
}

/**
 * Creates a transform stream for handling stream timeouts
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param onTimeout - Callback when timeout occurs
 * @returns A TransformStream that implements timeout logic
 */
export function createTimeoutTransform<T>(timeoutMs: number, onTimeout?: () => void): TransformStream<T, T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const resetTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      onTimeout?.();
    }, timeoutMs);
  };

  return new TransformStream<T, T>({
    start() {
      resetTimeout();
    },
    transform(chunk, controller) {
      resetTimeout();
      controller.enqueue(chunk);
    },
    flush() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  });
}

/**
 * Creates a transform stream that buffers chunks until a delimiter is found
 * Useful for processing complete messages or lines
 *
 * @param delimiter - The delimiter to split on
 * @returns A TransformStream that buffers and splits on delimiter
 */
export function createDelimiterTransform(delimiter: string): TransformStream<string, string> {
  let buffer = "";

  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      const parts = buffer.split(delimiter);

      // Keep the last part in the buffer (might be incomplete)
      buffer = parts.pop() || "";

      // Enqueue all complete parts
      for (const part of parts) {
        if (part) {
          controller.enqueue(part);
        }
      }
    },
    flush(controller) {
      // Enqueue any remaining data in the buffer
      if (buffer) {
        controller.enqueue(buffer);
      }
    },
  });
}

/**
 * Default CORS headers for stream responses
 */
export const DEFAULT_STREAM_HEADERS: StreamHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Error handler that captures exceptions and returns a user-friendly message
 */
export function createStreamErrorHandler(
  captureException?: (error: unknown, context?: unknown) => void
): (error: unknown) => string {
  return (error: unknown) => {
    if (captureException) {
      captureException(error, { source: "stream-service" });
    } else {
    }

    return "An error occurred while processing your request. Please try again.";
  };
}
