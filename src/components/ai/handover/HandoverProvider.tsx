/**
 * Handover Provider
 *
 * Context provider for managing AI to human handover state
 */

import React, { createContext, useCallback, useContext, useState } from "react";

export interface HandoverState {
  isHandoverActive: boolean;
  handoverReason?: string;
  assignedAgent?: string;
  handoverTimestamp?: Date;
  conversationId?: string;
}

export interface HandoverContextType {
  handoverState: HandoverState;
  initiateHandover: (conversationId: string, reason: string) => Promise<void>;
  completeHandover: (agentId: string) => Promise<void>;
  cancelHandover: () => void;
  isLoading: boolean;
}

const HandoverContext = createContext<HandoverContextType | undefined>(undefined);

export const useHandover = () => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error("useHandover must be used within a HandoverProvider");
  }
  return context;
};

interface HandoverProviderProps {
  children: React.ReactNode;
}

export const HandoverProvider: React.FC<HandoverProviderProps> = ({ children }) => {
  const [handoverState, setHandoverState] = useState<HandoverState>({
    isHandoverActive: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const initiateHandover = useCallback(async (conversationId: string, reason: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/handover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetOperatorId: "ai", // Handover to AI system
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Handover failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setHandoverState({
          isHandoverActive: true,
          handoverReason: reason,
          handoverTimestamp: new Date(),
          conversationId,
        });
      } else {
        throw new Error(result.error || "Handover failed");
      }
    } catch (error) {

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeHandover = useCallback(
    async (agentId: string) => {
      setIsLoading(true);
      try {
        if (!handoverState.conversationId) {
          throw new Error("No active handover to complete");
        }

        const response = await fetch(`/api/conversations/${handoverState.conversationId}/handover`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetOperatorId: agentId,
            reason: "handover_completion",
          }),
        });

        if (!response.ok) {
          throw new Error(`Handover completion failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setHandoverState((prev) => ({
            ...prev,
            assignedAgent: agentId,
          }));
        } else {
          throw new Error(result.error || "Handover completion failed");
        }
      } catch (error) {

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handoverState.conversationId]
  );

  const cancelHandover = useCallback(() => {
    setHandoverState({
      isHandoverActive: false,
    });
  }, []);

  const value: HandoverContextType = {
    handoverState,
    initiateHandover,
    completeHandover,
    cancelHandover,
    isLoading,
  };

  return <HandoverContext.Provider value={value}>{children}</HandoverContext.Provider>;
};

export default HandoverProvider;
