/**
 * Human-like AI Mode Helper Functions
 *
 * Runtime utilities for checking and managing human-like AI behavior
 * with organization-specific overrides and feature flag integration.
 */

import { FEATURE_FLAGS, HUMAN_AI_CONFIG, type FeatureContext } from "@/app/config/features";
import { supabase } from "@/lib/supabase";
import { phraseFilter } from "./phrase-filter";

/**
 * Cache for organization human-like AI settings to reduce database calls
 */
const orgSettingsCache = new Map<string, { enabled: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if human-like AI is enabled for a specific organization
 */
export async function isHumanAIModeEnabled(organizationId: string): Promise<boolean> {
  // Base feature flag check
  if (!FEATURE_FLAGS.RAG_HUMAN_MODE) {
    return false;
  }

  // Check cache first
  const cached = orgSettingsCache.get(organizationId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.enabled;
  }

  try {
    const supabaseClient = supabase.admin();
    const { data: org, error } = await supabase
      .from("organizations")
      .select("human_like_ai")
      .eq("id", organizationId)
      .single();

    if (error) {
      return false;
    }

    const enabled = org?.human_like_ai || false;

    // Cache the result
    orgSettingsCache.set(organizationId, {
      enabled,
      timestamp: Date.now(),
    });

    return enabled;
  } catch (error) {
    return false;
  }
}

/**
 * Check if human-like AI is enabled with full context
 */
export async function checkHumanAIContext(context: FeatureContext): Promise<{
  enabled: boolean;
  reason: string;
  config: typeof HUMAN_AI_CONFIG;
}> {
  // Base feature flag check
  if (!FEATURE_FLAGS.RAG_HUMAN_MODE) {
    return {
      enabled: false,
      reason: "Feature flag RAG_HUMAN_MODE is disabled",
      config: HUMAN_AI_CONFIG,
    };
  }

  // Organization-specific check
  if (context.organizationId) {
    const orgEnabled = await isHumanAIModeEnabled(context.organizationId);
    if (!orgEnabled) {
      return {
        enabled: false,
        reason: `Organization ${context.organizationId} has human-like AI disabled`,
        config: HUMAN_AI_CONFIG,
      };
    }
  }

  return {
    enabled: true,
    reason: "Human-like AI is enabled",
    config: HUMAN_AI_CONFIG,
  };
}

/**
 * Enable/disable human-like AI for an organization
 */
export async function setOrganizationHumanAI(organizationId: string, enabled: boolean): Promise<boolean> {
  try {
    const supabaseClient = supabase.admin();
    const { error } = await supabase.from("organizations").update({ human_like_ai: enabled }).eq("id", organizationId);

    if (error) {
      return false;
    }

    // Clear cache
    orgSettingsCache.delete(organizationId);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get human-like AI configuration for an organization
 */
export async function getHumanAIConfig(organizationId: string) {
  const enabled = await isHumanAIModeEnabled(organizationId);

  return {
    enabled,
    typingSimulation: enabled && FEATURE_FLAGS.AI_TYPING_SIMULATION,
    toneAdaptation: enabled && FEATURE_FLAGS.AI_TONE_ADAPTATION,
    partialMessages: enabled && FEATURE_FLAGS.REALTIME_PARTIAL_MESSAGES,
    config: HUMAN_AI_CONFIG,
  };
}

/**
 * Calculate typing delay based on content length and complexity
 */
export function calculateTypingDelay(content: string): {
  totalDelay: number;
  partialDelay: number;
  jitter: number;
} {
  const words = content.split(/\s+/).length;
  const baseWPM =
    HUMAN_AI_CONFIG.TYPING_WPM_MIN + Math.random() * (HUMAN_AI_CONFIG.TYPING_WPM_MAX - HUMAN_AI_CONFIG.TYPING_WPM_MIN);

  // Base delay calculation
  const baseDelay = (words / baseWPM) * 60 * 1000; // Convert to milliseconds

  // Add complexity factor for longer messages
  const complexityBonus = Math.min(words * HUMAN_AI_CONFIG.COMPLEXITY_DELAY_FACTOR, 3000);

  // Apply jitter
  const jitter = baseDelay * HUMAN_AI_CONFIG.TYPING_JITTER_FACTOR * (Math.random() - 0.5);

  const totalDelay = Math.max(
    HUMAN_AI_CONFIG.MIN_RESPONSE_DELAY,
    Math.min(baseDelay + complexityBonus + jitter, HUMAN_AI_CONFIG.MAX_RESPONSE_DELAY)
  );

  return {
    totalDelay: Math.round(totalDelay),
    partialDelay: Math.round(totalDelay * 0.6), // 60% for partial message
    jitter: Math.round(jitter),
  };
}

/**
 * Determine if a partial message should be sent
 */
export function shouldSendPartialMessage(content: string): boolean {
  if (!FEATURE_FLAGS.REALTIME_PARTIAL_MESSAGES) {
    return false;
  }

  // Only send partial for longer messages
  if (content.length < HUMAN_AI_CONFIG.PARTIAL_MESSAGE_MIN_LENGTH) {
    return false;
  }

  // Random probability
  return Math.random() < HUMAN_AI_CONFIG.PARTIAL_MESSAGE_PROBABILITY;
}

/**
 * Generate partial message content (first part of the response)
 */
export function generatePartialContent(fullContent: string): string {
  const sentences = fullContent.split(/[.!?]+/).filter((s: unknown) => s.trim());

  if (sentences.length <= 1) {
    // For short content, return first half
    const midPoint = Math.floor(fullContent.length * 0.4);
    return fullContent.substring(0, midPoint).trim();
  }

  // Return first sentence or two
  const partialSentences = sentences.slice(0, Math.min(2, sentences.length - 1));
  return partialSentences.join(". ").trim() + (partialSentences.length > 0 ? "..." : "");
}

/**
 * Performance monitoring and cost tracking
 */
interface PerformanceMetrics {
  organizationId: string;
  hourlyTokens: number;
  hourlyRequests: number;
  averageLatency: number;
  lastReset: number;
}

const performanceCache = new Map<string, PerformanceMetrics>();
const METRICS_RESET_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Update performance metrics for an organization
 */
export function updatePerformanceMetrics(organizationId: string, tokens: number, latency: number): void {
  const now = Date.now();
  let metrics = performanceCache.get(organizationId);

  if (!metrics || now - metrics.lastReset > METRICS_RESET_INTERVAL) {
    metrics = {
      organizationId,
      hourlyTokens: 0,
      hourlyRequests: 0,
      averageLatency: 0,
      lastReset: now,
    };
  }

  metrics.hourlyTokens += tokens;
  metrics.hourlyRequests += 1;
  metrics.averageLatency = (metrics.averageLatency * (metrics.hourlyRequests - 1) + latency) / metrics.hourlyRequests;

  performanceCache.set(organizationId, metrics);
}

/**
 * Get current performance metrics for an organization
 */
export function getPerformanceMetrics(organizationId: string): PerformanceMetrics | null {
  const metrics = performanceCache.get(organizationId);
  if (!metrics) return null;

  const now = Date.now();
  if (now - metrics.lastReset > METRICS_RESET_INTERVAL) {
    performanceCache.delete(organizationId);
    return null;
  }

  return metrics;
}

/**
 * Check if human-like AI should be bypassed due to performance constraints
 */
export function shouldBypassHumanAI(context: { responseTime?: number; tokenCount?: number; organizationId?: string }): {
  bypass: boolean;
  reason?: string;
  severity: "low" | "medium" | "high";
} {
  // Check response time constraint (critical)
  if (context.responseTime && context.responseTime > HUMAN_AI_CONFIG.MAX_RESPONSE_LATENCY) {
    return {
      bypass: true,
      reason: `Response time ${context.responseTime}ms exceeds limit ${HUMAN_AI_CONFIG.MAX_RESPONSE_LATENCY}ms`,
      severity: "high",
    };
  }

  // Check organization-specific metrics
  if (context.organizationId) {
    const metrics = getPerformanceMetrics(context.organizationId);

    if (metrics) {
      // Check hourly token limit
      if (metrics.hourlyTokens > HUMAN_AI_CONFIG.MAX_TOKENS_PER_HOUR) {
        return {
          bypass: true,
          reason: `Hourly token limit exceeded: ${metrics.hourlyTokens}/${HUMAN_AI_CONFIG.MAX_TOKENS_PER_HOUR}`,
          severity: "medium",
        };
      }

      // Check if average latency is too high
      if (metrics.averageLatency > HUMAN_AI_CONFIG.MAX_RESPONSE_LATENCY * 0.8) {
        return {
          bypass: true,
          reason: `Average latency too high: ${Math.round(metrics.averageLatency)}ms`,
          severity: "medium",
        };
      }

      // Check request rate (soft limit)
      if (metrics.hourlyRequests > 1000) {
        // 1000 requests per hour limit
        return {
          bypass: true,
          reason: `Request rate limit exceeded: ${metrics.hourlyRequests}/hour`,
          severity: "low",
        };
      }
    }
  }

  // Check individual request token count
  if (context.tokenCount && context.tokenCount > 1000) {
    // Single request limit
    return {
      bypass: true,
      reason: `Single request token count too high: ${context.tokenCount}`,
      severity: "medium",
    };
  }

  return { bypass: false, severity: "low" };
}

/**
 * Circuit breaker for human-like AI
 */
interface CircuitBreakerState {
  organizationId: string;
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
  nextAttempt: number;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const CIRCUIT_BREAKER_THRESHOLD = 5; // failures
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CIRCUIT_BREAKER_RESET = 30 * 60 * 1000; // 30 minutes

/**
 * Check circuit breaker state
 */
export function checkCircuitBreaker(organizationId: string): {
  allowed: boolean;
  state: "closed" | "open" | "half-open";
  reason?: string;
} {
  const now = Date.now();
  let breaker = circuitBreakers.get(organizationId);

  if (!breaker) {
    breaker = {
      organizationId,
      failures: 0,
      lastFailure: 0,
      state: "closed",
      nextAttempt: 0,
    };
    circuitBreakers.set(organizationId, breaker);
  }

  // Reset circuit breaker after timeout
  if (breaker.state === "open" && now > breaker.nextAttempt) {
    breaker.state = "half-open";
    breaker.failures = 0;
  }

  // Reset completely after longer timeout
  if (now - breaker.lastFailure > CIRCUIT_BREAKER_RESET) {
    breaker.state = "closed";
    breaker.failures = 0;
  }

  switch (breaker.state) {
    case "closed":
      return { allowed: true, state: "closed" };
    case "half-open":
      return { allowed: true, state: "half-open" };
    case "open":
      return {
        allowed: false,
        state: "open",
        reason: `Circuit breaker open due to ${breaker.failures} failures`,
      };
    default:
      return { allowed: true, state: "closed" };
  }
}

/**
 * Record circuit breaker success
 */
export function recordCircuitBreakerSuccess(organizationId: string): void {
  const breaker = circuitBreakers.get(organizationId);
  if (breaker && breaker.state === "half-open") {
    breaker.state = "closed";
    breaker.failures = 0;
  }
}

/**
 * Record circuit breaker failure
 */
export function recordCircuitBreakerFailure(organizationId: string): void {
  const now = Date.now();
  let breaker = circuitBreakers.get(organizationId);

  if (!breaker) {
    breaker = {
      organizationId,
      failures: 0,
      lastFailure: 0,
      state: "closed",
      nextAttempt: 0,
    };
    circuitBreakers.set(organizationId, breaker);
  }

  breaker.failures += 1;
  breaker.lastFailure = now;

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.state = "open";
    breaker.nextAttempt = now + CIRCUIT_BREAKER_TIMEOUT;
  }
}

/**
 * Clear organization settings cache (useful for testing)
 */
export function clearHumanAICache(organizationId?: string): void {
  if (organizationId) {
    orgSettingsCache.delete(organizationId);
  } else {
    orgSettingsCache.clear();
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getHumanAICacheStats(): {
  size: number;
  entries: Array<{ organizationId: string; enabled: boolean; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(orgSettingsCache.entries()).map(([orgId, data]) => ({
    organizationId: orgId,
    enabled: data.enabled,
    age: now - data.timestamp,
  }));

  return {
    size: orgSettingsCache.size,
    entries,
  };
}

/**
 * Fallback mechanisms for when human-like AI fails
 */
export function getHumanAIFallback(
  originalContent: string,
  context: {
    organizationId: string;
    failureReason: string;
    severity: "low" | "medium" | "high";
  }
): {
  content: string;
  fallbackApplied: boolean;
  fallbackType: "none" | "minimal" | "standard" | "emergency";
} {
  const { severity, failureReason } = context;

  // Record the failure for circuit breaker
  recordCircuitBreakerFailure(context.organizationId);

  switch (severity) {
    case "high":
      // Emergency fallback - return content as-is

      return {
        content: originalContent,
        fallbackApplied: true,
        fallbackType: "emergency",
      };

    case "medium":
      // Standard fallback - minimal processing

      const minimalProcessed = phraseFilter(originalContent, {
        removeRoboticPhrases: true,
        adjustFormality: "maintain",
        preserveReadability: true,
      });
      return {
        content: minimalProcessed,
        fallbackApplied: true,
        fallbackType: "standard",
      };

    case "low":
      // Minimal fallback - basic improvements

      const basicProcessed = phraseFilter(originalContent, {
        removeRoboticPhrases: true,
        adjustFormality: "decrease",
        preserveReadability: true,
      });
      return {
        content: basicProcessed,
        fallbackApplied: true,
        fallbackType: "minimal",
      };

    default:
      return {
        content: originalContent,
        fallbackApplied: false,
        fallbackType: "none",
      };
  }
}

/**
 * Health check for human-like AI system
 */
export function getHumanAIHealthStatus(organizationId: string): {
  healthy: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  metrics: {
    circuitBreakerState: string;
    performanceMetrics: PerformanceMetrics | null;
    bypassRecommended: boolean;
  };
  recommendations: string[];
} {
  const circuitBreaker = checkCircuitBreaker(organizationId);
  const metrics = getPerformanceMetrics(organizationId);
  const bypassCheck = shouldBypassHumanAI({ organizationId });

  const recommendations: string[] = [];
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Check circuit breaker
  if (circuitBreaker.state === "open") {
    status = "unhealthy";
    recommendations.push("Circuit breaker is open - system is temporarily disabled");
  } else if (circuitBreaker.state === "half-open") {
    status = "degraded";
    recommendations.push("Circuit breaker is half-open - monitoring for recovery");
  }

  // Check performance metrics
  if (metrics) {
    if (metrics.averageLatency > HUMAN_AI_CONFIG.MAX_RESPONSE_LATENCY * 0.8) {
      status = status === "healthy" ? "degraded" : status;
      recommendations.push(`High latency detected: ${Math.round(metrics.averageLatency)}ms`);
    }

    if (metrics.hourlyTokens > HUMAN_AI_CONFIG.MAX_TOKENS_PER_HOUR * 0.8) {
      status = status === "healthy" ? "degraded" : status;
      recommendations.push(`High token usage: ${metrics.hourlyTokens}/${HUMAN_AI_CONFIG.MAX_TOKENS_PER_HOUR}`);
    }
  }

  // Check bypass recommendation
  if (bypassCheck.bypass) {
    status = "degraded";
    recommendations.push(`Bypass recommended: ${bypassCheck.reason}`);
  }

  return {
    healthy: status === "healthy",
    status,
    metrics: {
      circuitBreakerState: circuitBreaker.state,
      performanceMetrics: metrics,
      bypassRecommended: bypassCheck.bypass,
    },
    recommendations,
  };
}

/**
 * Development utilities
 */
export const HumanAIDevUtils = {
  /**
   * Test typing delay calculation
   */
  testTypingDelay(content: string) {
    if (process.env.NODE_ENV !== "development") return;

    const delay = calculateTypingDelay(content);
  },

  /**
   * Test partial message generation
   */
  testPartialMessage(content: string) {
    if (process.env.NODE_ENV !== "development") return;

    const shouldSend = shouldSendPartialMessage(content);
    const partial = shouldSend ? generatePartialContent(content) : null;
  },

  /**
   * Test organization settings
   */
  async testOrgSettings(organizationId: string) {
    if (process.env.NODE_ENV !== "development") return;

    const config = await getHumanAIConfig(organizationId);
  },

  /**
   * Test performance safeguards
   */
  testPerformanceSafeguards(organizationId: string) {
    if (process.env.NODE_ENV !== "development") return;

    const health = getHumanAIHealthStatus(organizationId);
    const bypassCheck = shouldBypassHumanAI({ organizationId });
    const circuitBreaker = checkCircuitBreaker(organizationId);
  },

  /**
   * Simulate performance metrics for testing
   */
  simulatePerformanceLoad(organizationId: string, requests: number = 10) {
    if (process.env.NODE_ENV !== "development") return;

    for (let i = 0; i < requests; i++) {
      const tokens = Math.floor(Math.random() * 500) + 100;
      const latency = Math.floor(Math.random() * 3000) + 500;
      updatePerformanceMetrics(organizationId, tokens, latency);

      // Simulate some failures
      if (Math.random() < 0.2) {
        recordCircuitBreakerFailure(organizationId);
      } else {
        recordCircuitBreakerSuccess(organizationId);
      }
    }

    const health = getHumanAIHealthStatus(organizationId);
  },
} as const;
