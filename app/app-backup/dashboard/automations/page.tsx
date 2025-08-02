/**
 * Automations Dashboard Page
 *
 * Comprehensive automation management interface for AI workflows, triggers, and rules
 * Includes escalation rules, auto-responses, and workflow automation
 */

"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Pause, Play, Plus, Settings, Target, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Switch } from "@/components/unified-ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/unified-ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { createClient } from "@/lib/supabase/client";

interface Automation {
  id: string;
  name: string;
  description: string;
  type: "escalation" | "auto_response" | "workflow" | "notification";
  status: "active" | "inactive" | "draft";
  trigger: {
    event: string;
    conditions: any[];
  };
  actions: any[];
  created_at: string;
  updated_at: string;
  runs_count: number;
  success_rate: number;
  last_run?: string;
}

interface AutomationStats {
  total: number;
  active: number;
  totalRuns: number;
  averageSuccessRate: number;
  savedHours: number;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<AutomationStats>({
    total: 0,
    active: 0,
    totalRuns: 0,
    averageSuccessRate: 0,
    savedHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "auto_response" as const,
    trigger_event: "",
    action_type: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadAutomations();
    loadStats();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);

      // Mock data for now - would integrate with escalation_rules table
      const mockAutomations: Automation[] = [
        {
          id: "1",
          name: "High Priority Escalation",
          description: "Automatically escalate conversations with angry customers to human agents",
          type: "escalation",
          status: "active",
          trigger: {
            event: "message_received",
            conditions: [
              { field: "sentiment", operator: "equals", value: "angry" },
              { field: "ai_confidence", operator: "less_than", value: 0.7 },
            ],
          },
          actions: [
            { type: "escalate_to_human", priority: "high" },
            { type: "notify_manager", delay: 300 },
          ],
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T14:30:00Z",
          runs_count: 45,
          success_rate: 95.6,
          last_run: "2024-01-20T09:15:00Z",
        },
        {
          id: "2",
          name: "FAQ Auto-Response",
          description: "Automatically respond to common questions about business hours",
          type: "auto_response",
          status: "active",
          trigger: {
            event: "message_received",
            conditions: [
              { field: "content", operator: "contains", value: "business hours" },
              { field: "ai_confidence", operator: "greater_than", value: 0.9 },
            ],
          },
          actions: [{ type: "send_response", template: "business_hours_template" }],
          created_at: "2024-01-10T08:00:00Z",
          updated_at: "2024-01-18T16:45:00Z",
          runs_count: 128,
          success_rate: 98.4,
          last_run: "2024-01-20T11:30:00Z",
        },
        {
          id: "3",
          name: "VIP Customer Workflow",
          description: "Special handling for VIP customers with priority routing",
          type: "workflow",
          status: "active",
          trigger: {
            event: "conversation_started",
            conditions: [{ field: "customer_tier", operator: "equals", value: "vip" }],
          },
          actions: [
            { type: "set_priority", value: "high" },
            { type: "assign_to_team", team: "vip_support" },
            { type: "send_notification", recipients: ["manager@company.com"] },
          ],
          created_at: "2024-01-12T12:00:00Z",
          updated_at: "2024-01-19T10:20:00Z",
          runs_count: 23,
          success_rate: 100,
          last_run: "2024-01-19T15:45:00Z",
        },
        {
          id: "4",
          name: "After Hours Notification",
          description: "Notify customers about response delays outside business hours",
          type: "notification",
          status: "inactive",
          trigger: {
            event: "message_received",
            conditions: [{ field: "time", operator: "outside_hours", value: "9-17" }],
          },
          actions: [
            { type: "send_auto_reply", message: "Thanks for your message! We'll respond during business hours." },
          ],
          created_at: "2024-01-08T14:00:00Z",
          updated_at: "2024-01-15T09:30:00Z",
          runs_count: 67,
          success_rate: 89.6,
          last_run: "2024-01-15T18:20:00Z",
        },
      ];

      setAutomations(mockAutomations);
    } catch (error) {

      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from automations
      const totalRuns = automations.reduce((sum, auto) => sum + auto.runs_count, 0);
      const activeCount = automations.filter((auto) => auto.status === "active").length;
      const avgSuccessRate =
        automations.length > 0 ? automations.reduce((sum, auto) => sum + auto.success_rate, 0) / automations.length : 0;

      setStats({
        total: automations.length,
        active: activeCount,
        totalRuns,
        averageSuccessRate: avgSuccessRate,
        savedHours: Math.round(totalRuns * 0.25), // Estimate 15 minutes saved per automation
      });
    } catch (error) {

    }
  };

  const toggleAutomation = async (automationId: string, enabled: boolean) => {
    try {
      // Update automation status
      setAutomations((prev) =>
        prev.map((auto) => (auto.id === automationId ? { ...auto, status: enabled ? "active" : "inactive" } : auto))
      );

      toast.success(`Automation ${enabled ? "enabled" : "disabled"} successfully`);
    } catch (error) {

      toast.error("Failed to update automation");
    }
  };

  const createAutomation = async () => {
    if (!createForm.name.trim()) {
      toast.error("Automation name is required");
      return;
    }

    try {
      setCreating(true);

      // Create new automation (mock implementation)
      const newAutomation: Automation = {
        id: Date.now().toString(),
        name: createForm.name,
        description: createForm.description,
        type: createForm.type,
        status: "draft",
        trigger: {
          event: createForm.trigger_event,
          conditions: [],
        },
        actions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        runs_count: 0,
        success_rate: 0,
      };

      setAutomations((prev) => [newAutomation, ...prev]);
      setShowCreateDialog(false);
      setCreateForm({
        name: "",
        description: "",
        type: "auto_response",
        trigger_event: "",
        action_type: "",
      });

      toast.success("Automation created successfully");
    } catch (error) {

      toast.error("Failed to create automation");
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-status-success text-status-success-dark";
      case "inactive":
        return "bg-neutral-200 text-neutral-700";
      case "draft":
        return "bg-status-warning text-status-warning-dark";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "escalation":
        return <AlertTriangle className="h-4 w-4" />;
      case "auto_response":
        return <Zap className="h-4 w-4" />;
      case "workflow":
        return <Target className="h-4 w-4" />;
      case "notification":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="mt-2 text-gray-600">Loading automations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-600">Automate your customer support workflows and responses</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Automations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-ds-lg bg-blue-100">
                <Settings className="h-6 w-6 text-brand-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Automations</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[var(--fl-color-success-subtle)]">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold">{stats.totalRuns}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[var(--fl-color-warning-subtle)]">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours Saved</p>
                <p className="text-2xl font-bold">{stats.savedHours}</p>
              </div>
              <div className="bg-brand-mahogany-100 flex h-12 w-12 items-center justify-center rounded-ds-lg">
                <Clock className="text-brand-mahogany-500 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-ds-lg bg-gray-100">
                        {getTypeIcon(automation.type)}
                      </div>
                      <div>
                        <div className="font-medium">{automation.name}</div>
                        <div className="text-sm text-[var(--fl-color-text-muted)]">{automation.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{automation.type.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(automation.status)}>{automation.status}</Badge>
                  </TableCell>
                  <TableCell>{automation.runs_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium">{automation.success_rate.toFixed(1)}%</div>
                      <div className="h-2 w-16 rounded-ds-full bg-gray-200">
                        <div
                          className="bg-status-success h-2 rounded-ds-full"
                          style={{ width: `${automation.success_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {automation.last_run ? (
                      <div className="text-sm text-[var(--fl-color-text-muted)]">
                        {new Date(automation.last_run).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={automation.status === "active"}
                        onCheckedChange={(checked) => toggleAutomation(automation.id, checked)}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Automation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Automation</DialogTitle>
            <DialogDescription>Set up a new automation rule to streamline your support workflow.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., High Priority Escalation"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this automation does..."
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={createForm.type}
                onValueChange={(value: any) => setCreateForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select automation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_response">Auto Response</SelectItem>
                  <SelectItem value="escalation">Escalation Rule</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="trigger">Trigger Event</Label>
              <Select
                value={createForm.trigger_event}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, trigger_event: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message_received">Message Received</SelectItem>
                  <SelectItem value="conversation_started">Conversation Started</SelectItem>
                  <SelectItem value="sentiment_detected">Sentiment Detected</SelectItem>
                  <SelectItem value="time_based">Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createAutomation} disabled={creating}>
              {creating ? "Creating..." : "Create Automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
