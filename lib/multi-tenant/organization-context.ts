/**
 * Multi-tenant Organization Context
 * Provides organization context and utilities for multi-tenant functionality
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "trial";
  createdAt: Date;
  updatedAt: Date;
  settings?: Record<string, unknown>;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "pending" | "suspended";
  joinedAt: Date;
}

export interface OrganizationContext {
  organization: Organization | null;
  members: OrganizationMember[];
  currentUserRole: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface OrganizationService {
  getCurrentOrganization(): Promise<Organization | null>;
  getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>;
  updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization>;
  getUserRole(orgId: string, userId: string): Promise<string | null>;
  switchOrganization(orgId: string): Promise<void>;
}

// Hook for accessing organization context
export function useOrganization() {
  // Stub implementation - returns mock data
  return {
    organization: {
      id: "org_default",
      name: "Default Organization",
      slug: "default",
      plan: "free" as const,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    members: [],
    currentUserRole: "admin",
    isLoading: false,
    error: null,
  };
}

export class OrganizationContextManager {
  private currentOrg: Organization | null = null;
  private members: OrganizationMember[] = [];
  private isLoading = false;

  async getCurrentOrganization(): Promise<Organization | null> {
    // Stub implementation
    if (!this.currentOrg) {
      this.currentOrg = {
        id: "org-1",
        name: "Default Organization",
        slug: "default-org",
        plan: "pro",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {},
      };
    }
    return this.currentOrg;
  }

  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    // Stub implementation
    if (this.members.length === 0) {
      this.members = [
        {
          id: "member-1",
          userId: "user-1",
          organizationId: orgId,
          role: "owner",
          status: "active",
          joinedAt: new Date(),
        },
      ];
    }
    return this.members;
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    // Stub implementation
    const current = await this.getCurrentOrganization();
    if (current && current.id === orgId) {
      this.currentOrg = { ...current, ...updates, updatedAt: new Date() };
      return this.currentOrg;
    }
    throw new Error("Organization not found");
  }

  async getUserRole(orgId: string, userId: string): Promise<string | null> {
    // Stub implementation
    const members = await this.getOrganizationMembers(orgId);
    const member = members.find((m) => m.userId === userId);
    return member?.role || null;
  }

  async switchOrganization(orgId: string): Promise<void> {
    // Stub implementation
    this.isLoading = true;
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.currentOrg = {
        id: orgId,
        name: `Organization ${orgId}`,
        slug: `org-${orgId}`,
        plan: "pro",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } finally {
      this.isLoading = false;
    }
  }

  getContext(): OrganizationContext {
    return {
      organization: this.currentOrg,
      members: this.members,
      currentUserRole: this.members[0]?.role || null,
      isLoading: this.isLoading,
      error: null,
    };
  }
}

// Default instance
export const organizationManager = new OrganizationContextManager();

// Utility functions
export function getOrganizationId(): string | null {
  // Stub implementation - get from current context
  return "org-1";
}

export function getOrganizationSlug(): string | null {
  // Stub implementation
  return "default-org";
}

export function isOrganizationOwner(role: string): boolean {
  return role === "owner";
}

export function isOrganizationAdmin(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canManageOrganization(role: string): boolean {
  return isOrganizationAdmin(role);
}

export function canInviteMembers(role: string): boolean {
  return isOrganizationAdmin(role);
}

// Legacy exports for compatibility
export const organizationContext = organizationManager;
export default organizationManager;
