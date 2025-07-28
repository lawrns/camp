'use client';

import React, { useState } from 'react';
import { useRealtimeTeamData } from '@/hooks/useRealtimeTeamData';
import { useAssignmentQueue } from '@/hooks/useAssignmentQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Clock, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Zap,
  UserCheck,
  Timer
} from 'lucide-react';

interface RealtimeTeamDashboardProps {
  organizationId: string;
}

export function RealtimeTeamDashboard({ organizationId }: RealtimeTeamDashboardProps) {
  const {
    teamMembers,
    teamMetrics,
    loading: teamLoading,
    error: teamError,
    refreshData,
    updateAgentStatus
  } = useRealtimeTeamData(organizationId);

  const {
    queueItems,
    pendingCount,
    failedCount,
    highPriorityCount,
    loading: queueLoading,
    error: queueError,
    refreshQueue,
    autoAssign
  } = useAssignmentQueue(organizationId);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshData(), refreshQueue()]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'busy': return 'destructive';
      case 'away': return 'secondary';
      case 'offline': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600';
    if (priority >= 6) return 'text-orange-600';
    if (priority >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (teamLoading || queueLoading) {
    return (
      <div className="flex items-center justify-center p-spacing-xl">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading team dashboard...</span>
      </div>
    );
  }

  if (teamError || queueError) {
    return (
      <div className="p-spacing-md bg-red-50 border border-[var(--fl-color-danger-muted)] rounded-ds-lg">
        <p className="text-red-800">
          Error loading dashboard: {teamError || queueError}
        </p>
        <Button onClick={handleRefresh} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Team Dashboard</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Team Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-ds-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.onlineAgents}/{teamMetrics.totalAgents}</div>
            <p className="text-tiny text-muted-foreground">
              {teamMetrics.busyAgents} busy, {teamMetrics.awayAgents} away
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.utilizationRate.toFixed(1)}%</div>
            <Progress value={teamMetrics.utilizationRate} className="mt-2" />
            <p className="text-tiny text-muted-foreground mt-1">
              {teamMetrics.totalActiveChats}/{teamMetrics.totalCapacity} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatTime(teamMetrics.averageResponseTime * 1000)}
            </div>
            <p className="text-tiny text-muted-foreground">
              Team average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {teamMetrics.averageSatisfaction.toFixed(1)}/5
            </div>
            <p className="text-tiny text-muted-foreground">
              Team average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Zap className="h-5 w-5" />
            Assignment Queue
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} pending</Badge>
            )}
            {highPriorityCount > 0 && (
              <Badge variant="destructive">{highPriorityCount} urgent</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No items in assignment queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between spacing-3 border rounded-ds-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-ds-2 mb-1">
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        Priority {item.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {item.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(item.waitTime)} waiting
                      </span>
                    </div>
                    <div className="text-sm">
                      Skills: {item.requiredSkills.join(', ') || 'None specified'}
                    </div>
                    <div className="text-tiny text-muted-foreground">
                      Attempts: {item.attempts} | Expires in: {formatTime(item.expiresIn)}
                    </div>
                  </div>
                  <div className="flex gap-ds-2">
                    <Button
                      size="sm"
                      onClick={() => autoAssign(item.id)}
                      disabled={item.status !== 'pending'}
                    >
                      Auto Assign
                    </Button>
                  </div>
                </div>
              ))}
              {queueItems.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {queueItems.length - 5} more items...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <UserCheck className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-ds-4">
            {teamMembers.map((member) => (
              <div key={member.agentId} className="flex items-center space-x-3 spacing-3 border rounded-ds-lg">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-ds-full border-2 border-white ${getStatusColor(member.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <div className="flex items-center gap-ds-2 mt-1">
                    <Badge variant={getStatusBadgeVariant(member.status)} className="text-tiny">
                      {member.status}
                    </Badge>
                    <span className="text-tiny text-muted-foreground">
                      {member.currentLoad}/{member.maxCapacity}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Progress value={member.utilizationRate} className="h-1" />
                  </div>
                  <div className="flex items-center gap-ds-2 mt-1 text-tiny text-muted-foreground">
                    <span>⭐ {member.satisfactionScore.toFixed(1)}</span>
                    <span>⏱️ {formatTime(member.avgResponseTime * 1000)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
