"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { ArrowLeft, CheckCircle, Clock, Ticket, User, Warning, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { apiGet, apiPatch, apiPost, handleApiResponse } from "@/lib/utils/api-client";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

interface Comment {
  id: number;
  content: string;
  authorId: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
}

interface HistoryEntry {
  id: number;
  action: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface TicketDetails {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assigneeName?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  dueDate?: string;
  conversation?: {
    id: string;
    subject: string;
    customerEmail: string;
    customerDisplayName: string;
  };
  comments: Comment[];
  history: HistoryEntry[];
}

const statusOptions = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800", icon: Clock },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Warning },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
];

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Resolve params Promise
  React.useEffect(() => {
    params.then((resolvedParams) => {
      setTicketId(resolvedParams.id);
    });
  }, [params]);

  // Fetch ticket details
  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery<TicketDetails>({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) throw new Error("No ticket ID");
      const response = await apiGet(`/api/tickets/${ticketId}`);
      return handleApiResponse<TicketDetails>(response);
    },
    enabled: !!ticketId,
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      if (!ticketId) throw new Error("No ticket ID");
      const response = await apiPatch(`/api/tickets/${ticketId}/status`, { status });
      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket status updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${(error instanceof Error ? error.message : String(error))}`);
    },
  });

  // Update ticket priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ priority }: { priority: string }) => {
      if (!ticketId) throw new Error("No ticket ID");
      const response = await apiPatch(`/api/tickets/${ticketId}/priority`, { priority });
      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket priority updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update priority: ${(error instanceof Error ? error.message : String(error))}`);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, isInternal }: { content: string; isInternal: boolean }) => {
      if (!ticketId) throw new Error("No ticket ID");
      const response = await apiPost(`/api/tickets/${ticketId}/comments`, { content, isInternal });
      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      setNewComment("");
      setIsInternal(false);
      toast.success("Comment added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${(error instanceof Error ? error.message : String(error))}`);
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status });
  };

  const handlePriorityChange = (priority: string) => {
    updatePriorityMutation.mutate({ priority });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment, isInternal });
  };

  // Show loading while resolving params
  if (!ticketId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const getPriorityConfig = (priority: string) => {
    return priorityOptions.find((p) => p.value === priority) || priorityOptions[0];
  };

  if (isLoading) {
    return (
      <div className="spacing-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="h-32 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="spacing-6">
        <div className="text-center">
          <Icon icon={WarningCircle} className="text-brand-mahogany-500 mx-auto mb-4 h-16 w-16" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Ticket Not Found</h2>
          <p className="mb-4 text-gray-600">
            The ticket you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard/tickets")} variant="outline" leftIcon={<Icon icon={ArrowLeft} className="h-4 w-4" />}>
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="mx-auto max-w-6xl spacing-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/tickets")} leftIcon={<Icon icon={ArrowLeft} className="h-4 w-4" />}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Icon icon={Ticket} className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">Ticket #{ticket.id}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{ticket.description || "No description provided"}</p>
              </div>

              {ticket.conversation && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Related Conversation</label>
                  <div className="mt-1 rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                    <p className="font-medium">{ticket.conversation.subject}</p>
                    <p className="text-sm text-gray-600">
                      {ticket.conversation.customerDisplayName} ({ticket.conversation.customerEmail})
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments & History */}
          <Card>
            <CardHeader>
              <CardTitle>Comments & Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Comments */}
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-[var(--fl-color-border)] pl-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon icon={User} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                      <span className="text-sm font-medium">{comment.authorName}</span>
                      <span className="text-xs text-[var(--fl-color-text-muted)]">
                        {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                      </span>
                      {comment.isInternal && (
                        <Badge variant="secondary" className="text-xs">
                          Internal
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}

                {/* History */}
                {ticket.history.map((entry) => (
                  <div key={entry.id} className="border-status-info-light border-l-4 pl-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Icon icon={Clock} className="h-4 w-4 text-[var(--fl-color-info)]" />
                      <span className="text-sm font-medium">{entry.authorName}</span>
                      <span className="text-xs text-[var(--fl-color-text-muted)]">
                        {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {entry.action} {entry.field}
                      {entry.oldValue && entry.newValue && (
                        <span>
                          {" "}
                          from <strong>{entry.oldValue}</strong> to <strong>{entry.newValue}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle>Add Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="internal" className="text-sm text-gray-700">
                      Internal comment (not visible to customer)
                    </label>
                  </div>
                  <Button onClick={handleAddComment} disabled={!newComment.trim() || addCommentMutation.isPending}>
                    {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <OptionIcon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Priority</label>
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger>
                    <SelectValue>
                      <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <Badge className={option.color}>{option.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon icon={User} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                  <span className="font-medium">{ticket.customerName || "Unknown Customer"}</span>
                </div>
                {ticket.customerEmail && <div className="ml-6 text-sm text-gray-600">{ticket.customerEmail}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ticket.assigneeName ? (
                  <div className="flex items-center gap-2">
                    <Icon icon={User} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                    <span className="font-medium">{ticket.assigneeName}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Unassigned</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <div className="text-gray-600">{format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Updated:</span>
                  <div className="text-gray-600">{format(new Date(ticket.updatedAt), "MMM d, yyyy h:mm a")}</div>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Resolved:</span>
                    <div className="text-gray-600">{format(new Date(ticket.resolvedAt), "MMM d, yyyy h:mm a")}</div>
                  </div>
                )}
                {ticket.closedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Closed:</span>
                    <div className="text-gray-600">{format(new Date(ticket.closedAt), "MMM d, yyyy h:mm a")}</div>
                  </div>
                )}
                {ticket.dueDate && (
                  <div>
                    <span className="font-medium text-gray-700">Due:</span>
                    <div className="text-gray-600">{format(new Date(ticket.dueDate), "MMM d, yyyy h:mm a")}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
