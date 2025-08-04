/**
 * API Response Utilities
 * Standardized response helpers for consistent API communication
 * Complements the existing error handler with success responses
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiError, ApiResponse, PaginatedResponse } from "@/types/common";

/**
 * Standard HTTP status codes for different response types
 */
export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * Extended API response type with metadata
 */
export interface ApiResponseWithMeta<T = unknown> extends ApiResponse<T> {
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    [key: string]: unknown;
  };
}

/**
 * Response headers configuration
 */
export interface ResponseHeaders {
  "Content-Type"?: string;
  "Cache-Control"?: string;
  "X-Request-ID"?: string;
  "X-RateLimit-Limit"?: string;
  "X-RateLimit-Remaining"?: string;
  "X-RateLimit-Reset"?: string;
  [key: string]: string | undefined;
}

/**
 * Response options for customization
 */
export interface ResponseOptions {
  status?: HttpStatusCode;
  headers?: ResponseHeaders;
  meta?: Record<string, unknown>;
}

/**
 * Main API Response Builder Class
 */
export class ApiResponseBuilder {
  /**
   * Creates a successful response
   */
  static success<T>(data: T, message?: string, options: ResponseOptions = {}): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };

    if (message !== undefined) {
      response.message = message;
    }

    return NextResponse.json(response, {
      status: options.status || HttpStatus.OK,
      ...(options.headers ? { headers: options.headers as HeadersInit } : {}),
    });
  }

  /**
   * Creates an error response
   */
  static error(
    error: string | ApiError,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse> {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorCode = typeof error === "object" ? error.code : undefined;
    const errorDetails = typeof error === "object" ? error.details : undefined;

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };

    // Add error details in development
    if (process.env.NODE_ENV === "development" && (errorCode || errorDetails)) {
      (response as unknown).debug = {
        code: errorCode,
        details: errorDetails,
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    return NextResponse.json(response, {
      status: options.status || statusCode,
      ...(options.headers ? { headers: options.headers as HeadersInit } : {}),
    });
  }

  /**
   * Creates a validation error response
   */
  static validationError(
    errors: z.ZodError | Record<string, string[]> | string,
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse> {
    let formattedErrors: Record<string, string[]> = {};
    let message = "Validation failed";

    if (errors instanceof z.ZodError) {
      // Format Zod errors
      errors.errors.forEach((err: unknown) => {
        const path = err.path.join(".");
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(err.message);
      });
      message = "Request validation failed";
    } else if (typeof errors === "string") {
      formattedErrors.general = [errors];
      message = errors;
    } else {
      formattedErrors = errors;
    }

    const response: ApiResponse & { validation?: Record<string, string[]> } = {
      success: false,
      error: message,
      message,
      validation: formattedErrors,
    };

    return NextResponse.json(response, {
      status: options.status || HttpStatus.UNPROCESSABLE_ENTITY,
      ...(options.headers ? { headers: options.headers as HeadersInit } : {}),
    });
  }

  /**
   * Creates a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse<PaginatedResponse<T>>> {
    const paginatedData: PaginatedResponse<T> = {
      data,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };

    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      data: paginatedData,
    };

    return NextResponse.json(response, {
      status: options.status || HttpStatus.OK,
      ...(options.headers ? { headers: options.headers as HeadersInit } : {}),
    });
  }

  /**
   * Creates a no content response (204)
   */
  static noContent(options: ResponseOptions = {}): NextResponse {
    return new NextResponse(null, {
      status: options.status || HttpStatus.NO_CONTENT,
      ...(options.headers ? { headers: options.headers as HeadersInit } : {}),
    });
  }

  /**
   * Creates a created response (201)
   */
  static created<T>(data: T, location?: string, options: ResponseOptions = {}): NextResponse<ApiResponse<T>> {
    const headers: ResponseHeaders = {
      ...options.headers,
    };

    if (location) {
      headers.Location = location;
    }

    return this.success(data, "Resource created successfully", {
      ...options,
      status: HttpStatus.CREATED,
      headers,
    });
  }

  /**
   * Creates an accepted response (202)
   */
  static accepted<T>(
    data?: T,
    message = "Request accepted for processing",
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse<T>> {
    return this.success(data as T, message, {
      ...options,
      status: HttpStatus.ACCEPTED,
    });
  }

  /**
   * Creates a response with custom metadata
   */
  static withMeta<T>(
    data: T,
    meta: Record<string, unknown>,
    options: ResponseOptions = {}
  ): NextResponse<ApiResponseWithMeta<T>> {
    const response: ApiResponseWithMeta<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };

    return NextResponse.json(response, {
      status: options.status || HttpStatus.OK,
      ...(options.headers ? { headers: options.headers as HeadersInit } : {}),
    });
  }

  /**
   * Handles response with rate limiting headers
   */
  static withRateLimit<T>(
    data: T,
    limit: number,
    remaining: number,
    reset: Date,
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse<T>> {
    const headers: ResponseHeaders = {
      ...options.headers,
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": Math.floor(reset.getTime() / 1000).toString(),
    };

    return this.success(data, undefined, {
      ...options,
      headers,
    });
  }

  /**
   * Creates a cached response with cache headers
   */
  static cached<T>(
    data: T,
    maxAge: number = 300, // 5 minutes default
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse<T>> {
    const headers: ResponseHeaders = {
      ...options.headers,
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    };

    return this.success(data, undefined, {
      ...options,
      headers,
    });
  }

  /**
   * Creates a response for deleted resources
   */
  static deleted(message = "Resource deleted successfully", options: ResponseOptions = {}): NextResponse<ApiResponse> {
    return this.success(null, message, options);
  }

  /**
   * Creates a response for updated resources
   */
  static updated<T>(
    data: T,
    message = "Resource updated successfully",
    options: ResponseOptions = {}
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, options);
  }
}

/**
 * Convenience response functions
 */
export const response = {
  // Success responses
  ok: <T>(data: T, message?: string) => ApiResponseBuilder.success(data, message),
  created: <T>(data: T, location?: string) => ApiResponseBuilder.created(data, location),
  accepted: <T>(data?: T, message?: string) => ApiResponseBuilder.accepted(data, message),
  noContent: () => ApiResponseBuilder.noContent(),

  // Data responses
  success: <T>(data: T, message?: string) => ApiResponseBuilder.success(data, message),
  paginated: <T>(data: T[], page: number, limit: number, total: number) =>
    ApiResponseBuilder.paginated(data, page, limit, total),
  cached: <T>(data: T, maxAge?: number) => ApiResponseBuilder.cached(data, maxAge),

  // Update responses
  updated: <T>(data: T, message?: string) => ApiResponseBuilder.updated(data, message),
  deleted: (message?: string) => ApiResponseBuilder.deleted(message),

  // Error responses
  error: (error: string | ApiError, status?: HttpStatusCode) => ApiResponseBuilder.error(error, status),
  badRequest: (error: string) => ApiResponseBuilder.error(error, HttpStatus.BAD_REQUEST),
  unauthorized: (error = "Unauthorized") => ApiResponseBuilder.error(error, HttpStatus.UNAUTHORIZED),
  forbidden: (error = "Forbidden") => ApiResponseBuilder.error(error, HttpStatus.FORBIDDEN),
  notFound: (resource = "Resource") => ApiResponseBuilder.error(`${resource} not found`, HttpStatus.NOT_FOUND),
  conflict: (error: string) => ApiResponseBuilder.error(error, HttpStatus.CONFLICT),
  validationError: (errors: z.ZodError | Record<string, string[]> | string) =>
    ApiResponseBuilder.validationError(errors),
  serverError: (error = "Internal server error") => ApiResponseBuilder.error(error, HttpStatus.INTERNAL_SERVER_ERROR),

  // Special responses
  withMeta: <T>(data: T, meta: Record<string, unknown>) => ApiResponseBuilder.withMeta(data, meta),
  withRateLimit: <T>(data: T, limit: number, remaining: number, reset: Date) =>
    ApiResponseBuilder.withRateLimit(data, limit, remaining, reset),
};

/**
 * Response interceptor for consistent error handling
 */
export async function withResponseHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  errorMessage = "An error occurred"
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.validationError(error);
    }

    if (error instanceof Error) {
      const apiError = error as ApiError;
      return response.error(apiError.message || errorMessage, apiError.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return response.serverError(errorMessage);
  }
}

/**
 * Validation helper that throws formatted errors
 */
export function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error; // Will be caught by withResponseHandler
    }
    throw new Error("Validation failed");
  }
}

/**
 * Helper to extract pagination params from request
 */
export function getPaginationParams(request: Request): {
  page: number;
  limit: number;
  offset: number;
} {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Helper to create consistent error objects
 */
export function createError(
  message: string,
  code?: string,
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: unknown
): ApiError {
  const error: ApiError = {
    message,
    code,
    statusCode,
    details,
  };
  return error;
}

// Export types
export type { ApiResponse, ApiResponseWithMeta, ResponseOptions };

// Default export
export default response;
