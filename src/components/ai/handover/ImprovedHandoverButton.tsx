/**
 * Improved Handover Button
 * Advanced AI-to-human handover with confidence indicators and smart routing
 */

"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle,
  Clock,
  Target,
  User,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

export interface HandoverReason {
  type: "confidence" | "complexity" | "escalation" | "manual" | "timeout";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  autoTrigger?: boolean;
}

export interface HandoverConfig {
  confidenceThreshold: number;
  complexityThreshold: number;
  timeoutThreshold: number; // in minutes
  availableAgents: number;
  estimatedWaitTime: number; // in minutes
}

export interface ImprovedHandoverButtonProps {
  conversationId: string;
  currentConfidence: number;
  complexity: number;
  reasons: HandoverReason[];
  config: HandoverConfig;
  onHandover: (reason: HandoverReason) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
  showDetails?: boolean;
  variant?: "button" | "card" | "inline";
}

export const ImprovedHandoverButton: React.FC<ImprovedHandoverButtonProps> = ({
  conversationId,
  currentConfidence,
  complexity,
  reasons,
  config,
  onHandover,
  onCancel,
  className,
  disabled = false,
  showDetails = true,
  variant = "button",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [selectedReason, setSelectedReason] = useState<HandoverReason | null>(null);

  // Determine handover urgency
  const getHandoverUrgency = (): "none" | "suggested" | "recommended" | "required" => {
    const criticalReasons = reasons.filter((r) => r.severity === "critical");
    const highReasons = reasons.filter((r) => r.severity === "high");

    if (criticalReasons.length > 0 || currentConfidence < 0.3) return "required";
    if (highReasons.length > 0 || currentConfidence < 0.5) return "recommended";
    if (reasons.length > 0 || currentConfidence < 0.7) return "suggested";
    return "none";
  };

  const urgency = getHandoverUrgency();

  const handleHandover = async (reason: HandoverReason) => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onHandover(reason);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = () => {
    switch (urgency) {
      case "required":
        return "text-red-600 border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)]";
      case "recommended":
        return "text-orange-600 border-orange-200 bg-orange-50";
      case "suggested":
        return "text-yellow-600 border-[var(--fl-color-warning-muted)] bg-[var(--fl-color-warning-subtle)]";
      default:
        return "text-green-600 border-[var(--fl-color-success-muted)] bg-[var(--fl-color-success-subtle)]";
    }
  };

  const getUrgencyIcon = () => {
    switch (urgency) {
      case "required":
        return AlertTriangle;
      case "recommended":
        return Target;
      case "suggested":
        return Zap;
      default:
        return CheckCircle;
    }
  };

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Badge variant={urgency === "none" ? "secondary" : "destructive"}>
          AI Confidence: {Math.round(currentConfidence * 100)}%
        </Badge>
        {urgency !== "none" && (
          <Button
            size="sm"
            variant={urgency === "required" ? "destructive" : "outline"}
            onClick={() => setShowReasons(!showReasons)}
            disabled={disabled || isLoading}
          >
            <Icon icon={User} className="mr-1 h-3 w-3" />
            Handover
          </Button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className={cn("w-full", getUrgencyColor(), className)}>
        <CardContent className="spacing-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-spacing-sm">
              <Icon icon={Bot} className="h-5 w-5" />
              <span className="font-medium">AI Assistant Status</span>
            </div>
            <Badge variant="outline">{Math.round(currentConfidence * 100)}% confident</Badge>
          </div>

          <Progress value={currentConfidence * 100} className="mb-3" />

          {showDetails && (
            <div className="mb-3 space-y-spacing-sm">
              <div className="text-sm">
                <span className="font-medium">Complexity:</span> {Math.round(complexity * 100)}%
              </div>
              <div className="text-sm">
                <span className="font-medium">Available agents:</span> {config.availableAgents}
              </div>
              <div className="text-sm">
                <span className="font-medium">Estimated wait:</span> {formatWaitTime(config.estimatedWaitTime)}
              </div>
            </div>
          )}

          {urgency !== "none" && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {urgency === "required"
                  ? "Handover Required"
                  : urgency === "recommended"
                    ? "Handover Recommended"
                    : "Handover Suggested"}
              </span>
              <Button
                size="sm"
                variant={urgency === "required" ? "destructive" : "default"}
                onClick={() => setShowReasons(true)}
                disabled={disabled || isLoading}
              >
                <Icon icon={ArrowRight} className="mr-1 h-3 w-3" />
                Transfer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default button variant
  return (
    <div className={className}>
      <Button
        variant={urgency === "required" ? "destructive" : urgency === "recommended" ? "default" : "outline"}
        size="sm"
        onClick={() => setShowReasons(true)}
        disabled={disabled || isLoading || urgency === "none"}
        className={cn("flex items-center space-x-2")}
      >
        {isLoading ? <Icon icon={Clock} className="h-4 w-4 animate-spin" /> : <Icon icon={User} className="h-4 w-4" />}
        <span>
          {urgency === "required"
            ? "Transfer Required"
            : urgency === "recommended"
              ? "Transfer Recommended"
              : urgency === "suggested"
                ? "Consider Transfer"
                : "Transfer to Agent"}
        </span>
        <Badge variant="secondary" className="ml-1">
          {Math.round(currentConfidence * 100)}%
        </Badge>
      </Button>

      {showReasons && (
        <Card className="absolute z-50 mt-2 w-80 shadow-card-deep">
          <CardContent className="spacing-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium">Handover Reasons</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowReasons(false)}>
                ×
              </Button>
            </div>

            <div className="mb-4 space-y-spacing-sm">
              {reasons.map((reason, index) => {
                const Icon = getUrgencyIcon();
                return (
                  <div
                    key={index}
                    className={cn(
                      "cursor-pointer rounded border spacing-2 transition-colors",
                      selectedReason === reason
                        ? "bg-status-info-light border-status-info-light"
                        : "hover:bg-[var(--fl-color-background-subtle)]"
                    )}
                    onClick={() => setSelectedReason(reason)}
                  >
                    <div className="flex items-center space-x-spacing-sm">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{reason.type}</span>
                      <Badge variant={reason.severity === "critical" ? "destructive" : "secondary"}>
                        {reason.severity}
                      </Badge>
                    </div>
                    <p className="text-foreground mt-1 text-tiny">{reason.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-spacing-sm">
              <Button
                size="sm"
                onClick={() => selectedReason && handleHandover(selectedReason)}
                disabled={!selectedReason || isLoading}
                className="flex-1"
              >
                Transfer Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowReasons(false);
                  onCancel?.();
                }}
                className="flex-1"
              >
                Continue AI
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImprovedHandoverButton;
