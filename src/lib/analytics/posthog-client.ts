import {
  CAMPFIRE_PREFIX,
  CampfireEvents,
  getEventPriority,
  isValidEventName,
  migrateLegacyEventName,
  validateEventName,
  type CampfireEventData,
} from "@/lib/conventions/event-registry";
// Temporarily disable PostHog to fix placeholder key issue
// import posthog from "posthog-js";

// Mock PostHog for development
const posthog = {
  init: () => { },
  capture: () => { },
  identify: () => { },
  reset: () => { },
};

export interface AnalyticsClient {
  track: (event: string, properties?: Record<string, any>) => void;
  trackTyped: (event: CampfireEvents, properties?: CampfireEventData) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  reset: () => void;
  pageview: (url?: string) => void;
}

// Enhanced tracking with validation
export interface ValidatedTrackingResult {
  success: boolean;
  eventName: string;
  originalEventName?: string;
  warnings?: string[];
  errors?: string[];
}

class PostHogClient implements AnalyticsClient {
  private initialized = false;
  private developmentMode = process.env.NODE_ENV === "development";
  private validationEnabled = true;

  init(apiKey: string, host: string = "https://app.posthog.com") {
    if (this.initialized) return;

    // Validate API key - don't initialize with placeholder keys
    if (!apiKey || apiKey.includes("placeholder") || apiKey === "placeholder_posthog_key") {
      console.log("PostHog init skipped - invalid or placeholder API key");
      return;
    }

    if (typeof window !== "undefined" && apiKey) {
      posthog.init(apiKey, {
        api_host: host,
        capture_pageview: false, // We'll manage this manually
        capture_pageleave: true,
        autocapture: false, // Only track what we explicitly send
        // Enhanced configuration for Campfire
        sanitize_properties: (properties, event) => {
          // Add campfire context to all events
          return {
            ...properties,
            campfire_version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
            campfire_environment: process.env.NODE_ENV || "unknown",
          };
        },
      });
      this.initialized = true;

      if (this.developmentMode) {

      }
    }
  }

  track(event: string, properties?: Record<string, any>): ValidatedTrackingResult {
    const result = this.validateAndTrack(event, properties);

    if (this.developmentMode && result.warnings?.length) {

    }

    if (this.developmentMode && result.errors?.length) {

    }

    return result;
  }

  trackTyped(event: CampfireEvents, properties?: CampfireEventData): ValidatedTrackingResult {
    // Type-safe tracking with guaranteed valid event names
    if (this.initialized) {
      const enhancedProperties = {
        ...properties,
        campfire_event_category: this.getEventCategory(event),
        campfire_event_priority: getEventPriority(event),
        campfire_tracked_at: new Date().toISOString(),
      };

      posthog.capture(event, enhancedProperties);

      return {
        success: true,
        eventName: event,
      };
    }

    return {
      success: false,
      eventName: event,
      errors: ["PostHog client not initialized"],
    };
  }

  private validateAndTrack(event: string, properties?: Record<string, any>): ValidatedTrackingResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let finalEventName = event;
    let originalEventName: string | undefined;

    // Skip validation for PostHog system events
    if (event.startsWith("$")) {
      if (this.initialized) {
        posthog.capture(event, properties);
        return { success: true, eventName: event };
      }
      return { success: false, eventName: event, errors: ["PostHog client not initialized"] };
    }

    if (this.validationEnabled) {
      const validation = validateEventName(event);

      if (!validation.isValid) {
        // Try to migrate legacy event name
        const migratedEvent = migrateLegacyEventName(event);

        if (migratedEvent) {
          originalEventName = event;
          finalEventName = migratedEvent;
          warnings.push(`Event '${event}' migrated to '${migratedEvent}'`);

          if (this.developmentMode) {

          }
        } else {
          // Event doesn't follow conventions and can't be migrated
          if (!event.startsWith(CAMPFIRE_PREFIX)) {
            warnings.push(`Event '${event}' should start with '${CAMPFIRE_PREFIX}' prefix`);

            if (this.developmentMode) {

            }
          }

          if (!isValidEventName(event)) {
            warnings.push(`Event '${event}' is not registered in CampfireEvents enum`);
          }
        }
      }
    }

    // Track the event (original or migrated)
    if (this.initialized) {
      const enhancedProperties = {
        ...properties,
        campfire_event_category: this.getEventCategory(finalEventName),
        campfire_tracked_at: new Date().toISOString(),
      };

      if (originalEventName) {
        enhancedProperties.campfire_original_event_name = originalEventName;
        enhancedProperties.campfire_migrated = true;
      }

      posthog.capture(finalEventName, enhancedProperties);

      return {
        success: true,
        eventName: finalEventName,
        originalEventName,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    errors.push("PostHog client not initialized");
    return {
      success: false,
      eventName: finalEventName,
      originalEventName,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors,
    };
  }

  private getEventCategory(eventName: string): string {
    if (eventName.includes("widget")) return "widget";
    if (eventName.includes("conversation")) return "conversation";
    if (eventName.includes("message")) return "message";
    if (eventName.includes("ai_")) return "ai";
    if (eventName.includes("handover")) return "handover";
    if (eventName.includes("user")) return "user";
    if (eventName.includes("org")) return "organization";
    if (eventName.includes("kb_")) return "knowledge_base";
    if (eventName.includes("integration")) return "integration";
    if (eventName.includes("error")) return "error";
    if (eventName.includes("feature") || eventName.includes("experiment")) return "feature";
    if (eventName.includes("time") || eventName.includes("performance")) return "performance";
    return "other";
  }

  private getEventConstantName(eventName: string): string {
    // Convert event name to constant name
    // e.g., 'campfire_widget_loaded' -> 'WIDGET_LOADED'
    return eventName.replace(CAMPFIRE_PREFIX, "").toUpperCase();
  }

  // Configuration methods
  setValidationEnabled(enabled: boolean): void {
    this.validationEnabled = enabled;
    if (this.developmentMode) {

    }
  }

  isValidationEnabled(): boolean {
    return this.validationEnabled;
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (this.initialized) {
      posthog.identify(userId, traits);
    }
  }

  reset() {
    if (this.initialized) {
      posthog.reset();
    }
  }

  pageview(url?: string) {
    if (this.initialized) {
      posthog.capture("$pageview", {
        url,
        campfire_pageview: true,
        campfire_tracked_at: new Date().toISOString(),
      });
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Utility methods for development
  getValidEvents(): string[] {
    return Object.values(CampfireEvents);
  }

  validateEvent(eventName: string): {
    isValid: boolean;
    suggestions?: string[];
    errors?: string[];
  } {
    const validation = validateEventName(eventName);
    const migratedEvent = migrateLegacyEventName(eventName);

    return {
      isValid: validation.isValid,
      suggestions: migratedEvent
        ? [`Use: ${migratedEvent}`]
        : validation.suggestion
          ? [validation.suggestion]
          : undefined,
      errors: validation.error ? [validation.error] : undefined,
    };
  }
}

// Singleton instance
export const analytics = new PostHogClient();

// Initialize on import if env vars are available
if (typeof window !== "undefined") {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // Only initialize if we have a real API key (not placeholder)
  if (apiKey && apiKey !== "placeholder_posthog_key" && !apiKey.includes("placeholder")) {
    analytics.init(apiKey, host);
  } else {
    console.log("PostHog analytics disabled - no valid API key provided");
  }
}
