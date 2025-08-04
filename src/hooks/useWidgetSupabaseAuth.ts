/**
 * Widget Supabase Authentication Hook
 * 
 * Unified authentication approach using Supabase sessions with dedicated storage
 * to replace the separate JWT system and fix message broadcasting failures.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface WidgetSupabaseAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  organizationId: string | null;
  conversationId: string | null;
  visitorId: string | null;
  error: string | null;
}

export interface WidgetSupabaseAuthReturn extends WidgetSupabaseAuthState {
  signInAsVisitor: (organizationId: string, metadata?: unknown) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  refreshSession: () => Promise<void>;
}

export function useWidgetSupabaseAuth(organizationId: string): WidgetSupabaseAuthReturn {
  const [authState, setAuthState] = useState<WidgetSupabaseAuthState>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    user: null,
    organizationId: null,
    conversationId: null,
    visitorId: null,
    error: null,
  });

  const widgetClient = supabase.widget();

  // Initialize auth state from existing session
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data: { session }, error } = await widgetClient.auth.getSession();
      
      if (error) {
        console.error('[Widget Auth] Session error:', error);
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message,
          isAuthenticated: false,
          session: null,
          user: null 
        }));
        return;
      }

      if (session?.user) {
        const userMetadata = session.user.user_metadata || {};
        const appMetadata = session.user.app_metadata || {};
        
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          session,
          user: session.user,
          organizationId: userMetadata.organization_id || appMetadata.organization_id,
          conversationId: userMetadata.conversation_id,
          visitorId: userMetadata.visitor_id,
          error: null,
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          session: null,
          user: null,
          error: null,
        }));
      }
    } catch (error) {
      console.error('[Widget Auth] Initialize error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        isAuthenticated: false,
      }));
    }
  }, [widgetClient]);

  // Sign in as visitor with organization context
  const signInAsVisitor = useCallback(async (orgId: string, metadata: unknown = {}) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Generate visitor ID if not provided
      const visitorId = metadata.visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const conversationId = metadata.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create anonymous user with organization context
      const { data, error } = await widgetClient.auth.signInAnonymously({
        options: {
          data: {
            organization_id: orgId,
            visitor_id: visitorId,
            conversation_id: conversationId,
            widget_session: true,
            ...metadata,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.session?.user) {
        const userMetadata = data.session.user.user_metadata || {};
        
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          session: data.session,
          user: data.session.user,
          organizationId: orgId,
          conversationId: userMetadata.conversation_id,
          visitorId: userMetadata.visitor_id,
          error: null,
        }));
      }
    } catch (error) {
      console.error('[Widget Auth] Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
        isAuthenticated: false,
      }));
    }
  }, [widgetClient]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await widgetClient.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        session: null,
        user: null,
        organizationId: null,
        conversationId: null,
        visitorId: null,
        error: null,
      });
    } catch (error) {
      console.error('[Widget Auth] Sign out error:', error);
    }
  }, [widgetClient]);

  // Get authorization headers for API calls
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const { data: { session } } = await widgetClient.auth.getSession();
      
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        };
      }
      
      return {
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('[Widget Auth] Get headers error:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }, [widgetClient]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await widgetClient.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (data.session) {
        const userMetadata = data.session.user.user_metadata || {};
        
        setAuthState(prev => ({
          ...prev,
          session: data.session,
          user: data.session.user,
          organizationId: userMetadata.organization_id,
          conversationId: userMetadata.conversation_id,
          visitorId: userMetadata.visitor_id,
        }));
      }
    } catch (error) {
      console.error('[Widget Auth] Refresh error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Refresh failed',
      }));
    }
  }, [widgetClient]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = widgetClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Widget Auth] Auth state change:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          const userMetadata = session.user.user_metadata || {};
          
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            session,
            user: session.user,
            organizationId: userMetadata.organization_id,
            conversationId: userMetadata.conversation_id,
            visitorId: userMetadata.visitor_id,
            error: null,
          }));
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            session: null,
            user: null,
            organizationId: null,
            conversationId: null,
            visitorId: null,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const userMetadata = session.user.user_metadata || {};
          
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
            organizationId: userMetadata.organization_id,
            conversationId: userMetadata.conversation_id,
            visitorId: userMetadata.visitor_id,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [widgetClient]);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    ...authState,
    signInAsVisitor,
    signOut,
    getAuthHeaders,
    refreshSession,
  };
}
