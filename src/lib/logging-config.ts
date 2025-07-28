// Environment-based logging configuration

export const loggingConfig = {
  development: {
    enableLogs: true,
    logLevel: "warn", // Reduced from debug to warn
    showStackTraces: true,
    showNetworkLogs: false, // Disabled to reduce noise
    showPerformanceLogs: false, // Disabled to reduce noise
    showReduxLogs: false, // Disabled to reduce noise
    showRouterLogs: false, // Disabled to reduce noise
    showWebSocketLogs: false,
    showFirebaseLogs: false,
    showSupabaseLogs: false,
    showWidgetLogs: false, // New: disable widget verbose logging
    showSentryLogs: false, // New: disable Sentry tracing logs
  },
  staging: {
    enableLogs: true,
    logLevel: "warn",
    showStackTraces: true,
    showNetworkLogs: false,
    showPerformanceLogs: false,
    showReduxLogs: false,
    showRouterLogs: false,
    showWebSocketLogs: false,
    showFirebaseLogs: false,
    showSupabaseLogs: false,
  },
  production: {
    enableLogs: false,
    logLevel: "error",
    showStackTraces: false,
    showNetworkLogs: false,
    showPerformanceLogs: false,
    showReduxLogs: false,
    showRouterLogs: false,
    showWebSocketLogs: false,
    showFirebaseLogs: false,
    showSupabaseLogs: false,
  },
};

export const getLoggingConfig = () => {
  const env = process.env.NODE_ENV || "development";
  const stage = process.env.NEXT_PUBLIC_STAGE || env;

  return loggingConfig[stage as keyof typeof loggingConfig] || loggingConfig.production;
};

// Helper to check if specific log type is enabled
export const shouldLog = (logType: keyof typeof loggingConfig.development): boolean => {
  const config = getLoggingConfig();
  return config.enableLogs && config[logType] === true;
};
