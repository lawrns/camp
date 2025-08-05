"use client";

import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/unified-ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Switch } from "@/components/unified-ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/unified-ui/components/table";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { AlertTriangle as AlertTriangle, CheckCircle, Clock, Copy, PencilSimple as Edit2, Link as Globe, Spinner as Loader2, DotsThree as MoreHorizontal, Play, Plus, Trash as Trash2, XCircle, Zap as Zap,  } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Webhook {
  id: string;
  name: string;
  url: string;
  description?: string;
  events: string[];
  status: "active" | "inactive" | "failing";
  enabled: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  consecutive_failures: number;
  total_deliveries: number;
  successful_deliveries: number;
  headers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface CreateWebhookFormData {
  name: string;
  url: string;
  description: string;
  events: string[];
  secret: string;
  headers: Record<string, string>;
  timeout_seconds: number;
  retry_count: number;
  enabled: boolean;
}

interface WebhookManagementProps {
  organizationId: string;
}

const WEBHOOK_EVENTS = [
  { value: "message.created", label: "Message Created", description: "When a new message is sent" },
  { value: "message.updated", label: "Message Updated", description: "When a message is edited" },
  { value: "conversation.created", label: "Conversation Created", description: "When a new conversation starts" },
  { value: "conversation.updated", label: "Conversation Updated", description: "When conversation details change" },
  { value: "conversation.closed", label: "Conversation Closed", description: "When a conversation is resolved" },
  { value: "conversation.assigned", label: "Conversation Assigned", description: "When assigned to an agent" },
  { value: "conversation.unassigned", label: "Conversation Unassigned", description: "When unassigned from an agent" },
  { value: "agent.online", label: "Agent Online", description: "When an agent comes online" },
  { value: "agent.offline", label: "Agent Offline", description: "When an agent goes offline" },
  { value: "customer.created", label: "Customer Created", description: "When a new customer is created" },
  { value: "customer.updated", label: "Customer Updated", description: "When customer details change" },
  { value: "ticket.created", label: "Ticket Created", description: "When a new ticket is created" },
  { value: "ticket.updated", label: "Ticket Updated", description: "When ticket details change" },
  { value: "ticket.closed", label: "Ticket Closed", description: "When a ticket is resolved" },
  { value: "ai.response.generated", label: "AI Response Generated", description: "When AI generates a response" },
  { value: "ai.handover.requested", label: "AI Handover Requested", description: "When AI requests human handover" },
  { value: "security.login.failed", label: "Failed Login", description: "When login attempts fail" },
  { value: "security.password.changed", label: "Password Changed", description: "When password is changed" },
  { value: "security.api.key.created", label: "API Key Created", description: "When API key is created" },
  { value: "security.api.key.revoked", label: "API Key Revoked", description: "When API key is revoked" },
];

export function WebhookManagement({ organizationId }: WebhookManagementProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<CreateWebhookFormData>({
    name: "",
    url: "",
    description: "",
    events: [],
    secret: "",
    headers: {},
    timeout_seconds: 30,
    retry_count: 3,
    enabled: true,
  });

  const [testData, setTestData] = useState({
    event: "",
    payload: "{}",
  });

  // Fetch webhooks
  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/webhooks");
      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }

      const data = await response.json();
      if (data.success) {
        setWebhooks(data.data.webhooks);
      } else {
        throw new Error(data.error || "Failed to fetch webhooks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  // Create webhook
  const handleCreateWebhook = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error("Name and URL are required");
      return;
    }

    if (formData.events.length === 0) {
      toast.error("At least one event is required");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Webhook created successfully");
        setShowCreateDialog(false);
        setFormData({
          name: "",
          url: "",
          description: "",
          events: [],
          secret: "",
          headers: {},
          timeout_seconds: 30,
          retry_count: 3,
          enabled: true,
        });
        fetchWebhooks();
      } else {
        throw new Error(data.error || "Failed to create webhook");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  };

  // Update webhook
  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return;

    setCreating(true);
    try {
      const response = await fetch(`/api/webhooks/${selectedWebhook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Webhook updated successfully");
        setShowEditDialog(false);
        setSelectedWebhook(null);
        fetchWebhooks();
      } else {
        throw new Error(data.error || "Failed to update webhook");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update webhook");
    } finally {
      setCreating(false);
    }
  };

  // Delete webhook
  const handleDeleteWebhook = async (webhook: Webhook) => {
    if (!confirm(`Are you sure you want to delete the webhook "${webhook.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Webhook deleted successfully");
        fetchWebhooks();
      } else {
        throw new Error(data.error || "Failed to delete webhook");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete webhook");
    }
  };

  // Test webhook
  const handleTestWebhook = async () => {
    if (!selectedWebhook || !testData.event) {
      toast.error("Please select an event to test");
      return;
    }

    setTesting(true);
    try {
      let payload = {};
      if (testData.payload.trim()) {
        try {
          payload = JSON.parse(testData.payload);
        } catch {
          toast.error("Invalid JSON payload");
          return;
        }
      }

      const response = await fetch(`/api/webhooks/${selectedWebhook.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: testData.event,
          payload,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult(data.data.testResult);
        toast.success(data.message);
      } else {
        throw new Error(data.error || "Failed to test webhook");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to test webhook");
    } finally {
      setTesting(false);
    }
  };

  // Toggle webhook status
  const handleToggleStatus = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !webhook.enabled,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Webhook ${webhook.enabled ? "disabled" : "enabled"} successfully`);
        fetchWebhooks();
      } else {
        throw new Error(data.error || "Failed to update webhook");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update webhook");
    }
  };

  // Generate secret
  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setFormData((prev) => ({ ...prev, secret }));
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Get status config
  const getStatusConfig = (webhook: Webhook) => {
    if (!webhook.enabled) {
      return { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Disabled" };
    }

    switch (webhook.status) {
      case "active":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" };
      case "failing":
        return { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Failing" };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: Clock, label: "Inactive" };
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Open edit dialog
  const openEditDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      description: webhook.description || "",
      events: webhook.events,
      secret: "", // Don't show existing secret
      headers: webhook.headers,
      timeout_seconds: webhook.timeout_seconds,
      retry_count: webhook.retry_count,
      enabled: webhook.enabled,
    });
    setShowEditDialog(true);
  };

  // Open test dialog
  const openTestDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setTestData({
      event: webhook.events[0] || "",
      payload: JSON.stringify(
        {
          test: true,
          message: "Test webhook delivery",
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
    });
    setTestResult(null);
    setShowTestDialog(true);
  };

  if (loading) {
    return <WebhookManagementSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load webhooks: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-foreground text-sm">Configure webhooks to receive real-time notifications</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger>
            <Button>
              <Icon icon={Plus} className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Set up a webhook to receive real-time notifications for events in your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="My Webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://api.example.com/webhooks"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of what this webhook does"
                  rows={2}
                />
              </div>

              <div>
                <Label>Events</Label>
                <div className="grid max-h-48 grid-cols-1 gap-ds-2 overflow-y-auto rounded-ds-lg border spacing-3 md:grid-cols-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-spacing-sm">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={formData.events.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({ ...prev, events: [...prev.events, event.value] }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              events: prev.events.filter((ev) => ev !== event.value),
                            }));
                          }
                        }}
                        className="border-ds-border-strong rounded"
                      />
                      <label htmlFor={event.value} className="text-sm">
                        <div className="font-medium">{event.label}</div>
                        <div className="text-tiny text-[var(--fl-color-text-muted)]">{event.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="secret">Secret</Label>
                <div className="flex gap-ds-2">
                  <Input
                    id="secret"
                    value={formData.secret}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secret: e.target.value }))}
                    placeholder="Webhook secret for signature verification"
                  />
                  <Button type="button" onClick={generateSecret} variant="outline">
                    Generate
                  </Button>
                </div>
                <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">Used to verify webhook authenticity</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1"
                    max="300"
                    value={formData.timeout_seconds}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, timeout_seconds: parseInt(e.target.value) || 30 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="retry">Retry Count</Label>
                  <Input
                    id="retry"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retry_count}
                    onChange={(e) => setFormData((prev) => ({ ...prev, retry_count: parseInt(e.target.value) || 3 }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-spacing-sm">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(enabled) => setFormData((prev) => ({ ...prev, enabled }))}
                />
                <Label>Enable webhook</Label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook} disabled={creating}>
                  {creating ? (
                    <>
                      <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Icon icon={Globe} className="mr-2 h-4 w-4" />
                      Create Webhook
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Webhooks</CardTitle>
          <CardDescription>
            {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="py-8 text-center">
              <Icon icon={Globe} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-base font-medium text-gray-900">No webhooks configured</h3>
              <p className="text-foreground mb-4">Get started by creating your first webhook</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Icon icon={Plus} className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => {
                  const statusConfig = getStatusConfig(webhook);
                  const successRate =
                    webhook.total_deliveries > 0
                      ? Math.round((webhook.successful_deliveries / webhook.total_deliveries) * 100)
                      : 0;

                  return (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{webhook.name}</div>
                          {webhook.description && (
                            <div className="text-sm text-[var(--fl-color-text-muted)]">{webhook.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-spacing-sm">
                          <span className="max-w-[200px] truncate font-mono text-sm">{webhook.url}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(webhook.url)}>
                            <Icon icon={Copy} className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 3).map((event) => (
                            <Badge key={event} variant="secondary" className="text-tiny">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 3 && (
                            <Badge variant="secondary" className="text-tiny">
                              +{webhook.events.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <Icon icon={statusConfig.icon} className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{successRate}%</div>
                          <div className="text-tiny text-[var(--fl-color-text-muted)]">
                            {webhook.successful_deliveries}/{webhook.total_deliveries}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-[var(--fl-color-text-muted)]">
                          {formatDate(webhook.last_triggered_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-spacing-sm">
                          <Button variant="ghost" size="sm" onClick={() => openTestDialog(webhook)}>
                            <Icon icon={Play} className="h-3 w-3" />
                          </Button>
                          <Switch checked={webhook.enabled} onCheckedChange={() => handleToggleStatus(webhook)} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Icon icon={MoreHorizontal} className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => openEditDialog(webhook)}>
                                <Icon icon={Edit2} className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openTestDialog(webhook)}>
                                <Icon icon={Play} className="mr-2 h-4 w-4" />
                                Test
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteWebhook(webhook)} className="text-red-600">
                                <Icon icon={Trash2} className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update your webhook configuration.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="My Webhook"
                />
              </div>
              <div>
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/webhooks"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this webhook does"
                rows={2}
              />
            </div>

            <div>
              <Label>Events</Label>
              <div className="grid max-h-48 grid-cols-1 gap-ds-2 overflow-y-auto rounded-ds-lg border spacing-3 md:grid-cols-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center space-x-spacing-sm">
                    <input
                      type="checkbox"
                      id={`edit-${event.value}`}
                      checked={formData.events.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({ ...prev, events: [...prev.events, event.value] }));
                        } else {
                          setFormData((prev) => ({ ...prev, events: prev.events.filter((ev) => ev !== event.value) }));
                        }
                      }}
                      className="border-ds-border-strong rounded"
                    />
                    <label htmlFor={`edit-${event.value}`} className="text-sm">
                      <div className="font-medium">{event.label}</div>
                      <div className="text-tiny text-[var(--fl-color-text-muted)]">{event.description}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-secret">Secret (leave empty to keep current)</Label>
              <div className="flex gap-ds-2">
                <Input
                  id="edit-secret"
                  value={formData.secret}
                  onChange={(e) => setFormData((prev) => ({ ...prev, secret: e.target.value }))}
                  placeholder="Leave empty to keep current secret"
                />
                <Button type="button" onClick={generateSecret} variant="outline">
                  Generate
                </Button>
              </div>
              <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">Used to verify webhook authenticity</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-timeout">Timeout (seconds)</Label>
                <Input
                  id="edit-timeout"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.timeout_seconds}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, timeout_seconds: parseInt(e.target.value) || 30 }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-retry">Retry Count</Label>
                <Input
                  id="edit-retry"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.retry_count}
                  onChange={(e) => setFormData((prev) => ({ ...prev, retry_count: parseInt(e.target.value) || 3 }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-spacing-sm">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(enabled) => setFormData((prev) => ({ ...prev, enabled }))}
              />
              <Label>Enable webhook</Label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleUpdateWebhook} disabled={creating}>
                {creating ? (
                  <>
                    <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon icon={Globe} className="mr-2 h-4 w-4" />
                    Update Webhook
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>Send a test event to {selectedWebhook?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="test-event">Event</Label>
              <Select
                value={testData.event}
                onValueChange={(value) => setTestData((prev) => ({ ...prev, event: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event to test" />
                </SelectTrigger>
                <SelectContent>
                  {selectedWebhook?.events.map((event) => {
                    const eventInfo = WEBHOOK_EVENTS.find((e) => e.value === event);
                    return (
                      <SelectItem key={event} value={event}>
                        {eventInfo?.label || event}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-payload">Test Payload (JSON)</Label>
              <Textarea
                id="test-payload"
                value={testData.payload}
                onChange={(e) => setTestData((prev) => ({ ...prev, payload: e.target.value }))}
                placeholder="Enter JSON payload for the test"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {testResult && (
              <div className="space-y-spacing-sm">
                <Label>Test Result</Label>
                <div
                  className={`rounded-ds-lg border spacing-3 ${testResult.success ? "border-status-success-light bg-[var(--fl-color-success-subtle)]" : "border-status-error-light bg-[var(--fl-color-danger-subtle)]"}`}
                >
                  <div className="mb-2 flex items-center space-x-spacing-sm">
                    <Icon
                      icon={testResult.success ? CheckCircle : XCircle}
                      className={`h-4 w-4 ${testResult.success ? "text-semantic-success-dark" : "text-red-600"}`}
                    />
                    <span className={`font-medium ${testResult.success ? "text-green-900" : "text-red-900"}`}>
                      {testResult.success ? "Success" : "Failed"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Status: {testResult.responseStatus}</div>
                    <div>Duration: {testResult.duration}ms</div>
                    {testResult.errorMessage && <div className="text-red-600">Error: {testResult.errorMessage}</div>}
                    {testResult.responseBody && (
                      <div>
                        <div className="font-medium">Response:</div>
                        <pre className="bg-background mt-1 overflow-x-auto rounded p-spacing-sm text-tiny">
                          {testResult.responseBody}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowTestDialog(false)} disabled={testing}>
                Close
              </Button>
              <Button onClick={handleTestWebhook} disabled={testing || !testData.event}>
                {testing ? (
                  <>
                    <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Icon icon={Zap} className="mr-2 h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Skeleton loader component
function WebhookManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-spacing-sm">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-spacing-md">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
