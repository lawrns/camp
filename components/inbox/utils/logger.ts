const isDevelopment = process.env.NODE_ENV === "development";

export const logWithContext = (level: "info" | "warn" | "error", message: string, context?: any) => {
  const timestamp = new Date().toISOString();
  const prefix = `🔗 [UnifiedInboxDashboard-Improved] ${timestamp}`;

  if (isDevelopment) {
    if (level === "error") {
    } else if (level === "warn") {
    } else {
    }
  }
};
