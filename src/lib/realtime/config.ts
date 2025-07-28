/**
 * Realtime Configuration Compatibility
 *
 * Provides configuration stubs for components importing from this path.
 *
 * @deprecated Configuration is now handled internally
 */

export const realtimeConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === "development",
  connection: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  channels: {
    maxSubscriptions: 50,
    cleanupInterval: 60000,
  },
};

export const getRealtimeConfig = () => realtimeConfig;

export default realtimeConfig;
