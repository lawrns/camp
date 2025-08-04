/**
 * Agent Handoff Provider
 * Context provider for managing agent handoff state and operations
 */

"use client";

import React, { createContext, useCallback, useContext, useReducer } from "react";

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "offline" | "busy" | "away";
  skills: string[];
  capacity: number; // 0-100
  current_conversations: number;
  max_conversations: number;
  response_time_avg: number; // in minutes
  satisfaction_score: number; // 0-5
}

export interface HandoffRequest {
  id: string;
  conversation_id: string;
  from_agent_id?: string;
  to_agent_id?: string;
  reason: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  created_at: string;
  completed_at?: string;
  notes?: string;
}

export interface HandoffState {
  agents: Agent[];
  activeHandoffs: HandoffRequest[];
  loading: boolean;
  error: string | null;
  selectedAgent?: Agent | undefined;
}

type HandoffAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_AGENTS"; payload: Agent[] }
  | { type: "SET_ACTIVE_HANDOFFS"; payload: HandoffRequest[] }
  | { type: "ADD_HANDOFF"; payload: HandoffRequest }
  | { type: "UPDATE_HANDOFF"; payload: HandoffRequest }
  | { type: "REMOVE_HANDOFF"; payload: string }
  | { type: "SELECT_AGENT"; payload: Agent | undefined }
  | { type: "UPDATE_AGENT_STATUS"; payload: { agentId: string; status: Agent["status"] } };

const initialState: HandoffState = {
  agents: [],
  activeHandoffs: [],
  loading: false,
  error: null,
};

function handoffReducer(state: HandoffState, action: HandoffAction): HandoffState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_AGENTS":
      return { ...state, agents: action.payload, loading: false };

    case "SET_ACTIVE_HANDOFFS":
      return { ...state, activeHandoffs: action.payload, loading: false };

    case "ADD_HANDOFF":
      return {
        ...state,
        activeHandoffs: [...state.activeHandoffs, action.payload],
        loading: false,
      };

    case "UPDATE_HANDOFF":
      return {
        ...state,
        activeHandoffs: state.activeHandoffs.map((handoff) =>
          handoff.id === action.payload.id ? action.payload : handoff
        ),
      };

    case "REMOVE_HANDOFF":
      return {
        ...state,
        activeHandoffs: state.activeHandoffs.filter((handoff) => handoff.id !== action.payload),
      };

    case "SELECT_AGENT":
      return { ...state, selectedAgent: action.payload };

    case "UPDATE_AGENT_STATUS":
      return {
        ...state,
        agents: state.agents.map((agent) =>
          agent.id === action.payload.agentId ? { ...agent, status: action.payload.status } : agent
        ),
      };

    default:
      return state;
  }
}

export interface HandoffContextValue {
  state: HandoffState;
  actions: {
    loadAgents: () => Promise<void>;
    loadActiveHandoffs: () => Promise<void>;
    requestHandoff: (
      conversationId: string,
      reason: string,
      priority: HandoffRequest["priority"]
    ) => Promise<HandoffRequest>;
    acceptHandoff: (handoffId: string) => Promise<void>;
    declineHandoff: (handoffId: string, reason?: string) => Promise<void>;
    completeHandoff: (handoffId: string) => Promise<void>;
    cancelHandoff: (handoffId: string) => Promise<void>;
    selectAgent: (agent?: Agent) => void;
    updateAgentStatus: (agentId: string, status: Agent["status"]) => Promise<void>;
    getAvailableAgents: (skills?: string[]) => Agent[];
    getBestAgent: (conversationId: string, skills?: string[]) => Agent | null;
  };
  // Additional properties for MessagePanel compatibility
  requestHumanHandoff?: (conversationId: string, reason?: string) => Promise<void>;
  requestAIHandoff?: (conversationId: string, reason?: string) => Promise<void>;
}

const HandoffContext = createContext<HandoffContextValue | null>(null);

export function useAgentHandoff(): HandoffContextValue {
  const context = useContext(HandoffContext);
  if (!context) {
    throw new Error("useAgentHandoff must be used within an AgentHandoffProvider");
  }
  return context;
}

export interface AgentHandoffProviderProps {
  children: React.ReactNode;
  organizationId: string;
}

export const AgentHandoffProvider: React.FC<AgentHandoffProviderProps> = ({ children, organizationId }) => {
  const [state, dispatch] = useReducer(handoffReducer, initialState);

  const loadAgents = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(`/api/organizations/${organizationId}/agents`, {
        credentials: "include", // CRITICAL FIX: Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error("Failed to load agents");
      }

      const agents = await response.json();
      dispatch({ type: "SET_AGENTS", payload: agents });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to load agents",
      });
    }
  }, [organizationId]);

  const loadActiveHandoffs = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(`/api/organizations/${organizationId}/handoffs`, {
        credentials: "include", // CRITICAL FIX: Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error("Failed to load handoffs");
      }

      const handoffs = await response.json();
      dispatch({ type: "SET_ACTIVE_HANDOFFS", payload: handoffs });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to load handoffs",
      });
    }
  }, [organizationId]);

  const requestHandoff = useCallback(
    async (conversationId: string, reason: string, priority: HandoffRequest["priority"]): Promise<HandoffRequest> => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await fetch(`/api/conversations/${conversationId}/handoff`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
            priority,
            organization_id: organizationId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to request handoff");
        }

        const handoff = await response.json();
        dispatch({ type: "ADD_HANDOFF", payload: handoff });
        return handoff;
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to request handoff",
        });
        throw error;
      }
    },
    [organizationId]
  );

  const acceptHandoff = useCallback(async (handoffId: string) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to accept handoff");
      }

      const updatedHandoff = await response.json();
      dispatch({ type: "UPDATE_HANDOFF", payload: updatedHandoff });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to accept handoff",
      });
      throw error;
    }
  }, []);

  const declineHandoff = useCallback(async (handoffId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to decline handoff");
      }

      const updatedHandoff = await response.json();
      dispatch({ type: "UPDATE_HANDOFF", payload: updatedHandoff });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to decline handoff",
      });
      throw error;
    }
  }, []);

  const completeHandoff = useCallback(async (handoffId: string) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete handoff");
      }

      dispatch({ type: "REMOVE_HANDOFF", payload: handoffId });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to complete handoff",
      });
      throw error;
    }
  }, []);

  const cancelHandoff = useCallback(async (handoffId: string) => {
    try {
      const response = await fetch(`/api/handoffs/${handoffId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel handoff");
      }

      dispatch({ type: "REMOVE_HANDOFF", payload: handoffId });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to cancel handoff",
      });
      throw error;
    }
  }, []);

  const selectAgent = useCallback((agent?: Agent) => {
    dispatch({ type: "SELECT_AGENT", payload: agent });
  }, []);

  const updateAgentStatus = useCallback(async (agentId: string, status: Agent["status"]) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update agent status");
      }

      dispatch({ type: "UPDATE_AGENT_STATUS", payload: { agentId, status } });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to update agent status",
      });
      throw error;
    }
  }, []);

  const getAvailableAgents = useCallback(
    (skills?: string[]): Agent[] => {
      return state.agents.filter((agent) => {
        // Must be online and have capacity
        if (agent.status !== "online" || agent.current_conversations >= agent.max_conversations) {
          return false;
        }

        // If skills are specified, agent must have at least one matching skill
        if (skills && skills.length > 0) {
          return skills.some((skill) => agent.skills.includes(skill));
        }

        return true;
      });
    },
    [state.agents]
  );

  const getBestAgent = useCallback(
    (conversationId: string, skills?: string[]): Agent | null => {
      const availableAgents = getAvailableAgents(skills);

      if (availableAgents.length === 0) {
        return null;
      }

      // Score agents based on capacity, response time, and satisfaction
      const scoredAgents = availableAgents.map((agent) => {
        let score = 0;

        // Lower capacity is better (more availability)
        score += (100 - agent.capacity) * 0.4;

        // Lower response time is better
        score += (60 - Math.min(agent.response_time_avg, 60)) * 0.3;

        // Higher satisfaction is better
        score += agent.satisfaction_score * 20 * 0.3;

        return { agent, score };
      });

      // Sort by score (descending) and return the best agent
      scoredAgents.sort((a, b) => b.score - a.score);
      return scoredAgents[0]?.agent || null;
    },
    [getAvailableAgents]
  );

  const requestHumanHandoff = useCallback(
    async (conversationId: string, reason?: string) => {
      await requestHandoff(conversationId, reason || "Customer requested human assistance", "medium");
    },
    [requestHandoff]
  );

  const requestAIHandoff = useCallback(
    async (conversationId: string, reason?: string) => {
      // For AI handoff, we can use the same mechanism but with different priority/handling
      await requestHandoff(conversationId, reason || "Handoff to AI assistant", "low");
    },
    [requestHandoff]
  );

  const contextValue: HandoffContextValue = {
    state,
    actions: {
      loadAgents,
      loadActiveHandoffs,
      requestHandoff,
      acceptHandoff,
      declineHandoff,
      completeHandoff,
      cancelHandoff,
      selectAgent,
      updateAgentStatus,
      getAvailableAgents,
      getBestAgent,
    },
    requestHumanHandoff,
    requestAIHandoff,
  };

  return <HandoffContext.Provider value={contextValue}>{children}</HandoffContext.Provider>;
};

export default AgentHandoffProvider;
