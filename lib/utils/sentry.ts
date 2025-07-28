// Temporarily disabled Sentry to fix OpenTelemetry conflicts
// import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/utils/env-config";

// Stub Sentry functions
const Sentry = {
  captureException: (error: any, hint?: any) => {
     
  },
};

export const captureExceptionAndThrowIfDevelopment = (error: any, hint?: any) => {
  Sentry.captureException(error, hint);
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") throw error;
};

export const captureExceptionAndLogIfDevelopment = (error: any, hint?: any) => {
  Sentry.captureException(error, hint);
   
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    // Handle development error
  }
};

export const captureExceptionAndLog = (error: any, hint?: any) => {
  Sentry.captureException(error, hint);
   
};
