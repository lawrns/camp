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
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/unified-ui/components/table";
import { Icon } from "@/lib/ui/Icon";

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
        return { icon: Clock, color: "bg-blue-500", badge: "primary" };
      case "in_progress":
        return { icon: User, color: "bg-yellow-500", badge: "secondary" };
      case "waiting":
        return { icon: Warning, color: "bg-orange-500", badge: "outline" };
      case "resolved":
        return { icon: CheckCircle, color: "bg-green-500", badge: "primary" };
      case "closed":
        return { icon: Archive, color: "bg-gray-500", badge: "outline" };
      default:
        return { icon: Clock, color: "bg-gray-400", badge: "outline" };
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
        return { color: "bg-gray-400", badge: "outline" };
    }
  };

  const getSlaStatusConfig = (slaStatus: TicketData["slaStatus"]) => {
    switch (slaStatus) {
      case "on_track":
        return { icon: CheckCircle, color: "text-green-600", badge: "primary" };
      case "at_risk":
        return { icon: Warning, color: "text-yellow-600", badge: "secondary" };
      case "overdue":
        return { icon: WarningCircle, color: "text-red-600", badge: "destructive" };
      default:
        return { icon: Clock, color: "text-gray-600", badge: "outline" };
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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {userName}
              </h1>
              <p className="mt-2 text-gray-600">
                Manage support tickets and track customer issues
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard/tickets/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon icon={Plus} className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Icon icon={Ticket} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Icon icon={Clock} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openTickets}</div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Icon icon={User} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.inProgressTickets}</div>
              <p className="text-xs text-muted-foreground">
                Being worked on
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Icon icon={CheckCircle} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.slaCompliance}%</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Icon icon={MagnifyingGlass} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Icon icon={FunnelSimple} className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            <div className="flex items-center gap-2">
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
        </div>

        {/* Tickets Table */}
        <Card>
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
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleTicketClick(ticket.id)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{ticket.title}</div>
                          <div className="text-sm text-gray-500">#{ticket.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{ticket.customer.name}</div>
                          {ticket.customer.email && (
                            <div className="text-sm text-gray-500">{ticket.customer.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.badge as any} className="capitalize">
                          <Icon icon={StatusIcon} className="mr-1 h-3 w-3" />
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig.badge as any} className="capitalize">
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                              {ticket.assignee.name.charAt(0)}
                            </div>
                            <span className="text-sm">{ticket.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Icon icon={SlaIcon} className={`h-4 w-4 ${slaConfig.color}`} />
                          <span className={`text-sm ${slaConfig.color}`}>
                            {ticket.slaStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Icon icon={DotsThreeVertical} className="h-4 w-4" />
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
          <div className="text-center py-12">
            <Icon icon={Ticket} className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
                ? "Try adjusting your filters or search query."
                : "Create your first ticket to get started."}
            </p>
            <Button onClick={() => router.push("/dashboard/tickets/new")}>
              <Icon icon={Plus} className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
