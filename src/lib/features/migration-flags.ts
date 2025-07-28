// Migration flags stub
export const migrationFlags = {
  enableNewFeature: false,
  enableBetaFeatures: false,
};

export const FLAG_GROUPS = {
  authentication: {
    name: "Authentication",
    flags: ["useAuth", "strictOrganizationBoundaries"],
  },
  realtime: {
    name: "Real-time Features",
    flags: ["optimizedRealtimeSync", "batchedSubscriptions"],
  },
  performance: {
    name: "Performance",
    flags: ["aggressiveCaching", "lazyLoadingEnabled"],
  },
  PHASE_1_SECURITY: {
    name: "Phase 1: Security",
    flags: ["useAuth", "strictOrganizationBoundaries"],
  },
  PHASE_2_REALTIME: {
    name: "Phase 2: Real-time",
    flags: ["optimizedRealtimeSync", "batchedSubscriptions"],
  },
  PHASE_3_STATE: {
    name: "Phase 3: State",
    flags: ["aggressiveCaching", "lazyLoadingEnabled"],
  },
};

export function getFlagStatus(): Record<string, { enabled: boolean }> {
  // Return a stub object with all flags set to false
  const allFlags = [
    ...FLAG_GROUPS.authentication.flags,
    ...FLAG_GROUPS.realtime.flags,
    ...FLAG_GROUPS.performance.flags,
    ...FLAG_GROUPS.PHASE_1_SECURITY.flags,
    ...FLAG_GROUPS.PHASE_2_REALTIME.flags,
    ...FLAG_GROUPS.PHASE_3_STATE.flags,
  ];

  // Remove duplicates
  const uniqueFlags = [...new Set(allFlags)];

  const status: Record<string, { enabled: boolean }> = {};
  uniqueFlags.forEach((flag: any) => {
    status[flag] = { enabled: false };
  });

  return status;
}

export function isPhaseEnabled(phase: string): boolean {
  return false; // Stub implementation
}

export default migrationFlags;
