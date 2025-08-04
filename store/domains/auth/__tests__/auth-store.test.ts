/**
 * Auth Store Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus } from "../../../event-bus";
import { useAuthStore } from "../auth-store";

// Mock event bus
vi.mock("../../../event-bus", () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe("AuthStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      organization: null,
      lastAuthCheck: null,
      authMethod: null,
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  describe("setAuth", () => {
    it("should set user and session", () => {
      const mockUser = { id: "user-123", email: "test@example.com" } as unknown;
      const mockSession = { access_token: "token-123" } as unknown;

      useAuthStore.getState().setAuth(mockUser, mockSession);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it("should emit auth:login event when user is set", () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: { organization_id: "org-123" },
      } as unknown;
      const mockSession = { access_token: "token-123" } as unknown;

      useAuthStore.getState().setAuth(mockUser, mockSession);

      expect(eventBus.emit).toHaveBeenCalledWith("auth:login", {
        source: "AuthStore",
        userId: "user-123",
        organizationId: "org-123",
        session: mockSession,
      });
    });

    it("should emit auth:logout event when user is null", () => {
      // First set a user
      const mockUser = { id: "user-123" } as unknown;
      useAuthStore.setState({ user: mockUser });

      // Then clear it
      useAuthStore.getState().setAuth(null, null);

      expect(eventBus.emit).toHaveBeenCalledWith("auth:logout", {
        source: "AuthStore",
        userId: "user-123",
      });
    });
  });

  describe("clearAuth", () => {
    it("should clear all auth state", () => {
      // Set some initial state
      useAuthStore.setState({
        user: { id: "user-123" } as unknown,
        session: { access_token: "token" } as unknown,
        isAuthenticated: true,
        organization: { id: "org-123", name: "Test Org", settings: {} },
      });

      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.session).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.organization).toBe(null);
    });

    it("should emit auth:clear event", () => {
      useAuthStore.setState({ user: { id: "user-123" } as unknown });

      useAuthStore.getState().clearAuth();

      expect(eventBus.emit).toHaveBeenCalledWith("auth:clear", {
        source: "AuthStore",
        userId: "user-123",
      });
    });
  });

  describe("organization actions", () => {
    it("should set organization", () => {
      const mockOrg = {
        id: "org-123",
        name: "Test Organization",
        settings: {
          aiEnabled: true,
          ragEnabled: false,
          autoHandoff: true,
        },
      };

      useAuthStore.getState().setOrganization(mockOrg);

      expect(useAuthStore.getState().organization).toEqual(mockOrg);
    });

    it("should update organization settings", () => {
      const mockOrg = {
        id: "org-123",
        name: "Test Organization",
        settings: {
          aiEnabled: true,
          ragEnabled: false,
          autoHandoff: true,
        },
      };

      useAuthStore.setState({ organization: mockOrg });

      useAuthStore.getState().updateOrganizationSettings({
        aiEnabled: false,
        newFeature: true,
      });

      const state = useAuthStore.getState();
      expect(state.organization?.settings.aiEnabled).toBe(false);
      expect(state.organization?.settings.ragEnabled).toBe(false);
      expect(state.organization?.settings.newFeature).toBe(true);
    });
  });

  describe("convenience hooks", () => {
    it("should return correct values from selectors", () => {
      const mockUser = { id: "user-123", email: "test@example.com" } as unknown;
      const mockOrg = { id: "org-123", name: "Test Org", settings: {} };

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        organization: mockOrg,
        error: "Test error",
      });

      const state = useAuthStore.getState();

      // Test selectors
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.organization).toEqual(mockOrg);
      expect(state.error).toBe("Test error");
    });
  });
});
