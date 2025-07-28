/**
 * API Response Utilities - Test Suite
 */

import { describe, expect, it } from "@jest/globals";
import { z } from "zod";
import response, {
  ApiResponseBuilder,
  createError,
  getPaginationParams,
  HttpStatus,
  validateRequest,
  withResponseHandler,
} from "../response";

describe("ApiResponseBuilder", () => {
  describe("success responses", () => {
    it("should create a basic success response", () => {
      const data = { id: 1, name: "Test" };
      const result = ApiResponseBuilder.success(data);

      expect(result.status).toBe(HttpStatus.OK);
      const body = JSON.parse(result.body);
      expect(body).toEqual({
        success: true,
        data,
        message: undefined,
      });
    });

    it("should create a success response with message", () => {
      const data = { id: 1 };
      const message = "Operation successful";
      const result = ApiResponseBuilder.success(data, message);

      const body = JSON.parse(result.body);
      expect(body.message).toBe(message);
    });

    it("should create a created response with location header", () => {
      const data = { id: 1, name: "New Resource" };
      const location = "/api/resources/1";
      const result = ApiResponseBuilder.created(data, location);

      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.headers.get("Location")).toBe(location);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it("should create an accepted response", () => {
      const data = { taskId: "task-123" };
      const result = ApiResponseBuilder.accepted(data);

      expect(result.status).toBe(HttpStatus.ACCEPTED);
      const body = JSON.parse(result.body);
      expect(body.data).toEqual(data);
    });

    it("should create a no content response", () => {
      const result = ApiResponseBuilder.noContent();

      expect(result.status).toBe(HttpStatus.NO_CONTENT);
      expect(result.body).toBeNull();
    });
  });

  describe("error responses", () => {
    it("should create a basic error response", () => {
      const errorMessage = "Something went wrong";
      const result = ApiResponseBuilder.error(errorMessage);

      expect(result.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result.body);
      expect(body).toEqual({
        success: false,
        error: errorMessage,
        message: errorMessage,
      });
    });

    it("should create an error response with custom status", () => {
      const result = ApiResponseBuilder.error("Not found", HttpStatus.NOT_FOUND);

      expect(result.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("should create an error response from ApiError object", () => {
      const apiError = createError("Validation failed", "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
      const result = ApiResponseBuilder.error(apiError, apiError.statusCode);

      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      const body = JSON.parse(result.body);
      expect(body.error).toBe("Validation failed");
    });

    it("should include debug info in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const apiError = createError("Error", "ERROR_CODE", HttpStatus.BAD_REQUEST, { field: "test" });
      const result = ApiResponseBuilder.error(apiError);

      const body = JSON.parse(result.body);
      expect(body.debug).toBeDefined();
      expect(body.debug.code).toBe("ERROR_CODE");
      expect(body.debug.details).toEqual({ field: "test" });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("validation errors", () => {
    it("should format Zod validation errors", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const error = schema.safeParse({ email: "invalid", age: 10 }).error!;
      const result = ApiResponseBuilder.validationError(error);

      expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.validation).toBeDefined();
      expect(body.validation.email).toBeDefined();
      expect(body.validation.age).toBeDefined();
    });

    it("should handle string validation errors", () => {
      const result = ApiResponseBuilder.validationError("Invalid input");

      const body = JSON.parse(result.body);
      expect(body.validation.general).toEqual(["Invalid input"]);
    });

    it("should handle custom validation error objects", () => {
      const errors = {
        username: ["Too short", "Must be alphanumeric"],
        password: ["Required"],
      };
      const result = ApiResponseBuilder.validationError(errors);

      const body = JSON.parse(result.body);
      expect(body.validation).toEqual(errors);
    });
  });

  describe("paginated responses", () => {
    it("should create a paginated response", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = ApiResponseBuilder.paginated(items, 1, 10, 25);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual({
        data: items,
        page: 1,
        limit: 10,
        total: 25,
        hasMore: true,
      });
    });

    it("should correctly calculate hasMore", () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = ApiResponseBuilder.paginated(items, 3, 10, 25);

      const body = JSON.parse(result.body);
      expect(body.data.hasMore).toBe(false);
    });
  });

  describe("special responses", () => {
    it("should create response with metadata", () => {
      const data = { result: "success" };
      const meta = { version: "1.0", source: "api" };
      const result = ApiResponseBuilder.withMeta(data, meta);

      const body = JSON.parse(result.body);
      expect(body.data).toEqual(data);
      expect(body.meta.version).toBe("1.0");
      expect(body.meta.source).toBe("api");
      expect(body.meta.timestamp).toBeDefined();
    });

    it("should create response with rate limit headers", () => {
      const data = { message: "Rate limited response" };
      const reset = new Date(Date.now() + 3600000);
      const result = ApiResponseBuilder.withRateLimit(data, 100, 75, reset);

      expect(result.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(result.headers.get("X-RateLimit-Remaining")).toBe("75");
      expect(result.headers.get("X-RateLimit-Reset")).toBeDefined();
    });

    it("should create cached response", () => {
      const data = { cached: true };
      const result = ApiResponseBuilder.cached(data, 600);

      expect(result.headers.get("Cache-Control")).toBe("public, max-age=600, s-maxage=600");
    });
  });
});

describe("Convenience functions", () => {
  it("should provide shorthand success methods", () => {
    const data = { test: true };

    expect(response.ok(data)).toBeDefined();
    expect(response.created(data)).toBeDefined();
    expect(response.updated(data)).toBeDefined();
    expect(response.deleted()).toBeDefined();
  });

  it("should provide shorthand error methods", () => {
    expect(response.badRequest("Bad input")).toBeDefined();
    expect(response.unauthorized()).toBeDefined();
    expect(response.forbidden()).toBeDefined();
    expect(response.notFound()).toBeDefined();
    expect(response.conflict("Duplicate")).toBeDefined();
    expect(response.serverError()).toBeDefined();
  });
});

describe("Helper functions", () => {
  describe("validateRequest", () => {
    it("should validate and return parsed data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: "John", age: 30 };
      const result = validateRequest(data, schema);

      expect(result).toEqual(data);
    });

    it("should throw ZodError for invalid data", () => {
      const schema = z.object({
        email: z.string().email(),
      });

      expect(() => validateRequest({ email: "invalid" }, schema)).toThrow(z.ZodError);
    });
  });

  describe("getPaginationParams", () => {
    it("should extract pagination params from request", () => {
      const request = new Request("http://example.com/api?page=2&limit=50");
      const params = getPaginationParams(request);

      expect(params).toEqual({
        page: 2,
        limit: 50,
        offset: 50,
      });
    });

    it("should use default values", () => {
      const request = new Request("http://example.com/api");
      const params = getPaginationParams(request);

      expect(params).toEqual({
        page: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("should enforce max limit", () => {
      const request = new Request("http://example.com/api?limit=200");
      const params = getPaginationParams(request);

      expect(params.limit).toBe(100);
    });
  });

  describe("createError", () => {
    it("should create an ApiError object", () => {
      const error = createError("Test error", "TEST_CODE", HttpStatus.BAD_REQUEST, { field: "value" });

      expect(error).toEqual({
        message: "Test error",
        code: "TEST_CODE",
        statusCode: HttpStatus.BAD_REQUEST,
        details: { field: "value" },
      });
    });
  });

  describe("withResponseHandler", () => {
    it("should handle successful responses", async () => {
      const handler = async () => response.ok({ success: true });
      const result = await withResponseHandler(handler);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it("should handle ZodError", async () => {
      const schema = z.object({ required: z.string() });
      const handler = async () => {
        validateRequest({}, schema);
        return response.ok({});
      };

      const result = await withResponseHandler(handler);
      expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

      const body = JSON.parse(result.body);
      expect(body.validation).toBeDefined();
    });

    it("should handle ApiError", async () => {
      const handler = async () => {
        throw createError("Custom error", "CUSTOM", HttpStatus.CONFLICT);
      };

      const result = await withResponseHandler(handler);
      expect(result.status).toBe(HttpStatus.CONFLICT);

      const body = JSON.parse(result.body);
      expect(body.error).toBe("Custom error");
    });

    it("should handle generic errors", async () => {
      const handler = async () => {
        throw new Error("Generic error");
      };

      const result = await withResponseHandler(handler);
      expect(result.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

      const body = JSON.parse(result.body);
      expect(body.error).toBe("Generic error");
    });
  });
});
