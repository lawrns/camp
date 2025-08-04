"use client";

import { useWidgetAuth } from "@/hooks/useWidgetAuth";

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: unknown;
  token?: string | null;
  conversationId?: string | null;
}

export const useAuth = (organizationId: string): UseAuthReturn => {
  try {
    const widgetAuth = useWidgetAuth(organizationId);

    return {
      isAuthenticated: widgetAuth.isAuthenticated,
      isLoading: widgetAuth.isLoading,
      error: widgetAuth.error,
      user: widgetAuth.user,
      token: widgetAuth.token,
      conversationId: widgetAuth.conversationId,
    };
  } catch (error) {
    console.warn('[Widget useAuth] Auth context not available, using fallback:', error);
    
    // Return fallback auth state for widget
    return {
      isAuthenticated: true, // Widget should work without auth
      isLoading: false,
      error: null,
      user: {
        id: 'widget-user',
        displayName: 'Widget User',
        organizationId
      },
      token: 'widget-token',
      conversationId: null,
    };
  }
};
