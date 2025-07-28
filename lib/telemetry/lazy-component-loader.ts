/**
 * Lazy component loader for performance optimization
 */

import { ComponentType, lazy, LazyExoticComponent } from "react";

interface LazyLoadConfig {
  fallback?: ComponentType;
  retryCount?: number;
  retryDelay?: number;
  preload?: boolean;
}

interface ComponentMetadata {
  name: string;
  loadTime?: number;
  retryCount: number;
  lastError?: Error;
}

export class LazyComponentLoader {
  private static instance: LazyComponentLoader;
  private components = new Map<string, LazyExoticComponent<any>>();
  private metadata = new Map<string, ComponentMetadata>();
  private preloadPromises = new Map<string, Promise<any>>();

  static getInstance(): LazyComponentLoader {
    if (!LazyComponentLoader.instance) {
      LazyComponentLoader.instance = new LazyComponentLoader();
    }
    return LazyComponentLoader.instance;
  }

  loadComponent<T extends ComponentType<any>>(
    name: string,
    importFn: () => Promise<{ default: T }>,
    config: LazyLoadConfig = {}
  ): LazyExoticComponent<T> {
    if (this.components.has(name)) {
      return this.components.get(name) as LazyExoticComponent<T>;
    }

    const metadata: ComponentMetadata = {
      name,
      retryCount: 0,
    };

    const enhancedImportFn = async () => {
      const startTime = performance.now();

      try {
        const result = await this.retryImport(importFn, config.retryCount || 3, config.retryDelay || 1000);

        metadata.loadTime = performance.now() - startTime;
        metadata.retryCount = 0;

        this.metadata.set(name, metadata);

        return result;
      } catch (error) {
        metadata.lastError = error as Error;
        metadata.retryCount++;
        this.metadata.set(name, metadata);

        throw error;
      }
    };

    const lazyComponent = lazy(enhancedImportFn);
    this.components.set(name, lazyComponent);

    // Preload if requested
    if (config.preload) {
      this.preload(name, enhancedImportFn);
    }

    return lazyComponent;
  }

  private async retryImport<T>(importFn: () => Promise<T>, maxRetries: number, delay: number): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;

        if (i < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError!;
  }

  preload(name: string, importFn: () => Promise<any>): Promise<any> {
    if (this.preloadPromises.has(name)) {
      return this.preloadPromises.get(name)!;
    }

    const promise = importFn().catch((error) => {
      return null;
    });

    this.preloadPromises.set(name, promise);
    return promise;
  }

  // Preload critical components
  preloadCritical(): void {
    const criticalComponents = ["Chat", "MessageList", "ConversationList", "UserProfile"];

    criticalComponents.forEach((name) => {
      if (this.components.has(name)) {
        // Component already loaded, skip
        return;
      }

      // This would be implemented with actual import paths
    });
  }

  // Get loading statistics
  getStats() {
    const stats = {
      totalComponents: this.components.size,
      loadedComponents: 0,
      averageLoadTime: 0,
      failedComponents: 0,
      preloadedComponents: this.preloadPromises.size,
    };

    let totalLoadTime = 0;

    for (const metadata of this.metadata.values()) {
      if (metadata.loadTime) {
        stats.loadedComponents++;
        totalLoadTime += metadata.loadTime;
      }

      if (metadata.lastError) {
        stats.failedComponents++;
      }
    }

    stats.averageLoadTime = stats.loadedComponents > 0 ? totalLoadTime / stats.loadedComponents : 0;

    return stats;
  }

  // Clear all loaded components (for testing)
  clear(): void {
    this.components.clear();
    this.metadata.clear();
    this.preloadPromises.clear();
  }
}

// Utility functions for common lazy loading patterns
export function createLazyComponent<T extends ComponentType<any>>(
  name: string,
  importFn: () => Promise<{ default: T }>,
  config?: LazyLoadConfig
): LazyExoticComponent<T> {
  return LazyComponentLoader.getInstance().loadComponent(name, importFn, config);
}

export function preloadComponent(name: string, importFn: () => Promise<any>): Promise<any> {
  return LazyComponentLoader.getInstance().preload(name, importFn);
}

// Common lazy components
export const LazyComponents = {
  // Would be implemented with actual import paths
  Chat: createLazyComponent("Chat", () => import("@/components/chat/ChatView"), { preload: true }),
  MessageList: createLazyComponent("MessageList", () => import("@/components/inbox/MessagePanel/MessageList")),
  ConversationList: createLazyComponent(
    "ConversationList",
    () => import("@/components/InboxDashboard/sub-components/ConversationList")
  ),
  UserProfile: createLazyComponent("UserProfile", () => import("@/components/user/UserProfile")),
};

// Export singleton instance
export const lazyLoader = LazyComponentLoader.getInstance();
