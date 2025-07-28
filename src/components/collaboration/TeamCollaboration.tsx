"use client";

import React, { useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Warning as AlertCircle,
  Bell,
  Robot as Bot,
  Crown,
  ChatCircle as MessageCircle,
  Phone,
  PaperPlaneTilt as Send,
  Gear as Settings,
  Shield,
  Users,
  VideoCamera as Video,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Separator } from "@/components/unified-ui/components/Separator";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";

// Team member interface
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "agent" | "viewer" | "ai";
  status: "online" | "away" | "busy" | "offline";
  currentActivity?: string;
  activeConversations: number;
  performance: {
    satisfaction: number;
    responseTime: number;
    resolved: number;
  };
  lastActive: Date;
  capabilities?: string[];
}

// Message interface
export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: "message" | "status" | "system" | "alert";
  metadata?: {
    conversationId?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    mentions?: string[];
  };
}

// Quick action interface
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  disabled?: boolean;
}

// Mock data generators
const generateTeamMembers = (): TeamMember[] => [
  {
    id: "1",
    name: "Alex Rivera",
    email: "alex@campfire.dev",
    avatar: "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=80",
    role: "admin",
    status: "online",
    currentActivity: "Reviewing escalated tickets",
    activeConversations: 3,
    performance: { satisfaction: 98.5, responseTime: 2.3, resolved: 45 },
    lastActive: new Date(),
    capabilities: ["Technical Support", "Team Lead", "Escalation"],
  },
  {
    id: "2",
    name: "Jordan Kim",
    email: "jordan@campfire.dev",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=80",
    role: "agent",
    status: "busy",
    currentActivity: "On customer call",
    activeConversations: 5,
    performance: { satisfaction: 96.2, responseTime: 3.1, resolved: 38 },
    lastActive: new Date(),
    capabilities: ["Sales Support", "Product Expert"],
  },
  {
    id: "3",
    name: "Sam Taylor",
    email: "sam@campfire.dev",
    role: "agent",
    status: "away",
    currentActivity: "Coffee break",
    activeConversations: 0,
    performance: { satisfaction: 94.1, responseTime: 4.2, resolved: 22 },
    lastActive: new Date(Date.now() - 300000), // 5 minutes ago
    capabilities: ["Billing Support", "Documentation"],
  },
  {
    id: "4",
    name: "AI Assistant Pro",
    email: "ai@campfire.dev",
    role: "ai",
    status: "online",
    currentActivity: "Processing customer queries",
    activeConversations: 127,
    performance: { satisfaction: 92.8, responseTime: 0.5, resolved: 89 },
    lastActive: new Date(),
    capabilities: ["24/7 Support", "Multi-language", "Auto-resolution"],
  },
];

const generateMockMessage = (members: TeamMember[]): TeamMessage => {
  const member = members[Math.floor(Math.random() * members.length)] || { id: "fallback", name: "Unknown" };
  const messages = [
    "Just resolved a complex billing issue - customer was very happy! 🎉",
    "Need backup on technical ticket #4521 - payment gateway integration",
    "Customer feedback: They love the new dashboard features!",
    "Escalating high-priority issue to engineering team",
    "Quick reminder: Team standup in 15 minutes",
    "Anyone available to take overflow from my queue?",
    "Just finished customer call - they're upgrading to enterprise! 💪",
    "Documentation updated for new API endpoints",
  ];

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    senderId: member.id,
    senderName: member.name,
    message: messages[Math.floor(Math.random() * messages.length)] || "Default message",
    timestamp: new Date(),
    type: Math.random() > 0.9 ? "alert" : "message",
    metadata: {
      priority: Math.random() > 0.8 ? "high" : "medium",
      ...(Math.random() > 0.7 && { mentions: ["@everyone"] }),
    },
  };
};

export function TeamCollaboration() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(generateTeamMembers());
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with some messages
  useEffect(() => {
    const initialMessages = Array.from({ length: 5 }, () => generateMockMessage(teamMembers));
    setMessages(initialMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
  }, [teamMembers]);

  // Simulate real-time messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newMsg = generateMockMessage(teamMembers);
        setMessages((prev) => [...prev, newMsg].slice(-50)); // Keep last 50 messages
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [teamMembers]);

  // Simulate team member status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTeamMembers((prev) =>
        prev.map((member: any) => {
          if (Math.random() > 0.8) {
            const statuses: TeamMember["status"][] = ["online", "away", "busy"];
            const activities = [
              "Handling customer query",
              "On customer call",
              "Coffee break",
              "Reviewing tickets",
              "Documentation update",
              "Team meeting",
            ];

            return {
              ...member,
              status:
                member.role === "ai" ? "online" : statuses[Math.floor(Math.random() * statuses.length)] || "online",
              currentActivity: activities[Math.floor(Math.random() * activities.length)] || "Working",
              activeConversations:
                member.role === "ai" ? Math.floor(100 + Math.random() * 50) : Math.floor(Math.random() * 8),
              lastActive: new Date(),
            };
          }
          return member;
        })
      );
    }, 20000); // Every 20 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: TeamMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: user.id,
      senderName: user.email || "Unknown",
      message: newMessage.trim(),
      timestamp: new Date(),
      type: "message",
      metadata: {
        priority: "medium",
      },
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const getStatusColor = (status: TeamMember["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-[var(--fl-color-danger-subtle)]0";
      case "away":
        return "bg-orange-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getRoleIcon = (role: TeamMember["role"]) => {
    switch (role) {
      case "admin":
        return <Icon icon={Crown} className="h-3 w-3" />;
      case "agent":
        return <Icon icon={Shield} className="h-3 w-3" />;
      case "ai":
        return <Icon icon={Bot} className="h-3 w-3" />;
      default:
        return <Icon icon={Users} className="h-3 w-3" />;
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "call",
      label: "Start Call",
      icon: Phone,
      action: () => {},
    },
    {
      id: "video",
      label: "Video Call",
      icon: Video,
      action: () => {},
    },
    {
      id: "broadcast",
      label: "Broadcast",
      icon: Bell,
      action: () => {},
    },
    {
      id: "escalate",
      label: "Escalate",
      icon: AlertCircle,
      action: () => {},
    },
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  if (!isExpanded) {
    // Collapsed view
    return (
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-ds-2 text-sm">
              <Icon icon={Users} className="h-4 w-4" />
              Team ({teamMembers.filter((m: any) => m.status === "online").length} online)
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
              <Icon icon={MessageCircle} className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Team Status Overview */}
          <div className="space-y-spacing-sm">
            {teamMembers.slice(0, 3).map((member: any) => (
              <div key={member.id} className="flex items-center gap-ds-2">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-brand-50 text-tiny text-brand-700">
                      {member.role === "ai" ? (
                        <Icon icon={Bot} className="h-3 w-3" />
                      ) : (
                        member.name
                          .split(" ")
                          .map((n: any) => n[0])
                          .join("")
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-ds-full border border-background ${getStatusColor(member.status)}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-tiny font-medium">{member.name}</p>
                  <p className="truncate text-tiny text-muted-foreground">{member.currentActivity}</p>
                </div>
                <Badge variant="outline" className="text-tiny">
                  {member.activeConversations}
                </Badge>
              </div>
            ))}

            {teamMembers.length > 3 && (
              <p className="text-center text-tiny text-muted-foreground">+{teamMembers.length - 3} more team members</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-ds-2">
            {quickActions.slice(0, 2).map((action: any) => (
              <Button key={action.id} variant="outline" size="sm" onClick={action.action} className="h-8 text-tiny">
                <action.icon className="mr-1 h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className="flex h-[600px] w-96 flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Users} className="h-5 w-5" />
            Team Collaboration
            <div className="bg-semantic-success h-2 w-2 animate-pulse rounded-ds-full" />
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
            <Icon icon={Settings} className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex gap-ds-2">
          {quickActions.map((action: any) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="h-8 flex-1 text-tiny"
            >
              <action.icon className="mr-1 h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3">
        {/* Team Members List */}
        <div>
          <h3 className="mb-2 text-sm font-medium">Team Members ({teamMembers.length})</h3>
          <ScrollArea className="h-32">
            <div className="space-y-spacing-sm">
              {teamMembers.map((member: any) => (
                <OptimizedMotion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-ds-lg p-spacing-sm transition-colors hover:bg-accent/30"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-brand-50 text-tiny text-brand-700">
                        {member.role === "ai" ? (
                          <Icon icon={Bot} className="h-4 w-4" />
                        ) : (
                          member.name
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-ds-full border border-background ${getStatusColor(member.status)}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-tiny font-medium">{member.name}</p>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="truncate text-tiny text-muted-foreground">{member.currentActivity}</p>
                  </div>

                  <div className="text-right">
                    <Badge variant="outline" className="text-tiny">
                      {member.activeConversations}
                    </Badge>
                    <p className="mt-1 text-tiny text-muted-foreground">{formatTime(member.lastActive)}</p>
                  </div>
                </OptimizedMotion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Messages */}
        <div className="flex min-h-0 flex-1 flex-col">
          <h3 className="mb-2 text-sm font-medium">Team Chat</h3>
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              <OptimizedAnimatePresence>
                {messages.map((message: any) => (
                  <OptimizedMotion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`rounded-ds-lg spacing-2 ${
                      message.type === "alert"
                        ? "border-status-error-light border bg-[var(--fl-color-danger-subtle)]"
                        : "bg-accent/30"
                    }`}
                  >
                    <div className="flex items-start gap-ds-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-brand-50 text-tiny text-brand-700">
                          {message.senderName
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-ds-2">
                          <p className="text-tiny font-medium">{message.senderName}</p>
                          {message.metadata?.priority === "high" && (
                            <Badge variant="error" className="text-tiny">
                              High
                            </Badge>
                          )}
                          <span className="text-tiny text-muted-foreground">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-tiny">{message.message}</p>
                      </div>
                    </div>
                  </OptimizedMotion.div>
                ))}
              </OptimizedAnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="mt-3 flex gap-ds-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="h-8 text-tiny"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()} className="h-8 px-3">
              <Icon icon={Send} className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified presence indicator component
export function TeamPresenceIndicator() {
  const [onlineCount, setOnlineCount] = useState(3);
  const [totalCount] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(Math.floor(Math.random() * 2) + 3); // 3-4 online
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-ds-2">
      <div className="flex -space-x-spacing-sm">
        {Array.from({ length: Math.min(onlineCount, 3) }).map((_, i) => (
          <div
            key={i}
            className="flex h-6 w-6 items-center justify-center rounded-ds-full border-2 border-background bg-brand-500"
          >
            <span className="text-tiny font-medium text-white">{i + 1}</span>
          </div>
        ))}
        {onlineCount > 3 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-ds-full border-2 border-background bg-muted">
            <span className="text-tiny font-medium text-muted-foreground">+{onlineCount - 3}</span>
          </div>
        )}
      </div>
      <span className="text-tiny text-muted-foreground">
        {onlineCount} of {totalCount} online
      </span>
      <div className="bg-semantic-success h-2 w-2 animate-pulse rounded-ds-full" />
    </div>
  );
}
