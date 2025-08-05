"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, MessageCircle as MessageSquare, Tag, UserCircle } from "lucide-react";
import { Avatar } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { AssignmentPanel } from "./AssignmentPanel";
import { ConvertToTicketDialog } from "./ConvertToTicketDialog";
import { UnifiedTimeline } from "./UnifiedTimeline";

interface ConversationDetailWithAssignmentProps {
  conversationId: string;
  conversation?: {
    id: number;
    emailFrom: string;
    subject: string;
    status: string;
    assignedToClerkId?: string;
    createdAt: Date;
    tags?: string[];
    priority?: "low" | "medium" | "high" | "urgent";
    customer?: {
      name: string;
      email: string;
    };
    messages?: Array<{
      id: string;
      content: string;
      sender: string;
      timestamp: Date;
    }>;
  };
}

export function ConversationDetailWithAssignment({
  conversationId,
  conversation,
}: ConversationDetailWithAssignmentProps) {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [assignedAgentId, setAssignedAgentId] = useState(conversation?.assignedToClerkId);

  const handleAssignmentChange = (agentId: string) => {
    setAssignedAgentId(agentId);
    // In a real app, this would update the conversation in the backend
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-[var(--fl-color-warning-subtle)]";
      case "low":
        return "text-blue-600 bg-[var(--fl-color-info-subtle)]";
      default:
        return "text-gray-600 bg-[var(--fl-color-background-subtle)]";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Main Conversation Area */}
      <div className="space-y-6 lg:col-span-2">
        {/* Conversation Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{conversation?.subject || "Conversation"}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon icon={UserCircle} className="h-4 w-4" />
                    {conversation?.emailFrom}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon={Clock} className="h-4 w-4" />
                    {conversation?.createdAt && format(conversation.createdAt, "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
              <div className="flex gap-ds-2">
                <Badge variant={conversation?.status === "open" ? "default" : "secondary"}>
                  {conversation?.status || "open"}
                </Badge>
                {conversation?.priority && (
                  <Badge className={getPriorityColor(conversation.priority)}>{conversation.priority}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Conversation Timeline */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedTimeline conversationId={conversationId} events={[]} />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar with Assignment and Details */}
      <div className="space-y-6">
        {/* Assignment Panel */}
        <AssignmentPanel
          conversationId={conversationId}
          currentAgentId={assignedAgentId}
          organizationId={organizationId || ""}
          onAssignmentChange={handleAssignmentChange}
        />

        {/* Conversation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Tags */}
            {conversation?.tags && conversation.tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-ds-2">
                  {conversation.tags.map((tag: unknown) => (
                    <Badge key={tag} variant="outline">
                      <Icon icon={Tag} className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-medium">Quick Actions</p>
              <div className="space-y-spacing-sm">
                <ConvertToTicketDialog
                  open={false}
                  onOpenChange={() => {}}
                  conversation={{
                    id: conversationId,
                    subject: conversation?.subject || "",
                    customer: {
                      name: conversation?.customer?.name || "",
                      email: conversation?.customer?.email || "",
                    },
                    messages:
                      conversation?.messages?.map((msg) => ({
                        ...msg,
                        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
                      })) || [],
                  }}
                  onConvert={async (ticketData) => {
                    // Handle ticket conversion
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Conversation created</p>
                  <p className="text-tiny text-muted-foreground">
                    {conversation?.createdAt && format(conversation.createdAt, "MMM d, h:mm a")}
                  </p>
                </div>
                {assignedAgentId && (
                  <div className="text-sm">
                    <p className="font-medium">Agent assigned</p>
                    <p className="text-tiny text-muted-foreground">Agent ID: {assignedAgentId}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
