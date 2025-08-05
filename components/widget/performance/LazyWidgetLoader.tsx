/**
 * Lazy Widget Loader - Advanced Dynamic Import System
 * 
 * Features:
 * - Core widget (<30KB) loads immediately
 * - Advanced features load on interaction
 * - Intelligent preloading based on user behavior
 * - Progressive enhancement for mobile
 * - Bundle splitting for edge deployment
 * - Skeleton loading states
 */

"use client";

import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

interface LoadingMetrics {
  componentName: string;
  loadTime: number;
  bundleSize?: number;
  cacheHit: boolean;
  timestamp: number;
}

class PerformanceTracker {
  private metrics: LoadingMetrics[] = [];
  private loadingStates = new Map<string, number>();

  startLoading(componentName: string): void {
    this.loadingStates.set(componentName, Date.now());
  }

  endLoading(componentName: string, cacheHit = false): void {
    const startTime = this.loadingStates.get(componentName);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      this.metrics.push({
        componentName,
        loadTime,
        cacheHit,
        timestamp: Date.now(),
      });
      this.loadingStates.delete(componentName);
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[LazyLoader] ${componentName} loaded in ${loadTime}ms (cache: ${cacheHit})`);
      }
    }
  }

  getMetrics(): LoadingMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(componentName?: string): number {
    const relevantMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.loadTime, 0);
    return totalTime / relevantMetrics.length;
  }
}

const performanceTracker = new PerformanceTracker();

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const ChatSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="flex items-center space-x-3">
      <div className="h-8 w-8 rounded-full bg-gray-200"></div>
      <div className="h-4 w-24 rounded bg-gray-200"></div>
    </div>
    <div className="space-y-2">
      <div className="h-16 rounded-lg bg-gray-200"></div>
      <div className="h-12 rounded-lg bg-gray-200"></div>
      <div className="h-20 rounded-lg bg-gray-200"></div>
    </div>
    <div className="flex items-center space-x-2">
      <div className="h-10 flex-1 rounded-lg bg-gray-200"></div>
      <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
    </div>
  </div>
);

const FAQSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="h-6 w-32 rounded bg-gray-200"></div>
    <div className="space-y-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-12 rounded-lg bg-gray-200"></div>
      ))}
    </div>
  </div>
);

const FileUploadSkeleton = () => (
  <div className="animate-pulse p-4">
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
      <div className="h-12 w-12 mx-auto rounded bg-gray-200 mb-4"></div>
      <div className="h-4 w-48 mx-auto rounded bg-gray-200 mb-2"></div>
      <div className="h-3 w-32 mx-auto rounded bg-gray-200"></div>
    </div>
  </div>
);

const EmojiPickerSkeleton = () => (
  <div className="animate-pulse p-4">
    <div className="grid grid-cols-8 gap-2">
      {Array.from({ length: 32 }).map((_, i) => (
        <div key={i} className="h-8 w-8 rounded bg-gray-200"></div>
      ))}
    </div>
  </div>
);

// ============================================================================
// LAZY COMPONENT DEFINITIONS
// ============================================================================

// Core chat interface - loads on widget open
const LazyChatInterface = dynamic(
  () => import('../features/ChatInterface').then(mod => {
    performanceTracker.endLoading('ChatInterface');
    return { default: mod.ChatInterface };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('ChatInterface');
      return <ChatSkeleton />;
    },
    ssr: false,
  }
);

// FAQ component - loads on tab switch
const LazyFAQComponent = dynamic(
  () => import('../features/FAQComponent').then(mod => {
    performanceTracker.endLoading('FAQComponent');
    return { default: mod.FAQComponent };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('FAQComponent');
      return <FAQSkeleton />;
    },
    ssr: false,
  }
);

// File upload - loads on interaction
const LazyFileUpload = dynamic(
  () => import('../features/FileUpload').then(mod => {
    performanceTracker.endLoading('FileUpload');
    return { default: mod.FileUpload };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('FileUpload');
      return <FileUploadSkeleton />;
    },
    ssr: false,
  }
);

// Emoji picker - loads on interaction
const LazyEmojiPicker = dynamic(
  () => import('../features/EmojiPicker').then(mod => {
    performanceTracker.endLoading('EmojiPicker');
    return { default: mod.EmojiPicker };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('EmojiPicker');
      return <EmojiPickerSkeleton />;
    },
    ssr: false,
  }
);

// AI handover - loads on demand
const LazyAIHandover = dynamic(
  () => import('../features/AIHandoverQueue').then(mod => {
    performanceTracker.endLoading('AIHandoverQueue');
    return { default: mod.AIHandoverQueue };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('AIHandoverQueue');
      return <div className="animate-pulse h-32 bg-gray-200 rounded-lg"></div>;
    },
    ssr: false,
  }
);

// Message reactions - loads on hover/interaction
const LazyMessageReactions = dynamic(
  () => import('../features/MessageReactions').then(mod => {
    performanceTracker.endLoading('MessageReactions');
    return { default: mod.MessageReactions };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('MessageReactions');
      return <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>;
    },
    ssr: false,
  }
);

// Rich text input - loads on focus
const LazyRichTextInput = dynamic(
  () => import('../features/RichTextInput').then(mod => {
    performanceTracker.endLoading('RichTextInput');
    return { default: mod.RichTextInput };
  }),
  {
    loading: () => {
      performanceTracker.startLoading('RichTextInput');
      return <div className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>;
    },
    ssr: false,
  }
);

// ============================================================================
// PRELOADING STRATEGIES
// ============================================================================

interface PreloadConfig {
  component: string;
  trigger: 'immediate' | 'interaction' | 'idle' | 'viewport' | 'hover';
  delay?: number;
  condition?: () => boolean;
}

const PRELOAD_STRATEGIES: PreloadConfig[] = [
  // Preload chat interface immediately after widget opens
  { component: 'ChatInterface', trigger: 'immediate' },
  
  // Preload FAQ when user hovers over FAQ tab
  { component: 'FAQComponent', trigger: 'hover', delay: 500 },
  
  // Preload file upload when user starts typing
  { component: 'FileUpload', trigger: 'interaction', delay: 1000 },
  
  // Preload emoji picker on idle after 3 seconds
  { component: 'EmojiPicker', trigger: 'idle', delay: 3000 },
  
  // Preload AI handover if conversation is active
  { 
    component: 'AIHandoverQueue', 
    trigger: 'idle', 
    delay: 5000,
    condition: () => typeof window !== 'undefined' && window.location.search.includes('ai=true')
  },
];

// ============================================================================
// INTELLIGENT PRELOADER
// ============================================================================

export function useIntelligentPreloader() {
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());

  const preloadComponent = useCallback(async (componentName: string) => {
    if (preloadedComponents.has(componentName)) return;

    try {
      performanceTracker.startLoading(componentName);
      
      switch (componentName) {
        case 'ChatInterface':
          await import('../features/ChatInterface');
          break;
        case 'FAQComponent':
          await import('../features/FAQComponent');
          break;
        case 'FileUpload':
          await import('../features/FileUpload');
          break;
        case 'EmojiPicker':
          await import('../features/EmojiPicker');
          break;
        case 'AIHandoverQueue':
          await import('../features/AIHandoverQueue');
          break;
        case 'MessageReactions':
          await import('../features/MessageReactions');
          break;
        case 'RichTextInput':
          await import('../features/RichTextInput');
          break;
      }
      
      performanceTracker.endLoading(componentName, true);
      setPreloadedComponents(prev => new Set([...prev, componentName]));
      
    } catch (error) {
      console.error(`[LazyLoader] Failed to preload ${componentName}:`, error);
    }
  }, [preloadedComponents]);

  useEffect(() => {
    // Set up preloading strategies
    PRELOAD_STRATEGIES.forEach(({ component, trigger, delay = 0, condition }) => {
      if (condition && !condition()) return;

      switch (trigger) {
        case 'immediate':
          setTimeout(() => preloadComponent(component), delay);
          break;
          
        case 'idle':
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              setTimeout(() => preloadComponent(component), delay);
            });
          } else {
            setTimeout(() => preloadComponent(component), delay + 1000);
          }
          break;
          
        case 'interaction':
          // Set up interaction listeners
          const handleInteraction = () => {
            setTimeout(() => preloadComponent(component), delay);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
          };
          
          document.addEventListener('click', handleInteraction, { once: true });
          document.addEventListener('keydown', handleInteraction, { once: true });
          break;
      }
    });
  }, [preloadComponent]);

  return { preloadComponent, preloadedComponents };
}

// ============================================================================
// BUNDLE SIZE MONITOR
// ============================================================================

export function useBundleSizeMonitor() {
  const [bundleMetrics, setBundleMetrics] = useState({
    coreSize: 0,
    totalSize: 0,
    loadedChunks: 0,
  });

  useEffect(() => {
    // Monitor bundle size using Performance API
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalSize = 0;
        let loadedChunks = 0;

        entries.forEach((entry: any) => {
          if (entry.name.includes('chunk') || entry.name.includes('widget')) {
            totalSize += entry.transferSize || 0;
            loadedChunks++;
          }
        });

        setBundleMetrics(prev => ({
          ...prev,
          totalSize: prev.totalSize + totalSize,
          loadedChunks: prev.loadedChunks + loadedChunks,
        }));
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);

  return bundleMetrics;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  LazyChatInterface,
  LazyFAQComponent,
  LazyFileUpload,
  LazyEmojiPicker,
  LazyAIHandover,
  LazyMessageReactions,
  LazyRichTextInput,
  performanceTracker,
};

export default {
  LazyChatInterface,
  LazyFAQComponent,
  LazyFileUpload,
  LazyEmojiPicker,
  LazyAIHandover,
  LazyMessageReactions,
  LazyRichTextInput,
  useIntelligentPreloader,
  useBundleSizeMonitor,
  performanceTracker,
};
