/**
 * RAG Service Error Types
 *
 * Comprehensive error handling system for RAG operations
 * Following the existing error patterns in the codebase
 */

export type RAGErrorCategory = "RETRIEVAL" | "GENERATION" | "VALIDATION" | "SYSTEM";

export interface RAGErrorOptions {
  code: string;
  category: RAGErrorCategory;
  retryable: boolean;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Base RAG Error class following the DataError pattern
 */
export class RAGError extends Error {
  public readonly code: string;
  public readonly category: RAGErrorCategory;
  public readonly retryable: boolean;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, options: RAGErrorOptions) {
    super(message);
    this.name = "RAGError";
    this.code = options.code;
    this.category = options.category;
    this.retryable = options.retryable;
    if (options.metadata !== undefined) {
      this.metadata = options.metadata;
    }
    this.cause = options.cause;
  }

  /**
   * Serialize error for logging
   */
  toJSON() {
    const result: {
      name: string;
      message: string;
      code: string;
      category: string;
      retryable: boolean;
      metadata?: Record<string, unknown>;
      stack?: string;
    } = {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      retryable: this.retryable,
    };
    if (this.metadata !== undefined) {
      result.metadata = this.metadata;
    }
    if (this.stack !== undefined) {
      result.stack = this.stack;
    }
    return result;
  }
}

/**
 * Specific error types for different RAG operations
 */
export class RAGRetrievalError extends RAGError {
  constructor(message: string, options: Omit<RAGErrorOptions, "category">) {
    super(message, { ...options, category: "RETRIEVAL" });
    this.name = "RAGRetrievalError";
  }
}

export class RAGGenerationError extends RAGError {
  constructor(message: string, options: Omit<RAGErrorOptions, "category">) {
    super(message, { ...options, category: "GENERATION" });
    this.name = "RAGGenerationError";
  }
}

export class RAGValidationError extends RAGError {
  constructor(message: string, options: Omit<RAGErrorOptions, "category">) {
    super(message, { ...options, category: "VALIDATION" });
    this.name = "RAGValidationError";
  }
}

export class RAGSystemError extends RAGError {
  constructor(message: string, options: Omit<RAGErrorOptions, "category">) {
    super(message, { ...options, category: "SYSTEM" });
    this.name = "RAGSystemError";
  }
}

/**
 * Error codes for different failure scenarios
 */
export const RAG_ERROR_CODES = {
  // Retrieval errors
  SEARCH_FAILED: "SEARCH_FAILED",
  EMBEDDING_FAILED: "EMBEDDING_FAILED",
  KNOWLEDGE_NOT_FOUND: "KNOWLEDGE_NOT_FOUND",
  VECTOR_SEARCH_ERROR: "VECTOR_SEARCH_ERROR",

  // Generation errors
  AI_RESPONSE_FAILED: "AI_RESPONSE_FAILED",
  CONTENT_GENERATION_ERROR: "CONTENT_GENERATION_ERROR",
  CONFIDENCE_CALCULATION_ERROR: "CONFIDENCE_CALCULATION_ERROR",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_CONFIDENCE_THRESHOLD: "INVALID_CONFIDENCE_THRESHOLD",

  // System errors
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Helper functions for creating specific errors
 */
export function createRetrievalError(
  message: string,
  code: string,
  metadata?: Record<string, unknown>
): RAGRetrievalError {
  const options: Omit<RAGErrorOptions, "category"> = {
    code,
    retryable: ["SEARCH_FAILED", "VECTOR_SEARCH_ERROR"].includes(code),
  };
  if (metadata !== undefined) {
    options.metadata = metadata;
  }
  return new RAGRetrievalError(message, options);
}

export function createGenerationError(
  message: string,
  code: string,
  metadata?: Record<string, unknown>
): RAGGenerationError {
  const options: Omit<RAGErrorOptions, "category"> = {
    code,
    retryable: ["AI_RESPONSE_FAILED"].includes(code),
  };
  if (metadata !== undefined) {
    options.metadata = metadata;
  }
  return new RAGGenerationError(message, options);
}

export function createValidationError(
  message: string,
  code: string,
  metadata?: Record<string, unknown>
): RAGValidationError {
  const options: Omit<RAGErrorOptions, "category"> = {
    code,
    retryable: false, // Validation errors are never retryable
  };
  if (metadata !== undefined) {
    options.metadata = metadata;
  }
  return new RAGValidationError(message, options);
}

export function createSystemError(message: string, code: string, metadata?: Record<string, unknown>): RAGSystemError {
  const options: Omit<RAGErrorOptions, "category"> = {
    code,
    retryable: ["SERVICE_UNAVAILABLE", "TIMEOUT"].includes(code),
  };
  if (metadata !== undefined) {
    options.metadata = metadata;
  }
  return new RAGSystemError(message, options);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RAGError) {
    return error.retryable;
  }
  return false;
}

/**
 * Extract error information for logging
 */
export function extractErrorInfo(error: unknown): {
  message: string;
  code: string;
  category: string;
  retryable: boolean;
  metadata?: Record<string, unknown>;
} {
  if (error instanceof RAGError) {
    const result: {
      message: string;
      code: string;
      category: string;
      retryable: boolean;
      metadata?: Record<string, unknown>;
    } = {
      message: error.message,
      code: error.code,
      category: error.category,
      retryable: error.retryable,
    };
    if (error.metadata !== undefined) {
      result.metadata = error.metadata;
    }
    return result;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: RAG_ERROR_CODES.UNKNOWN_ERROR,
      category: "SYSTEM",
      retryable: false,
    };
  }

  return {
    message: "Unknown error occurred",
    code: RAG_ERROR_CODES.UNKNOWN_ERROR,
    category: "SYSTEM",
    retryable: false,
    metadata: { originalError: error },
  };
}
