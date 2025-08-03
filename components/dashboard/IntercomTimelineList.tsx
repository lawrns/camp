"use client";

import { Avatar, AvatarFallback } from '@/components/unified-ui/components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { Badge } from '@/components/unified-ui/components/Badge';
import { 
  ChatCircle, 
  CheckCircle, 
  Clock, 
  Star, 
  Users, 
  ArrowUp,
  UserCircle
} from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimelineActivity {
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

interface IntercomTimelineListProps {
  activities: TimelineActivity[];
  title?: string;
  emptyState?: string;
  maxHeight?: string;
  loading?: boolean;
  className?: string;
}

const activityConfig = {
  conversation_started: {
    icon: ChatCircle,
    color: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    border: 'border-blue-200/50',
    badge: 'bg-blue-100 text-blue-700'
  },
  message_sent: {
    icon: ChatCircle,
    color: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200/50',
    badge: 'bg-blue-100 text-blue-700'
  },
  conversation_resolved: {
    icon: CheckCircle,
    color: 'text-purple-600',
    bg: 'bg-gradient-to-br from-purple-50 to-violet-100',
    border: 'border-purple-200/50',
    badge: 'bg-purple-100 text-purple-700'
  },
  satisfaction_updated: {
    icon: Star,
    color: 'text-amber-600',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    border: 'border-amber-200/50',
    badge: 'bg-amber-100 text-amber-700'
  },
  agent_joined: {
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-gradient-to-br from-indigo-50 to-blue-100',
    border: 'border-indigo-200/50',
    badge: 'bg-indigo-100 text-indigo-700'
  },
  performance_milestone: {
    icon: ArrowUp,
    color: 'text-orange-600',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
    border: 'border-orange-200/50',
    badge: 'bg-orange-100 text-orange-700'
  }
};

function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function TimelineItem({ activity, index }: { activity: TimelineActivity; index: number }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
        "hover:bg-white/50 hover:shadow-md hover:-translate-y-0.5",
        "animate-fade-in-left group cursor-pointer"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar with status indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className={cn(
          "w-8 h-8 transition-all duration-300 ring-2 ring-white shadow-sm",
          isHovered && "scale-110 ring-4"
        )}>
          {activity.memberAvatar ? (
            <img 
              src={activity.memberAvatar} 
              alt={activity.memberName}
              className="w-full h-full object-cover"
            />
          ) : (
            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-gray-100 to-gray-200">
              {getInitials(activity.memberName)}
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Activity type indicator */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white",
          "flex items-center justify-center transition-all duration-300",
          config.bg,
          config.border,
          isHovered && "scale-110"
        )}>
          <Icon className={cn("w-2.5 h-2.5", config.color)} />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-gray-900 truncate">
              {activity.memberName}
            </span>
            <Badge 
              variant="secondary" 
              className={cn("text-xs px-2 py-0.5 rounded-full", config.badge)}
            >
              {activity.type.replace('_', ' ')}
            </Badge>
          </div>
          
          <time 
            className="text-xs text-gray-500 flex-shrink-0 font-numeric tabular-nums"
            title={activity.timestamp.toLocaleString()}
          >
            {formatTimeAgo(activity.timestamp)}
          </time>
        </div>
        
        {/* Message */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {activity.message}
        </p>
        
        {/* Metadata */}
        {activity.metadata && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {activity.metadata.satisfaction && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500" />
                <span className="font-numeric tabular-nums">
                  {activity.metadata.satisfaction}/5
                </span>
              </div>
            )}
            {activity.metadata.responseTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="font-numeric tabular-nums">
                  {activity.metadata.responseTime}s
                </span>
              </div>
            )}
            {activity.metadata.messagesCount && (
              <div className="flex items-center gap-1">
                <ChatCircle className="w-3 h-3 text-blue-500" />
                <span className="font-numeric tabular-nums">
                  {activity.metadata.messagesCount} messages
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function IntercomTimelineList({
  activities,
  title = "Team Activity",
  emptyState = "No recent activity — celebrate the silence! 🎉",
  maxHeight = "360px",
  loading = false,
  className
}: IntercomTimelineListProps) {
  if (loading) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-gray-100/50">
          <CardTitle className="flex items-center gap-2 text-gray-900 font-heading">
            <Users className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
    <Card className={cn("glass-card overflow-hidden", className)}>
      {/* Sticky header */}
      <CardHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-gray-100/50">
        <CardTitle className="flex items-center gap-2 text-gray-900 font-heading">
          <Users className="w-5 h-5" />
          {title}
          {activities.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {activities.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      {/* Scrollable content */}
      <CardContent className="p-0">
        <div 
          className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{ maxHeight }}
        >
          {activities.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                {emptyState}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/50">
              {activities.map((activity, index) => (
                <TimelineItem 
                  key={activity.id} 
                  activity={activity} 
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
