"use client";

import React, { useEffect } from "react";
import { HandoverQueueSimulation } from "./HandoverQueueSimulation";
import { useAIHandoverWithQueue } from "@/hooks/useAIHandoverWithQueue";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/entities/message";

interface AIHandoverManagerProps {
  conversationId: string;
  organizationId: string;
  userId?: string;
  messages: Message[];
  className?: string;
  children?: React.ReactNode;
}

export function AIHandoverManager({
  conversationId,
  organizationId,
  userId,
  messages,
  className,
  children,
}: AIHandoverManagerProps) {
  const handover = useAIHandoverWithQueue(conversationId, organizationId, userId);

  // Check confidence on new messages
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.senderType === "ai") {
      handover.checkConfidenceAndTriggerHandover(latestMessage);
    }
  }, [messages, handover]);

  return (
    <div className={cn("relative", className)}>
      {/* Status Badge */}
      {(handover.isAIActive || handover.queueState.assignedAgentName) && (
        <div className="absolute right-4 top-4 z-10">
          <Badge
            variant={handover.queueState.assignedAgentName ? "default" : "secondary"}
            className="flex items-center gap-1.5"
          >
            {handover.queueState.assignedAgentName ? (
              <>
                <User className="h-3 w-3" />
                Agent {handover.queueState.assignedAgentName}
              </>
            ) : (
              <>
                <Bot className="h-3 w-3" />
                AI Assistant
              </>
            )}
          </Badge>
        </div>
      )}

      {/* Confidence Indicator (for debugging/demo) */}
      {process.env.NODE_ENV === "development" && handover.isAIActive && (
        <div className="absolute left-4 top-4 z-10">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              handover.confidence < 0.7 ? "border-[var(--fl-color-danger)] text-red-600" : "border-[var(--fl-color-success)] text-green-600"
            )}
          >
            Confidence: {(handover.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      )}

      {/* Queue Simulation */}
      <HandoverQueueSimulation
        isVisible={handover.queueState.showQueueSimulation}
        onComplete={handover.completeHandoverSimulation}
      />

      {/* Children (conversation interface) */}
      {children}
    </div>
  );
}
