/**
 * Environment Validation Module
 *
 * Provides validation for environment variables with proper error handling
 */

export class EnvironmentValidationError extends Error {
  public errors: string[];
  public warnings: string[];

  constructor(message: string, errors: string[] = [], warnings: string[] = []) {
    super(message);
    this.name = "EnvironmentValidationError";
    this.errors = errors;
    this.warnings = warnings;
  }
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: string[];
  warnings?: string[];
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation - in development, be more lenient
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  if (!isDev) {
    // Production validations
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
    }
  } else {
    // Development warnings
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      warnings.push("NEXT_PUBLIC_SUPABASE_URL not set - using defaults");
    }
  }

  return {
    success: errors.length === 0,
    data: process.env,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function validateClientEnv(): ValidationResult {
  // Validate only client-side environment variables
  return validateEnv();
}

export function validateServerEnv(): ValidationResult {
  // Validate server-side environment variables
  return validateEnv();
}

export function getValidatedEnv() {
  const result = validateEnv();

  if (!result.success) {
    if (process.env.NODE_ENV === "development") {

    }
    throw new EnvironmentValidationError("Environment validation failed", result.errors, result.warnings);
  }

  return result.data || process.env;
}

export function shouldSkipValidation(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "true" || process.env.NODE_ENV === "test";
}
