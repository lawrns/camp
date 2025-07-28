import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/consolidated-exports';
// Remove direct import: // import { RealtimeChannel } from '@supabase/supabase-js';

interface TeamMember {
  agentId: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage?: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number;
  autoAssign: boolean;
  skills: string[];
  avgResponseTime: number;
  satisfactionScore: number;
  lastActive: string;
}

interface TeamMetrics {
  totalAgents: number;
  onlineAgents: number;
  busyAgents: number;
  awayAgents: number;
  offlineAgents: number;
  totalActiveChats: number;
  totalCapacity: number;
  averageResponseTime: number;
  averageSatisfaction: number;
  utilizationRate: number;
}

interface UseRealtimeTeamDataReturn {
  teamMembers: TeamMember[];
  teamMetrics: TeamMetrics;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateAgentStatus: (agentId: string, status: string, statusMessage?: string) => Promise<void>;
}

export function useRealtimeTeamData(organizationId: string): UseRealtimeTeamDataReturn {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>({
    totalAgents: 0,
    onlineAgents: 0,
    busyAgents: 0,
    awayAgents: 0,
    offlineAgents: 0,
    totalActiveChats: 0,
    totalCapacity: 0,
    averageResponseTime: 0,
    averageSatisfaction: 0,
    utilizationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Calculate team metrics from team members
  const calculateTeamMetrics = useCallback((members: TeamMember[]): TeamMetrics => {
    const totalAgents = members.length;
    const onlineAgents = members.filter(m => m.status === 'online').length;
    const busyAgents = members.filter(m => m.status === 'busy').length;
    const awayAgents = members.filter(m => m.status === 'away').length;
    const offlineAgents = members.filter(m => m.status === 'offline').length;
    const totalActiveChats = members.reduce((sum, m) => sum + m.currentLoad, 0);
    const totalCapacity = members.reduce((sum, m) => sum + m.maxCapacity, 0);
    const averageResponseTime = totalAgents > 0 
      ? members.reduce((sum, m) => sum + m.avgResponseTime, 0) / totalAgents 
      : 0;
    const averageSatisfaction = totalAgents > 0
      ? members.reduce((sum, m) => sum + m.satisfactionScore, 0) / totalAgents
      : 0;
    const utilizationRate = totalCapacity > 0 ? (totalActiveChats / totalCapacity) * 100 : 0;

    return {
      totalAgents,
      onlineAgents,
      busyAgents,
      awayAgents,
      offlineAgents,
      totalActiveChats,
      totalCapacity,
      averageResponseTime,
      averageSatisfaction,
      utilizationRate
    };
  }, []);

  // Fetch initial team data
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/team/availability?organizationId=${organizationId}&includeMetrics=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team data: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTeamMembers(data.teamAvailability || []);
        setTeamMetrics(data.teamMetrics || calculateTeamMetrics(data.teamAvailability || []));
      } else {
        throw new Error(data.error || 'Failed to fetch team data');
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, calculateTeamMetrics]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!organizationId) return;

    const client = supabase.client();
    
    // Create channel for organization-wide updates
    const realtimeChannel: any = client.channel(`team:${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_availability',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        console.log('Agent availability change:', payload);
        handleAgentAvailabilityChange(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'metrics_cache',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        console.log('Metrics update:', payload);
        handleMetricsUpdate(payload);
      })
      .on('broadcast', {
        event: 'agent_status_update'
      }, (payload) => {
        console.log('Agent status broadcast:', payload);
        handleAgentStatusBroadcast(payload);
      })
      .subscribe();

    setChannel(realtimeChannel);

    // Initial data fetch
    fetchTeamData();

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [organizationId, fetchTeamData]);

  // Handle agent availability changes
  const handleAgentAvailabilityChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setTeamMembers(prevMembers => {
      let updatedMembers = [...prevMembers];
      
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const agentIndex = updatedMembers.findIndex(m => m.agentId === newRecord.agent_id);
        
        const updatedMember: TeamMember = {
          agentId: newRecord.agent_id,
          name: newRecord.profiles?.full_name || newRecord.profiles?.email || 'Unknown',
          email: newRecord.profiles?.email || '',
          avatar: newRecord.profiles?.avatar_url,
          status: newRecord.status,
          statusMessage: newRecord.status_message,
          currentLoad: newRecord.current_chat_count || 0,
          maxCapacity: newRecord.max_concurrent_chats || 0,
          utilizationRate: newRecord.max_concurrent_chats > 0 
            ? (newRecord.current_chat_count / newRecord.max_concurrent_chats) * 100 
            : 0,
          autoAssign: newRecord.auto_assign || false,
          skills: newRecord.skills || [],
          avgResponseTime: newRecord.avg_response_time || 0,
          satisfactionScore: newRecord.satisfaction_score || 0,
          lastActive: newRecord.last_active || new Date().toISOString()
        };
        
        if (agentIndex >= 0) {
          updatedMembers[agentIndex] = updatedMember;
        } else {
          updatedMembers.push(updatedMember);
        }
      } else if (eventType === 'DELETE' && oldRecord) {
        updatedMembers = updatedMembers.filter(m => m.agentId !== oldRecord.agent_id);
      }
      
      // Recalculate metrics
      setTeamMetrics(calculateTeamMetrics(updatedMembers));
      
      return updatedMembers;
    });
  }, [calculateTeamMetrics]);

  // Handle metrics updates
  const handleMetricsUpdate = useCallback((payload: any) => {
    const { new: newRecord } = payload;
    
    if (newRecord.time_period === 'current') {
      // Update specific agent metrics
      setTeamMembers(prevMembers => {
        const updatedMembers = prevMembers.map(member => {
          if (member.agentId === newRecord.agent_id) {
            const updates: Partial<TeamMember> = {};
            
            switch (newRecord.metric_type) {
              case 'response_time_avg':
                updates.avgResponseTime = newRecord.metric_value;
                break;
              case 'satisfaction_score':
                updates.satisfactionScore = newRecord.metric_value;
                break;
            }
            
            return { ...member, ...updates };
          }
          return member;
        });
        
        // Recalculate team metrics
        setTeamMetrics(calculateTeamMetrics(updatedMembers));
        
        return updatedMembers;
      });
    }
  }, [calculateTeamMetrics]);

  // Handle agent status broadcasts
  const handleAgentStatusBroadcast = useCallback((payload: any) => {
    const { agentId, status, statusMessage } = payload.payload;
    
    setTeamMembers(prevMembers => {
      const updatedMembers = prevMembers.map(member => 
        member.agentId === agentId 
          ? { ...member, status, statusMessage, lastActive: new Date().toISOString() }
          : member
      );
      
      setTeamMetrics(calculateTeamMetrics(updatedMembers));
      
      return updatedMembers;
    });
  }, [calculateTeamMetrics]);

  // Update agent status
  const updateAgentStatus = useCallback(async (
    agentId: string, 
    status: string, 
    statusMessage?: string
  ) => {
    try {
      const response = await fetch('/api/team/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          agentId,
          status,
          statusMessage
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update agent status: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update agent status');
      }
    } catch (err) {
      console.error('Error updating agent status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [organizationId]);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    await fetchTeamData();
  }, [fetchTeamData]);

  return {
    teamMembers,
    teamMetrics,
    loading,
    error,
    refreshData,
    updateAgentStatus
  };
}
