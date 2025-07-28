/**
 * Assertion utilities
 */

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

export function assertDefined<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined");
  }
  return value;
}
