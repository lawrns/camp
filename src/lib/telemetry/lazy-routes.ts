/**
 * Lazy route loading for performance optimization
 */

import { ComponentType, lazy, LazyExoticComponent } from "react";

interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  priority?: "high" | "medium" | "low";
  dependencies?: string[];
}

interface RouteMetadata {
  path: string;
  loadTime?: number;
  accessCount: number;
  lastAccessed?: Date;
  preloaded: boolean;
}

export class LazyRouteLoader {
  private static instance: LazyRouteLoader;
  private routes = new Map<string, LazyExoticComponent<any>>();
  private metadata = new Map<string, RouteMetadata>();
  private preloadPromises = new Map<string, Promise<any>>();

  static getInstance(): LazyRouteLoader {
    if (!LazyRouteLoader.instance) {
      LazyRouteLoader.instance = new LazyRouteLoader();
    }
    return LazyRouteLoader.instance;
  }

  registerRoute(config: RouteConfig): LazyExoticComponent<any> {
    if (this.routes.has(config.path)) {
      return this.routes.get(config.path)!;
    }

    const metadata: RouteMetadata = {
      path: config.path,
      accessCount: 0,
      preloaded: false,
    };

    const enhancedImportFn = async () => {
      const startTime = performance.now();

      try {
        // Load dependencies first
        if (config.dependencies) {
          await Promise.all(config.dependencies.map((dep) => this.preloadRoute(dep)));
        }

        const result = await config.component();

        metadata.loadTime = performance.now() - startTime;
        metadata.accessCount++;
        metadata.lastAccessed = new Date();

        this.metadata.set(config.path, metadata);

        return result;
      } catch (error) {
        throw error;
      }
    };

    const lazyComponent = lazy(enhancedImportFn);
    this.routes.set(config.path, lazyComponent);

    // Preload if requested
    if (config.preload) {
      this.preloadRoute(config.path);
    }

    return lazyComponent;
  }

  async preloadRoute(path: string): Promise<void> {
    if (this.preloadPromises.has(path)) {
      return this.preloadPromises.get(path);
    }

    const metadata = this.metadata.get(path);
    if (metadata) {
      metadata.preloaded = true;
    }

    const promise = this.loadRouteComponent(path).catch((error) => {});

    this.preloadPromises.set(path, promise);
    return promise;
  }

  private async loadRouteComponent(path: string): Promise<any> {
    // This would typically trigger the lazy component loading
    // For now, we'll just mark it as preloaded

    return Promise.resolve();
  }

  // Preload routes based on priority
  preloadByPriority(priority: "high" | "medium" | "low"): void {
    const routesToPreload = this.getRoutesByPriority(priority);

    routesToPreload.forEach((path) => {
      this.preloadRoute(path);
    });
  }

  private getRoutesByPriority(priority: "high" | "medium" | "low"): string[] {
    // This would be implemented with actual route priority mapping
    const priorityRoutes = {
      high: ["/dashboard", "/dashboard/inbox", "/conversations"],
      medium: ["/settings", "/profile", "/team"],
      low: ["/analytics", "/integrations", "/admin"],
    };

    return priorityRoutes[priority] || [];
  }

  // Preload based on user behavior
  preloadBasedOnUsage(): void {
    const frequentRoutes = Array.from(this.metadata.entries())
      .filter(([, metadata]) => metadata.accessCount > 5)
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 5) // Top 5 most accessed
      .map(([path]) => path);

    frequentRoutes.forEach((path) => {
      this.preloadRoute(path);
    });
  }

  // Get route statistics
  getStats() {
    const stats = {
      totalRoutes: this.routes.size,
      preloadedRoutes: this.preloadPromises.size,
      averageLoadTime: 0,
      mostAccessedRoute: "",
      leastAccessedRoute: "",
      routesByPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };

    let totalLoadTime = 0;
    let loadedRoutes = 0;
    let maxAccess = 0;
    let minAccess = Infinity;

    for (const [path, metadata] of this.metadata.entries()) {
      if (metadata.loadTime) {
        totalLoadTime += metadata.loadTime;
        loadedRoutes++;
      }

      if (metadata.accessCount > maxAccess) {
        maxAccess = metadata.accessCount;
        stats.mostAccessedRoute = path;
      }

      if (metadata.accessCount < minAccess) {
        minAccess = metadata.accessCount;
        stats.leastAccessedRoute = path;
      }
    }

    stats.averageLoadTime = loadedRoutes > 0 ? totalLoadTime / loadedRoutes : 0;

    return stats;
  }

  // Clear all routes (for testing)
  clear(): void {
    this.routes.clear();
    this.metadata.clear();
    this.preloadPromises.clear();
  }
}

// Utility function to create lazy routes
export function createLazyRoute(config: RouteConfig): LazyExoticComponent<any> {
  return LazyRouteLoader.getInstance().registerRoute(config);
}

// Common route definitions
export const LazyRoutes = {
  Dashboard: createLazyRoute({
    path: "/dashboard",
    component: () => import("@/app/dashboard/page"),
    preload: true,
    priority: "high",
  }),

  Inbox: createLazyRoute({
    path: "/dashboard/inbox",
    component: () => import("@/app/dashboard/inbox/page"),
    preload: true,
    priority: "high",
  }),

  Settings: createLazyRoute({
    path: "/dashboard/settings",
    component: () => import("@/app/dashboard/settings/page"),
    priority: "medium",
  }),

  Analytics: createLazyRoute({
    path: "/dashboard/analytics",
    component: () => import("@/app/dashboard/analytics/page"),
    priority: "low",
  }),

  Team: createLazyRoute({
    path: "/dashboard/team",
    component: () => import("@/app/dashboard/team/page"),
    priority: "medium",
  }),
};

// Export singleton instance
export const lazyRouteLoader = LazyRouteLoader.getInstance();
