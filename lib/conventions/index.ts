/**
 * Campfire Naming Conventions
 *
 * Centralized utilities for enforcing naming standards across the platform.
 * Builds on existing campfire_ standardization patterns.
 */

export { CampfireEvents, type CampfireEventData } from "./event-registry";
export { buildChannelName, validateChannelName } from "./channel-builder";
export { API_ENDPOINTS } from "./api-endpoints";
export { validateStorageKey, buildStorageKey } from "./storage-keys";
export { validateDatabaseTable } from "./database-naming";

// Validation utilities
export { isValidEventName } from "./validators/event-validator";
export { isValidChannelName } from "./validators/channel-validator";
export { isValidApiEndpoint } from "./validators/api-validator";

// Migration helpers
export { migrateEventName } from "./migration/event-migration";
export { migrateChannelName } from "./migration/channel-migration";
export { migrateStorageKey } from "./migration/storage-migration";

// Constants
export const CAMPFIRE_PREFIX = "campfire_";
export const ORG_CHANNEL_PREFIX = "org:";
export const GLOBAL_CHANNEL_PREFIX = "campfire:global:";

// Type definitions
export interface ConventionValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

export interface MigrationResult {
  original: string;
  migrated: string;
  isChanged: boolean;
  warnings?: string[];
}
