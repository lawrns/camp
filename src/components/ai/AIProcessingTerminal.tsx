"use client";

import { useEffect, useRef, useState } from "react";
import { cookies } from "next/headers";
import {
  AlertCircle,
  Bot,
  CheckCircle,
  MessageSquare,
  Pause,
  Play,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { createServerClient } from "@/lib/core/auth";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface AIProcessingLog {
  id: string;
  timestamp: string;
  event: string;
  data: unknown;
  source: string;
  type?: "info" | "warning" | "error" | "success" | "processing";
  title?: string;
  message?: string;
  metadata?: unknown;
  duration?: number;
}

interface AITerminalProps {
  conversationId?: string;
  organizationId?: string;
  className?: string;
  maxLogs?: number;
}

export function AIProcessingTerminal({ conversationId, organizationId, className, maxLogs = 100 }: AITerminalProps) {
  const { user } = useAuth();
  const authOrgId = user?.organizationId;
  const [logs, setLogs] = useState<AIProcessingLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [aiSessionActive, setAiSessionActive] = useState(false);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabaseClient = createServerClient(cookies());

  // Use the organization ID from props or auth
  const effectiveOrgId = organizationId || authOrgId;

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Add log entry
  const addLog = (log: Omit<AIProcessingLog, "id" | "timestamp">) => {
    if (isPaused) return; // Don't add logs when paused

    const newLog: AIProcessingLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      event: log.event || "system",
      data: log.data || {},
      source: log.source || "system",
    };

    // Extract confidence from log data
    if (newLog.data?.confidence !== undefined) {
      setLastConfidence(newLog.data.confidence);
    }

    setLogs((prev) => {
      const updated = [...prev, newLog];
      // Keep only last maxLogs entries
      return updated.slice(-maxLogs);
    });
  };

  // Mock AI processing logs for demonstration
  useEffect(() => {
    if (!conversationId || !effectiveOrgId) return;

    // Start with initial connection log
    addLog({
      event: "terminal_connected",
      data: { conversationId, organizationId: effectiveOrgId },
      source: "system",
      type: "success",
      title: "Terminal Connected",
      message: "AI Processing Terminal is monitoring this conversation",
    });

    // Set up real-time monitoring for AI processing events
    const channelName = `org:${effectiveOrgId}:ai-terminal`;

    const channel = supabaseClient
      .channel(channelName)
      .on(
        "broadcast",
        {
          event: "ai_processing_update",
        },
        (payload: { payload: unknown }) => {
          const eventData = payload.payload;

          // Only process events for this conversation
          if (eventData.conversationId !== conversationId) return;

          const logEntry: AIProcessingLog = {
            id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: eventData.timestamp || new Date().toISOString(),
            event: eventData.event,
            data: eventData.data,
            source: eventData.source || "ai_processor",
            type: eventData.type || "info",
            title:
              eventData.title || eventData.event.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
            message: eventData.message || "AI processing event",
            metadata: eventData.data,
            duration: eventData.data?.processingTime,
          };

          setLogs((prev) => [...prev.slice(-(maxLogs - 1)), logEntry]);

          // Update AI session status based on events
          if (eventData.event === "ai_processing_started") {
            setAiSessionActive(true);
          } else if (eventData.event === "ai_response_sent") {
            // Keep active for a bit after response
            setTimeout(() => setAiSessionActive(false), 2000);
          } else if (eventData.event === "escalated_to_human") {
            setAiSessionActive(false);
          } else if (eventData.event === "processing_error") {
            setAiSessionActive(false);
          }

          // Extract confidence from events
          if (eventData.data?.confidence !== undefined) {
            setLastConfidence(eventData.data.confidence);
          }
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          addLog({
            event: "realtime_connected",
            data: { status },
            source: "system",
            type: "success",
            title: "Real-time Connected",
            message: "Monitoring AI processing events in real-time",
          });
        } else if (status === "CLOSED") {
          setIsConnected(false);
          addLog({
            event: "realtime_disconnected",
            data: { status },
            source: "system",
            type: "warning",
            title: "Real-time Disconnected",
            message: "Lost connection to AI processing events",
          });
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [conversationId, effectiveOrgId, supabaseClient, maxLogs]);

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog({
      event: "logs_cleared",
      data: {},
      source: "system",
      type: "info",
      title: "Logs Cleared",
      message: "Terminal history has been cleared",
    });
  };

  // Get icon for log type
  const getLogIcon = (log: AIProcessingLog) => {
    if (log.type) {
      switch (log.type) {
        case "success":
          return <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />;
        case "error":
          return <Icon icon={AlertCircle} className="text-brand-mahogany-500 h-4 w-4" />;
        case "warning":
          return <Icon icon={AlertCircle} className="text-semantic-warning h-4 w-4" />;
        case "processing":
          return <Icon icon={Zap} className="h-4 w-4 animate-pulse text-[var(--fl-color-info)]" />;
        default:
          return <Icon icon={MessageSquare} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />;
      }
    }

    // Determine icon based on event name
    if (log.event.includes("error")) {
      return <Icon icon={AlertCircle} className="text-brand-mahogany-500 h-4 w-4" />;
    } else if (log.event.includes("escalated")) {
      return <Icon icon={AlertCircle} className="text-semantic-warning h-4 w-4" />;
    } else if (log.event.includes("sent") || log.event.includes("completed")) {
      return <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />;
    } else if (log.event.includes("processing")) {
      return <Icon icon={Zap} className="h-4 w-4 animate-pulse text-[var(--fl-color-info)]" />;
    } else if (log.source === "ai_processor") {
      return <Icon icon={Bot} className="h-4 w-4 text-blue-600" />;
    } else {
      return <Icon icon={MessageSquare} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Terminal} className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">AI Processing Terminal</CardTitle>
            </div>
            <div className="flex items-center gap-ds-2">
              <Badge variant={aiSessionActive ? "default" : "secondary"}>
                {aiSessionActive ? (
                  <>
                    <Icon icon={Bot} className="mr-1 h-3 w-3" />
                    AI Active
                  </>
                ) : (
                  "Standby"
                )}
              </Badge>
              <Badge variant={isConnected ? "default" : "error"} className="text-tiny">
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="h-7 w-7 p-0"
                title={isPaused ? "Resume updates" : "Pause updates"}
              >
                {isPaused ? <Icon icon={Play} className="h-3 w-3" /> : <Icon icon={Pause} className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearLogs} className="h-7 w-7 p-0" title="Clear logs">
                <Icon icon={Trash2} className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Real-time Confidence Meter */}
          {aiSessionActive && lastConfidence !== null && (
            <div className="flex items-center gap-ds-2">
              <span className="text-foreground text-tiny">Confidence:</span>
              <div className="flex flex-1 items-center gap-1">
                <div className="h-2 w-24 overflow-hidden rounded-ds-full bg-gray-200">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      lastConfidence >= 0.8
                        ? "bg-semantic-success"
                        : lastConfidence >= 0.7
                          ? "bg-semantic-warning"
                          : "bg-brand-mahogany-500"
                    )}
                    style={{ width: `${lastConfidence * 100}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-typography-xs font-medium",
                    lastConfidence >= 0.8
                      ? "text-semantic-success-dark"
                      : lastConfidence >= 0.7
                        ? "text-yellow-600"
                        : "text-red-600"
                  )}
                >
                  {Math.round(lastConfidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 p-0">
        {isPaused && (
          <div className="absolute right-2 top-2 z-10">
            <Badge
              variant="outline"
              className="text-yellow-600-dark border-status-warning-light bg-[var(--fl-color-warning-subtle)]"
            >
              <Icon icon={Pause} className="mr-1 h-3 w-3" />
              Paused
            </Badge>
          </div>
        )}
        <ScrollArea ref={scrollRef} className="h-full px-4 pb-4">
          {logs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon icon={Terminal} className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No AI activity yet</p>
                <p className="text-sm">Logs will appear when AI processing begins</p>
              </div>
            </div>
          ) : (
            <div className="space-y-spacing-sm">
              {logs.map((log: unknown) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-3 rounded-ds-lg border border-[var(--fl-color-border-subtle)] bg-white/50 spacing-3",
                    log.type === "error" && "border-status-error-light bg-status-error-light/50",
                    log.type === "warning" && "border-status-warning-light bg-status-warning-light/50",
                    log.type === "success" && "border-status-success-light bg-status-success-light/50",
                    log.type === "processing" && "border-status-info-light bg-status-info-light/50"
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">{getLogIcon(log)}</div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-ds-2">
                      <span className="text-sm font-medium text-gray-900">{log.title || log.event}</span>
                      <span className="text-tiny text-[var(--fl-color-text-muted)]">{formatTime(log.timestamp)}</span>
                      {log.source && (
                        <Badge variant="outline" className="text-tiny">
                          {log.source}
                        </Badge>
                      )}
                      {log.duration && (
                        <Badge variant="outline" className="text-tiny">
                          {log.duration}ms
                        </Badge>
                      )}
                    </div>
                    <p className="leading-relaxed text-foreground text-sm">
                      {log.message || JSON.stringify(log.data)}
                    </p>
                    {(log.metadata || log.data) && (
                      <pre className="bg-background mt-1 overflow-x-auto rounded p-spacing-sm text-tiny text-[var(--fl-color-text-muted)]">
                        {JSON.stringify(log.metadata || log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
