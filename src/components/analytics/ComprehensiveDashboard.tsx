"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import {
  Warning as AlertCircle,
  Robot as Bot,
  Clock,
  ChatCircle as MessageSquare,
  CheckCircle as ThumbsUp,
  TrendDown as TrendingDown,
  TrendUp as TrendingUp,
  Users,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface DashboardProps {
  organizationId?: string;
}

const COLORS = ["#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function ComprehensiveDashboard({ organizationId }: DashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [period, organizationId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        ...(organizationId && { organizationId }),
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-spacing-md">
        <Card className="border-status-error-light bg-[var(--fl-color-danger-subtle)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-ds-2 text-red-600">
              <Icon icon={AlertCircle} className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle case when metrics is null or doesn't have expected structure
  const conversations = metrics?.conversations || {
    total: 0,
    resolved: 0,
    averageResolutionTime: 0,
    byChannel: [],
    byStatus: []
  };

  const messages = metrics?.messages || {
    peakHours: [],
    responseTime: [],
    byType: [],
    total: 0
  };

  const ai = metrics?.ai || {
    handovers: 0,
    messagesHandled: 0,
    successRate: 0,
    escalations: 0,
    averageConfidence: 0
  };

  const agents = metrics?.agents || {
    messagesPerAgent: [],
    satisfactionByAgent: []
  };

  const customers = metrics?.customers || {
    total: 0,
    new: 0,
    returning: 0,
    satisfactionScore: 0
  };

  return (
    <div className="space-y-6 p-spacing-md" data-testid="comprehensive-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your support team's performance and customer satisfaction</p>
        </div>

        <Select value={period} onValueChange={(value: string) => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Conversations"
          value={conversations.total}
          change={calculateChange(conversations.total, conversations.resolved)}
          icon={MessageSquare}
          trend="up"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${Math.round((conversations.resolved / conversations.total) * 100)}%`}
          change={`${conversations.averageResolutionTime} min avg`}
          icon={Clock}
          trend="neutral"
        />
        <MetricCard
          title="AI Success Rate"
          value={`${Math.round(ai.successRate * 100)}%`}
          change={`${ai.escalations} escalations`}
          icon={Bot}
          trend={ai.successRate > 0.8 ? "up" : "down"}
        />
        <MetricCard
          title="Customer Satisfaction"
          value={customers.satisfactionScore.toFixed(1)}
          change="out of 5.0"
          icon={ThumbsUp}
          trend="up"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="conversations" className="space-y-3">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="ai">AI Performance</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversations by Channel</CardTitle>
                <CardDescription>Distribution across different communication channels</CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.byChannel && conversations.byChannel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={conversations.byChannel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {conversations.byChannel.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-foreground-muted">
                    <div className="text-center">
                      <div className="mb-2 text-4xl">📊</div>
                      <p>No channel data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversation Status</CardTitle>
                <CardDescription>Current status of all conversations</CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.byStatus && conversations.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversations.byStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-foreground-muted">
                    <div className="text-center">
                      <div className="mb-2 text-4xl">📈</div>
                      <p>No status data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Volume by Hour</CardTitle>
                <CardDescription>Peak hours for customer messages</CardDescription>
              </CardHeader>
              <CardContent>
                {messages.peakHours && messages.peakHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={messages.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-foreground-muted">
                    <div className="text-center">
                      <div className="mb-2 text-4xl">⏰</div>
                      <p>No peak hours data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Messages by Type</CardTitle>
                <CardDescription>Distribution of message senders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.byType.map((type: any) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-ds-2">
                        <Badge variant="outline">{type.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {((type.count / messages.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={(type.count / messages.total) * 100} className="w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>AI Handovers</CardTitle>
                <CardDescription>Total AI sessions initiated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ai.handovers}</div>
                <p className="mt-2 text-sm text-muted-foreground">{ai.messagesHandled} messages handled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Confidence</CardTitle>
                <CardDescription>AI response confidence level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(ai.averageConfidence * 100).toFixed(1)}%</div>
                <Progress value={ai.averageConfidence * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escalation Rate</CardTitle>
                <CardDescription>AI to human handovers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ai.handovers > 0 ? ((ai.escalations / ai.handovers) * 100).toFixed(1) : 0}%
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ai.escalations} total escalations</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agent Activity</CardTitle>
                <CardDescription>Messages sent by each agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.messagesPerAgent.map((agent: any) => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <span className="font-medium">{agent.name}</span>
                      <div className="flex items-center gap-ds-2">
                        <span className="text-sm text-muted-foreground">{agent.count} messages</span>
                        <Badge variant="secondary">{agent.count > 50 ? "High" : "Normal"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Satisfaction Ratings</CardTitle>
                <CardDescription>Customer ratings by agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.satisfactionByAgent.map((agent: any) => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <span className="font-medium">{agent.name}</span>
                      <div className="flex items-center gap-ds-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              icon={ThumbsUp}
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(agent.rating) ? "fill-orange-400 text-orange-400" : "text-neutral-300"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{agent.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Customers</CardTitle>
                <CardDescription>Unique customers in period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.total}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Icon icon={TrendingUp} className="text-semantic-success h-4 w-4" />
                    <span className="text-sm">{customers.new} new</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon icon={Users} className="h-4 w-4 text-[var(--fl-color-info)]" />
                    <span className="text-sm">{customers.returning} returning</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Customer Journey</CardTitle>
                <CardDescription>New vs returning customer ratio</CardDescription>
              </CardHeader>
              <CardContent>
                {customers.new > 0 || customers.returning > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "New Customers", value: customers.new },
                          { name: "Returning Customers", value: customers.returning },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-foreground-muted">
                    <div className="text-center">
                      <div className="mb-2 text-4xl">👥</div>
                      <p>No customer data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, change, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="flex items-center gap-1 text-tiny text-muted-foreground">
          {trend === "up" && <Icon icon={TrendingUp} className="text-semantic-success h-3 w-3" />}
          {trend === "down" && <Icon icon={TrendingDown} className="text-brand-mahogany-500 h-3 w-3" />}
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-spacing-md" data-testid="comprehensive-dashboard">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i: any) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function calculateChange(total: number, resolved: number): string {
  const percentage = (resolved / total) * 100;
  return `${percentage.toFixed(1)}% resolved`;
}

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}
