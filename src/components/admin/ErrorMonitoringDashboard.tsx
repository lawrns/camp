/**
 * Error Monitoring Dashboard
 *
 * Comprehensive dashboard for monitoring application errors,
 * tracking trends, and managing error resolution
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bug,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Activity,
  Zap,
  Database,
  Wifi,
  Shield,
  User,
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

interface ErrorReport {
  id: string;
  error_id: string;
  fingerprint: string;
  message: string;
  level: "page" | "component" | "widget" | "critical";
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  context?: string;
  url: string;
  user_id?: string;
  retry_count: number;
  similar_error_count: number;
  is_known_issue: boolean;
  resolved: boolean;
  created_at: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

interface ErrorStatistics {
  total_errors: number;
  critical_errors: number;
  high_errors: number;
  medium_errors: number;
  low_errors: number;
  unique_errors: number;
  resolved_errors: number;
  error_rate: number;
  top_categories: Record<string, number>;
  error_trend: Array<{
    time_bucket: string;
    error_count: number;
    critical_count: number;
  }>;
}

export function ErrorMonitoringDashboard({ organizationId }: { organizationId: string }) {
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  // Fetch error data
  useEffect(() => {
    const fetchErrorData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          organizationId,
          timeRange: selectedTimeRange,
          limit: "100",
          offset: "0",
        });

        if (selectedSeverity !== "all") {
          params.append("severity", selectedSeverity);
        }
        if (selectedCategory !== "all") {
          params.append("category", selectedCategory);
        }

        const response = await fetch(`/api/errors/report?${params}`);

        if (response.ok) {
          const data = await response.json();
          setErrorReports(data.errors || []);
          setStatistics(data.statistics);
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchErrorData();
  }, [organizationId, selectedTimeRange, selectedSeverity, selectedCategory]);

  // Filter error reports based on search term
  const filteredErrorReports = useMemo(() => {
    if (!searchTerm) return errorReports;

    const term = searchTerm.toLowerCase();
    return errorReports.filter(
      (error) =>
        (error instanceof Error ? error.message : String(error)).toLowerCase().includes(term) ||
        error.category.toLowerCase().includes(term) ||
        error.url.toLowerCase().includes(term) ||
        error.profiles?.email?.toLowerCase().includes(term)
    );
  }, [errorReports, searchTerm]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-[var(--fl-color-danger-muted)]";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-[var(--fl-color-warning-muted)]";
      case "low":
        return "text-blue-600 bg-blue-50 border-[var(--fl-color-border-interactive)]";
      default:
        return "text-gray-600 bg-gray-50 border-[var(--fl-color-border)]";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "network":
        return <Wifi className="h-4 w-4" />;
      case "authentication":
        return <User className="h-4 w-4" />;
      case "authorization":
        return <Shield className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      case "performance":
        return <Zap className="h-4 w-4" />;
      case "ui":
        return <Activity className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const handleResolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/errors/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorId,
          organizationId,
        }),
      });

      if (response.ok) {
        // Update local state
        setErrorReports((prev) => prev.map((error) => (error.id === errorId ? { ...error, resolved: true } : error)));
      }
    } catch (error) {

    }
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
          <h2 className="text-3xl font-bold text-gray-900">Error Monitoring</h2>
          <p className="text-foreground">Track and resolve application errors</p>
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
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <Bug className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-foreground text-sm font-medium">Total Errors</p>
                  <p className="text-3xl font-bold">{statistics.total_errors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-foreground text-sm font-medium">Critical Errors</p>
                  <p className="text-3xl font-bold text-red-600">{statistics.critical_errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-foreground text-sm font-medium">Resolution Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statistics.total_errors > 0
                      ? Math.round((statistics.resolved_errors / statistics.total_errors) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-spacing-md">
              <div className="flex items-center space-x-spacing-sm">
                <TrendingUp className="text-ds-brand h-5 w-5" />
                <div>
                  <p className="text-foreground text-sm font-medium">Unique Errors</p>
                  <p className="text-3xl font-bold">{statistics.unique_errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="errors" className="space-y-3">
        <TabsList>
          <TabsTrigger value="errors">Error Reports</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-3">
          {/* Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="border-ds-border-strong rounded-ds-md border px-3 py-2 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-ds-border-strong rounded-ds-md border px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="network">Network</option>
              <option value="authentication">Authentication</option>
              <option value="authorization">Authorization</option>
              <option value="database">Database</option>
              <option value="performance">Performance</option>
              <option value="ui">UI</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Error Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Showing {filteredErrorReports.length} of {errorReports.length} errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredErrorReports.slice(0, 50).map((error) => (
                  <div key={error.id} className="flex items-center space-x-3 rounded-ds-lg border spacing-3">
                    <div className="flex items-center space-x-spacing-sm">
                      {getCategoryIcon(error.category)}
                      <div className="flex items-center space-x-1">
                        {error.resolved ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-spacing-sm">
                        <Badge className={getSeverityColor(error.severity)}>{error.severity}</Badge>
                        <Badge variant="outline">{error.category}</Badge>
                        {error.is_known_issue && <Badge variant="secondary">Known Issue</Badge>}
                        {error.similar_error_count > 1 && <Badge variant="outline">{error.similar_error_count}x</Badge>}
                      </div>

                      <p className="mt-1 text-sm font-medium text-gray-900">{(error instanceof Error ? error.message : String(error))}</p>

                      <div className="text-foreground-muted mt-1 flex items-center space-x-3 text-sm">
                        <span>{error.profiles?.email || "Anonymous"}</span>
                        <span>{new URL(error.url).pathname}</span>
                        <span>{new Date(error.created_at).toLocaleString()}</span>
                        {error.retry_count > 0 && <span>{error.retry_count} retries</span>}
                      </div>
                    </div>

                    {!error.resolved && (
                      <Button variant="outline" size="sm" onClick={() => handleResolveError(error.id)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-3">
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>Error frequency over time ({selectedTimeRange})</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={statistics.error_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_bucket" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Line type="monotone" dataKey="error_count" stroke="#3B82F6" strokeWidth={2} name="Total Errors" />
                    <Line
                      type="monotone"
                      dataKey="critical_count"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Critical Errors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-3">
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Error Categories</CardTitle>
                <CardDescription>Distribution of errors by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={Object.entries(statistics.top_categories).map(([key, value]) => ({
                        name: key,
                        value: value,
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.entries(statistics.top_categories).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
