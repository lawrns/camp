// Sentry integration stub
export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
}

export interface SentryContext {
  [key: string]: unknown;
}

export class SentryService {
  private static instance: SentryService | undefined;

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  init(dsn?: string): void {
    // Stub implementation
    void dsn;
  }

  captureException(error: Error, context?: SentryContext): void {
    // Stub implementation - log to console in development
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
    }
  }

  captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
    // Stub implementation
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
    }
  }

  setUser(user: SentryUser): void {
    // Stub implementation
    void user;
  }

  setContext(key: string, context: SentryContext): void {
    // Stub implementation
    void key;
    void context;
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: string }): void {
    // Stub implementation
    void breadcrumb;
  }
}

export const sentryService = SentryService.getInstance();

// Convenience exports
export const captureException = (error: Error, context?: SentryContext) =>
  sentryService.captureException(error, context);

export const captureMessage = (message: string, level?: "info" | "warning" | "error") =>
  sentryService.captureMessage(message, level);

export const setUser = (user: SentryUser) => sentryService.setUser(user);

export const setContext = (key: string, context: SentryContext) => sentryService.setContext(key, context);

export const addBreadcrumb = (breadcrumb: { message: string; category?: string; level?: string }) =>
  sentryService.addBreadcrumb(breadcrumb);

// Additional convenience exports for missing functions
export const captureExceptionAndLog = (error: Error, context?: SentryContext) => {
  // Log to console in addition to capturing

  sentryService.captureException(error, context);
};

export const captureExceptionAndLogIfDevelopment = (error: Error, context?: SentryContext) => {
  if (process.env.NODE_ENV === "development") {
  }
  sentryService.captureException(error, context);
};

// Add missing export for backward compatibility
export const captureExceptionAndThrowIfDevelopment = (error: Error, context?: SentryContext) => {
  if (process.env.NODE_ENV === "development") {
    throw error;
  }
  sentryService.captureException(error, context);
};
