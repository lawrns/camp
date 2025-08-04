// Temporarily disabled Sentry to fix OpenTelemetry conflicts
// import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/utils/env-config";

// Stub Sentry functions
const Sentry = {
  captureException: (error: unknown, hint?: unknown) => {
     
  },
};

export const captureExceptionAndThrowIfDevelopment = (error: unknown, hint?: unknown) => {
  Sentry.captureException(error, hint);
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") throw error;
};

export const captureExceptionAndLogIfDevelopment = (error: unknown, hint?: unknown) => {
  Sentry.captureException(error, hint);
   
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    // Handle development error
  }
};

export const captureExceptionAndLog = (error: unknown, hint?: unknown) => {
  Sentry.captureException(error, hint);
   
};
