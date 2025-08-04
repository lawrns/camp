/**
 * Cookie Auth Storage Adapter
 * 
 * Robust cookie storage adapter that handles Supabase authentication cookies
 * with proper error handling and base64 decoding support.
 */

import { parseSupabaseCookie } from './extension-isolation';

export interface CookieAuthStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Browser Cookie Auth Storage Adapter
 * Handles Supabase authentication cookies with robust error handling
 */
export class BrowserCookieAuthStorageAdapter implements CookieAuthStorageAdapter {
  private isServer: boolean;

  constructor() {
    this.isServer = typeof window === 'undefined';
  }

  /**
   * Get item from cookies with safe parsing
   */
  getItem(key: string): string | null {
    if (this.isServer) {
      return null;
    }

    try {
      const cookies = document.cookie.split(';');
      
      for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split('=');
        
        if (name === key) {
          const value = valueParts.join('=');
          
          if (!value) {
            return null;
          }

          // Handle URL encoded values
          const decodedValue = decodeURIComponent(value);
          
          // Try to parse as Supabase cookie format
          const parsed = parseSupabaseCookie(decodedValue);
          if (parsed) {
            return JSON.stringify(parsed);
          }
          
          // Return raw value if parsing fails
          return decodedValue;
        }
      }
      
      return null;
    } catch (error) {
      // Suppress errors in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CookieAuthStorage] Failed to get cookie:', key, error);
      }
      return null;
    }
  }

  /**
   * Set item in cookies with proper encoding
   */
  setItem(key: string, value: string): void {
    if (this.isServer) {
      return;
    }

    try {
      // Encode the value to handle special characters
      const encodedValue = encodeURIComponent(value);
      
      // Set cookie with secure defaults
      const cookieOptions = [
        `${key}=${encodedValue}`,
        'path=/',
        'SameSite=Lax'
      ];

      // Add Secure flag in production
      if (window.location.protocol === 'https:') {
        cookieOptions.push('Secure');
      }

      document.cookie = cookieOptions.join('; ');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CookieAuthStorage] Failed to set cookie:', key, error);
      }
    }
  }

  /**
   * Remove item from cookies
   */
  removeItem(key: string): void {
    if (this.isServer) {
      return;
    }

    try {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CookieAuthStorage] Failed to remove cookie:', key, error);
      }
    }
  }
}

/**
 * Create a cookie storage adapter instance
 */
export function createCookieAuthStorageAdapter(): CookieAuthStorageAdapter {
  return new BrowserCookieAuthStorageAdapter();
}

/**
 * Safe cookie parsing utility function
 */
export function parseSupabaseCookieValue(cookieValue: string): unknown {
  return parseSupabaseCookie(cookieValue);
}
