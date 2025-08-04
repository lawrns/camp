import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retryable } from "..";
import { sleep } from "../sleep";

describe("retryable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, "setTimeout");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should succeed on first attempt", async () => {
    const mockFn = vi.fn().mockResolvedValue("success");
    const retryableFn = retryable(mockFn);

    const result = await retryableFn();

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValue("success");

    const retryableFn = retryable(mockFn, { maxRetries: 3 });
    const promise = retryableFn();

    // Fast-forward through all timers
    vi.runAllTimers();

    const result = await promise;

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should respect maxRetries option", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Permanent failure"));

    const retryableFn = retryable(mockFn, {
      maxRetries: 2,
      initialDelayMs: 100,
    });

    const promise = retryableFn();

    // Fast-forward through all timers
    vi.runAllTimers();

    await expect(promise).rejects.toThrow("Permanent failure");
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should use exponential backoff with jitter", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Error 1"))
      .mockRejectedValueOnce(new Error("Error 2"))
      .mockResolvedValue("success");

    const retryableFn = retryable(mockFn, {
      maxRetries: 2,
      initialDelayMs: 100,
      factor: 2,
      jitter: true,
    });

    const promise = retryableFn();

    // First retry should be after ~100ms (with jitter)
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect((setTimeout as unknown).mock.calls[0][1]).toBeGreaterThanOrEqual(0);
    expect((setTimeout as unknown).mock.calls[0][1]).toBeLessThanOrEqual(100);

    // Fast-forward past first delay
    vi.advanceTimersByTime(100);

    // Second retry should be after ~200ms (100 * 2^1 with jitter)
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect((setTimeout as unknown).mock.calls[1][1]).toBeGreaterThanOrEqual(100);
    expect((setTimeout as unknown).mock.calls[1][1]).toBeLessThanOrEqual(300);

    // Fast-forward past second delay
    vi.advanceTimersByTime(300);

    const result = await promise;
    expect(result).toBe("success");
  });

  it("should call onRetry callback before each retry", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Error 1"))
      .mockRejectedValueOnce(new Error("Error 2"))
      .mockResolvedValue("success");

    const onRetry = vi.fn();

    const retryableFn = retryable(mockFn, {
      maxRetries: 2,
      initialDelayMs: 100,
      onRetry,
    });

    const promise = retryableFn();

    // Fast-forward through all timers
    vi.runAllTimers();

    await promise;

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry.mock.calls[0][0].message).toBe("Error 1");
    expect(onRetry.mock.calls[0][1]).toBe(1); // First retry attempt
    expect(onRetry.mock.calls[1][0].message).toBe("Error 2");
    expect(onRetry.mock.calls[1][1]).toBe(2); // Second retry attempt
  });
});

describe("retryable with custom options", () => {
  it("should use custom retry options", async () => {
    let attempts = 0;
    const testFn = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts <= 2) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return "success";
    });

    const retryableFn = retryable(testFn, {
      maxRetries: 3,
      initialDelayMs: 50,
      factor: 1.5,
      jitter: false,
    });

    const promise = retryableFn();
    vi.runAllTimers();

    const result = await promise;
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should respect jitter setting", async () => {
    const testFn = vi.fn().mockRejectedValue(new Error("Test error"));

    const retryableFn = retryable(testFn, {
      maxRetries: 1,
      initialDelayMs: 100,
      jitter: false,
    });

    const promise = retryableFn();

    // With jitter disabled, delay should be exactly 100ms
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);

    vi.runAllTimers();

    await expect(promise).rejects.toThrow("Test error");
  });
});
