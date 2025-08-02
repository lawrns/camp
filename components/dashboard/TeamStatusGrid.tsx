"use client";

import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { Badge } from '@/components/unified-ui/components/Badge';
import { Avatar, AvatarFallback } from '@/components/unified-ui/components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { motion } from 'framer-motion';
import { 
  UserCircle, 
  Clock, 
  CheckCircle, 
  Star, 
  MessageCircle,
  Circle,
  XCircle
} from '@phosphor-icons/react';

interface TeamStatusGridProps {
  organizationId: string;
}

interface TeamMemberStatus {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: Date;
  activeConversations: number;
  maxConversations: number;
  avgResponseTime: number;
  satisfactionScore: number;
  resolvedToday: number;
  role: string;
}

const statusConfig = {
  online: {
    icon: Circle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Online',
  },
  offline: {
    icon: XCircle,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Offline',
  },
  busy: {
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Busy',
  },
  away: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Away',
  },
};

export function TeamStatusGrid({ organizationId }: TeamStatusGridProps) {
  const { members, loading: membersLoading } = useOrganizationMembers(organizationId);

  // Transform members data to include status and metrics
  const teamMembers: TeamMemberStatus[] = members.map((member, index) => ({
    id: member.id,
    name: member.profile.full_name || member.profile.email,
    email: member.profile.email,
    avatar: member.profile.avatar_url,
    status: index === 0 ? 'online' : index === 1 ? 'busy' : 'offline' as const,
    lastSeen: new Date(Date.now() - (index * 30 * 60 * 1000)), // Mock last seen times
    activeConversations: Math.floor(Math.random() * 5) + 1,
    maxConversations: 8,
    avgResponseTime: Math.floor(Math.random() * 300) + 60,
    satisfactionScore: 4 + Math.random(),
    resolvedToday: Math.floor(Math.random() * 10) + 1,
    role: member.role || 'Agent',
  }));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getWorkloadPercentage = (active: number, max: number) => {
    return Math.min((active / max) * 100, 100);
  };

  if (membersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Team Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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
          <UserCircle className="w-5 h-5" />
          Team Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member, index) => {
            const status = statusConfig[member.status];
            const StatusIcon = status.icon;
            const workloadPercentage = getWorkloadPercentage(member.activeConversations, member.maxConversations);

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${status.border} ${status.bg} hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        <AvatarFallback className="text-sm">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <StatusIcon className={`w-4 h-4 ${status.color} bg-white rounded-full`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {member.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Status and metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Active conversations</span>
                    <span className="font-medium">
                      {member.activeConversations}/{member.maxConversations}
                    </span>
                  </div>

                  {/* Workload progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${workloadPercentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`h-2 rounded-full ${
                        workloadPercentage > 80 ? 'bg-red-500' :
                        workloadPercentage > 60 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Performance metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-gray-600">Avg response:</span>
                      <span className="font-medium">{member.avgResponseTime}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-600" />
                      <span className="text-gray-600">Satisfaction:</span>
                      <span className="font-medium">{member.satisfactionScore.toFixed(1)}/5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-gray-600">Resolved today:</span>
                      <span className="font-medium">{member.resolvedToday}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-purple-600" />
                      <span className="text-gray-600">Workload:</span>
                      <span className="font-medium">{workloadPercentage.toFixed(0)}%</span>
                    </div>
                  </div>

                  {member.status !== 'online' && member.lastSeen && (
                    <div className="text-xs text-gray-500">
                      Last seen: {formatLastSeen(member.lastSeen)}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No team members found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 