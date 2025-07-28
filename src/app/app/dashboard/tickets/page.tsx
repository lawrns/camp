"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/unified-ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { apiGet, apiPatch, handleApiResponse } from "@/lib/utils/api-client";
import {
  Archive,
  CalendarBlank,
  CaretDown,
  CheckCircle,
  Clock,
  DotsThreeVertical,
  FunnelSimple,
  MagnifyingGlass,
  Plus,
  Ticket,
  User,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  slaStatus: string;
  updatedAt?: string;
  assigneeId?: string;
  customer?: {
    name: string;
    email?: string;
  };
  assignee?: {
    name: string;
    avatar?: string;
  };
  [key: string]: any;
}

interface TicketsResponse {
  tickets: Ticket[];
  success?: boolean;
}

interface AssignmentResponse {
  success: boolean;
  assignment: {
    assignedToMe: boolean;
    newAssignee: string | null;
  };
}

// No mock data - using real API data

const statusOptions = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800", icon: Clock },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-800", icon: WarningCircle },
  { value: "waiting", label: "Waiting", color: "bg-purple-100 text-purple-800", icon: User },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800", icon: Archive },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-orange-100 text-orange-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
];

const slaStatusOptions = [
  { value: "on-track", label: "On Track", color: "bg-green-100 text-green-800" },
  { value: "at-risk", label: "At Risk", color: "bg-orange-100 text-orange-800" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  { value: "resolved", label: "Resolved", color: "bg-blue-100 text-blue-800" },
];

export default function DashboardTicketsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const queryClient = useQueryClient();
  const router = useRouter();

  // Ticket assignment mutation
  const assignTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      assigneeId,
      reason,
    }: {
      ticketId: string;
      assigneeId: string | null;
      reason?: string;
    }) => {
      const response = await apiPatch(`/api/tickets/${ticketId}/assign`, { assigneeId, reason });
      return handleApiResponse<AssignmentResponse>(response);
    },
    onSuccess: (data) => {
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ["tickets"] });

      const { assignment } = data;
      if (assignment.assignedToMe) {
        toast.success("Ticket assigned to you successfully!");
      } else if (assignment.newAssignee) {
        toast.success("Ticket assigned successfully!");
      } else {
        toast.success("Ticket unassigned successfully!");
      }
    },
    onError: (error: Error) => {
      toast.error(`Assignment failed: ${(error instanceof Error ? error.message : String(error))}`);
    },
  });

  const handleAssignToMe = (ticketId: string) => {
    assignTicketMutation.mutate({
      ticketId,
      assigneeId: "me",
      reason: "Self-assigned from dashboard",
    });
  };

  const handleUnassign = (ticketId: string) => {
    assignTicketMutation.mutate({
      ticketId,
      assigneeId: null,
      reason: "Unassigned from dashboard",
    });
  };

  // Fetch real tickets data
  const {
    data: ticketsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tickets", statusFilter, priorityFilter, searchQuery],
    queryFn: async (): Promise<TicketsResponse> => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await apiGet(`/api/tickets?${params.toString()}`);
      return handleApiResponse<TicketsResponse>(response);
    },
    refetchInterval: false, // DISABLED: Use real-time updates instead
  });

  const tickets: Ticket[] = ticketsData?.tickets || [];

  const getStatusConfig = (status: string) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const getPriorityConfig = (priority: string) => {
    return priorityOptions.find((p) => p.value === priority) || priorityOptions[0];
  };

  const getSlaStatusConfig = (slaStatus: string) => {
    return slaStatusOptions.find((s) => s.value === slaStatus) || slaStatusOptions[0];
  };

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === "all" || ticket.assignee?.name === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getTicketsByStatus = (status: string) => {
    if (status === "all") return filteredTickets;
    return filteredTickets.filter((ticket: Ticket) => ticket.status === status);
  };

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t: Ticket) => t.status === "open").length,
    inProgress: tickets.filter((t: Ticket) => t.status === "in_progress").length,
    resolved: tickets.filter((t: Ticket) => t.status === "resolved").length,
    overdue: tickets.filter((t: Ticket) => t.slaStatus === "overdue").length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 spacing-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Management</h1>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="spacing-4 text-center">
                <div className="mx-auto mb-2 h-8 w-8 animate-pulse rounded bg-gray-200" />
                <div className="mx-auto mb-1 h-6 w-12 animate-pulse rounded bg-gray-200" />
                <div className="mx-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-6 spacing-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Management</h1>
            <p className="text-red-600">Error loading tickets: {(error instanceof Error ? error.message : String(error))}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 spacing-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <p className="text-gray-600">Manage and track customer support tickets</p>
        </div>
        <Button data-testid="createTicketButton">
          <Icon icon={Plus} className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="spacing-4 text-center">
            <Icon icon={Ticket} className="mx-auto mb-2 h-8 w-8 text-blue-600" />
            <div className="text-2xl font-bold">{ticketStats.total}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Total Tickets</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4 text-center">
            <Icon icon={Clock} className="mx-auto mb-2 h-8 w-8 text-orange-600" />
            <div className="text-2xl font-bold">{ticketStats.open}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Open</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4 text-center">
            <Icon icon={WarningCircle} className="mx-auto mb-2 h-8 w-8 text-orange-600" />
            <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">In Progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4 text-center">
            <Icon icon={CheckCircle} className="text-semantic-success-dark mx-auto mb-2 h-8 w-8" />
            <div className="text-2xl font-bold">{ticketStats.resolved}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Resolved</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4 text-center">
            <Icon icon={Warning} className="mx-auto mb-2 h-8 w-8 text-red-600" />
            <div className="text-2xl font-bold">{ticketStats.overdue}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="spacing-4">
          <div className="flex flex-wrap items-center gap-4" data-testid="ticketFilters">
            <div className="min-w-[200px] flex-1">
              <div className="relative">
                <Icon
                  icon={MagnifyingGlass}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Icon icon={FunnelSimple} className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredTickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({getTicketsByStatus("open").length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({getTicketsByStatus("in_progress").length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({getTicketsByStatus("resolved").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <Table data-testid="ticketList">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTicketsByStatus(activeTab).map((ticket: any) => {
                    const statusConfig = getStatusConfig(ticket.status);
                    const priorityConfig = getPriorityConfig(ticket.priority);
                    const slaConfig = getSlaStatusConfig(ticket.slaStatus);
                    const StatusIcon = statusConfig?.icon || Clock;

                    return (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-[var(--fl-color-background-subtle)]">
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.id}</div>
                            <div className="max-w-[200px] truncate text-sm text-gray-600">
                              {ticket.title || "No title"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.customer?.name || "Unknown Customer"}</div>
                            <div className="text-sm text-gray-600">{ticket.customer?.email || "No email"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig?.color || "bg-neutral-100 text-neutral-800"}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig?.label || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityConfig?.color || "bg-neutral-100 text-neutral-800"}>
                            {priorityConfig?.label || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-ds-full bg-gray-200 text-xs">
                              {ticket.assignee?.avatar || ticket.assignee?.name?.charAt(0) || "U"}
                            </div>
                            <span className="text-sm">{ticket.assignee?.name || "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={slaConfig?.color || "bg-neutral-100 text-neutral-800"}>
                            {slaConfig?.label || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-gray-100">
                              <Icon icon={DotsThreeVertical} className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="right-0">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}>
                                <Icon icon={MagnifyingGlass} className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Icon icon={CaretDown} className="mr-2 h-4 w-4" />
                                Edit Ticket
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Icon icon={CalendarBlank} className="mr-2 h-4 w-4" />
                                View Conversation
                              </DropdownMenuItem>
                              {!ticket.assigneeId && (
                                <DropdownMenuItem
                                  onClick={() => !assignTicketMutation.isPending && handleAssignToMe(ticket.id)}
                                  className={assignTicketMutation.isPending ? "cursor-not-allowed opacity-50" : ""}
                                >
                                  <Icon icon={User} className="mr-2 h-4 w-4" />
                                  Assign to Me
                                </DropdownMenuItem>
                              )}
                              {ticket.assigneeId && (
                                <DropdownMenuItem
                                  onClick={() => !assignTicketMutation.isPending && handleUnassign(ticket.id)}
                                  className={assignTicketMutation.isPending ? "cursor-not-allowed opacity-50" : ""}
                                >
                                  <Icon icon={User} className="mr-2 h-4 w-4" />
                                  Unassign
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
