/**
 * Security validation utilities
 * FIXES: Critical Issue C002 - Organization ID Injection Vulnerability
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Validates that a string is a valid UUID format
 * Prevents injection attacks and ensures data integrity
 */
export function validateUUID(value: string | null | undefined, fieldName: string = 'ID'): string {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }

  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid ${fieldName} format: must be a valid UUID`);
  }

  return result.data;
}

/**
 * Validates organization ID from request headers or body
 * Ensures proper UUID format and prevents injection attacks
 */
export function validateOrganizationId(
  headerValue: string | null,
  bodyValue?: string | null
): string {
  const organizationId = headerValue || bodyValue;
  
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  return validateUUID(organizationId, 'Organization ID');
}

/**
 * Validates conversation ID
 */
export function validateConversationId(conversationId: string | null | undefined): string {
  return validateUUID(conversationId, 'Conversation ID');
}

/**
 * Validates user ID
 */
export function validateUserId(userId: string | null | undefined): string {
  return validateUUID(userId, 'User ID');
}

/**
 * Validates that the current user has access to the specified organization
 * Checks organization membership and active status
 */
export async function validateOrganizationAccess(
  supabase: SupabaseClient,
  organizationId: string
): Promise<boolean> {
  try {
    // Validate organization ID format first
    validateUUID(organizationId, 'Organization ID');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    // Check if user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Organization access validation error:', error);
    return false;
  }
}

/**
 * Sanitizes error messages for production
 * Prevents information disclosure in error responses
 */
export function sanitizeErrorMessage(error: any, isDevelopment: boolean = process.env.NODE_ENV === 'development'): string {
  if (isDevelopment) {
    return error?.message || 'An error occurred';
  }

  // In production, return generic error messages to prevent information disclosure
  if (error?.code === 'PGRST116' || error?.message?.includes('violates row-level security')) {
    return 'Access denied';
  }

  if (error?.code?.startsWith('23') || error?.message?.includes('constraint')) {
    return 'Invalid data provided';
  }

  if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
    return 'Authentication required';
  }

  return 'Internal server error';
}

/**
 * Rate limiting validation
 * Basic implementation - should be enhanced with Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    const resetTime = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  rateLimitMap.set(key, current);
  
  return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime };
}
