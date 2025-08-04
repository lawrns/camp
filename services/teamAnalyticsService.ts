/**
 * Team Performance Analytics Service
 * Real-time team metrics and performance tracking with Supabase integration
 */

import { createApiClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

// Type definitions for team analytics
export interface TeamMemberPerformance {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  metrics: {
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number; // in hours
    customerSatisfaction: number; // 1-5 scale
    responseTime: number; // in minutes
    activeTickets: number;
    overdueTickets: number;
    efficiency: number; // percentage
  };
  trends: {
    ticketsThisWeek: number;
    ticketsLastWeek: number;
    satisfactionTrend: number; // percentage change
    resolutionTimeTrend: number; // percentage change
  };
  workload: {
    currentCapacity: number; // percentage
    maxCapacity: number;
    availableHours: number;
    scheduledHours: number;
  };
}

export interface TeamOverallMetrics {
  totalMembers: number;
  activeMembers: number;
  totalTickets: number;
  resolvedTickets: number;
  avgTeamSatisfaction: number;
  avgResolutionTime: number;
  teamEfficiency: number;
  workloadDistribution: {
    balanced: number;
    overloaded: number;
    underutilized: number;
  };
  trends: {
    ticketVolumeTrend: number;
    satisfactionTrend: number;
    efficiencyTrend: number;
  };
}

export interface WorkloadDistribution {
  memberId: string;
  name: string;
  currentTickets: number;
  capacity: number;
  utilizationPercentage: number;
  status: 'balanced' | 'overloaded' | 'underutilized';
}

export interface PerformanceTimeframe {
  period: '24h' | '7d' | '30d' | '90d';
  startDate: Date;
  endDate: Date;
}

/**
 * Get comprehensive team performance metrics
 */
export async function getTeamPerformanceMetrics(
  organizationId: string,
  timeframe: PerformanceTimeframe = { period: '7d', startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate: new Date() }
): Promise<{ members: TeamMemberPerformance[]; overall: TeamOverallMetrics }> {
  const supabase = createApiClient();

  try {
    console.log(`[TeamAnalytics] Getting performance metrics for org ${organizationId}, period: ${timeframe.period}`);

    // Get organization members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        users (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId);

    if (membersError) {
      console.error('[TeamAnalytics] Error fetching members:', membersError);
      throw new Error(`Failed to fetch team members: ${membersError.message}`);
    }

    // Generate mock performance data (in real implementation, this would query tickets, conversations, etc.)
    const memberPerformance: TeamMemberPerformance[] = (members || []).map((member, index) => {
      const baseMetrics = {
        totalTickets: Math.floor(Math.random() * 50) + 20,
        resolvedTickets: Math.floor(Math.random() * 40) + 15,
        avgResolutionTime: Math.floor(Math.random() * 24) + 2, // 2-26 hours
        customerSatisfaction: 3.5 + Math.random() * 1.5, // 3.5-5.0
        responseTime: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
        activeTickets: Math.floor(Math.random() * 10) + 1,
        overdueTickets: Math.floor(Math.random() * 3),
        efficiency: 70 + Math.random() * 25, // 70-95%
      };

      return {
        userId: member.user_id,
        name: member.users?.fullName || member.users?.email || 'Unknown User',
        email: member.users?.email || '',
        role: member.role,
        avatar: member.users?.avatar_url,
        metrics: baseMetrics,
        trends: {
          ticketsThisWeek: baseMetrics.totalTickets,
          ticketsLastWeek: Math.floor(baseMetrics.totalTickets * (0.8 + Math.random() * 0.4)),
          satisfactionTrend: (Math.random() - 0.5) * 20, // -10% to +10%
          resolutionTimeTrend: (Math.random() - 0.5) * 30, // -15% to +15%
        },
        workload: {
          currentCapacity: Math.floor(Math.random() * 40) + 60, // 60-100%
          maxCapacity: 100,
          availableHours: Math.floor(Math.random() * 20) + 20, // 20-40 hours
          scheduledHours: Math.floor(Math.random() * 30) + 30, // 30-60 hours
        },
      };
    });

    // Calculate overall team metrics
    const totalMembers = memberPerformance.length;
    const activeMembers = memberPerformance.filter(m => m.metrics.activeTickets > 0).length;
    const totalTickets = memberPerformance.reduce((sum, m) => sum + m.metrics.totalTickets, 0);
    const resolvedTickets = memberPerformance.reduce((sum, m) => sum + m.metrics.resolvedTickets, 0);
    const avgSatisfaction = memberPerformance.reduce((sum, m) => sum + m.metrics.customerSatisfaction, 0) / totalMembers;
    const avgResolutionTime = memberPerformance.reduce((sum, m) => sum + m.metrics.avgResolutionTime, 0) / totalMembers;
    const teamEfficiency = memberPerformance.reduce((sum, m) => sum + m.metrics.efficiency, 0) / totalMembers;

    // Calculate workload distribution
    const workloadStats = memberPerformance.reduce(
      (acc, member) => {
        const utilization = member.workload.currentCapacity;
        if (utilization > 90) acc.overloaded++;
        else if (utilization < 60) acc.underutilized++;
        else acc.balanced++;
        return acc;
      },
      { balanced: 0, overloaded: 0, underutilized: 0 }
    );

    const overall: TeamOverallMetrics = {
      totalMembers,
      activeMembers,
      totalTickets,
      resolvedTickets,
      avgTeamSatisfaction: avgSatisfaction,
      avgResolutionTime,
      teamEfficiency,
      workloadDistribution: workloadStats,
      trends: {
        ticketVolumeTrend: 12.5, // Mock 12.5% increase
        satisfactionTrend: 3.2, // Mock 3.2% increase
        efficiencyTrend: -1.8, // Mock 1.8% decrease
      },
    };

    return {
      members: memberPerformance,
      overall,
    };
  } catch (error) {
    console.error('[TeamAnalytics] Error in getTeamPerformanceMetrics:', error);
    throw error;
  }
}

/**
 * Get workload distribution for team balancing
 */
export async function getWorkloadDistribution(organizationId: string): Promise<WorkloadDistribution[]> {
  const supabase = createApiClient();

  try {
    console.log(`[TeamAnalytics] Getting workload distribution for org ${organizationId}`);

    // Get team performance data
    const { members } = await getTeamPerformanceMetrics(organizationId);

    // Transform to workload distribution format
    const workloadDistribution: WorkloadDistribution[] = members.map((member) => {
      const utilization = member.workload.currentCapacity;
      let status: 'balanced' | 'overloaded' | 'underutilized' = 'balanced';
      
      if (utilization > 90) status = 'overloaded';
      else if (utilization < 60) status = 'underutilized';

      return {
        memberId: member.userId,
        name: member.name,
        currentTickets: member.metrics.activeTickets,
        capacity: member.workload.maxCapacity,
        utilizationPercentage: utilization,
        status,
      };
    });

    return workloadDistribution;
  } catch (error) {
    console.error('[TeamAnalytics] Error in getWorkloadDistribution:', error);
    throw error;
  }
}

/**
 * Get team performance trends over time
 */
export async function getTeamPerformanceTrends(
  organizationId: string,
  days: number = 30
): Promise<{
  ticketVolume: Array<{ date: string; tickets: number; resolved: number }>;
  satisfaction: Array<{ date: string; score: number }>;
  efficiency: Array<{ date: string; percentage: number }>;
}> {
  try {
    console.log(`[TeamAnalytics] Getting performance trends for org ${organizationId}, ${days} days`);

    // Generate mock trend data (in real implementation, this would query historical data)
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0];
    });

    const ticketVolume = dates.map((date) => ({
      date,
      tickets: Math.floor(Math.random() * 20) + 10,
      resolved: Math.floor(Math.random() * 15) + 8,
    }));

    const satisfaction = dates.map((date) => ({
      date,
      score: 3.5 + Math.random() * 1.5,
    }));

    const efficiency = dates.map((date) => ({
      date,
      percentage: 70 + Math.random() * 25,
    }));

    return {
      ticketVolume,
      satisfaction,
      efficiency,
    };
  } catch (error) {
    console.error('[TeamAnalytics] Error in getTeamPerformanceTrends:', error);
    throw error;
  }
}

/**
 * Get individual member detailed performance
 */
export async function getMemberDetailedPerformance(
  organizationId: string,
  userId: string
): Promise<TeamMemberPerformance | null> {
  try {
    console.log(`[TeamAnalytics] Getting detailed performance for user ${userId}`);

    const { members } = await getTeamPerformanceMetrics(organizationId);
    return members.find(member => member.userId === userId) || null;
  } catch (error) {
    console.error('[TeamAnalytics] Error in getMemberDetailedPerformance:', error);
    throw error;
  }
}
