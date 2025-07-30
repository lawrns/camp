"use client";

import React, { useState } from "react";
import { Robot, User, Clock, CheckCircle, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { useAIHandover } from "@/hooks/useAIHandover";

interface AIHandoverButtonProps {
  conversationId: string;
  organizationId: string;
  userId?: string;
  currentConfidence?: number;
  className?: string;
  variant?: "button" | "card" | "inline";
  showDetails?: boolean;
  disabled?: boolean;
}

export function AIHandoverButton({
  conversationId,
  organizationId,
  userId,
  currentConfidence = 0.85,
  className,
  variant = "button",
  showDetails = true,
  disabled = false,
}: AIHandoverButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const handover = useAIHandover(conversationId, organizationId, userId);

  const confidenceThreshold = 0.7;
  const isLowConfidence = currentConfidence < confidenceThreshold;
  const urgency = isLowConfidence ? "required" : currentConfidence < 0.8 ? "recommended" : "optional";

  const handleHandoverClick = async () => {
    if (handover.isAIActive) {
      await handover.stopHandover();
    } else {
      await handover.startHandover();
    }
    setShowConfirmation(false);
  };

  const getButtonText = () => {
    if (handover.isProcessing) return "Processing...";
    if (handover.isAIActive) return "Stop AI Assistant";

    switch (urgency) {
      case "required":
        return "AI Handover Required";
      case "recommended":
        return "AI Handover Recommended";
      default:
        return "Start AI Assistant";
    }
  };

  const getButtonVariant = () => {
    if (handover.isAIActive) return "outline";
    switch (urgency) {
      case "required":
        return "destructive";
      case "recommended":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusIcon = () => {
    if (handover.isProcessing) return Clock;
    if (handover.isAIActive) return Robot;
    if (isLowConfidence) return XCircle;
    return CheckCircle;
  };

  const getStatusColor = () => {
    if (handover.isProcessing) return "text-yellow-500";
    if (handover.isAIActive) return "text-purple-500";
    if (isLowConfidence) return "text-red-500";
    return "text-green-500";
  };

  if (variant === "card") {
    return (
      <Card className={cn("border-purple-200/50 bg-gradient-to-br from-purple-50 to-blue-50", className)}>
        <CardContent className="spacing-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon
                icon={getStatusIcon()}
                className={cn("h-5 w-5", getStatusColor(), handover.isProcessing && "animate-spin")}
              />
              <div>
                <div className="text-sm font-medium">AI Assistant</div>
                {showDetails && (
                  <div className="text-foreground text-tiny">Confidence: {Math.round(currentConfidence * 100)}%</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-ds-2">
              {showDetails && (
                <Badge variant={isLowConfidence ? "destructive" : "secondary"} className="text-tiny">
                  {Math.round(currentConfidence * 100)}%
                </Badge>
              )}
              <Button
                variant={getButtonVariant()}
                size="sm"
                onClick={handleHandoverClick}
                disabled={disabled || handover.isProcessing}
                className="text-tiny"
              >
                {handover.isProcessing ? (
                  <Icon icon={Clock} className="h-3 w-3 animate-spin" />
                ) : handover.isAIActive ? (
                  <Icon icon={Robot} className="h-3 w-3" />
                ) : (
                  <Icon icon={User} className="h-3 w-3" />
                )}
                <span className="ml-1">{handover.isAIActive ? "Active" : "Start"}</span>
              </Button>
            </div>
          </div>

          {handover.error && <div className="mt-2 text-tiny text-red-600">{handover.error}</div>}

          {handover.isProcessing && handover.processingProgress > 0 && (
            <div className="mt-2">
              <div className="h-1 overflow-hidden rounded-ds-full bg-gray-200">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${handover.processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon
          icon={getStatusIcon()}
          className={cn("h-4 w-4", getStatusColor(), handover.isProcessing && "animate-spin")}
        />
        <span className="text-sm font-medium">{handover.isAIActive ? "AI Active" : "AI Inactive"}</span>
        {showDetails && (
          <Badge variant={isLowConfidence ? "destructive" : "secondary"} className="text-tiny">
            {Math.round(currentConfidence * 100)}%
          </Badge>
        )}
        <Button
          variant={getButtonVariant()}
          size="sm"
          onClick={handleHandoverClick}
          disabled={disabled || handover.isProcessing}
          className="ml-2"
        >
          {handover.isProcessing ? (
            <Icon icon={Clock} className="h-3 w-3 animate-spin" />
          ) : handover.isAIActive ? (
            <Icon icon={Robot} className="h-3 w-3" />
          ) : (
            <Icon icon={User} className="h-3 w-3" />
          )}
          <span className="ml-1">{handover.isAIActive ? "Stop" : "Start"}</span>
        </Button>
      </div>
    );
  }

  // Default button variant
  return (
    <div className={className}>
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={handleHandoverClick}
        disabled={disabled || handover.isProcessing}
        className="flex items-center gap-ds-2 whitespace-nowrap"
      >
        {handover.isProcessing ? (
          <Icon icon={Clock} className="h-4 w-4 animate-spin flex-shrink-0" />
        ) : handover.isAIActive ? (
          <Icon icon={Robot} className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Icon icon={User} className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate">{getButtonText()}</span>
        {showDetails && (
          <Badge variant="secondary" className="ml-1 text-tiny">
            {Math.round(currentConfidence * 100)}%
          </Badge>
        )}
      </Button>

      {handover.error && <div className="mt-1 text-tiny text-red-600">{handover.error}</div>}
    </div>
  );
}
