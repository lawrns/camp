'use client';

import React, { useState } from 'react';
import { useRealtimeTeamData } from '@/hooks/useRealtimeTeamData';
import { useAssignmentQueue } from '@/hooks/useAssignmentQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { Badge } from '@/components/unified-ui/components/Badge';
import { Button } from '@/components/unified-ui/components/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/unified-ui/components/Avatar';
import { Progress } from '@/components/unified-ui/components/Progress';
import { cn } from '@/lib/utils';

/**
 * RealtimeTeamDashboard - Design System Compliant Version
 *
 * Migrated to use unified design tokens and components:
 * - Unified import patterns from @/components/unified-ui/
 * - Design token-based status colors and styling
 * - Consistent spacing and layout using design tokens
 * - Enhanced accessibility and responsive design
 */
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

  // Design token-based status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[var(--fl-color-success)]';
      case 'busy': return 'bg-[var(--fl-color-error)]';
      case 'away': return 'bg-[var(--fl-color-warning)]';
      case 'offline': return 'bg-[var(--fl-color-text-muted)]';
      default: return 'bg-[var(--fl-color-text-muted)]';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'busy': return 'error';
      case 'away': return 'warning';
      case 'offline': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-[var(--fl-color-error)]';
    if (priority >= 6) return 'text-[var(--fl-color-warning)]';
    if (priority >= 4) return 'text-[var(--fl-color-warning-600)]';
    return 'text-[var(--fl-color-success)]';
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
      <div className="flex items-center justify-center p-[var(--fl-spacing-xl)]">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--fl-color-primary)]" />
        <span className="ml-[var(--fl-spacing-2)] text-[var(--fl-color-text-muted)]">
          Loading team dashboard...
        </span>
      </div>
    );
  }

  if (teamError || queueError) {
    return (
      <div className={cn(
        "p-[var(--fl-spacing-md)]",
        "bg-[var(--fl-color-error-subtle)]",
        "border border-[var(--fl-color-error-200)]",
        "rounded-[var(--fl-radius-lg)]"
      )}>
        <p className="text-[var(--fl-color-error)]">
          Error loading dashboard: {teamError || queueError}
        </p>
        <Button onClick={handleRefresh} className="mt-[var(--fl-spacing-2)]" variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--fl-spacing-6)]">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--fl-color-text)]">Team Dashboard</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-[var(--fl-spacing-2)]",
            refreshing && "animate-spin"
          )} />
          Refresh
        </Button>
      </div>

      {/* Team Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--fl-spacing-4)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
            <CardTitle className="text-sm font-medium text-[var(--fl-color-text)]">Team Status</CardTitle>
            <Users className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--fl-color-text)]">
              {teamMetrics.onlineAgents}/{teamMetrics.totalAgents}
            </div>
            <p className="text-xs text-[var(--fl-color-text-muted)]">
              {teamMetrics.busyAgents} busy, {teamMetrics.awayAgents} away
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
            <CardTitle className="text-sm font-medium text-[var(--fl-color-text)]">Utilization</CardTitle>
            <Timer className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--fl-color-text)]">
              {teamMetrics.utilizationRate.toFixed(1)}%
            </div>
            <Progress value={teamMetrics.utilizationRate} className="mt-[var(--fl-spacing-2)]" />
            <p className="text-xs text-[var(--fl-color-text-muted)] mt-[var(--fl-spacing-1)]">
              {teamMetrics.totalActiveChats}/{teamMetrics.totalCapacity} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
            <CardTitle className="text-sm font-medium text-[var(--fl-color-text)]">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--fl-color-text)]">
              {formatTime(teamMetrics.averageResponseTime * 1000)}
            </div>
            <p className="text-xs text-[var(--fl-color-text-muted)]">
              Team average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
            <CardTitle className="text-sm font-medium text-[var(--fl-color-text)]">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--fl-color-text)]">
              {teamMetrics.averageSatisfaction.toFixed(1)}/5
            </div>
            <p className="text-xs text-[var(--fl-color-text-muted)]">
              Team average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-[var(--fl-spacing-2)]">
            <Zap className="h-5 w-5 text-[var(--fl-color-primary)]" />
            <span className="text-[var(--fl-color-text)]">Assignment Queue</span>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="rounded-full">{pendingCount} pending</Badge>
            )}
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="rounded-full">{highPriorityCount} urgent</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-[var(--fl-spacing-8)] text-[var(--fl-color-text-muted)]">
              <CheckCircle className="h-12 w-12 mx-auto mb-[var(--fl-spacing-4)] text-[var(--fl-color-success)]" />
              <p>No items in assignment queue</p>
            </div>
          ) : (
            <div className="space-y-[var(--fl-spacing-3)]">
              {queueItems.slice(0, 5).map((item) => (
                <div key={item.id} className={cn(
                  "flex items-center justify-between",
                  "p-[var(--fl-spacing-3)]",
                  "border border-[var(--fl-color-border)]",
                  "rounded-[var(--fl-radius-lg)]",
                  "bg-[var(--fl-color-surface)]"
                )}>
                  <div className="flex-1">
                    <div className="flex items-center gap-[var(--fl-spacing-2)] mb-[var(--fl-spacing-1)]">
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        Priority {item.priority}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full">
                        {item.type}
                      </Badge>
                      <span className="text-sm text-[var(--fl-color-text-muted)]">
                        {formatTime(item.waitTime)} waiting
                      </span>
                    </div>
                    <div className="text-sm text-[var(--fl-color-text)]">
                      Skills: {item.requiredSkills.join(', ') || 'None specified'}
                    </div>
                    <div className="text-xs text-[var(--fl-color-text-muted)]">
                      Attempts: {item.attempts} | Expires in: {formatTime(item.expiresIn)}
                    </div>
                  </div>
                  <div className="flex gap-[var(--fl-spacing-2)]">
                    <Button
                      size="sm"
                      onClick={() => autoAssign(item.id)}
                      disabled={item.status !== 'pending'}
                      variant="default"
                    >
                      Auto Assign
                    </Button>
                  </div>
                </div>
              ))}
              {queueItems.length > 5 && (
                <p className="text-sm text-[var(--fl-color-text-muted)] text-center">
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
          <CardTitle className="flex items-center gap-[var(--fl-spacing-2)]">
            <UserCheck className="h-5 w-5 text-[var(--fl-color-primary)]" />
            <span className="text-[var(--fl-color-text)]">Team Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--fl-spacing-4)]">
            {teamMembers.map((member) => (
              <div key={member.agentId} className={cn(
                "flex items-center space-x-[var(--fl-spacing-3)]",
                "p-[var(--fl-spacing-3)]",
                "border border-[var(--fl-color-border)]",
                "rounded-[var(--fl-radius-lg)]",
                "bg-[var(--fl-color-surface)]"
              )}>
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4",
                    "rounded-[var(--fl-radius-full)]",
                    "border-2 border-[var(--fl-color-surface)]",
                    getStatusColor(member.status)
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[var(--fl-color-text)]">
                    {member.name}
                  </p>
                  <div className="flex items-center gap-[var(--fl-spacing-2)] mt-[var(--fl-spacing-1)]">
                    <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs rounded-full">
                      {member.status}
                    </Badge>
                    <span className="text-xs text-[var(--fl-color-text-muted)]">
                      {member.currentLoad}/{member.maxCapacity}
                    </span>
                  </div>
                  <div className="mt-[var(--fl-spacing-1)]">
                    <Progress value={member.utilizationRate} className="h-1" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-[var(--fl-spacing-2)]",
                    "mt-[var(--fl-spacing-1)] text-xs",
                    "text-[var(--fl-color-text-muted)]"
                  )}>
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
