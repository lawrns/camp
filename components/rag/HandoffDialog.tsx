// This file is deprecated - use components/shared/HandoffDialog.tsx instead

// Use centralized Agent type
import type { Agent } from "@/types/entities";
import { HandoffDialog as UnifiedHandoffDialog } from "../shared/HandoffDialog";

// Re-export types for backward compatibility
export interface HandoffReason {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  urgency: "low" | "medium" | "high";
}

export type { Agent } from "@/types/entities";

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | number;
  currentAgent?: Agent;
  availableAgents?: Agent[];
  ragProfiles?: Array<{ id: string; name: string; description: string }>;
  onHandoff: (data: unknown) => Promise<void>;
}

export default function HandoffDialog({
  conversationId,
  currentAgent,
  availableAgents,
  ragProfiles,
  onHandoff,
  ...props
}: HandoffDialogProps) {
  // Convert to unified component props
  return (
    <UnifiedHandoffDialog
      {...props}
      conversationId={typeof conversationId === "string" ? conversationId : conversationId.toString()}
      currentContext={`Current agent: ${currentAgent?.name || "None"}, RAG enabled: ${!!ragProfiles && ragProfiles.length > 0}`}
      onHandoff={onHandoff}
    />
  );
}
