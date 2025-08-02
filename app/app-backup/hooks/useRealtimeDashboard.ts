"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardMetrics {
  conversations: number;
  activeAgents: number;
  responseTime: string;
  satisfaction: string;
  pendingTickets: number;
  resolvedToday: number;
  loading: boolean;
  error: string | null;
}

export interface RealtimeActivity {
  id: string;
  type: 'conversation_started' | 'agent_joined' | 'ticket_resolved' | 'satisfaction_updated';
  message: string;
  timestamp: Date;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

export function useRealtimeDashboard() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    conversations: 12,
    activeAgents: 4,
    responseTime: "2.3s",
    satisfaction: "94%",
    pendingTickets: 8,
    resolvedToday: 23,
    loading: false,
    error: null,
  });

  const [activities, setActivities] = useState<RealtimeActivity[]>([
    {
      id: '1',
      type: 'conversation_started',
      message: 'New conversation started',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      color: 'green',
    },
    {
      id: '2',
      type: 'agent_joined',
      message: 'Agent joined conversation',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      color: 'blue',
    },
    {
      id: '3',
      type: 'ticket_resolved',
      message: 'Ticket resolved successfully',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      color: 'orange',
    },
  ]);

  const [systemStatus, setSystemStatus] = useState({
    api: 'operational',
    database: 'healthy',
    realtime: 'connected',
    auth: 'active',
  });

  useEffect(() => {
    if (!organizationId) {
      setMetrics(prev => ({
        ...prev,
        error: 'Organization ID not available',
        loading: false,
      }));
      return;
    }

    // Simulate real-time updates with intervals
    const metricsInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        conversations: Math.max(1, prev.conversations + Math.floor(Math.random() * 3) - 1),
        activeAgents: Math.max(1, prev.activeAgents + Math.floor(Math.random() * 2) - 1),
        responseTime: `${(Math.random() * 3 + 1).toFixed(1)}s`,
        pendingTickets: Math.max(0, prev.pendingTickets + Math.floor(Math.random() * 3) - 1),
        resolvedToday: prev.resolvedToday + Math.floor(Math.random() * 2),
      }));
    }, 10000);

    // Simulate new activities
    const activityInterval = setInterval(() => {
      const activityTypes: RealtimeActivity['type'][] = [
        'conversation_started',
        'agent_joined',
        'ticket_resolved',
        'satisfaction_updated',
      ];

      const colors: RealtimeActivity['color'][] = ['green', 'blue', 'purple', 'orange'];
      const messages = [
        'New conversation started',
        'Agent joined conversation',
        'Ticket resolved',
        'Customer satisfaction updated',
        'Message sent',
        'Customer responded',
      ];

      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      const newActivity: RealtimeActivity = {
        id: Date.now().toString(),
        type: randomType,
        message: randomMessage,
        timestamp: new Date(),
        color: randomColor,
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
    }, 15000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(activityInterval);
    };
  }, [organizationId]);

  return {
    metrics,
    activities,
    systemStatus,
    refreshMetrics: () => {
      setMetrics(prev => ({ ...prev, loading: true }));
      setTimeout(() => {
        setMetrics(prev => ({ ...prev, loading: false }));
      }, 1000);
    },
  };
}
