/**
 * React Query Hook for Offline Support and Background Sync
 * Handles offline functionality and syncs data when back online
 */

import { useCallback, useEffect } from "react";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInboxStore } from "@/store/domains/inbox/inbox-store";
import { useUIStore } from "@/store/domains/ui/ui-store";

interface OfflineAction {
  id: string;
  type: "send_message" | "update_conversation" | "update_profile";
  payload: unknown;
  timestamp: number;
}

// Storage key for offline actions
const OFFLINE_ACTIONS_KEY = "campfire-offline-actions";

// Get offline actions from localStorage
function getOfflineActions(): OfflineAction[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(OFFLINE_ACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save offline actions to localStorage
function saveOfflineActions(actions: OfflineAction[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
}

// Add an offline action
function addOfflineAction(action: Omit<OfflineAction, "id" | "timestamp">) {
  const actions = getOfflineActions();
  const newAction: OfflineAction = {
    ...action,
    id: `offline-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  };

  actions.push(newAction);
  saveOfflineActions(actions);

  return newAction;
}

// Remove an offline action
function removeOfflineAction(actionId: string) {
  const actions = getOfflineActions();
  const filtered = actions.filter((a: unknown) => a.id !== actionId);
  saveOfflineActions(filtered);
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const isMutating = useIsMutating();
  const { addNotification } = useUIStore();

  // Check online status
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  // Sync offline actions when coming back online
  const syncOfflineActions = useCallback(async () => {
    const actions = getOfflineActions();
    if (actions.length === 0) return;

    addNotification({
      type: "info",
      message: `Syncing ${actions.length} offline actions...`,
    });

    for (const action of actions) {
      try {
        switch (action.type) {
          case "send_message":
            await fetch(`/api/conversations/${action.payload.conversationId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(action.payload),
            });
            break;

          case "update_conversation":
            await fetch(`/api/conversations/${action.payload.conversationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(action.payload.updates),
            });
            break;

          case "update_profile":
            await fetch(`/api/customers/${encodeURIComponent(action.payload.email)}/profile`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(action.payload.updates),
            });
            break;
        }

        // Remove successful action
        removeOfflineAction(action.id);
      } catch (error) {}
    }

    // Invalidate all queries to refresh data
    await queryClient.invalidateQueries();

    const remainingActions = getOfflineActions();
    if (remainingActions.length === 0) {
      addNotification({
        type: "success",
        message: "All offline actions synced successfully!",
      });
    } else {
      addNotification({
        type: "warning",
        message: `${remainingActions.length} actions still pending sync`,
      });
    }
  }, [queryClient, addNotification]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back online! Syncing data...");
      syncOfflineActions();
    };

    const handleOffline = () => {
      toast.warning("You are offline. Changes will be synced when connection is restored.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if we need to sync on mount
    if (isOnline && getOfflineActions().length > 0) {
      syncOfflineActions();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineActions, isOnline]);

  // Helper to queue an action when offline
  const queueOfflineAction = useCallback(
    (type: OfflineAction["type"], payload: unknown) => {
      if (!isOnline) {
        const action = addOfflineAction({ type, payload });

        toast.info("Action saved offline. Will sync when connection is restored.");
        return true;
      }
      return false;
    },
    [isOnline]
  );

  return {
    isOnline,
    isSyncing: isMutating > 0,
    pendingActions: getOfflineActions().length,
    queueOfflineAction,
    syncOfflineActions,
  };
}

// Hook to handle window focus refetching with smart logic
export function useSmartRefetchOnFocus() {
  const queryClient = useQueryClient();
  const { selectedConversationId } = useInboxStore();

  useEffect(() => {
    let lastFocusTime = Date.now();

    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime;

      // Only refetch if it's been more than 30 seconds since last focus
      if (timeSinceLastFocus > 30 * 1000) {
        // Refetch conversations
        queryClient.invalidateQueries({
          queryKey: ["campfire", "conversations"],
          exact: false,
        });

        // Refetch current conversation messages if any
        if (selectedConversationId) {
          queryClient.invalidateQueries({
            queryKey: ["campfire", "messages", selectedConversationId],
            exact: false,
          });
        }
      }

      lastFocusTime = now;
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient, selectedConversationId]);
}
