/**
 * Widget Supabase Authentication Hook
 * 
 * Provides unified authentication for widget components using Supabase sessions
 * with dedicated storage key to prevent conflicts with dashboard authentication.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { widgetDebugger } from '@/lib/utils/widget-debug';

interface WidgetUser {
  id: string;
  email?: string;
  organizationId: string;
  visitorId?: string;
  conversationId?: string;
  metadata?: any;
}

interface WidgetAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: WidgetUser | null;
  session: any;
  error: string | null;
}

interface WidgetAuthActions {
  signInAsVisitor: (organizationId: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  refreshSession: () => Promise<void>;
}

export function useWidgetSupabaseAuth(organizationId: string): WidgetAuthState & WidgetAuthActions {
  const [state, setState] = useState<WidgetAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    session: null,
    error: null,
  });

  // Use ref to store organizationId to avoid dependency issues
  const organizationIdRef = useRef(organizationId);
  organizationIdRef.current = organizationId;

  // Get widget-specific Supabase client (stable reference)
  const getWidgetClient = useCallback(() => {
    return supabase.widget();
  }, []); // No dependencies to ensure stable reference

  // Initialize authentication state (only once)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (!isMounted) return;

        widgetDebugger.logAuth('info', 'Initializing widget authentication', { organizationId });
        widgetDebugger.updateAuthStatus('loading');

        const client = getWidgetClient();
        widgetDebugger.logSupabase('info', 'Getting widget client session');
        widgetDebugger.updateSupabaseStatus('connected');

        const { data: { session }, error } = await client.auth.getSession();

        if (!isMounted) return;

        if (error) {
          widgetDebugger.logAuth('error', 'Session error during initialization', error);
          widgetDebugger.updateAuthStatus('failed');
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
          return;
        }

        if (session?.user) {
          const userMetadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};

          const user: WidgetUser = {
            id: session.user.id,
            email: session.user.email,
            organizationId: userMetadata.organization_id || appMetadata.organization_id || organizationIdRef.current,
            visitorId: userMetadata.visitor_id,
            conversationId: userMetadata.conversation_id,
            metadata: userMetadata,
          };

          if (!isMounted) return;

          widgetDebugger.logAuth('info', 'Session found, user authenticated', {
            userId: user.id,
            organizationId: user.organizationId,
            visitorId: user.visitorId,
            conversationId: user.conversationId,
          });
          widgetDebugger.updateAuthStatus('authenticated', session.access_token);
          widgetDebugger.updateOrganizationId(user.organizationId);
          if (user.conversationId) {
            widgetDebugger.updateConversationId(user.conversationId);
          }

          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            user,
            session,
            error: null,
          }));
        } else {
          if (!isMounted) return;

          widgetDebugger.logAuth('info', 'No session found, user not authenticated');
          widgetDebugger.updateAuthStatus('disconnected');
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            user: null,
            session: null,
            error: null,
          }));
        }
      } catch (error) {
        if (!isMounted) return;

        widgetDebugger.logAuth('error', 'Authentication initialization failed', error);
        widgetDebugger.updateAuthStatus('failed');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        }));
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [getWidgetClient]); // Remove organizationId dependency to prevent re-initialization

  // Listen for auth state changes (stable subscription)
  useEffect(() => {
    const client = getWidgetClient();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        widgetDebugger.logAuth('info', `Auth state change: ${event}`, {
          userId: session?.user?.id,
          hasSession: !!session
        });

        if (event === 'SIGNED_IN' && session?.user) {
          const userMetadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};

          const user: WidgetUser = {
            id: session.user.id,
            email: session.user.email,
            organizationId: userMetadata.organization_id || appMetadata.organization_id || organizationIdRef.current,
            visitorId: userMetadata.visitor_id,
            conversationId: userMetadata.conversation_id,
            metadata: userMetadata,
          };

          widgetDebugger.logAuth('info', 'User signed in successfully', {
            userId: user.id,
            organizationId: user.organizationId,
            visitorId: user.visitorId,
          });
          widgetDebugger.updateAuthStatus('authenticated', session.access_token);
          widgetDebugger.updateOrganizationId(user.organizationId);
          if (user.conversationId) {
            widgetDebugger.updateConversationId(user.conversationId);
          }

          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            user,
            session,
            error: null,
          }));
        } else if (event === 'SIGNED_OUT') {
          widgetDebugger.logAuth('info', 'User signed out');
          widgetDebugger.updateAuthStatus('disconnected');
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            user: null,
            session: null,
            error: null,
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getWidgetClient]); // Remove organizationId dependency to prevent subscription recreation

  // Sign in as anonymous visitor
  const signInAsVisitor = useCallback(async (orgId: string, metadata: any = {}) => {
    try {
      widgetDebugger.logAuth('info', 'Starting visitor sign-in process', { orgId, metadata });
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const client = getWidgetClient();

      // Generate unique visitor credentials
      const visitorId = metadata.visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create conversation via API first to get a proper UUID
      let conversationId = metadata.conversationId;
      if (!conversationId) {
        try {
          const convResponse = await fetch('/api/widget/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organizationId: orgId,
              visitorId: visitorId,
              customerName: metadata.customerName || 'Anonymous Visitor',
              customerEmail: metadata.customerEmail || null,
            }),
          });

          if (convResponse.ok) {
            const convData = await convResponse.json();
            conversationId = convData.conversation?.id;
            widgetDebugger.logAuth('info', 'Created conversation via API', { conversationId });
          } else {
            // Fallback to generated ID if API fails
            conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            widgetDebugger.logAuth('warn', 'Failed to create conversation via API, using fallback', { conversationId });
          }
        } catch (error) {
          // Fallback to generated ID if API fails
          conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          widgetDebugger.logAuth('warn', 'Error creating conversation via API, using fallback', { error, conversationId });
        }
      }

      widgetDebugger.logAuth('info', 'Generated visitor credentials', { visitorId, conversationId });
      widgetDebugger.updateOrganizationId(orgId);
      widgetDebugger.updateConversationId(conversationId);

      // Sign in anonymously with metadata
      const authData = {
        organization_id: orgId,
        visitor_id: visitorId,
        conversation_id: conversationId,
        source: 'widget',
        ...metadata,
      };

      widgetDebugger.logAuth('info', 'Attempting anonymous sign-in', authData);

      const { data, error } = await client.auth.signInAnonymously({
        options: {
          data: authData,
        },
      });

      if (error) {
        throw error;
      }

      // Wait for session to be fully established before proceeding
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the session is properly set
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Failed to establish session after sign-in');
      }

      // Debug the JWT token structure
      if (session?.access_token) {
        try {
          // Decode JWT to see its structure (without verification)
          const tokenParts = session.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 JWT Token Debug:', {
              aud: payload.aud,
              iss: payload.iss,
              role: payload.role,
              exp: payload.exp,
              iat: payload.iat,
              user_metadata: payload.user_metadata,
              app_metadata: payload.app_metadata
            });
          }
        } catch (e) {
          console.warn('Failed to decode JWT for debugging:', e);
        }
      }

      widgetDebugger.logAuth('info', 'Visitor sign-in successful', {
        visitorId,
        userId: data.user?.id,
        sessionId: data.session?.access_token?.substring(0, 20) + '...',
        sessionEstablished: !!session,
        tokenAudience: session?.access_token ? 'decoded above' : 'no token'
      });
    } catch (error) {
      widgetDebugger.logAuth('error', 'Visitor sign-in failed', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
    }
  }, [getWidgetClient]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const client = getWidgetClient();
      await client.auth.signOut();
      console.log('[Widget Auth] Signed out');
    } catch (error) {
      console.error('[Widget Auth] Sign out error:', error);
    }
  }, [getWidgetClient]);

  // Get authentication headers for API calls
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const client = getWidgetClient();
      const { data: { session } } = await client.auth.getSession();
      
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'X-Organization-Id': state.user?.organizationId || organizationId,
        };
      }
      
      return {
        'X-Organization-Id': organizationId,
      };
    } catch (error) {
      console.error('[Widget Auth] Get headers error:', error);
      return {
        'X-Organization-Id': organizationId,
      };
    }
  }, [getWidgetClient, state.user?.organizationId, organizationId]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const client = getWidgetClient();
      const { data, error } = await client.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      console.log('[Widget Auth] Session refreshed');
    } catch (error) {
      console.error('[Widget Auth] Refresh error:', error);
    }
  }, [getWidgetClient]);

  return {
    ...state,
    signInAsVisitor,
    signOut,
    getAuthHeaders,
    refreshSession,
  };
}
