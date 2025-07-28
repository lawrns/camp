import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';

export interface HandoffRequest {
  conversationId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: {
    customerInfo: {
      name: string;
      email: string;
      tier: string;
    };
    issueType: string;
    previousAttempts: number;
    aiConfidence: number;
  };
}

export interface HandoffResponse {
  success: boolean;
  handoffId?: string;
  estimatedWaitTime?: number;
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  error?: string;
}

export async function triggerHandoff(
  conversationId: string,
  reason: string = 'Customer requested human assistance',
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<HandoffResponse> {
  try {
    // Update conversation status to handoff
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ 
        status: 'handoff',
        handoff_reason: reason,
        handoff_priority: priority,
        handoff_requested_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      throw new Error(`Failed to update conversation: ${updateError.message}`);
    }

    // Create handoff record
    const { data: handoffData, error: handoffError } = await supabase
      .from('handoffs')
      .insert({
        conversation_id: conversationId,
        reason,
        priority,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (handoffError) {
      throw new Error(`Failed to create handoff: ${handoffError.message}`);
    }

    // Find available agent
    const availableAgent = await findAvailableAgent(priority);
    
    if (availableAgent) {
      // Assign agent immediately
      await assignAgentToHandoff(handoffData.id, availableAgent.id);
      
      // Notify agent
      await sendNotification({
        userId: availableAgent.id,
        type: 'handoff_assigned',
        title: 'New Handoff Assignment',
        message: `You have been assigned a ${priority} priority handoff`,
        data: {
          conversationId,
          handoffId: handoffData.id,
          reason
        }
      });

      return {
        success: true,
        handoffId: handoffData.id,
        estimatedWaitTime: 0,
        assignedAgent: {
          id: availableAgent.id,
          name: availableAgent.name,
          avatar: availableAgent.avatar_url
        }
      };
    } else {
      // No agent available, add to queue
      const estimatedWaitTime = await calculateEstimatedWaitTime(priority);
      
      // Notify all agents about pending handoff
      await notifyAgentsOfPendingHandoff({
        conversationId,
        handoffId: handoffData.id,
        reason,
        priority
      });

      return {
        success: true,
        handoffId: handoffData.id,
        estimatedWaitTime
      };
    }
  } catch (error) {
    console.error('Handoff trigger failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function acceptHandoff(
  handoffId: string,
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if handoff is still available
    const { data: handoff, error: fetchError } = await supabase
      .from('handoffs')
      .select('*')
      .eq('id', handoffId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !handoff) {
      return {
        success: false,
        error: 'Handoff not found or already assigned'
      };
    }

    // Assign agent to handoff
    await assignAgentToHandoff(handoffId, agentId);

    // Update conversation with assigned agent
    await supabase
      .from('conversations')
      .update({
        status: 'active',
        assigned_agent_id: agentId,
        handoff_accepted_at: new Date().toISOString()
      })
      .eq('id', handoff.conversation_id);

    return { success: true };
  } catch (error) {
    console.error('Accept handoff failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function rejectHandoff(
  handoffId: string,
  agentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Log rejection
    await supabase
      .from('handoff_rejections')
      .insert({
        handoff_id: handoffId,
        agent_id: agentId,
        reason: reason || 'No reason provided',
        created_at: new Date().toISOString()
      });

    // Find next available agent
    const { data: handoff } = await supabase
      .from('handoffs')
      .select('priority')
      .eq('id', handoffId)
      .single();

    if (handoff) {
      const nextAgent = await findAvailableAgent(handoff.priority, [agentId]);
      
      if (nextAgent) {
        await assignAgentToHandoff(handoffId, nextAgent.id);
        
        await sendNotification({
          userId: nextAgent.id,
          type: 'handoff_assigned',
          title: 'New Handoff Assignment',
          message: `You have been assigned a ${handoff.priority} priority handoff`,
          data: { handoffId }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Reject handoff failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function findAvailableAgent(
  priority: string,
  excludeAgents: string[] = []
): Promise<{ id: string; name: string; avatar_url: string | null } | null> {
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, avatar_url, status, current_conversations')
      .eq('status', 'online')
      .not('id', 'in', `(${excludeAgents.join(',')})`)
      .order('current_conversations', { ascending: true })
      .limit(1);

    if (error || !agents || agents.length === 0) {
      return null;
    }

    return agents[0];
  } catch (error) {
    console.error('Find available agent failed:', error);
    return null;
  }
}

async function assignAgentToHandoff(handoffId: string, agentId: string): Promise<void> {
  await supabase
    .from('handoffs')
    .update({
      assigned_agent_id: agentId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    })
    .eq('id', handoffId);

  // Increment agent's conversation count
  await supabase.rpc('increment_agent_conversations', {
    agent_id: agentId
  });
}

async function calculateEstimatedWaitTime(priority: string): Promise<number> {
  try {
    // Get average handoff resolution time for this priority
    const { data, error } = await supabase
      .from('handoffs')
      .select('assigned_at, created_at')
      .eq('priority', priority)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(50);

    if (error || !data || data.length === 0) {
      // Default wait times by priority
      const defaultWaitTimes = {
        urgent: 2,
        high: 5,
        medium: 15,
        low: 30
      };
      return defaultWaitTimes[priority as keyof typeof defaultWaitTimes] || 15;
    }

    // Calculate average wait time
    const waitTimes = data
      .filter(h => h.assigned_at)
      .map(h => {
        const created = new Date(h.created_at).getTime();
        const assigned = new Date(h.assigned_at!).getTime();
        return (assigned - created) / (1000 * 60); // Convert to minutes
      });

    const averageWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
    return Math.ceil(averageWaitTime);
  } catch (error) {
    console.error('Calculate wait time failed:', error);
    return 15; // Default fallback
  }
}

async function notifyAgentsOfPendingHandoff(handoffInfo: {
  conversationId: string;
  handoffId: string;
  reason: string;
  priority: string;
}): Promise<void> {
  try {
    // Get all online agents
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('status', 'online');

    if (!agents) return;

    // Send notification to all online agents
    const notifications = agents.map(agent =>
      sendNotification({
        userId: agent.id,
        type: 'handoff_pending',
        title: 'New Handoff Available',
        message: `${handoffInfo.priority.toUpperCase()} priority handoff available`,
        data: handoffInfo
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Notify agents failed:', error);
  }
}

export async function getHandoffMetrics(organizationId: string, timeRange: '24h' | '7d' | '30d' = '24h') {
  try {
    const timeRangeHours = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };

    const since = new Date(Date.now() - timeRangeHours[timeRange] * 60 * 60 * 1000).toISOString();

    const { data: handoffs, error } = await supabase
      .from('handoffs')
      .select('*')
      .gte('created_at', since)
      .eq('organization_id', organizationId);

    if (error) throw error;

    const totalHandoffs = handoffs.length;
    const completedHandoffs = handoffs.filter(h => h.status === 'completed').length;
    const averageWaitTime = handoffs
      .filter(h => h.assigned_at)
      .reduce((sum, h) => {
        const wait = new Date(h.assigned_at!).getTime() - new Date(h.created_at).getTime();
        return sum + (wait / (1000 * 60)); // Convert to minutes
      }, 0) / handoffs.filter(h => h.assigned_at).length;

    const handoffRate = totalHandoffs / Math.max(1, completedHandoffs + totalHandoffs) * 100;

    return {
      totalHandoffs,
      completedHandoffs,
      averageWaitTime: Math.round(averageWaitTime || 0),
      handoffRate: Math.round(handoffRate * 100) / 100,
      byPriority: {
        urgent: handoffs.filter(h => h.priority === 'urgent').length,
        high: handoffs.filter(h => h.priority === 'high').length,
        medium: handoffs.filter(h => h.priority === 'medium').length,
        low: handoffs.filter(h => h.priority === 'low').length
      }
    };
  } catch (error) {
    console.error('Get handoff metrics failed:', error);
    return null;
  }
}