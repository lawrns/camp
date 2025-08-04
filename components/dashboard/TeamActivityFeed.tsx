"use client";

import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useRealtime } from '@/hooks/useRealtime';
import { Avatar, AvatarFallback } from '@/components/unified-ui/components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { 
  ChatCircle, 
  CheckCircle, 
  Clock, 
  Star, 
  Users, 
  ChatCircle as MessageCircle,
  UserCircle,
  ArrowUp
} from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

interface TeamActivity {
  id: string;
  type: 'conversation_started' | 'message_sent' | 'conversation_resolved' | 'satisfaction_updated' | 'agent_joined' | 'performance_milestone';
  message: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  timestamp: Date;
  metadata?: {
    conversationId?: string;
    satisfaction?: number;
    responseTime?: number;
    messagesCount?: number;
  };
}

interface TeamActivityFeedProps {
  organizationId: string;
  maxActivities?: number;
}

const activityIcons = {
  conversation_started: ChatCircle,
  message_sent: MessageCircle,
  conversation_resolved: CheckCircle,
  satisfaction_updated: Star,
  agent_joined: Users,
  performance_milestone: ArrowUp,
};

const activityColors = {
  conversation_started: 'text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-100',
  message_sent: 'text-green-600 bg-green-50',
  conversation_resolved: 'text-purple-600 bg-purple-50',
  satisfaction_updated: 'text-yellow-600 bg-yellow-50',
  agent_joined: 'text-indigo-600 bg-indigo-50',
  performance_milestone: 'text-orange-600 bg-orange-50',
};

export function TeamActivityFeed({ organizationId, maxActivities = 10 }: TeamActivityFeedProps) {
  const { members, loading: membersLoading } = useOrganizationMembers(organizationId);
  const [activities, setActivities] = useState<TeamActivity[]>([]);

  // Memoize realtime options to prevent infinite re-renders
  const realtimeOptions = {
    onNewMessage: (message: unknown) => {
      const member = members.find(m => m.user_id === message.senderId);
      if (member) {
        addActivity({
          type: 'message_sent',
          message: `${member.profile.fullName || member.profile.email} sent a message`,
          memberId: member.id,
          memberName: member.profile.fullName || member.profile.email,
          memberAvatar: member.profile.avatarUrl || undefined,
          metadata: {
            conversationId: message.conversation_id,
            messagesCount: 1,
          },
        });
      }
    },
    onConversationUpdate: (update: unknown) => {
      const member = members.find(m => m.user_id === update.agent_id);
      if (member) {
        let type: TeamActivity['type'] = 'conversation_started';
        let message = `${member.profile.fullName || member.profile.email} started a conversation`;

        if (update.status === 'resolved') {
          type = 'conversation_resolved';
          message = `${member.profile.fullName || member.profile.email} resolved a conversation`;
        } else if (update.status === 'assigned') {
          type = 'agent_joined';
          message = `${member.profile.fullName || member.profile.email} joined a conversation`;
        }

        addActivity({
          type,
          message,
          memberId: member.id,
          memberName: member.profile.fullName || member.profile.email,
          memberAvatar: member.profile.avatarUrl || undefined,
          metadata: {
            conversationId: update.conversation_id,
          },
        });
      }
    },
  };

  // Subscribe to realtime updates
  const [realtimeState] = useRealtime({
    type: "dashboard",
    organizationId,
    enableHeartbeat: true
  });
  
  // Handle realtime events
  useEffect(() => {
    // Note: Event handling would need to be implemented in the unified hook
    // or through a separate subscription mechanism
  }, [realtimeState]);

  const addActivity = (activity: Omit<TeamActivity, 'id' | 'timestamp'>) => {
    const newActivity: TeamActivity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setActivities(prev => [newActivity, ...prev.slice(0, maxActivities - 1)]);
  };

  // Generate mock activities for demonstration
  useEffect(() => {
    if (members.length > 0 && activities.length === 0) {
      const mockActivities: Omit<TeamActivity, 'id' | 'timestamp'>[] = [
        {
          type: 'conversation_resolved',
          message: 'Resolved customer inquiry about billing',
          memberId: members[0]?.id || '',
          memberName: members[0]?.profile.fullName || members[0]?.profile.email || 'Team Member',
          memberAvatar: members[0]?.profile.avatar_url,
          metadata: {
            conversationId: 'conv-123',
            satisfaction: 5,
            responseTime: 120,
          },
        },
        {
          type: 'message_sent',
          message: 'Responded to technical support request',
          memberId: members[1]?.id || '',
          memberName: members[1]?.profile.fullName || members[1]?.profile.email || 'Team Member',
          memberAvatar: members[1]?.profile.avatar_url,
          metadata: {
            conversationId: 'conv-124',
            messagesCount: 3,
          },
        },
        {
          type: 'performance_milestone',
          message: 'Achieved 95% customer satisfaction this week',
          memberId: members[0]?.id || '',
          memberName: members[0]?.profile.fullName || members[0]?.profile.email || 'Team Member',
          memberAvatar: members[0]?.profile.avatar_url,
          metadata: {
            satisfaction: 95,
          },
        },
      ];

      mockActivities.forEach((activity, index) => {
        setTimeout(() => {
          addActivity(activity);
        }, index * 1000);
      });
    }
  }, [members, activities.length]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (membersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type];
            const colorClasses = activityColors[activity.type];
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in-left delay-100"
              >
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    {activity.memberAvatar ? (
                      <img src={activity.memberAvatar} alt={activity.memberName} />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.memberName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {activity.memberName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${colorClasses}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <p className="text-sm text-gray-700">{activity.message}</p>
                  </div>
                  
                  {activity.metadata && (
                    <div className="flex items-center gap-2 mt-1">
                      {activity.metadata.satisfaction && (
                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {activity.metadata.satisfaction}/5
                        </span>
                      )}
                      {activity.metadata.responseTime && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.metadata.responseTime}s
                        </span>
                      )}
                      {activity.metadata.messagesCount && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {activity.metadata.messagesCount} messages
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <UserCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No recent team activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}