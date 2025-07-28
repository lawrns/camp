/**
 * Centralized naming convention utilities
 * Handles conversion between database snake_case and TypeScript camelCase
 */

// Enhanced type helpers for better type safety
type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
    ? `${T}${CamelToSnakeCase<U>}`
    : `${Uncapitalize<T>}_${CamelToSnakeCase<Uncapitalize<U>>}`
  : S;

type SnakeToCamelCaseObject<T> = {
  [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
};

type CamelToSnakeCaseObject<T> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K];
};

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  // eslint-disable-next-line require-unicode-regexp
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  // eslint-disable-next-line require-unicode-regexp
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function snakeToCamelObject<T extends Record<string, unknown>>(obj: T): SnakeToCamelCaseObject<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result = {} as SnakeToCamelCaseObject<T>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = snakeToCamel(key) as keyof SnakeToCamelCaseObject<T>;
      result[camelKey] = obj[key] as SnakeToCamelCaseObject<T>[keyof SnakeToCamelCaseObject<T>];
    }
  }
  return result;
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function camelToSnakeObject<T extends Record<string, unknown>>(obj: T): CamelToSnakeCaseObject<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result = {} as CamelToSnakeCaseObject<T>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = camelToSnake(key) as keyof CamelToSnakeCaseObject<T>;
      result[snakeKey] = obj[key] as CamelToSnakeCaseObject<T>[keyof CamelToSnakeCaseObject<T>];
    }
  }
  return result;
}

/**
 * Standard field mappings for common entities
 */
export const FIELD_MAPPINGS = {
  message: {
    toDatabase: {
      conversationId: "conversation_id",
      senderType: "sender_type",
      senderId: "sender_id",
      senderName: "sender_name",
      senderEmail: "sender_email",
      createdAt: "created_at",
      updatedAt: "updated_at",
      deliveryStatus: "delivery_status",
    },
    fromDatabase: {
      conversation_id: "conversationId",
      sender_type: "senderType",
      sender_id: "senderId",
      sender_name: "senderName",
      sender_email: "senderEmail",
      created_at: "createdAt",
      updated_at: "updatedAt",
      delivery_status: "deliveryStatus",
    },
  },
  conversation: {
    toDatabase: {
      customerId: "customer_id",
      customerName: "customer_name",
      customerEmail: "customer_email",
      customerIp: "customer_ip",
      lastMessageAt: "last_message_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      assignedTo: "assigned_to",
      organizationId: "organization_id",
    },
    fromDatabase: {
      customer_id: "customerId",
      customer_name: "customerName",
      customer_email: "customerEmail",
      customer_ip: "customerIp",
      last_message_at: "lastMessageAt",
      created_at: "createdAt",
      updated_at: "updatedAt",
      assigned_to: "assignedTo",
      organization_id: "organizationId",
    },
  },
};

/**
 * Transform message from database format to app format
 */
export function transformMessageFromDb(dbMessage: Record<string, unknown>): Record<string, unknown> {
  const mapping = FIELD_MAPPINGS.message.fromDatabase;
  const result: Record<string, unknown> = { ...dbMessage };

  for (const [dbKey, appKey] of Object.entries(mapping)) {
    if (dbKey in dbMessage) {
      result[appKey] = dbMessage[dbKey];
      if (dbKey !== appKey) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete result[dbKey];
      }
    }
  }

  return result;
}

/**
 * Transform message from app format to database format
 */
export function transformMessageToDb(appMessage: Record<string, unknown>): Record<string, unknown> {
  const mapping = FIELD_MAPPINGS.message.toDatabase;
  const result: Record<string, unknown> = { ...appMessage };

  for (const [appKey, dbKey] of Object.entries(mapping)) {
    if (appKey in appMessage) {
      result[dbKey] = appMessage[appKey];
      if (appKey !== dbKey) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete result[appKey];
      }
    }
  }

  return result;
}

/**
 * Transform conversation from database format to app format
 */
export function transformConversationFromDb(dbConversation: Record<string, unknown>): Record<string, unknown> {
  const mapping = FIELD_MAPPINGS.conversation.fromDatabase;
  const result: Record<string, unknown> = { ...dbConversation };

  for (const [dbKey, appKey] of Object.entries(mapping)) {
    if (dbKey in dbConversation) {
      result[appKey] = dbConversation[dbKey];
      if (dbKey !== appKey) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete result[dbKey];
      }
    }
  }

  return result;
}

/**
 * Transform conversation from app format to database format
 */
export function transformConversationToDb(appConversation: Record<string, unknown>): Record<string, unknown> {
  const mapping = FIELD_MAPPINGS.conversation.toDatabase;
  const result: Record<string, unknown> = { ...appConversation };

  for (const [appKey, dbKey] of Object.entries(mapping)) {
    if (appKey in appConversation) {
      result[dbKey] = appConversation[appKey];
      if (appKey !== dbKey) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete result[appKey];
      }
    }
  }

  return result;
}

/**
 * Enhanced utility functions for array transformations and database field handling
 */

/**
 * Convert an array of objects from snake_case to camelCase keys
 * @param arr Array of objects with snake_case keys
 * @returns New array with objects having camelCase keys
 */
export function snakeToCamelArray<T extends Record<string, unknown>>(arr: T[]): SnakeToCamelCaseObject<T>[] {
  return arr.map((obj) => snakeToCamelObject(obj));
}

/**
 * Convert an array of objects from camelCase to snake_case keys
 * @param arr Array of objects with camelCase keys
 * @returns New array with objects having snake_case keys
 */
export function camelToSnakeArray<T extends Record<string, unknown>>(arr: T[]): CamelToSnakeCaseObject<T>[] {
  return arr.map((obj) => camelToSnakeObject(obj));
}

/**
 * Database field transformer class for use with query builders
 * Provides a centralized way to transform between database and application formats
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DatabaseFieldTransformer {
  /**
   * Transform database row to application object
   * @param row Database row with snake_case fields
   * @returns Application object with camelCase fields
   */
  static fromDatabase<T extends Record<string, unknown>>(row: T): SnakeToCamelCaseObject<T> {
    return snakeToCamelObject(row);
  }

  /**
   * Transform application object to database row
   * @param obj Application object with camelCase fields
   * @returns Database row with snake_case fields
   */
  static toDatabase<T extends Record<string, unknown>>(obj: T): CamelToSnakeCaseObject<T> {
    return camelToSnakeObject(obj);
  }

  /**
   * Transform array of database rows to application objects
   * @param rows Array of database rows with snake_case fields
   * @returns Array of application objects with camelCase fields
   */
  static fromDatabaseArray<T extends Record<string, unknown>>(rows: T[]): SnakeToCamelCaseObject<T>[] {
    return snakeToCamelArray(rows);
  }

  /**
   * Transform array of application objects to database rows
   * @param objs Array of application objects with camelCase fields
   * @returns Array of database rows with snake_case fields
   */
  static toDatabaseArray<T extends Record<string, unknown>>(objs: T[]): CamelToSnakeCaseObject<T>[] {
    return camelToSnakeArray(objs);
  }

  /**
   * Transform nested object with selective field transformation
   * Useful for complex objects where only certain fields need transformation
   * @param obj Object to transform
   * @param fieldsToTransform Array of field names to transform
   * @param direction 'toCamel' or 'toSnake'
   * @returns Transformed object
   */
  static transformSelectiveFields<T extends Record<string, unknown>>(
    obj: T,
    fieldsToTransform: string[],
    direction: "toCamel" | "toSnake"
  ): T {
    const result = { ...obj };

    fieldsToTransform.forEach((field) => {
      if (field in result) {
        const transformedKey = direction === "toCamel" ? snakeToCamel(field) : camelToSnake(field);

        if (transformedKey !== field) {
          result[transformedKey as keyof T] = result[field as keyof T];
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete result[field as keyof T];
        }
      }
    });

    return result;
  }
}

/**
 * Utility for handling database query results with automatic field transformation
 * @param queryResult Raw database query result
 * @param transformer Optional custom transformer function
 * @returns Transformed result with camelCase fields
 */
export function transformDatabaseResult<T extends Record<string, unknown>>(
  queryResult: T | T[] | null,
  transformer?: (item: T) => SnakeToCamelCaseObject<T>
): SnakeToCamelCaseObject<T> | SnakeToCamelCaseObject<T>[] | null {
  if (!queryResult) return null;

  const transform = transformer || ((item: T) => DatabaseFieldTransformer.fromDatabase(item));

  if (Array.isArray(queryResult)) {
    return queryResult.map((item) => transform(item));
  }

  return transform(queryResult);
}

/**
 * Validate and transform database fields for insert/update operations
 * @param data Data to validate and transform
 * @param requiredFields Array of required field names (in camelCase)
 * @param optionalFields Array of optional field names (in camelCase)
 * @returns Validated and transformed data ready for database
 */
export function validateAndTransformForDatabase<T extends Record<string, unknown>>(
  data: T,
  requiredFields: string[],
  optionalFields: string[] = []
): CamelToSnakeCaseObject<T> {
  const allFields = [...requiredFields, ...optionalFields];

  // Validate required fields
  const missingFields = requiredFields.filter((field) => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // Filter to only include known fields
  const filteredData = Object.fromEntries(Object.entries(data).filter(([key]) => allFields.includes(key))) as T;

  return DatabaseFieldTransformer.toDatabase(filteredData);
}
