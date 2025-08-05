"use client";

import React from "react";
import { AlertTriangle as AlertTriangle, ArrowRight, Clock, MessageCircle as MessageSquare, User } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { HandoffData, HandoffReason, URGENCY_CONFIG } from "./types";

interface HandoffPreviewProps {
  handoffData: HandoffData;
  selectedReason?: HandoffReason;
  filteredAgents: unknown[];
}

export function HandoffPreview({ handoffData, selectedReason, filteredAgents }: HandoffPreviewProps) {
  const selectedAgent = filteredAgents.find((a) => a.id === handoffData.assignTo);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Handoff Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Handoff Flow Visualization */}
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-ds-full bg-primary/10">
              {handoffData.fromType === "visitor" ? (
                <Icon icon={User} className="h-8 w-8 text-primary" />
              ) : (
                <Icon icon={MessageSquare} className="h-8 w-8 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium capitalize">{handoffData.fromType}</p>
          </div>

          <Icon icon={ArrowRight} className="h-6 w-6 text-muted-foreground" />

          <div className="text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-ds-full bg-primary/10">
              {handoffData.toType === "agent" ? (
                <Icon icon={User} className="h-8 w-8 text-primary" />
              ) : (
                <Icon icon={MessageSquare} className="h-8 w-8 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium capitalize">{handoffData.toType}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {selectedReason && (
            <div className="flex items-start gap-ds-2">
              <Icon icon={MessageSquare} className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Reason</p>
                <p className="text-sm text-muted-foreground">{selectedReason.label}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-ds-2">
            <Icon icon={AlertTriangle} className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Priority</p>
              <Badge
                variant="outline"
                className={cn(
                  "mt-1",
                  URGENCY_CONFIG[handoffData.urgency].color,
                  URGENCY_CONFIG[handoffData.urgency].bgColor,
                  URGENCY_CONFIG[handoffData.urgency].borderColor
                )}
              >
                {URGENCY_CONFIG[handoffData.urgency].label}
              </Badge>
            </div>
          </div>

          {selectedAgent && (
            <div className="flex items-start gap-ds-2">
              <Icon icon={User} className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Assigned to</p>
                <p className="text-sm text-muted-foreground">{selectedAgent.name}</p>
                <div className="mt-1 flex gap-ds-2">
                  <Badge variant="secondary" className="text-tiny">
                    {selectedAgent.status}
                  </Badge>
                  <Badge variant="secondary" className="text-tiny">
                    {selectedAgent.activeChats || 0} active chats
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {handoffData.customNote && (
            <div className="flex items-start gap-ds-2">
              <Icon icon={MessageSquare} className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Additional Notes</p>
                <p className="text-sm text-muted-foreground">{handoffData.customNote}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-ds-2">
            <Icon icon={Clock} className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Estimated Response Time</p>
              <p className="text-sm text-muted-foreground">
                {handoffData.urgency === "critical"
                  ? "< 5 minutes"
                  : handoffData.urgency === "high"
                    ? "< 15 minutes"
                    : handoffData.urgency === "medium"
                      ? "< 30 minutes"
                      : "< 1 hour"}
              </p>
            </div>
          </div>
        </div>

        {/* Warning for critical handoffs */}
        {handoffData.urgency === "critical" && (
          <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
            <div className="text-red-600-dark flex items-center gap-ds-2">
              <Icon icon={AlertTriangle} className="h-4 w-4" />
              <p className="text-sm font-medium">Critical Priority</p>
            </div>
            <p className="mt-1 text-sm text-red-600">This handoff requires immediate attention</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
