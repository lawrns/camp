/**
 * Comprehensive Authentication Provider
 * 
 * Features:
 * - Token management integration
 * - Security monitoring
 * - Session persistence
 * - Multi-tab synchronization
 * - Error boundary integration
 * - Loading states
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';
import { tokenManager, useTokenManager } from '@/lib/auth/token-manager';
import { securityMonitor, logSecurityEvent } from '@/lib/security/security-monitor';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Security
  revokeSession: () => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function AuthProvider({ 
  children, 
  redirectTo = '/dashboard',
  requireAuth = false 
}: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use token manager hook
  const {
    user,
    session,
    isValid,
    isRefreshing,
    refreshToken,
    revokeSession: revokeCurrentSession,
    revokeAllSessions: revokeAllUserSessions,
  } = useTokenManager();

  // ============================================================================
  // AUTHENTICATION ACTIONS
  // ============================================================================

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      await logSecurityEvent('login_attempt', { email });

      const { data, error: authError } = await supabase.browser().auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        await logSecurityEvent('login_failure', { 
          email, 
          error: authError.message 
        }, 'medium');
        throw authError;
      }

      if (data.user) {
        await logSecurityEvent('login_success', { 
          email,
          userId: data.user.id 
        }, 'low');
        
        router.push(redirectTo);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router, redirectTo]);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata: Record<string, any> = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.browser().auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (authError) {
        throw authError;
      }

      await logSecurityEvent('login_attempt', { 
        email, 
        type: 'signup' 
      });

      if (data.user) {
        await logSecurityEvent('login_success', { 
          email,
          userId: data.user.id,
          type: 'signup'
        }, 'low');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUserId = user?.id;

      await supabase.browser().auth.signOut();

      if (currentUserId) {
        await logSecurityEvent('logout', { 
          userId: currentUserId 
        }, 'low');
      }

      router.push('/');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.browser().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (authError) {
        throw authError;
      }

      await logSecurityEvent('password_change', { 
        email,
        type: 'reset_request'
      }, 'medium');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.browser().auth.updateUser({
        password,
      });

      if (authError) {
        throw authError;
      }

      await logSecurityEvent('password_change', { 
        userId: user?.id,
        type: 'update'
      }, 'medium');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.browser().auth.updateUser({
        data: updates,
      });

      if (authError) {
        throw authError;
      }

      await logSecurityEvent('data_modification', { 
        resourceType: 'user_profile',
        resourceId: user?.id,
        changes: Object.keys(updates),
      }, 'low');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshSession = useCallback(async () => {
    try {
      setError(null);
      await refreshToken();
      
      await logSecurityEvent('token_refresh', { 
        userId: user?.id 
      }, 'low');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session refresh failed';
      setError(errorMessage);
      throw err;
    }
  }, [refreshToken, user?.id]);

  // ============================================================================
  // SECURITY ACTIONS
  // ============================================================================

  const revokeSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await revokeCurrentSession();

      await logSecurityEvent('session_revoked', { 
        userId: user?.id,
        type: 'current'
      }, 'medium');

      router.push('/');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session revocation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [revokeCurrentSession, user?.id, router]);

  const revokeAllSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await revokeAllUserSessions();

      await logSecurityEvent('session_revoked', { 
        userId: user?.id,
        type: 'all'
      }, 'high');

      router.push('/');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session revocation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [revokeAllUserSessions, user?.id, router]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    const userPermissions = user.user_metadata?.permissions || [];
    const userRole = user.user_metadata?.role;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    return userPermissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    return user.user_metadata?.role === role;
  }, [user]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Initial loading state management
    if (session !== null || !isValid) {
      setLoading(false);
    }
  }, [session, isValid]);

  useEffect(() => {
    // Handle authentication requirement
    if (!loading && requireAuth && !user) {
      router.push('/auth/login');
    }
  }, [loading, requireAuth, user, router]);

  useEffect(() => {
    // Set up token manager event listeners
    const handleTokenExpired = () => {
      setError('Your session has expired. Please sign in again.');
      logSecurityEvent('token_expired', { userId: user?.id }, 'medium');
    };

    const handleRefreshFailed = () => {
      setError('Session refresh failed. Please sign in again.');
    };

    tokenManager.on('session-expired', handleTokenExpired);
    tokenManager.on('refresh-failed', handleRefreshFailed);

    return () => {
      tokenManager.off('session-expired', handleTokenExpired);
      tokenManager.off('refresh-failed', handleRefreshFailed);
    };
  }, [user?.id]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextType = {
    // State
    user,
    session,
    loading,
    error,
    isRefreshing,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    
    // Security
    revokeSession,
    revokeAllSessions,
    
    // Utilities
    clearError,
    checkPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; redirectTo?: string } = {}
) {
  const { requireAuth = true, redirectTo = '/dashboard' } = options;

  return function AuthenticatedComponent(props: P) {
    return (
      <AuthProvider requireAuth={requireAuth} redirectTo={redirectTo}>
        <Component {...props} />
      </AuthProvider>
    );
  };
}

// ============================================================================
// PERMISSION GUARD COMPONENT
// ============================================================================

interface PermissionGuardProps {
  permission?: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ 
  permission, 
  role, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { checkPermission, hasRole } = useAuth();

  const hasAccess = permission ? checkPermission(permission) : 
                   role ? hasRole(role) : true;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
