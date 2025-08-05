/**
 * AI Session Manager
 *
 * Manages AI session state and lifecycle
 */

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";

export interface AISession {
  id: string;
  status: "active" | "idle" | "paused" | "terminated";
  startTime: Date;
  conversationCount: number;
  responseTime: number;
  confidence: number;
}

interface AISessionManagerProps {
  className?: string;
}

export const AISessionManager: React.FC<AISessionManagerProps> = ({ className }) => {
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    const mockSessions: AISession[] = [
      {
        id: "session-1",
        status: "active",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        conversationCount: 15,
        responseTime: 1.2,
        confidence: 0.92,
      },
      {
        id: "session-2",
        status: "idle",
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        conversationCount: 3,
        responseTime: 0.8,
        confidence: 0.88,
      },
    ];

    setTimeout(() => {
      setSessions(mockSessions);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleStartSession = () => {
    const newSession: AISession = {
      id: `session-${Date.now()}`,
      status: "active",
      startTime: new Date(),
      conversationCount: 0,
      responseTime: 0,
      confidence: 1.0,
    };
    setSessions((prev) => [...prev, newSession]);
  };

  const handleTerminateSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, status: "terminated" as const } : session))
    );
  };

  const getStatusColor = (status: AISession["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "paused":
        return "bg-orange-500";
      case "terminated":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card {...(className && { className })}>
        <CardHeader>
          <CardTitle>AI Session Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...(className && { className })}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          AI Session Manager
          <Button onClick={handleStartSession} size="sm">
            Start New Session
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-ds-lg border spacing-3">
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                <div>
                  <div className="font-medium">{session.id}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    Started: {session.startTime.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div>Conversations: {session.conversationCount}</div>
                <div>Avg Response: {session.responseTime}s</div>
                <div>Confidence: {(session.confidence * 100).toFixed(1)}%</div>
              </div>
              {session.status === "active" && (
                <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)}>
                  Terminate
                </Button>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="py-8 text-center text-[var(--color-text-muted)]">No active AI sessions</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AISessionManager;
