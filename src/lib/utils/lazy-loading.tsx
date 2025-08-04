"use client";


import { ComponentType, lazy, LazyExoticComponent } from "react";

/**
 * Creates a lazy-loaded component with error boundary support
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {

      // Return a fallback component in case of error
      return {
        default: (() => React.createElement('div', { className: "spacing-4 text-center text-red-500" }, 'Failed to load component. Please refresh and try again.')) as unknown as T
      };
    }
  });
}

/**
 * Preloads a component module for better performance
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
): void {
  // Start loading the component in the background
  importFn().catch((error) => {

  });
}

/**
 * Creates a lazy component with preloading capability
 */
export function createLazyComponentWithPreload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = createLazyComponent(importFn);

  return {
    Component: LazyComponent,
    preload: () => preloadComponent(importFn)
  };
}

/**
 * Intersection Observer based lazy loading utility
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedComponents = new Set<string>();

  constructor(private options: IntersectionObserverInit = {}) {
    if (typeof window !== "undefined") {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: "50px",
          threshold: 0.1,
          ...options
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const componentId = entry.target.getAttribute("data-lazy-id");
        if (componentId && !this.loadedComponents.has(componentId)) {
          this.loadedComponents.add(componentId);
          const loadFn = (entry.target as unknown).__lazyLoadFn;
          if (loadFn) {
            loadFn();
          }
          this.observer?.unobserve(entry.target);
        }
      }
    });
  }

  observe(element: Element, componentId: string, loadFn: () => void) {
    if (this.observer) {
      element.setAttribute("data-lazy-id", componentId);
      (element as unknown).__lazyLoadFn = loadFn;
      this.observer.observe(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.loadedComponents.clear();
    }
  }
}

/**
 * Hook for viewport-based lazy loading
 */
export function useViewportLazyLoading(
  threshold = 0.1,
  rootMargin = "50px"
) {
  const lazyLoader = new LazyLoader({ threshold, rootMargin });

  return {
    observe: lazyLoader.observe.bind(lazyLoader),
    disconnect: lazyLoader.disconnect.bind(lazyLoader)
  };
}

/**
 * Utility to determine if a component should load based on user interaction
 */
export function shouldLoadOnInteraction(
  interactionType: "hover" | "click" | "focus" = "hover"
) {
  return (element: Element, loadFn: () => void) => {
    const handler = () => {
      loadFn();
      element.removeEventListener(interactionType, handler);
    };

    element.addEventListener(interactionType, handler, { once: true });
  };
}

/**
 * Bundle size tracking utility
 */
export class BundleTracker {
  private static loadTimes = new Map<string, number>();
  private static bundleSizes = new Map<string, number>();

  static trackComponentLoad(componentName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(componentName, loadTime);

    if (process.env.NODE_ENV === "development") {

    }
  }

  static getLoadTimes() {
    return new Map(this.loadTimes);
  }

  static trackBundleSize(componentName: string, size: number) {
    this.bundleSizes.set(componentName, size);
  }

  static getBundleSizes() {
    return new Map(this.bundleSizes);
  }

  static getPerformanceReport() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      bundleSizes: Object.fromEntries(this.bundleSizes),
      totalComponents: this.loadTimes.size,
      averageLoadTime: Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / this.loadTimes.size || 0
    };
  }
}