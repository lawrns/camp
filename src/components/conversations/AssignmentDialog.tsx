"use client";

import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { AssignmentPanel } from "./AssignmentPanel";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string;
  currentAgentId?: string;
  organizationId: string;
  onAssignmentChange?: (agentId: string) => void;
  className?: string;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  conversationId,
  currentAgentId,
  organizationId,
  onAssignmentChange,
  className,
}: AssignmentDialogProps) {
  if (!conversationId) return null;

  const handleAssignmentChange = (agentId: string) => {
    onAssignmentChange?.(agentId);
    // Close dialog after successful assignment with a slight delay for visual feedback
    setTimeout(() => onOpenChange(false), 500);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      aria-labelledby="assignment-modal-title"
      aria-describedby="assignment-modal-description"
      role="dialog"
      tabIndex={-1}
    >
      <DialogContent className={cn("max-w-md ds-modal", className)}>
        <DialogHeader className="ds-modal-header">
          <DialogTitle id="assignment-modal-title" className="flex items-center gap-ds-2 text-base font-semibold">
            <Icon icon={UserPlus} className="h-5 w-5" />
            Assign Conversation
          </DialogTitle>
          <DialogDescription id="assignment-modal-description">
            Assign this conversation to an available operator or agent.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 ds-modal-body">
          <AssignmentPanel
            conversationId={conversationId}
            currentAgentId={currentAgentId || ""}
            organizationId={organizationId}
            onAssignmentChange={handleAssignmentChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
