"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Warning as AlertTriangle,
  Prohibit as Ban,
  CheckCircle,
  FileText,
  Globe,
  ClockCounterClockwise as History,
  Lock,
  PaperPlaneTilt as Send,
  Shield,
  UserMinus as UserX,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface ThreatAction {
  id: string;
  type: "block_ip" | "block_user" | "rate_limit" | "require_2fa" | "suspend_account" | "notify_admin";
  target: string;
  reason: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
  status: "active" | "expired" | "revoked";
}

interface SecurityIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affectedUsers: number;
  affectedResources: string[];
  status: "open" | "investigating" | "mitigated" | "resolved";
  createdAt: string;
  actions: ThreatAction[];
}

interface ResponseTemplate {
  id: string;
  name: string;
  description: string;
  actions: {
    type: string;
    config: unknown;
  }[];
}

interface ThreatResponseInterfaceProps {
  incidentId?: string;
  organizationId: string;
  className?: string;
}

const ACTION_CONFIGS = {
  block_ip: {
    icon: Globe,
    label: "Block IP Address",
    color: "text-red-600",
    fields: ["ip_address", "duration", "reason"],
  },
  block_user: {
    icon: UserX,
    label: "Block User",
    color: "text-red-600",
    fields: ["user_id", "duration", "reason"],
  },
  rate_limit: {
    icon: AlertTriangle,
    label: "Apply Rate Limit",
    color: "text-yellow-600",
    fields: ["target", "limit", "duration"],
  },
  require_2fa: {
    icon: Lock,
    label: "Require 2FA",
    color: "text-blue-600",
    fields: ["user_id"],
  },
  suspend_account: {
    icon: Ban,
    label: "Suspend Account",
    color: "text-red-600",
    fields: ["user_id", "reason"],
  },
  notify_admin: {
    icon: Send,
    label: "Notify Admin",
    color: "text-purple-600",
    fields: ["message", "priority"],
  },
};

export function ThreatResponseInterface({ incidentId, organizationId, className }: ThreatResponseInterfaceProps) {
  const [incident, setIncident] = useState<SecurityIncident | null>(null);
  const [activeActions, setActiveActions] = useState<ThreatAction[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<string>("");
  const [actionForm, setActionForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch incident details if ID provided
        if (incidentId) {
          const incidentResponse = await fetch(`/api/ai/security/incidents/${incidentId}`, {
            headers: { "X-Organization-ID": organizationId },
          });
          if (incidentResponse.ok) {
            const data = await incidentResponse.json();
            setIncident(data);
          }
        }

        // Fetch active threat actions
        const actionsResponse = await fetch("/api/ai/security/actions", {
          headers: { "X-Organization-ID": organizationId },
        });
        if (actionsResponse.ok) {
          const data = await actionsResponse.json();
          setActiveActions(data.actions || []);
        }

        // Fetch response templates
        const templatesResponse = await fetch("/api/ai/security/templates", {
          headers: { "X-Organization-ID": organizationId },
        });
        if (templatesResponse.ok) {
          const data = await templatesResponse.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load threat response data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [incidentId, organizationId, toast]);

  const executeAction = async (actionType: string, params: unknown) => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/ai/security/execute-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({
          actionType,
          params,
          incidentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to execute action");

      toast({
        title: "Action Executed",
        description: "Security action has been applied successfully",
      });

      // Refresh data
      const actionsResponse = await fetch("/api/ai/security/actions", {
        headers: { "X-Organization-ID": organizationId },
      });
      if (actionsResponse.ok) {
        const data = await actionsResponse.json();
        setActiveActions(data.actions || []);
      }

      setShowActionDialog(false);
      setActionForm({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute security action",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const revokeAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/ai/security/actions/${actionId}/revoke`, {
        method: "POST",
        headers: {
          "X-Organization-ID": organizationId,
        },
      });

      if (!response.ok) throw new Error("Failed to revoke action");

      toast({
        title: "Action Revoked",
        description: "Security action has been revoked",
      });

      setActiveActions((prev) => prev.map((a: unknown) => (a.id === actionId ? { ...a, status: "revoked" } : a)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke action",
        variant: "destructive",
      });
    }
  };

  const applyTemplate = async () => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    try {
      setSubmitting(true);
      for (const action of template.actions) {
        await executeAction(action.type, action.config);
      }
      toast({
        title: "Template Applied",
        description: `${template.name} has been applied successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply response template",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Threat Response</CardTitle>
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
      {/* Incident Context */}
      {incident && (
        <Alert
          className={cn(
            "border-l-4",
            incident.severity === "critical"
              ? "border-l-red-600"
              : incident.severity === "high"
                ? "border-l-orange-600"
                : incident.severity === "medium"
                  ? "border-l-yellow-600"
                  : "border-l-blue-600"
          )}
        >
          <Icon icon={Shield} className="h-4 w-4" />
          <AlertTitle>{incident.title}</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-spacing-sm">
              <p>{incident.description}</p>
              <div className="flex gap-3 text-sm">
                <span>
                  Affected Users: <strong>{incident.affectedUsers}</strong>
                </span>
                <Badge variant={incident.status === "open" ? "error" : "secondary"}>{incident.status}</Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quick-actions" className="space-y-3">
        <TabsList>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="templates">Response Templates</TabsTrigger>
          <TabsTrigger value="active">Active Measures</TabsTrigger>
          <TabsTrigger value="history">Response History</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-actions">
          <Card>
            <CardHeader>
              <CardTitle>Quick Response Actions</CardTitle>
              <CardDescription>Take immediate action to mitigate threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(ACTION_CONFIGS).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      className="h-auto justify-start spacing-3"
                      onClick={() => {
                        setSelectedActionType(type);
                        setShowActionDialog(true);
                      }}
                    >
                      <Icon className={cn("mr-3 h-5 w-5", config.color)} />
                      <div className="text-left">
                        <div className="font-semibold">{config.label}</div>
                        <div className="text-tiny text-muted-foreground">{config.fields.join(", ")}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>Apply pre-configured response strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Select value={selectedTemplate} onValueChange={(value: string) => setSelectedTemplate(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a response template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template: unknown) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-tiny text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={applyTemplate} disabled={!selectedTemplate || submitting}>
                  Apply Template
                </Button>
              </div>

              {selectedTemplate && (
                <Alert>
                  <Icon icon={AlertTriangle} className="h-4 w-4" />
                  <AlertTitle>Template Actions</AlertTitle>
                  <AlertDescription>
                    This template will execute the following actions:
                    <ul className="mt-2 list-inside list-disc">
                      {templates
                        .find((t) => t.id === selectedTemplate)
                        ?.actions.map((action, idx) => (
                          <li key={idx}>
                            {ACTION_CONFIGS[action.type as keyof typeof ACTION_CONFIGS]?.label || action.type}
                          </li>
                        ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Measures</CardTitle>
              <CardDescription>Currently active threat mitigation actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeActions.filter((a: unknown) => a.status === "active").length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No active security measures</p>
                ) : (
                  activeActions
                    .filter((a: unknown) => a.status === "active")
                    .map((action: unknown) => {
                      const config = ACTION_CONFIGS[action.type as keyof typeof ACTION_CONFIGS];
                      const Icon = config?.icon || Shield;

                      return (
                        <div key={action.id} className="flex items-center justify-between rounded-ds-lg border spacing-3">
                          <div className="flex items-center gap-3">
                            <Icon className={cn("h-5 w-5", config?.color)} />
                            <div>
                              <p className="font-medium">{config?.label || action.type}</p>
                              <p className="text-sm text-muted-foreground">
                                Target: {action.target} • Reason: {action.reason}
                              </p>
                              {action.expiresAt && (
                                <p className="text-tiny text-muted-foreground">
                                  Expires: {format(new Date(action.expiresAt), "MMM d, h:mm a")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => revokeAction(action.id)}>
                            Revoke
                          </Button>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Response History</CardTitle>
              <CardDescription>Past security actions and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeActions
                  .filter((a: unknown) => a.status !== "active")
                  .map((action: unknown) => {
                    const config = ACTION_CONFIGS[action.type as keyof typeof ACTION_CONFIGS];
                    const Icon = config?.icon || History;

                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between rounded-ds-lg border spacing-3 opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{config?.label || action.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {action.target} • {action.status}
                            </p>
                            <p className="text-tiny text-muted-foreground">
                              {format(new Date(action.createdAt), "MMM d, h:mm a")} by {action.createdBy}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{action.status}</Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ACTION_CONFIGS[selectedActionType as keyof typeof ACTION_CONFIGS]?.label}</DialogTitle>
            <DialogDescription>Configure and execute this security action</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedActionType === "block_ip" && (
              <>
                <div>
                  <Label htmlFor="ip_address">IP Address</Label>
                  <Input
                    id="ip_address"
                    placeholder="192.168.1.1"
                    value={actionForm.ipAddress || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setActionForm({ ...actionForm, ipAddress: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={actionForm.duration || "1h"}
                    onValueChange={(value: string) => setActionForm({ ...actionForm, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this action..."
                value={actionForm.reason || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setActionForm({ ...actionForm, reason: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => executeAction(selectedActionType, actionForm)} disabled={submitting}>
              {submitting ? "Executing..." : "Execute Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add missing Input component
function Input({ id, placeholder, value, onChange, className }: unknown) {
  return (
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        "text-typography-sm flex h-10 w-full rounded-ds-md border border-input bg-background px-3 py-2",
        className
      )}
    />
  );
}
