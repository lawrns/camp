/**
 * Database Extensions and Additional Types
 * Extends the base database types with custom functionality
 */

import type { Database } from './supabase-generated';

// Extended database types
export type ExtendedDatabase = Database;

// Add any custom database extensions here
export interface DatabaseExtensions {
  // Custom stored procedures, views, or computed columns
  // Add specific extensions as needed
}

// Export common database utility types
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]['Row'];
export type Insert<T extends TableName> = Tables[T]['Insert'];
export type Update<T extends TableName> = Tables[T]['Update'];

// Helper types for database operations
export type DatabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type DatabaseResult<T> = {
  data: T | null;
  error: DatabaseError | null;
};

// Database function result types
export interface SetActiveOrganizationResult {
  success: boolean;
  organization_id?: string;
  organization_name?: string;
  role?: string;
  message?: string;
  error?: string;
}

export interface GetUserAvailableOrganizationsResult {
  organization_id: string;
  organization_name: string;
  role: string;
  status: string;
  member_count?: number;
  created_at?: string;
}