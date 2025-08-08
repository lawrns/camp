/**
 * Tickets Management Dashboard
 *
 * Comprehensive interface for managing support tickets:
 * - Ticket listing with advanced filtering
 * - Status and priority management
 * - Assignment and workload distribution
 * - SLA tracking and analytics
 * - Bulk operations and automation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Calendar,
  ChevronDown,
  CheckCircle,
  Clock,
  MoreVertical,
  Filter,
  Search,
  Plus,
  Ticket,
  User,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, PageHeader, PageHeaderRow, PageTitle, PageToolbar, PageContent } from "@/components/ui/page-shell";

interface TicketData {
  id: string;
  title: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  slaStatus: "on_track" | "at_risk" | "overdue";
  updatedAt: string;
  createdAt: string;
  assigneeId?: string;
  customer: {
    name: string;
    email?: string;
  };
  assignee?: {
    name: string;
    avatar?: string;
  };
  description: string;
  category?: string;
  tags: string[];
}

export default function TicketsPage() {
  const router = useRouter();
  const [userName] = useState("Support Manager");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // Mock ticket data - in real app, this would come from API
  const [tickets, setTickets] = useState<TicketData[]>([
    {
      id: "1",
      title: "Login issues with mobile app",
      status: "open",
      priority: "high",
      slaStatus: "at_risk",
      updatedAt: "2024-01-20T10:30:00Z",
      createdAt: "2024-01-20T09:00:00Z",
      assigneeId: "user1",
      customer: {
        name: "John Smith",
        email: "john@example.com",
      },
      assignee: {
        name: "Sarah Johnson",
        avatar: "/avatars/sarah.jpg",
      },
      description: "Customer unable to login to mobile app after recent update",
      category: "Technical",
      tags: ["mobile", "login", "urgent"],
    },
    {
      id: "2",
      title: "Billing inquiry about subscription",
      status: "in_progress",
      priority: "medium",
      slaStatus: "on_track",
      updatedAt: "2024-01-20T11:15:00Z",
      createdAt: "2024-01-19T14:30:00Z",
      assigneeId: "user2",
      customer: {
        name: "Emily Davis",
        email: "emily@company.com",
      },
      assignee: {
        name: "Mike Chen",
        avatar: "/avatars/mike.jpg",
      },
      description: "Customer has questions about their subscription billing cycle",
      category: "Billing",
      tags: ["billing", "subscription"],
    },
    {
      id: "3",
      title: "Feature request: Dark mode",
      status: "waiting",
      priority: "low",
      slaStatus: "on_track",
      updatedAt: "2024-01-19T16:45:00Z",
      createdAt: "2024-01-18T10:00:00Z",
      customer: {
        name: "Alex Rodriguez",
        email: "alex@startup.io",
      },
      description: "Customer requesting dark mode feature for better accessibility",
      category: "Feature Request",
      tags: ["feature", "ui", "accessibility"],
    },
  ]);

  const [metrics, setMetrics] = useState({
    totalTickets: 3,
    openTickets: 1,
    inProgressTickets: 1,
    resolvedToday: 0,
    avgResponseTime: "2.5 hours",
    slaCompliance: 85,
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStatusConfig = (status: TicketData["status"]) => {
    switch (status) {
      case "open":
        return { icon: AlertCircle, color: "bg-[var(--fl-color-primary)]", badge: "destructive" };
      case "in_progress":
        return { icon: User, color: "bg-blue-500", badge: "default" };
      case "waiting":
        return { icon: Clock, color: "bg-orange-500", badge: "secondary" };
      case "resolved":
        return { icon: CheckCircle, color: "bg-green-500", badge: "success" };
      case "closed":
        return { icon: Archive, color: "bg-[var(--fl-color-text-muted)]", badge: "outline" };
      default:
        return { icon: Clock, color: "bg-[var(--fl-color-text-muted)]", badge: "outline" };
    }
  };

  const getPriorityConfig = (priority: TicketData["priority"]) => {
    switch (priority) {
      case "urgent":
        return { color: "bg-red-600", badge: "destructive" };
      case "high":
        return { color: "bg-red-500", badge: "destructive" };
      case "medium":
        return { color: "bg-yellow-500", badge: "secondary" };
      case "low":
        return { color: "bg-green-500", badge: "outline" };
      default:
        return { color: "bg-[var(--fl-color-text-muted)]", badge: "outline" };
    }
  };

  const getSlaStatusConfig = (slaStatus: TicketData["slaStatus"]) => {
    switch (slaStatus) {
      case "on_track":
        return { icon: CheckCircle, color: "text-green-600", badge: "success" };
      case "at_risk":
        return { icon: AlertTriangle, color: "text-yellow-600", badge: "secondary" };
      case "overdue":
        return { icon: AlertCircle, color: "text-red-600", badge: "destructive" };
      default:
        return { icon: Clock, color: "text-[var(--fl-color-text-muted)]", badge: "outline" };
    }
  };

  const getTicketsByStatus = (status: string) => {
    if (status === "all") return tickets;
    return tickets.filter(ticket => ticket.status === status);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery === "" || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === "all" || ticket.assigneeId === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const handleTicketClick = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--fl-color-background)]">
        <div className="container mx-auto max-w-6xl px-[var(--fl-spacing-6)] py-[var(--fl-spacing-12)]">
          <div className="text-center">
            <div className="mx-auto mb-[var(--fl-spacing-4)] h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--fl-color-primary)]"></div>
            <p className="text-[var(--fl-color-text-muted)]">Loading tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fl-color-background)]">
      <div className="container mx-auto max-w-6xl px-[var(--fl-spacing-6)] py-[var(--fl-spacing-12)]">
        {/* Header Section */}
        <div className="mb-[var(--fl-spacing-8)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--fl-color-text)]">
                {getGreeting()}, {userName}
              </h1>
              <p className="mt-[var(--fl-spacing-2)] text-[var(--fl-color-text-muted)]">
                Manage support tickets and track customer issues
              </p>
            </div>
            <div className="flex gap-[var(--fl-spacing-3)]">
              <Button
                onClick={() => router.push("/dashboard/tickets/new")}
                className="bg-[var(--fl-color-primary)] hover:bg-[var(--fl-color-primary)]/90"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="mb-[var(--fl-spacing-8)] grid grid-cols-1 gap-[var(--fl-spacing-6)] md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
              <CardTitle className="text-sm font-medium text-[var(--fl-color-text-muted)]">Total Tickets</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-[var(--fl-color-primary)]/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-[var(--fl-color-primary)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--fl-color-text)]">{metrics.totalTickets}</div>
              <p className="text-xs text-[var(--fl-color-text-muted)] mt-[var(--fl-spacing-1)]">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
              <CardTitle className="text-sm font-medium text-[var(--fl-color-text-muted)]">Open Tickets</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--fl-color-text)]">{metrics.openTickets}</div>
              <p className="text-xs text-[var(--fl-color-text-muted)] mt-[var(--fl-spacing-1)]">
                Needs attention
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
              <CardTitle className="text-sm font-medium text-[var(--fl-color-text-muted)]">In Progress</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--fl-color-text)]">{metrics.inProgressTickets}</div>
              <p className="text-xs text-[var(--fl-color-text-muted)] mt-[var(--fl-spacing-1)]">
                Being worked on
              </p>
            </CardContent>
          </Card>

          <Card className="border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-2)]">
              <CardTitle className="text-sm font-medium text-[var(--fl-color-text-muted)]">SLA Compliance</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--fl-color-text)]">{metrics.slaCompliance}%</div>
              <p className="text-xs text-[var(--fl-color-text-muted)] mt-[var(--fl-spacing-1)]">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-[var(--fl-spacing-6)] border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm">
          <CardContent className="p-[var(--fl-spacing-6)]">
            <div className="flex flex-col gap-[var(--fl-spacing-4)] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-[var(--fl-spacing-4)]">
                <div className="relative">
                  <Search className="absolute left-[var(--fl-spacing-3)] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fl-color-text-muted)]" />
                  <Input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 border-[var(--fl-color-border)] bg-[var(--fl-color-background)]"
                  />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                  Filters
                </Button>
              </div>

            <div className="flex items-center gap-[var(--fl-spacing-2)]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="user1">Sarah Johnson</SelectItem>
                  <SelectItem value="user2">Mike Chen</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm">
          <CardContent className="p-0">
            <Table>
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
                {filteredTickets.map((ticket) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  const slaConfig = getSlaStatusConfig(ticket.slaStatus);
                  const StatusIcon = statusConfig?.icon || Clock;
                  const SlaIcon = slaConfig?.icon || Clock;

                  return (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-[var(--fl-color-background)] transition-colors border-b border-[var(--fl-color-border)]"
                      onClick={() => handleTicketClick(ticket.id)}
                    >
                      <TableCell>
                        <div className="space-y-[var(--fl-spacing-1)]">
                          <div className="font-medium text-[var(--fl-color-text)]">{ticket.title}</div>
                          <div className="text-sm text-[var(--fl-color-text-muted)]">#{ticket.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-[var(--fl-spacing-1)]">
                          <div className="font-medium">{ticket.customer.name}</div>
                          {ticket.customer.email && (
                            <div className="text-sm text-[var(--fl-color-text-muted)]">{ticket.customer.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 capitalize rounded-full px-2 py-0.5 text-xs" data-variant={statusConfig.badge}>
                          <StatusIcon className="h-3 w-3" />
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={priorityConfig.badge as any}
                          className="capitalize rounded-full"
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-[var(--fl-spacing-2)]">
                            <div className="h-6 w-6 rounded-full bg-[var(--fl-color-primary)] flex items-center justify-center text-white text-xs font-semibold">
                              {ticket.assignee.name.charAt(0)}
                            </div>
                            <span className="text-sm">{ticket.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--fl-color-text-muted)]">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-[var(--fl-spacing-1)]">
                          <SlaIcon className={`h-4 w-4 ${slaConfig.color}`} />
                          <span className={`text-sm ${slaConfig.color}`}>
                            {ticket.slaStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-[var(--fl-color-text-muted)]">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredTickets.length === 0 && (
          <Card className="border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] shadow-sm">
            <CardContent className="text-center py-[var(--fl-spacing-12)]">
              <div className="h-16 w-16 mx-auto mb-[var(--fl-spacing-4)] rounded-full bg-[var(--fl-color-primary)]/10 flex items-center justify-center">
                <Ticket className="h-8 w-8 text-[var(--fl-color-primary)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--fl-color-text)] mb-[var(--fl-spacing-2)]">No tickets found</h3>
              <p className="text-[var(--fl-color-text-muted)] mb-[var(--fl-spacing-4)] max-w-md mx-auto">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
                  ? "Try adjusting your filters or search query."
                  : "Create your first ticket to get started."}
              </p>
              <Button onClick={() => router.push("/dashboard/tickets/new")} leftIcon={<Plus className="h-4 w-4" />}>
                Create Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
