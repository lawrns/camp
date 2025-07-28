// This file is deprecated - use components/shared/HandoffDialog.tsx instead
import { HandoffDialog as UnifiedHandoffDialog } from "../shared/HandoffDialog";
import { useAgentHandoff } from "./AgentHandoffProvider";
import { useConversation } from "./ConversationProvider";

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentAssignee?: string;
  ragEnabled?: boolean;
}

export default function HandoffDialog(props: HandoffDialogProps) {
  // Convert the props to match the unified component's expected interface
  const unifiedProps = {
    open: props.open,
    onOpenChange: props.onOpenChange,
    conversationId: props.conversationId.toString(),
    currentContext: "",
    onHandoff: (data: any) => {
      // Handle handoff logic here
    },
  };

  return <UnifiedHandoffDialog {...unifiedProps} />;
}
