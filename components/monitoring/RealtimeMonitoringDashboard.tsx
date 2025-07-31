"use client";

import React, { useState, useEffect } from "react";
import { realtimeMonitor, RealtimeLogger } from "@/lib/realtime/enhanced-monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Wifi, 
  MessageSquare, 
  Radio, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";

interface RealtimeMonitoringDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export function RealtimeMonitoringDashboard({ 
  className = "",
  refreshInterval = 5000 
}: RealtimeMonitoringDashboardProps) {
  const [connectionHealth, setConnectionHealth] = useState(realtimeMonitor.getConnectionHealth());
  const [connections, setConnections] = useState(realtimeMonitor.getAllConnections());
  const [recentEvents, setRecentEvents] = useState(realtimeMonitor.getRecentEvents(10));
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Auto-refresh data
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setConnectionHealth(realtimeMonitor.getConnectionHealth());
      setConnections(realtimeMonitor.getAllConnections());
      setRecentEvents(realtimeMonitor.getRecentEvents(10));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval]);

  const handleRefresh = () => {
    setConnectionHealth(realtimeMonitor.getConnectionHealth());
    setConnections(realtimeMonitor.getAllConnections());
    setRecentEvents(realtimeMonitor.getRecentEvents(10));
  };

  const handleReset = () => {
    realtimeMonitor.reset();
    handleRefresh();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "text-green-600 bg-green-100";
      case "connecting": return "text-yellow-600 bg-yellow-100";
      case "disconnected": return "text-gray-600 bg-gray-100";
      case "error": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "connection": return <Wifi className="h-4 w-4" />;
      case "message": return <MessageSquare className="h-4 w-4" />;
      case "broadcast": return <Radio className="h-4 w-4" />;
      case "heartbeat": return <Activity className="h-4 w-4" />;
      case "error": return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Real-time Monitoring</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            {isAutoRefresh ? "Pause" : "Resume"} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionHealth.totalConnections}</div>
            <p className="text-xs text-muted-foreground">
              {connectionHealth.healthyConnections} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectionHealth.averageLatency.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionHealth.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Sent and received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broadcast Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(connectionHealth.broadcastSuccessRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery reliability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active connections</p>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.connectionId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(connection.status)}>
                        {connection.status}
                      </Badge>
                      <span className="font-medium">{connection.channelName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ID: {connection.connectionId}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>
                      {connection.latency ? `${connection.latency.toFixed(1)}ms` : "N/A"}
                    </div>
                    <div className="text-muted-foreground">
                      ↑{connection.messagesSent} ↓{connection.messagesReceived}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent events</p>
            ) : (
              recentEvents.slice().reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 border rounded"
                >
                  <div className={`flex items-center gap-2 ${event.success ? "text-green-600" : "text-red-600"}`}>
                    {getEventIcon(event.type)}
                    <span className="text-sm font-medium">
                      {event.type}
                      {event.eventName && `:${event.eventName}`}
                    </span>
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    {event.channelName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                  {event.latency && (
                    <div className="text-xs text-muted-foreground">
                      {event.latency.toFixed(1)}ms
                    </div>
                  )}
                  {event.error && (
                    <div className="text-xs text-red-600 max-w-xs truncate">
                      {event.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Auto-refresh:</span>
              <span className={isAutoRefresh ? "text-green-600" : "text-gray-600"}>
                {isAutoRefresh ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Refresh interval:</span>
              <span>{refreshInterval / 1000}s</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealtimeMonitoringDashboard;
