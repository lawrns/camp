import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface WorkflowRule {
  id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    id: string;
    type: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
  };
  actions: Array<{
    id: string;
    type: string;
    parameters: Record<string, any>;
    delay?: number;
  }>;
  organization_id?: string;
}

export function useWorkflow() {
  const supabaseClient = supabase.admin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch workflows
  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("ai_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as WorkflowRule[];
    },
  });

  // Create workflow
  const createWorkflow = useMutation({
    mutationFn: async (workflow: WorkflowRule) => {
      const { data, error } = await supabaseClient
        .from("ai_sessions")
        .insert({
          conversation_id: workflow.name, // Using conversation_id field for name
          organization_id: workflow.organization_id || "", // Required field for RLS
          context: {
            description: workflow.description,
            enabled: workflow.enabled,
            triggers: workflow.trigger,
            actions: workflow.actions,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: "Workflow created",
        description: "Your workflow has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update workflow
  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...workflow }: WorkflowRule & { id: string }) => {
      const { data, error } = await supabaseClient
        .from("ai_sessions")
        .update({
          conversation_id: workflow.name, // Using conversation_id field for name
          context: {
            description: workflow.description,
            enabled: workflow.enabled,
            triggers: workflow.trigger,
            actions: workflow.actions,
          },
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: "Workflow updated",
        description: "Your workflow has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseClient.from("ai_sessions").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle workflow
  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      // Get current context and update enabled status
      const { data: current, error: fetchError } = await supabaseClient
        .from("ai_sessions")
        .select("context")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const updatedContext = {
        ...current.context,
        enabled,
      };

      const { error } = await supabaseClient.from("ai_sessions").update({ context: updatedContext }).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow: createWorkflow.mutate,
    updateWorkflow: (id: string, workflow: WorkflowRule) => updateWorkflow.mutate({ id, ...workflow }),
    deleteWorkflow: deleteWorkflow.mutate,
    toggleWorkflow: toggleWorkflow.mutate,
    isCreating: createWorkflow.isPending,
    isUpdating: updateWorkflow.isPending,
    isDeleting: deleteWorkflow.isPending,
  };
}
