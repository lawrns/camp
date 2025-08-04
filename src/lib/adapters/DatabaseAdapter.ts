/**
 * DatabaseAdapter - Handles snake_case/camelCase conversions and eliminates `as unknown` casts
 */

export interface DatabaseAdapter<TDatabase, TDomain> {
  toDomain(dbRecord: TDatabase): TDomain;
  toDatabase(domainEntity: TDomain): Partial<TDatabase>;
}

/**
 * Generic field converter for snake_case to camelCase
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): unknown {
  const result: unknown = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Generic field converter for camelCase to snake_case
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): unknown {
  const result: unknown = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * User Factory Result Adapter
 */
export interface UserFactoryResult {
  user: unknown;
  organization: unknown;
  mailbox: unknown;
}

export class UserFactoryAdapter {
  static toDomain(dbResult: unknown): UserFactoryResult {
    return {
      user: dbResult.user ?? null,
      organization: dbResult.organization ?? null,
      mailbox: dbResult.mailbox ?? null,
    };
  }
}

/**
 * Conversation Factory Result Adapter
 */
export interface ConversationFactoryResult {
  conversation: unknown;
}

export class ConversationFactoryAdapter {
  static toDomain(dbResult: unknown): ConversationFactoryResult {
    return {
      conversation: dbResult.conversation ?? null,
    };
  }
}

/**
 * Mailbox Factory Result Adapter
 */
export interface MailboxFactoryResult {
  mailbox: unknown;
}

export class MailboxFactoryAdapter {
  static toDomain(dbResult: unknown): MailboxFactoryResult {
    return {
      mailbox: dbResult.mailbox ?? null,
    };
  }
}

/**
 * Organization Settings Adapter
 */
export interface OrganizationSettingsAdapter {
  widget?: Record<string, any>;
  security?: Record<string, any>;
  branding?: Record<string, any>;
}

export class OrganizationAdapter {
  static adaptSettings(settings: unknown): OrganizationSettingsAdapter {
    return {
      widget: settings?.widget ?? {},
      security: settings?.security ?? {},
      branding: settings?.branding ?? {},
    };
  }
}
