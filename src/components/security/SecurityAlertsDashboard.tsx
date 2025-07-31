"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Warning as AlertCircle,
  Warning as AlertTriangle,
  Prohibit as Ban,
  CheckCircle,
  Clock,
  Eye,
  Funnel as Filter,
  ArrowsClockwise as RefreshCw,
  MagnifyingGlass as Search,
  ShieldWarning as ShieldAlert,
  XCircle,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface SecurityAlert {
  id: string;
  type: "authentication" | "data_access" | "suspicious_activity" | "rate_limit" | "injection_attempt" | "brute_force";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  source: {
    ip: string;
    userId?: string;
    userEmail?: string;
    location?: string;
    userAgent?: string;
  };
  metadata: {
    attemptCount?: number;
    affectedResources?: string[];
    detectionMethod?: string;
    confidence?: number;
  };
  status: "active" | "investigating" | "resolved" | "false_positive";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface SecurityMetrics {
  total24h: number;
  criticalCount: number;
  activeThreats: number;
  blockedAttempts: number;
  topThreatTypes: {
    type: string;
    count: number;
  }[];
  riskScore: number;
}

interface SecurityAlertsDashboardProps {
  organizationId: string;
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-[var(--fl-color-danger-subtle)]" },
  high: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  medium: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-[var(--fl-color-warning-subtle)]" },
  low: { icon: CheckCircle, color: "text-blue-600", bg: "bg-[var(--fl-color-info-subtle)]" },
};

const THREAT_TYPE_LABELS = {
  authentication: "Authentication Attack",
  data_access: "Unauthorized Access",
  suspicious_activity: "Suspicious Activity",
  rate_limit: "Rate Limit Violation",
  injection_attempt: "Injection Attempt",
  brute_force: "Brute Force Attack",
};

export function SecurityAlertsDashboard({ organizationId, className }: SecurityAlertsDashboardProps) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const realtime = useRealtime();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch alerts
      const alertsResponse = await fetch("/api/ai/security", {
        headers: { "X-Organization-ID": organizationId },
      });
      if (!alertsResponse.ok) throw new Error("Failed to fetch security alerts");
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);
      setMetrics(alertsData.metrics || null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load security alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();

    // Subscribe to real-time security alerts
    const unsubscribe = realtime.subscribe("security-alerts", organizationId, {
      onMessage: (payload) => {
        if (payload.type === "new_alert") {
          setAlerts((prev) => [payload.alert, ...prev]);
          toast({
            title: "New Security Alert",
            description: payload.alert.title,
            variant: "destructive",
          });
        } else if (payload.type === "alert_update") {
          setAlerts((prev) => prev.map((a: any) => (a.id === payload.alert.id ? payload.alert : a)));
        }
      },
    });

    return () => unsubscribe();
  }, [organizationId, realtime, toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
    setRefreshing(false);
  };

  const handleAlertAction = async (alertId: string, action: "resolve" | "false_positive" | "block") => {
    try {
      const response = await fetch(`/api/ai/security/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({ alertId, action }),
      });

      if (!response.ok) throw new Error("Failed to update alert");

      toast({
        title: "Alert Updated",
        description: `Alert has been ${action === "resolve" ? "resolved" : action === "false_positive" ? "marked as false positive" : "blocked"}`,
      });

      await fetchSecurityData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
    }
  };

  const filteredAlerts = alerts.filter((alert: any) => {
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && alert.status !== filterStatus) return false;
    if (
      searchQuery &&
      !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !alert.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">24h Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.total24h}</div>
              <p className="text-tiny text-muted-foreground">{metrics.criticalCount} critical</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics.activeThreats}</div>
              <p className="text-tiny text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Blocked Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-semantic-success-dark text-3xl font-bold">{metrics.blockedAttempts}</div>
              <p className="text-tiny text-muted-foreground">Successfully prevented</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <span
                  className={cn(
                    metrics.riskScore > 70
                      ? "text-red-600"
                      : metrics.riskScore > 40
                        ? "text-yellow-600"
                        : "text-semantic-success-dark"
                  )}
                >
                  {metrics.riskScore}%
                </span>
              </div>
              <p className="text-tiny text-muted-foreground">Overall security risk</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Monitor and respond to security threats</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} leftIcon={<Icon icon={RefreshCw} className={`h-4 w-4 ${refreshing && "animate-spin"}`} />}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Icon
                  icon={Search}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
                />
                <Input
                  id="search"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={filterSeverity}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterSeverity(e.target.value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerts List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No alerts found</div>
              ) : (
                filteredAlerts.map((alert: SecurityAlert) => {
                  const severityConfig = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG];
                  const SeverityIcon = severityConfig.icon;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "cursor-pointer rounded-ds-lg border spacing-4 transition-colors",
                        selectedAlert?.id === alert.id ? "border-primary bg-muted/50" : "hover:bg-muted/25"
                      )}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn("rounded-ds-full spacing-2", severityConfig.bg)}>
                            <SeverityIcon className={cn("h-4 w-4", severityConfig.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-ds-2">
                              <h4 className="font-semibold">{alert.title}</h4>
                              <Badge variant="outline" className="text-tiny">
                                {THREAT_TYPE_LABELS[alert.type as keyof typeof THREAT_TYPE_LABELS] || alert.type}
                              </Badge>
                              <Badge variant={alert.status === "active" ? "error" : "secondary"} className="text-tiny">
                                {alert.status}
                              </Badge>
                            </div>
                            <p className="mb-2 text-sm text-muted-foreground">{alert.description}</p>
                            <div className="flex items-center gap-3 text-tiny text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon icon={Clock} className="h-3 w-3" />
                                {format(new Date(alert.createdAt), "MMM d, h:mm a")}
                              </span>
                              {alert.source.ip && <span>IP: {alert.source.ip}</span>}
                              {alert.source.userEmail && <span>User: {alert.source.userEmail}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-ds-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              // View details
                            }}
                          >
                            <Icon icon={Eye} className="h-4 w-4" />
                          </Button>
                          {alert.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlertAction(alert.id, "block");
                              }}
                            >
                              <Icon icon={Ban} className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {alert.status === "active" && (
                        <div className="mt-3 flex gap-ds-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertAction(alert.id, "resolve");
                            }}
                          >
                            Mark Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertAction(alert.id, "false_positive");
                            }}
                          >
                            False Positive
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Alert Details */}
      {selectedAlert && (
        <Card>
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="mb-2 font-semibold">Source Information</h4>
                <div className="grid gap-ds-2 text-sm">
                  {selectedAlert.source.ip && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span>{selectedAlert.source.ip}</span>
                    </div>
                  )}
                  {selectedAlert.source.userEmail && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User:</span>
                      <span>{selectedAlert.source.userEmail}</span>
                    </div>
                  )}
                  {selectedAlert.source.location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{selectedAlert.source.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Additional Details</h4>
                  <div className="grid gap-ds-2 text-sm">
                    {selectedAlert.metadata.attemptCount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attempt Count:</span>
                        <span>{selectedAlert.metadata.attemptCount}</span>
                      </div>
                    )}
                    {selectedAlert.metadata.confidence && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Detection Confidence:</span>
                        <span>{selectedAlert.metadata.confidence}%</span>
                      </div>
                    )}
                    {selectedAlert.metadata.affectedResources && (
                      <div>
                        <span className="text-muted-foreground">Affected Resources:</span>
                        <div className="mt-1">
                          {selectedAlert.metadata.affectedResources.map((resource, idx) => (
                            <Badge key={idx} variant="outline" className="mb-1 mr-1">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Select({ value, onValueChange, children }: any) {
  return (
    <select
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
      className="form-select"
    >
      {children}
    </select>
  );
}

function SelectTrigger({ children, className }: any) {
  return <div className={className}>{children}</div>;
}

function SelectContent({ children }: any) {
  return <>{children}</>;
}

function SelectItem({ value, children }: any) {
  return <option value={value}>{children}</option>;
}

function SelectValue() {
  return null;
}
