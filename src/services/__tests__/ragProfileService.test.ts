import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { generateRagDraft, getRagProfile } from "../ragProfileService";

// Mock the database client
jest.mock("@/db/client", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    then: jest.fn(),
  },
}));

// Mock the database schemas
jest.mock("@/db/schema/ragProfiles", () => ({
  ragProfiles: {
    id: "id",
    name: "name",
    prompt: "prompt",
    threshold: "threshold",
    k: "k",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

jest.mock("@/db/schema/knowledgeChunks", () => ({
  knowledgeChunks: {
    content: "content",
  },
}));

jest.mock("@/db/schema/campfireMessages", () => ({
  campfireMessages: {
    sender: "sender",
    content: "content",
    channelId: "channel_id",
    createdAt: "created_at",
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  sql: jest.fn(),
}));

describe("ragProfileService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getRagProfile", () => {
    it("should retry on database failure and eventually succeed", async () => {
      const mockProfile = {
        id: "test-id",
        name: "Test Profile",
        prompt: "Test prompt",
        threshold: 0.7,
        k: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database to fail twice then succeed
      const { db } = await import("@/db/client");
      const mockThen = db.then as unknown;

      mockThen
        .mockRejectedValueOnce(new Error("Database connection failed"))
        .mockRejectedValueOnce(new Error("Database timeout"))
        .mockResolvedValue([mockProfile]);

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const promise = getRagProfile("test-id");

      // Fast-forward through retry delays
      jest.runAllTimers();

      const result = await promise;

      expect(result).toEqual(mockProfile);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith("getRagProfile retry attempt 1:", "Database connection failed");
      expect(consoleWarnSpy).toHaveBeenCalledWith("getRagProfile retry attempt 2:", "Database timeout");

      consoleWarnSpy.mockRestore();
    });

    it("should fail after max retries", async () => {
      const { db } = await import("@/db/client");
      const mockThen = db.then as unknown;

      // Mock database to always fail
      mockThen.mockRejectedValue(new Error("Persistent database error"));

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const promise = getRagProfile("test-id");

      // Fast-forward through all retry attempts
      jest.runAllTimers();

      await expect(promise).rejects.toThrow("Persistent database error");
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3); // maxRetries = 3

      consoleWarnSpy.mockRestore();
    });
  });

  describe("generateRagDraft", () => {
    it("should retry on failure and eventually succeed", async () => {
      const mockProfile = {
        id: "test-id",
        name: "Test Profile",
        prompt: "Test prompt",
        threshold: 0.7,
        k: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { db } = await import("@/db/client");
      const mockThen = db.then as unknown;

      // First call (getRagProfile) succeeds
      mockThen
        .mockResolvedValueOnce([mockProfile])
        // Second call (history) fails then succeeds
        .mockRejectedValueOnce(new Error("Database error"))
        .mockResolvedValueOnce([
          { sender: "user", content: "Hello" },
          { sender: "agent", content: "Hi there!" },
        ])
        // Third call (chunks) succeeds
        .mockResolvedValueOnce([{ content: "Knowledge chunk 1" }, { content: "Knowledge chunk 2" }]);

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const promise = generateRagDraft("channel-id", "profile-id", "mailbox-id");

      // Fast-forward through retry delays
      jest.runAllTimers();

      const result = await promise;

      expect(result).toContain("Test Profile");
      expect(result).toContain("Test prompt");
      expect(result).toContain("user: Hello");
      expect(result).toContain("Knowledge chunk 1");
      expect(consoleWarnSpy).toHaveBeenCalledWith("generateRagDraft retry attempt 1:", "Database error");

      consoleWarnSpy.mockRestore();
    });

    it("should fail if profile not found", async () => {
      const { db } = await import("@/db/client");
      const mockThen = db.then as unknown;

      // Mock getRagProfile to return null (profile not found)
      mockThen.mockResolvedValue([]);

      const promise = generateRagDraft("channel-id", "non-existent-id", "mailbox-id");

      jest.runAllTimers();

      await expect(promise).rejects.toThrow("RAG profile not found");
    });
  });
});
