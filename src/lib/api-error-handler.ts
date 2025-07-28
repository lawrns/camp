/**
 * API Error Handler
 * Provides centralized error handling for API routes
 */

import { NextRequest, NextResponse } from "next/server";

export interface ApiError extends Error {
  statusCode: number;
  code?: string | undefined;
  details?: unknown;
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: unknown;
    timestamp: string;
    path?: string;
  };
}

export const ApiErrorHandler = {
  createError: (message: string, statusCode = 500, code?: string, details?: unknown): ApiError => {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    return error;
  },

  handleError: (error: unknown, request?: NextRequest): NextResponse<ErrorResponse> => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let code: string | undefined;
    let details: unknown;

    // Handle different error types
    if (error instanceof Error) {
      message = error.message;

      if ("statusCode" in error && typeof error.statusCode === "number") {
        statusCode = error.statusCode;
      }

      if ("code" in error && typeof error.code === "string") {
        code = error.code;
      }

      if ("details" in error) {
        details = error.details;
      }
    } else if (typeof error === "string") {
      message = error;
    }

    // Log error for debugging

    const errorObj: ErrorResponse["error"] = {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (code !== undefined) {
      errorObj.code = code;
    }

    if (process.env.NODE_ENV === "development" && details !== undefined) {
      errorObj.details = details;
    }

    if (request?.url !== undefined) {
      errorObj.path = request.url;
    }

    const errorResponse: ErrorResponse = {
      error: errorObj,
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  },

  withErrorHandling: async <T>(
    handler: () => Promise<T>,
    request?: NextRequest
  ): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      const result = await handler();
      return NextResponse.json(result);
    } catch (error) {
      return ApiErrorHandler.handleError(error, request);
    }
  },

  validateRequired: (data: Record<string, unknown>, fields: string[]): void => {
    const missing = fields.filter((field: string) => !data[field]);
    if (missing.length > 0) {
      throw ApiErrorHandler.createError(`Missing required fields: ${missing.join(", ")}`, 400, "MISSING_FIELDS", {
        missingFields: missing,
      });
    }
  },

  validateTypes: (data: Record<string, unknown>, schema: Record<string, string>): void => {
    for (const [field, expectedType] of Object.entries(schema)) {
      if (data[field] !== undefined && typeof data[field] !== expectedType) {
        throw ApiErrorHandler.createError(`Field '${field}' must be of type ${expectedType}`, 400, "INVALID_TYPE", {
          field,
          expectedType,
          actualType: typeof data[field],
        });
      }
    }
  },

  notFound: (resource = "Resource"): ApiError => {
    return ApiErrorHandler.createError(`${resource} not found`, 404, "NOT_FOUND");
  },

  unauthorized: (message = "Unauthorized"): ApiError => {
    return ApiErrorHandler.createError(message, 401, "UNAUTHORIZED");
  },

  forbidden: (message = "Forbidden"): ApiError => {
    return ApiErrorHandler.createError(message, 403, "FORBIDDEN");
  },

  badRequest: (message = "Bad Request", details?: unknown): ApiError => {
    return ApiErrorHandler.createError(message, 400, "BAD_REQUEST", details);
  },

  conflict: (message = "Conflict"): ApiError => {
    return ApiErrorHandler.createError(message, 409, "CONFLICT");
  },

  tooManyRequests: (message = "Too Many Requests"): ApiError => {
    return ApiErrorHandler.createError(message, 429, "TOO_MANY_REQUESTS");
  },

  internalError: (message = "Internal Server Error", details?: unknown): ApiError => {
    return ApiErrorHandler.createError(message, 500, "INTERNAL_ERROR", details);
  },
};

// Convenience functions for common error types
export const createApiError = ApiErrorHandler.createError;
export const handleApiError = ApiErrorHandler.handleError;
export const withErrorHandling = ApiErrorHandler.withErrorHandling;
export const validateRequired = ApiErrorHandler.validateRequired;
export const validateTypes = ApiErrorHandler.validateTypes;

// Common error creators
export const notFound = ApiErrorHandler.notFound;
export const unauthorized = ApiErrorHandler.unauthorized;
export const forbidden = ApiErrorHandler.forbidden;
export const badRequest = ApiErrorHandler.badRequest;
export const conflict = ApiErrorHandler.conflict;
export const tooManyRequests = ApiErrorHandler.tooManyRequests;
export const internalError = ApiErrorHandler.internalError;

// Default export
export default ApiErrorHandler;
