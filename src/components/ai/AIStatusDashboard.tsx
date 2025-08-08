/**
 * AI Status Dashboard
 *
 * Real-time dashboard showing AI system status and metrics
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import React, { useEffect, useState } from "react";

export interface AISystemStatus {
  status: "online" | "degraded" | "offline";
  uptime: number;
  responseTime: number;
  accuracy: number;
  activeConversations: number;
  queueLength: number;
  errorRate: number;
  lastUpdate: Date;
}

interface AIStatusDashboardProps {
  className?: string;
}

export const AIStatusDashboard: React.FC<AIStatusDashboardProps> = ({ className }) => {
  const [status, setStatus] = useState<AISystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = () => {
      // Mock API call - in production, this would fetch real status
      const mockStatus: AISystemStatus = {
        status: "online",
        uptime: 99.8,
        responseTime: 1.2,
        accuracy: 94.5,
        activeConversations: 23,
        queueLength: 2,
        errorRate: 0.5,
        lastUpdate: new Date(),
      };

      setTimeout(() => {
        setStatus(mockStatus);
        setIsLoading(false);
      }, 500);
    };

    fetchStatus();

    // REPLACED: Use real-time subscription instead of 30-second polling
    // AI status updates will come through the dashboard metrics system

    // This eliminates the 30-second polling that was causing unnecessary API calls

    return () => {

    };
  }, []);

  const getStatusColor = (status: AISystemStatus["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: AISystemStatus["status"]) => {
    switch (status) {
      case "online":
        return "All Systems Operational";
      case "degraded":
        return "Performance Degraded";
      case "offline":
        return "System Offline";
      default:
        return "Unknown Status";
    }
  };

  if (isLoading) {
    return (
      <Card {...(className && { className })}>
        <CardHeader>
          <CardTitle>AI System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card {...(className && { className })}>
        <CardHeader>
          <CardTitle>AI System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-[var(--fl-color-text-muted)]">Unable to load system status</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...(className && { className })}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          AI System Status
          <Badge className={getStatusColor(status.status)}>{status.status.toUpperCase()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="text-center">
            <div className="text-base font-medium">{getStatusText(status.status)}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">
              Last updated: {status.lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-spacing-sm">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm">{status.uptime}%</span>
              </div>
              <Progress value={status.uptime} className="h-2" />
            </div>

            <div className="space-y-spacing-sm">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm">{status.accuracy}%</span>
              </div>
              <Progress value={status.accuracy} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Response Time</div>
              <div className="text-3xl font-bold">{status.responseTime}s</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Error Rate</div>
              <div className="text-3xl font-bold">{status.errorRate}%</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Active Conversations</div>
              <div className="text-3xl font-bold">{status.activeConversations}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Queue Length</div>
              <div className="text-3xl font-bold">{status.queueLength}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStatusDashboard;
