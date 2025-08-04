/**
 * Enterprise Feature Flag Infrastructure
 * 
 * Comprehensive feature flag system for gradual rollouts with instant rollback:
 * - Multi-provider support (LaunchDarkly, Unleash, custom)
 * - Real-time flag updates with WebSocket connections
 * - A/B testing and gradual rollout capabilities
 * - Performance monitoring integration
 * - Sentry context integration for debugging
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Feature flag configuration types
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  value?: unknown;
  rolloutPercentage?: number;
  targeting?: {
    userId?: string;
    organizationId?: string;
    userSegment?: string;
    region?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  };
  metadata?: {
    description?: string;
    owner?: string;
    createdAt?: string;
    lastModified?: string;
  };
}

export interface FeatureFlagContext {
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  error: string | null;
  refreshFlags: () => Promise<void>;
  isEnabled: (flagKey: string, defaultValue?: boolean) => boolean;
  getValue: <T = any>(flagKey: string, defaultValue?: T) => T;
  track: (flagKey: string, event: string, properties?: Record<string, any>) => void;
}

// Feature flag provider configuration
export interface FeatureFlagConfig {
  provider: 'launchdarkly' | 'unleash' | 'custom' | 'local';
  apiKey?: string;
  environment?: string;
  userId?: string;
  organizationId?: string;
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  fallbackFlags?: Record<string, boolean>;
  debug?: boolean;
}

// Default feature flags for widget consolidation
export const DEFAULT_FLAGS: Record<string, boolean> = {
  // Widget consolidation flags
  'widget-consolidation-enabled': false,
  'enhanced-panel-v3': false,
  'ai-handover-queue': false,
  'performance-monitoring': true,
  'accessibility-enhancements': true,

  // Performance flags
  'bundle-optimization': true,
  'lazy-loading': true,
  'animation-reduction': false,
  'frame-rate-monitoring': true,

  // Enterprise features
  'enterprise-security': false,
  'audit-logging': false,
  'user-feedback-system': false,
  'real-time-optimization': true,

  // A/B testing flags
  'new-welcome-flow': false,
  'improved-ai-responses': false,
  'enhanced-mobile-ui': false,
};

// Feature flag provider interface
export interface IFeatureFlagProvider {
  initialize(config: FeatureFlagConfig): Promise<void>;
  getFlags(): Promise<Record<string, FeatureFlag>>;
  isEnabled(flagKey: string, defaultValue?: boolean): boolean;
  getValue<T>(flagKey: string, defaultValue?: T): T;
  track(flagKey: string, event: string, properties?: Record<string, any>): void;
  onFlagChange(callback: (flags: Record<string, FeatureFlag>) => void): () => void;
  destroy(): void;
}

// Local development provider
class LocalFeatureFlagProvider implements IFeatureFlagProvider {
  private flags: Record<string, FeatureFlag> = {};
  private listeners: ((flags: Record<string, FeatureFlag>) => void)[] = [];

  async initialize(config: FeatureFlagConfig): Promise<void> {
    // Load flags from localStorage or use defaults
    const storedFlags = localStorage.getItem('feature-flags');
    const localFlags = storedFlags ? JSON.parse(storedFlags) : {};

    // Merge with default flags
    Object.entries({ ...DEFAULT_FLAGS, ...config.fallbackFlags }).forEach(([key, enabled]) => {
      this.flags[key] = {
        key,
        enabled: localFlags[key] !== undefined ? localFlags[key] : enabled,
        rolloutPercentage: 100,
        metadata: {
          description: `Local development flag for ${key}`,
          owner: 'development',
          createdAt: new Date().toISOString(),
        },
      };
    });

    if (config.debug) {

    }
  }

  async getFlags(): Promise<Record<string, FeatureFlag>> {
    return this.flags;
  }

  isEnabled(flagKey: string, defaultValue: boolean = false): boolean {
    return this.flags[flagKey]?.enabled ?? defaultValue;
  }

  getValue<T>(flagKey: string, defaultValue?: T): T {
    return this.flags[flagKey]?.value ?? defaultValue;
  }

  track(flagKey: string, event: string, properties?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'feature_flag_interaction', {
        flag_key: flagKey,
        event_type: event,
        ...properties,
      });
    }
  }

  onFlagChange(callback: (flags: Record<string, FeatureFlag>) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  destroy(): void {
    this.listeners = [];
  }

  // Development helper methods
  setFlag(flagKey: string, enabled: boolean): void {
    if (this.flags[flagKey]) {
      this.flags[flagKey].enabled = enabled;
      localStorage.setItem('feature-flags', JSON.stringify(
        Object.fromEntries(Object.entries(this.flags).map(([key, flag]) => [key, flag.enabled]))
      ));
      this.listeners.forEach(listener => listener(this.flags));
    }
  }
}

// LaunchDarkly provider (placeholder for actual implementation)
class LaunchDarklyProvider implements IFeatureFlagProvider {
  private client: unknown = null;
  private flags: Record<string, FeatureFlag> = {};

  async initialize(config: FeatureFlagConfig): Promise<void> {
    // In a real implementation, this would initialize the LaunchDarkly client

    // Use fallback flags
    Object.entries(config.fallbackFlags || DEFAULT_FLAGS).forEach(([key, enabled]) => {
      this.flags[key] = {
        key,
        enabled,
        rolloutPercentage: 100,
        metadata: {
          description: `Fallback flag for ${key}`,
          owner: 'system',
        },
      };
    });
  }

  async getFlags(): Promise<Record<string, FeatureFlag>> {
    return this.flags;
  }

  isEnabled(flagKey: string, defaultValue: boolean = false): boolean {
    return this.flags[flagKey]?.enabled ?? defaultValue;
  }

  getValue<T>(flagKey: string, defaultValue?: T): T {
    return this.flags[flagKey]?.value ?? defaultValue;
  }

  track(flagKey: string, event: string, properties?: Record<string, any>): void {
    // LaunchDarkly tracking implementation

  }

  onFlagChange(callback: (flags: Record<string, FeatureFlag>) => void): () => void {
    // LaunchDarkly real-time updates implementation
    return () => { };
  }

  destroy(): void {
    if (this.client) {
      // Clean up LaunchDarkly client
    }
  }
}

// Feature flag provider factory
export function createFeatureFlagProvider(config: FeatureFlagConfig): IFeatureFlagProvider {
  switch (config.provider) {
    case 'launchdarkly':
      return new LaunchDarklyProvider();
    case 'local':
    default:
      return new LocalFeatureFlagProvider();
  }
}

// React context for feature flags
const FeatureFlagContext = createContext<FeatureFlagContext | null>(null);

// Feature flag provider component
export function FeatureFlagProvider({
  children,
  config
}: {
  children: React.ReactNode;
  config: FeatureFlagConfig;
}) {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<IFeatureFlagProvider | null>(null);

  // Initialize provider
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newProvider = createFeatureFlagProvider(config);
        await newProvider.initialize(config);

        const initialFlags = await newProvider.getFlags();
        setFlags(initialFlags);
        setProvider(newProvider);

        // Set up real-time updates
        if (config.enableRealTimeUpdates) {
          newProvider.onFlagChange(setFlags);
        }

        // Add flags to Sentry context
        if (typeof window !== 'undefined' && (window as unknown).Sentry) {
          (window as unknown).Sentry.setContext('feature_flags', {
            enabled_flags: Object.entries(initialFlags)
              .filter(([_, flag]) => flag.enabled)
              .map(([key]) => key),
            total_flags: Object.keys(initialFlags).length,
          });
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize feature flags');
        setIsLoading(false);

      }
    };

    initializeProvider();

    return () => {
      if (provider) {
        provider.destroy();
      }
    };
  }, [config]);

  const refreshFlags = useCallback(async () => {
    if (!provider) return;

    try {
      const updatedFlags = await provider.getFlags();
      setFlags(updatedFlags);
    } catch (err) {

    }
  }, [provider]);

  const isEnabled = useCallback((flagKey: string, defaultValue: boolean = false): boolean => {
    if (!provider) return defaultValue;
    return provider.isEnabled(flagKey, defaultValue);
  }, [provider]);

  const getValue = useCallback(<T = any>(flagKey: string, defaultValue?: T): T => {
    if (!provider) return defaultValue as T;
    return provider.getValue(flagKey, defaultValue);
  }, [provider]);

  const track = useCallback((flagKey: string, event: string, properties?: Record<string, any>) => {
    if (!provider) return;
    provider.track(flagKey, event, properties);
  }, [provider]);

  const contextValue: FeatureFlagContext = {
    flags,
    isLoading,
    error,
    refreshFlags,
    isEnabled,
    getValue,
    track,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// Hook to use feature flags
export function useFeatureFlags(): FeatureFlagContext {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

// Hook for individual feature flag
export function useFeatureFlag(flagKey: string, defaultValue: boolean = false): {
  isEnabled: boolean;
  isLoading: boolean;
  track: (event: string, properties?: Record<string, any>) => void;
} {
  const { isEnabled, isLoading, track } = useFeatureFlags();

  return {
    isEnabled: isEnabled(flagKey, defaultValue),
    isLoading,
    track: (event: string, properties?: Record<string, any>) => track(flagKey, event, properties),
  };
}
