/**
 * API Response Utilities
 * Standardized response helpers for API routes
 */

import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create an error API response
 */
export function createErrorResponse(error: string, status: number = 400, details?: unknown): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(errors: Record<string, string[]>): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: errors,
      timestamp: new Date().toISOString(),
    },
    { status: 422 }
  );
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(message?: string): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message || "Unauthorized",
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Create a not found response
 */
export function createNotFoundResponse(resource?: string): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: resource ? `${resource} not found` : "Resource not found",
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * Create an internal server error response
 */
export function createServerErrorResponse(error?: string): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: error || "Internal server error",
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {

  if (error instanceof Error) {
    return createServerErrorResponse(error.message);
  }

  return createServerErrorResponse("An unexpected error occurred");
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};

  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === "string" && !body[field].trim())) {
      errors[field] = [`${field} is required`];
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Extract organization ID from headers or body
 */
export function extractOrganizationId(request: Request, body?: Record<string, any>): string | null {
  // Try header first
  const headerOrgId = request.headers.get("X-Organization-ID");
  if (headerOrgId) return headerOrgId;

  // Try body
  if (body?.organizationId) return body.organizationId;
  if (body?.organization_id) return body.organization_id;

  return null;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<
  ApiResponse<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>
> {
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    message,
    timestamp: new Date().toISOString(),
  });
}
