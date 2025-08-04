/**
 * Widget Fallback Configuration
 * 
 * Centralized configuration for widget fallback behavior,
 * allowing fine-grained control over when and how widgets
 * fall back to different modes.
 */

export interface WidgetFallbackConfig {
  // Strategy selection
  strategy?: 'auto' | 'full' | 'reduced' | 'basic';

  // Network-based fallback
  enableNetworkFallback?: boolean;
  networkThresholds?: {
    slowConnectionTypes?: string[];
    verySlowConnectionTypes?: string[];
    minDownlinkMbps?: number;
  };

  // Error-based fallback
  enableErrorFallback?: boolean;
  errorFallbackRules?: {
    authErrors?: 'prompt' | 'fallback' | 'hide';
    networkErrors?: 'fallback' | 'retry' | 'hide';
    scriptErrors?: 'fallback' | 'retry' | 'hide';
    unknownErrors?: 'fallback' | 'hide';
  };

  // Auth context detection
  authFallback?: {
    enableWidgetAuth?: boolean;
    strictContextDetection?: boolean;
    dashboardExclusion?: boolean;
  };

  // Performance thresholds
  performanceThresholds?: {
    maxLoadTimeMs?: number;
    maxRetries?: number;
    fallbackDelayMs?: number;
  };

  // Debug options
  debug?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export const DEFAULT_FALLBACK_CONFIG: WidgetFallbackConfig = {
  strategy: 'auto',
  enableNetworkFallback: true,
  networkThresholds: {
    slowConnectionTypes: ['3g'],
    verySlowConnectionTypes: ['2g', 'slow-2g'],
    minDownlinkMbps: 1.5,
  },
  enableErrorFallback: true,
  errorFallbackRules: {
    authErrors: 'prompt',
    networkErrors: 'fallback',
    scriptErrors: 'fallback',
    unknownErrors: 'fallback',
  },
  authFallback: {
    enableWidgetAuth: true,
    strictContextDetection: true,
    dashboardExclusion: true,
  },
  performanceThresholds: {
    maxLoadTimeMs: 10000,
    maxRetries: 2,
    fallbackDelayMs: 1000,
  },
  debug: process.env.NODE_ENV === 'development',
  logLevel: 'warn',
};

/**
 * Determine widget strategy based on network conditions and config
 */
export function determineWidgetStrategy(
  networkInfo: { effectiveType?: string; downlink?: number; saveData?: boolean },
  config: WidgetFallbackConfig = DEFAULT_FALLBACK_CONFIG
): 'full' | 'reduced' | 'basic' {
  // Explicit strategy override
  if (config.strategy && config.strategy !== 'auto') {
    return config.strategy;
  }

  if (!config.enableNetworkFallback) {
    return 'full';
  }

  const { effectiveType, downlink, saveData } = networkInfo;
  const thresholds = config.networkThresholds || DEFAULT_FALLBACK_CONFIG.networkThresholds!;

  // Very slow connections
  if (thresholds.verySlowConnectionTypes?.includes(effectiveType || '')) {
    return 'basic';
  }

  // Slow connections or save data mode
  if (
    saveData ||
    thresholds.slowConnectionTypes?.includes(effectiveType || '') ||
    (downlink && downlink < (thresholds.minDownlinkMbps || 1.5))
  ) {
    return 'reduced';
  }

  return 'full';
}

/**
 * Determine fallback action based on error type and config
 */
export function determineFallbackAction(
  error: Error,
  currentStrategy: string,
  config: WidgetFallbackConfig = DEFAULT_FALLBACK_CONFIG
): 'prompt' | 'fallback' | 'retry' | 'hide' {
  if (!config.enableErrorFallback) {
    return 'hide';
  }

  const rules = config.errorFallbackRules || DEFAULT_FALLBACK_CONFIG.errorFallbackRules!;
  const errorMessage = error.message?.toLowerCase() || '';

  // Classify error type
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('auth')) {
    return rules.authErrors || 'prompt';
  }

  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return rules.networkErrors || 'fallback';
  }

  if (errorMessage.includes('script') || error.name === 'SyntaxError' || errorMessage.includes('load')) {
    return rules.scriptErrors || 'fallback';
  }

  return rules.unknownErrors || 'fallback';
}

/**
 * Check if widget authentication should be attempted
 */
export function shouldAttemptWidgetAuth(
  context: {
    pathname: string;
    search: string;
    hasWidgetConfig: boolean;
    hasWidgetElement: boolean;
    hasStoredOrgId: boolean;
  },
  config: WidgetFallbackConfig = DEFAULT_FALLBACK_CONFIG
): boolean {
  const authConfig = config.authFallback || DEFAULT_FALLBACK_CONFIG.authFallback!;

  if (!authConfig.enableWidgetAuth) {
    return false;
  }

  // Check for dashboard exclusion
  if (authConfig.dashboardExclusion) {
    const isDashboardContext =
      context.pathname.startsWith('/dashboard') ||
      context.pathname.startsWith('/login') ||
      context.pathname.startsWith('/register');

    if (isDashboardContext) {
      return false;
    }
  }

  // Check for widget context
  const hasWidgetContext =
    context.pathname.includes('/widget') ||
    context.search.includes('widget=true') ||
    context.search.includes('organizationId=') ||
    context.hasWidgetConfig ||
    context.hasWidgetElement ||
    context.hasStoredOrgId;

  if (authConfig.strictContextDetection) {
    return hasWidgetContext;
  }

  // Lenient detection - try widget auth if not explicitly dashboard
  return hasWidgetContext || !context.pathname.startsWith('/dashboard');
}

/**
 * Create a logger with configurable levels
 */
export function createFallbackLogger(config: WidgetFallbackConfig = DEFAULT_FALLBACK_CONFIG) {
  const logLevel = config.logLevel || 'warn';
  const debug = config.debug || false;

  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levels[logLevel];

  return {
    error: (message: string, ...args: unknown[]) => {
      if (currentLevel >= 0) {
        // Console logging disabled in production
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (currentLevel >= 1) {
        // Console logging disabled in production
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (currentLevel >= 2) {
        // Console logging disabled in production
      }
    },
    debug: (message: string, ...args: unknown[]) => {
      if (debug && currentLevel >= 3) {
        // Console logging disabled in production
      }
    },
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: Partial<WidgetFallbackConfig> = {}): WidgetFallbackConfig {
  return {
    ...DEFAULT_FALLBACK_CONFIG,
    ...userConfig,
    networkThresholds: {
      ...DEFAULT_FALLBACK_CONFIG.networkThresholds,
      ...userConfig.networkThresholds,
    },
    errorFallbackRules: {
      ...DEFAULT_FALLBACK_CONFIG.errorFallbackRules,
      ...userConfig.errorFallbackRules,
    },
    authFallback: {
      ...DEFAULT_FALLBACK_CONFIG.authFallback,
      ...userConfig.authFallback,
    },
    performanceThresholds: {
      ...DEFAULT_FALLBACK_CONFIG.performanceThresholds,
      ...userConfig.performanceThresholds,
    },
  };
}

/**
 * Global widget fallback configuration
 * Can be set by users to customize behavior
 */
declare global {
  interface Window {
    CampfireWidgetFallbackConfig?: Partial<WidgetFallbackConfig>;
  }
}

/**
 * Get effective configuration from global config and defaults
 */
export function getEffectiveConfig(): WidgetFallbackConfig {
  const globalConfig = typeof window !== 'undefined' ? window.CampfireWidgetFallbackConfig : {};
  return mergeConfig(globalConfig);
}
