/**
 * Audit Logs Dashboard
 *
 * Comprehensive dashboard for viewing and analyzing audit logs,
 * security events, and suspicious activity detection
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Globe,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AuditLogEntry {
  id: string;
  user_id?: string;
  actor_type: "user" | "system" | "api" | "widget" | "ai";
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface SecurityEvent extends AuditLogEntry {
  risk_score: number;
}

interface SuspiciousActivity {
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  suspicious_actions: Record<string, number>;
  risk_score: number;
  recommendation: string;
}

interface AuditStatistics {
  total_events: number;
  successful_events: number;
  failed_events: number;
  unique_users: number;
  events_by_type: Record<string, number>;
  events_by_action: Record<string, number>;
  avg_duration_ms: number;
  error_rate: number;
}

export function AuditLogsDashboard({ organizationId }: { organizationId: string }) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  // Fetch audit data
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setLoading(true);

        const [logsResponse, securityResponse, suspiciousResponse, statsResponse] = await Promise.all([
          fetch(
            `/api/admin/audit-logs?organizationId=${organizationId}&range=${selectedTimeRange}&resourceType=${selectedResourceType}`
          ),
          fetch(`/api/admin/security-events?organizationId=${organizationId}&range=${selectedTimeRange}`),
          fetch(`/api/admin/suspicious-activity?organizationId=${organizationId}`),
          fetch(`/api/admin/audit-statistics?organizationId=${organizationId}&range=${selectedTimeRange}`),
        ]);

        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setAuditLogs(logsData.logs || []);
        }

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          setSecurityEvents(securityData.events || []);
        }

        if (suspiciousResponse.ok) {
          const suspiciousData = await suspiciousResponse.json();
          setSuspiciousActivity(suspiciousData.activities || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData.statistics);
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [organizationId, selectedTimeRange, selectedResourceType]);

  // Filter audit logs based on search term
  const filteredAuditLogs = useMemo(() => {
    if (!searchTerm) return auditLogs;

    const term = searchTerm.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.action.toLowerCase().includes(term) ||
        log.user_email?.toLowerCase().includes(term) ||
        log.resource_type.toLowerCase().includes(term) ||
        log.ipAddress?.includes(term)
    );
  }, [auditLogs, searchTerm]);

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("remove")) return "text-red-600 bg-red-50";
    if (action.includes("create") || action.includes("add")) return "text-green-600 bg-green-50";
    if (action.includes("update") || action.includes("edit")) return "text-blue-600 bg-blue-50";
    if (action.includes("auth")) return "text-purple-600 bg-purple-50";
    return "text-gray-600 bg-gray-50";
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case "user":
        return <User className="h-4 w-4" />;
      case "system":
        return <Activity className="h-4 w-4" />;
      case "api":
        return <Globe className="h-4 w-4" />;
      case "widget":
        return <Globe className="h-4 w-4" />;
      case "ai":
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 8) return "text-red-600 bg-red-50";
    if (riskScore >= 5) return "text-orange-600 bg-orange-50";
    if (riskScore >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-foreground">Monitor system activity and security events</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border-ds-border-strong rounded-ds-md border px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <Activity className="text-ds-brand h-5 w-5" />
                <div>
                  <p className="text-foreground text-sm font-medium">Total Events</p>
                  <p className="text-3xl font-bold">{statistics.total_events.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-foreground text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">
                    {((statistics.successful_events / statistics.total_events) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <User className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-foreground text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold">{statistics.unique_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-foreground text-sm font-medium">Avg Duration</p>
                  <p className="text-3xl font-bold">{Math.round(statistics.avg_duration_ms)}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-3">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-3">
          {/* Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedResourceType}
              onChange={(e) => setSelectedResourceType(e.target.value)}
              className="border-ds-border-strong rounded-ds-md border px-3 py-2 text-sm"
            >
              <option value="all">All Resources</option>
              <option value="conversation">Conversations</option>
              <option value="message">Messages</option>
              <option value="ticket">Tickets</option>
              <option value="user">Users</option>
              <option value="auth">Authentication</option>
              <option value="widget">Widget</option>
            </select>
          </div>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Showing {filteredAuditLogs.length} of {auditLogs.length} events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAuditLogs.slice(0, 50).map((log) => (
                  <div key={log.id} className="flex items-center space-x-3 rounded-ds-lg border spacing-3">
                    <div className="flex items-center space-x-spacing-sm">
                      {getActorIcon(log.actor_type)}
                      <div className="flex items-center space-x-1">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-spacing-sm">
                        <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                        <span className="text-foreground text-sm">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-foreground-muted text-tiny">#{log.resource_id.slice(-8)}</span>
                        )}
                      </div>

                      <div className="text-foreground-muted mt-1 flex items-center space-x-3 text-sm">
                        <span>{log.user_email || log.actor_id || "System"}</span>
                        <span>{log.ipAddress}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.duration_ms && <span>{log.duration_ms}ms</span>}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-spacing-sm">
                <Shield className="h-5 w-5" />
                <span>Security Events</span>
              </CardTitle>
              <CardDescription>
                Authentication failures, suspicious activities, and security-related events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 rounded-ds-lg border spacing-3">
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        event.risk_score >= 8
                          ? "text-red-500"
                          : event.risk_score >= 5
                            ? "text-orange-500"
                            : "text-yellow-500"
                      }`}
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-spacing-sm">
                        <Badge className={getActionColor(event.action)}>{event.action}</Badge>
                        <Badge className={getRiskColor(event.risk_score)}>Risk: {event.risk_score}</Badge>
                      </div>

                      <div className="text-foreground-muted mt-1 flex items-center space-x-3 text-sm">
                        <span>{event.user_email || "Unknown"}</span>
                        <span>{event.ipAddress}</span>
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                      </div>

                      {event.error_message && <p className="mt-1 text-sm text-red-600">{event.error_message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-spacing-sm">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Suspicious Activity</span>
              </CardTitle>
              <CardDescription>
                Detected patterns that may indicate security threats or unusual behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suspiciousActivity.map((activity, index) => (
                  <div key={index} className="rounded-ds-lg border bg-red-50 spacing-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center space-x-spacing-sm">
                        <span className="font-medium">{activity.user_email || "Unknown User"}</span>
                        <Badge className={getRiskColor(activity.risk_score)}>Risk Score: {activity.risk_score}</Badge>
                      </div>
                      <span className="text-foreground-muted text-sm">{activity.ipAddress}</span>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {Object.entries(activity.suspicious_actions).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-base font-bold text-red-600">{value}</div>
                          <div className="text-foreground text-tiny">{key.replace("_", " ")}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-foreground text-sm">{activity.recommendation}</p>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))}

                {suspiciousActivity.length === 0 && (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                    <p className="text-foreground">No suspicious activity detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3">
          {statistics && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Events by Resource Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(statistics.events_by_type).map(([key, value]) => ({
                          name: key,
                          value: value,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {Object.entries(statistics.events_by_type).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Events by Action Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(statistics.events_by_action).map(([key, value]) => ({
                        name: key,
                        value: value,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
