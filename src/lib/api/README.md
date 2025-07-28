# API Response Utilities

Standardized API response utilities for consistent communication across all Campfire API routes.

## Overview

The response utilities provide a unified way to create API responses that:

- Follow consistent structure using the `ApiResponse` interface
- Include proper HTTP status codes
- Handle validation errors gracefully
- Support pagination, rate limiting, and caching
- Integrate seamlessly with existing error handlers

## Quick Start

```typescript
import response from "@/lib/api/response";

// Success response
return response.ok({ user: { id: 1, name: "John" } });

// Error response
return response.notFound("User");

// Validation error
return response.validationError({
  email: ["Invalid email format"],
  password: ["Too short"],
});
```

## Response Types

### Success Responses

```typescript
// 200 OK - General success
response.ok(data, message?)

// 201 Created - Resource created
response.created(data, locationUrl?)

// 202 Accepted - Async operation started
response.accepted(data?, message?)

// 204 No Content - Success with no body
response.noContent()

// 200 OK - Resource updated
response.updated(data, message?)

// 200 OK - Resource deleted
response.deleted(message?)
```

### Error Responses

```typescript
// 400 Bad Request
response.badRequest(message)

// 401 Unauthorized
response.unauthorized(message?)

// 403 Forbidden
response.forbidden(message?)

// 404 Not Found
response.notFound(resourceName?)

// 409 Conflict
response.conflict(message)

// 422 Unprocessable Entity - Validation errors
response.validationError(errors)

// 500 Internal Server Error
response.serverError(message?)

// Custom error with status code
response.error(message, statusCode)
```

### Special Responses

```typescript
// Paginated response
response.paginated(items, page, limit, total);

// Response with metadata
response.withMeta(data, { version: "1.0", source: "api" });

// Rate-limited response
response.withRateLimit(data, limit, remaining, resetDate);

// Cached response
response.cached(data, maxAgeSeconds);
```

## Usage Patterns

### Basic API Route

```typescript
import { NextRequest } from "next/server";
import response from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return response.ok(data);
  } catch (error) {
    return response.serverError();
  }
}
```

### With Validation

```typescript
import { z } from "zod";
import response, { validateRequest, withResponseHandler } from "@/lib/api/response";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  return withResponseHandler(async () => {
    const body = await request.json();
    const data = validateRequest(body, schema);

    const user = await createUser(data);
    return response.created(user, `/api/users/${user.id}`);
  });
}
```

### With Pagination

```typescript
import response, { getPaginationParams } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const { page, limit, offset } = getPaginationParams(request);

  const { items, total } = await fetchItems({ offset, limit });

  return response.paginated(items, page, limit, total);
}
```

### With Tenant Guard

```typescript
import response, { withResponseHandler } from "@/lib/api/response";
import { withTenantGuard } from "@/lib/auth/tenant-guard";

export const GET = withTenantGuard(async (request, { organizationId }) => {
  return withResponseHandler(async () => {
    const data = await fetchOrgData(organizationId);
    return response.ok(data);
  });
});
```

## Helper Functions

### `withResponseHandler`

Wraps async handlers with automatic error handling:

- Catches and formats Zod validation errors
- Handles ApiError objects with proper status codes
- Logs errors for debugging
- Returns consistent error responses

### `validateRequest`

Validates request data against a Zod schema:

- Throws ZodError if validation fails
- Returns parsed and typed data if valid
- Integrates with `withResponseHandler` for automatic error formatting

### `getPaginationParams`

Extracts pagination parameters from request:

- Returns `page`, `limit`, and `offset`
- Enforces maximum limit of 100
- Provides sensible defaults (page: 1, limit: 20)

### `createError`

Creates standardized error objects:

```typescript
const error = createError("Resource not found", "NOT_FOUND", 404, { resourceId: 123 });
```

## Response Structure

All responses follow the `ApiResponse` interface:

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Additional fields for specific response types:

- Validation errors include `validation` field
- Paginated responses wrap data in `PaginatedResponse`
- Metadata responses include `meta` field

## Best Practices

1. **Always use response utilities** instead of raw `NextResponse.json()`
2. **Handle errors with `withResponseHandler`** for consistency
3. **Validate input with Zod schemas** and `validateRequest`
4. **Use appropriate status codes** for different scenarios
5. **Include helpful error messages** for debugging
6. **Add rate limiting headers** for public endpoints
7. **Cache static data** with appropriate max-age

## Integration with Existing Code

The response utilities complement the existing error handler:

- Use `ApiErrorHandler` for throwing errors
- Use response utilities for creating responses
- Both use the same `ApiError` interface
- Consistent error format across the application

## Examples

See `response.example.ts` for comprehensive usage examples covering:

- CRUD operations
- Validation handling
- Pagination
- Rate limiting
- Caching
- Async operations
- Complex error scenarios

## Testing

Run tests with:

```bash
npm test lib/api/__tests__/response.test.ts
```

The test suite covers all response types, helper functions, and edge cases.
