"use client";

import { Avatar, AvatarFallback } from '@/components/unified-ui/components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { Badge } from '@/components/unified-ui/components/Badge';
import { 
  Users, 
  Circle, 
  Clock, 
  ChatCircle, 
  Star,
  CheckCircle
} from '@phosphor-icons/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AgentKPIs {
  conversationsToday: number;
  avgResponseTime: number;
  satisfactionRate: number;
  resolvedToday: number;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  lastSeen?: Date;
  kpis?: AgentKPIs;
}

interface IntercomAgentPresencePanelProps {
  agents: Agent[];
  title?: string;
  showKPIs?: boolean;
  maxVisible?: number;
  className?: string;
}

const statusConfig = {
  online: {
    color: 'bg-blue-500',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    label: 'Online'
  },
  busy: {
    color: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    label: 'Busy'
  },
  offline: {
    color: 'bg-gray-400',
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    label: 'Offline'
  }
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatLastSeen(lastSeen: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function AgentCard({ agent, showKPIs }: { agent: Agent; showKPIs?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const statusStyle = statusConfig[agent.status];

  return (
    <div
      className={cn(
        "relative group transition-all duration-300",
        "hover:-translate-y-1 hover:scale-105"
      )}
      onMouseEnter={() => {
        setIsHovered(true);
        if (showKPIs && agent.kpis) {
          setShowTooltip(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
    >
      {/* Agent card */}
      <div className={cn(
        "glass-card p-4 rounded-xl border transition-all duration-300",
        "hover:shadow-lg hover:border-gray-300/50",
        statusStyle.bg,
        "relative overflow-hidden"
      )}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex items-center gap-3">
          {/* Avatar with status */}
          <div className="relative">
            <Avatar className={cn(
              "w-10 h-10 transition-all duration-300 ring-2 ring-white shadow-sm",
              isHovered && "scale-110 ring-4"
            )}>
              {agent.avatar ? (
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-gray-100 to-gray-200">
                  {getInitials(agent.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Status indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
              "flex items-center justify-center transition-all duration-300",
              isHovered && "scale-110"
            )}>
              <Circle className={cn("w-3 h-3", statusStyle.color)} weight="fill" />
            </div>
          </div>
          
          {/* Agent info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {agent.name}
              </h4>
              <Badge 
                variant="secondary" 
                className={cn("text-xs px-2 py-0.5 rounded-full", statusStyle.text, statusStyle.bg)}
              >
                {statusStyle.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {agent.status === 'offline' && agent.lastSeen ? (
                <span>Last seen {formatLastSeen(agent.lastSeen)}</span>
              ) : (
                <span>Active now</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom accent */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
          statusStyle.color.replace('bg-', 'bg-gradient-to-r from-').replace(' ', ' to-transparent '),
          "opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100",
          "transform-gpu origin-left"
        )} />
      </div>
      
      {/* KPI Tooltip */}
      {showTooltip && agent.kpis && (
        <div className={cn(
          "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50",
          "glass-card p-3 rounded-lg border shadow-lg min-w-48",
          "animate-fade-in-up"
        )}>
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-gray-900 mb-2">
              Last 24h Performance
            </h5>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <ChatCircle className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">Conversations:</span>
                <span className="font-medium font-numeric tabular-nums">
                  {agent.kpis.conversationsToday}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-500" />
                <span className="text-gray-600">Avg Response:</span>
                <span className="font-medium font-numeric tabular-nums">
                  {agent.kpis.avgResponseTime}s
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500" />
                <span className="text-gray-600">Satisfaction:</span>
                <span className="font-medium font-numeric tabular-nums">
                  {agent.kpis.satisfactionRate}%
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">Resolved:</span>
                <span className="font-medium font-numeric tabular-nums">
                  {agent.kpis.resolvedToday}
                </span>
              </div>
            </div>
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45" />
        </div>
      )}
    </div>
  );
}

function AvatarStack({ agents, maxVisible = 5 }: { agents: Agent[]; maxVisible?: number }) {
  const visibleAgents = agents.slice(0, maxVisible);
  const remainingCount = Math.max(0, agents.length - maxVisible);

  return (
    <div className="flex items-center">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {visibleAgents.map((agent, index) => (
          <div
            key={agent.id}
            className={cn(
              "relative transition-all duration-300 hover:z-10 hover:scale-110",
              "animate-fade-in-up"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
              {agent.avatar ? (
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-gray-100 to-gray-200">
                  {getInitials(agent.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Status dot */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white",
              statusConfig[agent.status].color
            )} />
          </div>
        ))}
        
        {/* Remaining count */}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center shadow-sm">
            <span className="text-xs font-medium text-gray-600">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
      
      {/* Online count */}
      <div className="ml-3 flex items-center gap-1 text-sm text-gray-600">
        <Circle className="w-2 h-2 text-green-500" weight="fill" />
        <span className="font-medium font-numeric tabular-nums">
          {agents.filter(a => a.status === 'online').length}
        </span>
        <span>online</span>
      </div>
    </div>
  );
}

export function IntercomAgentPresencePanel({
  agents,
  title = "Team Status",
  showKPIs = true,
  maxVisible = 5,
  className
}: IntercomAgentPresencePanelProps) {
  const onlineAgents = agents.filter(agent => agent.status === 'online');
  const busyAgents = agents.filter(agent => agent.status === 'busy');
  const offlineAgents = agents.filter(agent => agent.status === 'offline');

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="border-b border-gray-100/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-heading">
            <Users className="w-5 h-5" />
            {title}
          </div>
          
          {/* Avatar stack for header */}
          <AvatarStack agents={agents} maxVisible={maxVisible} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {agents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              No team members found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status summary */}
            <div className="flex items-center gap-4 text-sm">
              {onlineAgents.length > 0 && (
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 text-green-500" weight="fill" />
                  <span className="font-medium font-numeric tabular-nums">{onlineAgents.length}</span>
                  <span className="text-gray-600">online</span>
                </div>
              )}
              {busyAgents.length > 0 && (
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 text-amber-500" weight="fill" />
                  <span className="font-medium font-numeric tabular-nums">{busyAgents.length}</span>
                  <span className="text-gray-600">busy</span>
                </div>
              )}
              {offlineAgents.length > 0 && (
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 text-gray-400" weight="fill" />
                  <span className="font-medium font-numeric tabular-nums">{offlineAgents.length}</span>
                  <span className="text-gray-600">offline</span>
                </div>
              )}
            </div>
            
            {/* Agent cards */}
            <div className="space-y-3">
              {[...onlineAgents, ...busyAgents, ...offlineAgents].map((agent, index) => (
                <div
                  key={agent.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AgentCard agent={agent} showKPIs={showKPIs} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
