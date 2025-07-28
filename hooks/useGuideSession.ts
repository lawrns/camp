import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type GuideSessionStatus = "planning" | "active" | "completed" | "cancelled";

interface GuideStep {
  id: string;
  completed: boolean;
  completedAt?: string;
}

interface GuideSessionState {
  id: string;
  conversationId?: number;
  status: GuideSessionStatus;
  currentStep: number;
  completedSteps: number[];
  steps: GuideStep[];
  startedAt?: Date;
  completedAt?: Date;
}

interface GuideSessionRecord {
  id: string;
  conversation_id: string | null;
  status: string;
  current_step: number | null;
  steps: GuideStep[] | null;
  created_at: string;
  completed_at: string | null;
  organization_id: string;
}

export function useGuideSession(sessionId: string, conversationId?: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<GuideSessionState | null>(null);

  // Fetch existing session - using ai_sessions as fallback since guide_sessions doesn't exist in types
  const { data: session, isLoading } = useQuery({
    queryKey: ["guide-session", sessionId],
    queryFn: async () => {
      // Note: guide_sessions table doesn't exist in current Supabase types
      // Using ai_sessions as temporary fallback
      const { data, error } = await supabase.from("ai_sessions").select("*").eq("id", sessionId).single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as GuideSessionRecord;
    },
  });

  // Initialize or update local state
  useEffect(() => {
    if (session) {
      setLocalState({
        id: session.id,
        conversationId: session.conversation_id ? parseInt(session.conversation_id, 10) : undefined,
        status: session.status as GuideSessionStatus,
        currentStep: session.current_step || 0,
        completedSteps: session.steps?.filter((s) => s.completed).map((_, index) => index) || [],
        steps: session.steps || [],
        startedAt: session.created_at ? new Date(session.created_at) : undefined,
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
      });
    }
  }, [session]);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      // Note: guide_sessions table doesn't exist in current Supabase types
      // Using ai_sessions as temporary fallback
      const { data, error } = await supabase
        .from("ai_sessions")
        .upsert({
          id: sessionId,
          conversation_id: conversationId,
          status: "active",
          current_step: 0,
          steps: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guide-session", sessionId] });

      // Track event
      trackGuideEvent("session_started", {
        sessionId,
        conversationId,
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<GuideSessionState>) => {
      // Note: guide_sessions table doesn't exist in current Supabase types
      // Using ai_sessions as temporary fallback
      const { data, error } = await supabase
        .from("ai_sessions")
        .update({
          status: updates.status,
          current_step: updates.currentStep !== undefined ? updates.currentStep : undefined,
          steps: updates.steps,
          completed_at: updates.completedAt?.toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guide-session", sessionId] });
    },
  });

  // Track guide events
  const trackGuideEvent = useCallback(
    async (event: string, metadata: any) => {
      try {
        // Note: analytics_events table doesn't exist in current Supabase types
        // Using activity_events as fallback
        if (session?.organization_id) {
          await supabase.from("activity_events").insert({
            action: `guide_${event}`,
            actor_type: "system",
            entity_type: "guide_session",
            entity_id: sessionId,
            description: JSON.stringify({
              sessionId,
              conversationId,
              ...metadata,
            }),
            organization_id: session.organization_id,
          });
        }
      } catch (error) {}
    },
    [supabase, sessionId, conversationId, session]
  );

  // Public methods
  const startSession = useCallback(() => {
    startSessionMutation.mutate();
  }, [startSessionMutation]);

  const nextStep = useCallback(() => {
    if (!localState) return;

    const newStep = Math.min(localState.currentStep + 1, localState.steps.length - 1);
    setLocalState({
      ...localState,
      currentStep: newStep,
    });

    updateSessionMutation.mutate({
      currentStep: newStep,
    });

    trackGuideEvent("step_advanced", {
      fromStep: localState.currentStep,
      toStep: newStep,
    });
  }, [localState, updateSessionMutation, trackGuideEvent]);

  const previousStep = useCallback(() => {
    if (!localState) return;

    const newStep = Math.max(localState.currentStep - 1, 0);
    setLocalState({
      ...localState,
      currentStep: newStep,
    });

    updateSessionMutation.mutate({
      currentStep: newStep,
    });
  }, [localState, updateSessionMutation]);

  const completeStep = useCallback(
    (stepIndex: number) => {
      if (!localState) return;

      const updatedSteps = [...localState.steps];
      if (updatedSteps[stepIndex]) {
        updatedSteps[stepIndex].completed = true;
        updatedSteps[stepIndex].completedAt = new Date().toISOString();
      }

      const completedSteps = updatedSteps.filter((s: any) => s.completed).map((_, index) => index);

      setLocalState({
        ...localState,
        steps: updatedSteps,
        completedSteps,
      });

      updateSessionMutation.mutate({
        steps: updatedSteps,
      });

      trackGuideEvent("step_completed", {
        stepIndex,
        stepId: updatedSteps[stepIndex]?.id,
      });
    },
    [localState, updateSessionMutation, trackGuideEvent]
  );

  const cancelSession = useCallback(() => {
    if (!localState) return;

    const updates = {
      status: "cancelled" as GuideSessionStatus,
      completedAt: new Date(),
    };

    setLocalState({
      ...localState,
      ...updates,
    });

    updateSessionMutation.mutate(updates);

    trackGuideEvent("session_cancelled", {
      currentStep: localState.currentStep,
      completedSteps: localState.completedSteps.length,
    });
  }, [localState, updateSessionMutation, trackGuideEvent]);

  const completeSession = useCallback(() => {
    if (!localState) return;

    const updates = {
      status: "completed" as GuideSessionStatus,
      completedAt: new Date(),
    };

    setLocalState({
      ...localState,
      ...updates,
    });

    updateSessionMutation.mutate(updates);

    trackGuideEvent("session_completed", {
      totalSteps: localState.steps.length,
      duration: Date.now() - (localState.startedAt?.getTime() || 0),
    });
  }, [localState, updateSessionMutation, trackGuideEvent]);

  return {
    // State
    currentStep: localState?.currentStep || 0,
    progress: localState?.completedSteps.length || 0,
    isActive: localState?.status === "active",
    isCompleted: localState?.status === "completed",
    session: localState,
    isLoading,

    // Methods
    startSession,
    nextStep,
    previousStep,
    completeStep,
    cancelSession,
    completeSession,
  };
}
