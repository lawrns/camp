/**
 * Widget API Key Service
 * Manages widget authentication and API key functionality
 */

export interface WidgetApiKey {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  hashedKey: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateApiKeyRequest {
  organizationId: string;
  name: string;
  permissions?: string[];
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  isActive?: boolean;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export class WidgetApiKeyService {
  private apiKeys: Map<string, WidgetApiKey> = new Map();

  async createApiKey(request: CreateApiKeyRequest): Promise<WidgetApiKey> {
    const keyId = this.generateKeyId();
    const apiKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(apiKey);
    const now = new Date();

    const widgetApiKey: WidgetApiKey = {
      id: keyId,
      organizationId: request.organizationId,
      name: request.name,
      key: apiKey,
      hashedKey,
      permissions: request.permissions || ["widget:read", "widget:write"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(request.expiresAt && { expiresAt: request.expiresAt }),
      metadata: request.metadata || {},
    };

    this.apiKeys.set(keyId, widgetApiKey);
    return widgetApiKey;
  }

  async getApiKey(keyId: string): Promise<WidgetApiKey | null> {
    return this.apiKeys.get(keyId) || null;
  }

  async getApiKeyByKey(apiKey: string): Promise<WidgetApiKey | null> {
    const hashedKey = this.hashApiKey(apiKey);
    return Array.from(this.apiKeys.values()).find((key) => key.hashedKey === hashedKey) || null;
  }

  async getApiKeysByOrganization(organizationId: string): Promise<WidgetApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter((key: unknown) => key.organizationId === organizationId)
      .map((key: unknown) => ({ ...key, key: "***" })); // Hide actual key in list
  }

  async updateApiKey(keyId: string, request: UpdateApiKeyRequest): Promise<WidgetApiKey | null> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return null;

    const updatedApiKey: WidgetApiKey = {
      ...apiKey,
      ...request,
      updatedAt: new Date(),
    };

    this.apiKeys.set(keyId, updatedApiKey);
    return { ...updatedApiKey, key: "***" }; // Hide actual key
  }

  async deleteApiKey(keyId: string): Promise<boolean> {
    return this.apiKeys.delete(keyId);
  }

  async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    key?: WidgetApiKey;
    error?: string;
  }> {
    const key = await this.getApiKeyByKey(apiKey);

    if (!key) {
      return { valid: false, error: "Invalid API key" };
    }

    if (!key.isActive) {
      return { valid: false, error: "API key is inactive" };
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Update last used timestamp
    key.lastUsedAt = new Date();
    this.apiKeys.set(key.id, key);

    return { valid: true, key };
  }

  async regenerateApiKey(keyId: string): Promise<WidgetApiKey | null> {
    const existingKey = this.apiKeys.get(keyId);
    if (!existingKey) return null;

    const newApiKey = this.generateApiKey();
    const hashedKey = this.hashApiKey(newApiKey);

    const updatedKey: WidgetApiKey = {
      ...existingKey,
      key: newApiKey,
      hashedKey,
      updatedAt: new Date(),
    };

    this.apiKeys.set(keyId, updatedKey);
    return updatedKey;
  }

  async revokeApiKey(keyId: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;

    apiKey.isActive = false;
    apiKey.updatedAt = new Date();
    return true;
  }

  async getApiKeyUsageStats(keyId: string): Promise<{
    totalRequests: number;
    requestsToday: number;
    requestsThisWeek: number;
    requestsThisMonth: number;
    lastUsedAt?: Date;
    averageRequestsPerDay: number;
  } | null> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return null;

    // Simulate usage stats
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalRequests: Math.floor(Math.random() * 10000),
      requestsToday: Math.floor(Math.random() * 100),
      requestsThisWeek: Math.floor(Math.random() * 500),
      requestsThisMonth: Math.floor(Math.random() * 2000),
      ...(apiKey.lastUsedAt && { lastUsedAt: apiKey.lastUsedAt }),
      averageRequestsPerDay: Math.floor(Math.random() * 50),
    };
  }

  private generateKeyId(): string {
    return `wak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateApiKey(): string {
    const prefix = "wapi_";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = prefix;

    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  private hashApiKey(apiKey: string): string {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash function
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Default instance
export const widgetApiKeyService = new WidgetApiKeyService();

// Utility functions
export async function createWidgetApiKey(request: CreateApiKeyRequest): Promise<WidgetApiKey> {
  return widgetApiKeyService.createApiKey(request);
}

export async function validateWidgetApiKey(apiKey: string): Promise<{
  valid: boolean;
  key?: WidgetApiKey;
  error?: string;
}> {
  return widgetApiKeyService.validateApiKey(apiKey);
}

export async function getWidgetApiKeysByOrganization(organizationId: string): Promise<WidgetApiKey[]> {
  return widgetApiKeyService.getApiKeysByOrganization(organizationId);
}

export async function regenerateWidgetApiKey(keyId: string): Promise<WidgetApiKey | null> {
  return widgetApiKeyService.regenerateApiKey(keyId);
}

// Additional exports for widget configuration
export async function getWidgetApiKeyInfo(organizationId: string): Promise<{
  enabled: boolean;
  apiKey?: string | undefined;
  lastUpdated?: Date | undefined;
}> {
  const keys = await widgetApiKeyService.getApiKeysByOrganization(organizationId);
  const activeKey = keys.find((key) => key.isActive);

  return {
    enabled: !!activeKey,
    apiKey: activeKey?.key !== undefined ? activeKey.key : undefined,
    lastUpdated: activeKey?.updatedAt !== undefined ? activeKey.updatedAt : undefined,
  };
}

export async function setWidgetEnabled(
  organizationId: string,
  enabled: boolean
): Promise<{
  success: boolean;
  apiKey?: string;
  error?: string;
}> {
  if (enabled) {
    // Create a new API key if enabling
    const apiKey = await widgetApiKeyService.createApiKey({
      organizationId,
      name: "Default Widget Key",
      permissions: ["widget:read", "widget:write"],
    });

    return {
      success: true,
      apiKey: apiKey.key,
    };
  } else {
    // Revoke all active keys if disabling
    const keys = await widgetApiKeyService.getApiKeysByOrganization(organizationId);
    for (const key of keys) {
      if (key.isActive) {
        await widgetApiKeyService.revokeApiKey(key.id);
      }
    }

    return {
      success: true,
    };
  }
}
