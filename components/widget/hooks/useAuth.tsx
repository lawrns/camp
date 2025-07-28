"use client";

import { useWidgetAuth } from "@/hooks/useWidgetAuth";

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: any;
  token?: string | null;
  conversationId?: string | null;
}

export const useAuth = (organizationId: string): UseAuthReturn => {
  const widgetAuth = useWidgetAuth(organizationId);

  return {
    isAuthenticated: widgetAuth.isAuthenticated,
    isLoading: widgetAuth.isLoading,
    error: widgetAuth.error,
    user: widgetAuth.user,
    token: widgetAuth.token,
    conversationId: widgetAuth.conversationId,
  };
};
