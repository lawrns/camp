"use client";

import React, { useEffect, useState } from "react";
import {
  Warning as AlertTriangle,
  Robot as Bot,
  CheckCircle,
  Database,
  Info,
  Envelope as Mail,
  ArrowsClockwise as RefreshCw,
  FloppyDisk as Save,
  Gear as Settings,
  Shield,
  Link as Webhook,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";

interface SystemConfig {
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableReadReplicas: boolean;
    backupRetention: number;
  };
  realtime: {
    maxConnections: number;
    heartbeatInterval: number;
    reconnectAttempts: number;
    messageQueueSize: number;
  };
  ai: {
    provider: string;
    model: string;
    maxTokens: number;
    temperature: number;
    enableRAG: boolean;
    confidenceThreshold: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
    };
  };
  notifications: {
    emailProvider: string;
    webhookRetries: number;
    enablePushNotifications: boolean;
    defaultNotificationSettings: {
      newConversation: boolean;
      agentAssignment: boolean;
      escalation: boolean;
    };
  };
  performance: {
    cacheTimeout: number;
    enableCompression: boolean;
    maxFileSize: number;
    rateLimitRequests: number;
  };
}

interface SystemConfigurationPanelProps {
  organizationId: string;
}

export function SystemConfigurationPanel({ organizationId }: SystemConfigurationPanelProps) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("database");

  useEffect(() => {
    loadConfiguration();
  }, [organizationId]);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/config`);
      const data = await response.json();

      if (response.ok) {
        setConfig(data.config);
      } else {
        toast.error("Failed to load configuration");
      }
    } catch (error) {
      toast.error("Error loading configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        toast.success("Configuration saved successfully");
        setHasChanges(false);
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("Error saving configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;

    setConfig((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateNestedConfig = (section: keyof SystemConfig, subsection: string, field: string, value: any) => {
    if (!config) return;

    setConfig((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [subsection]: {
          ...(prev![section] as any)[subsection],
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-spacing-lg">
          <Icon icon={RefreshCw} className="mr-2 h-6 w-6 animate-spin" />
          Loading configuration...
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-spacing-lg">
          <Alert>
            <Icon icon={AlertTriangle} className="h-4 w-4" />
            <AlertDescription>Failed to load system configuration. Please try refreshing the page.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-foreground">Configure system-wide settings and performance parameters</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="border-orange-600 text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={saveConfiguration} disabled={!hasChanges || isSaving} className="flex items-center gap-ds-2">
            {isSaving ? (
              <Icon icon={RefreshCw} className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon={Save} className="h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="database" className="flex items-center gap-ds-2">
            <Icon icon={Database} className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-ds-2">
            <Icon icon={Zap} className="h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-ds-2">
            <Icon icon={Bot} className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-ds-2">
            <Icon icon={Shield} className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-ds-2">
            <Icon icon={Mail} className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-ds-2">
            <Icon icon={Settings} className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Database Configuration */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Database} className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>Configure database connection and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="connectionPoolSize">Connection Pool Size</Label>
                  <Input
                    id="connectionPoolSize"
                    type="number"
                    value={config.database.connectionPoolSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("database", "connectionPoolSize", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="queryTimeout">Query Timeout (ms)</Label>
                  <Input
                    id="queryTimeout"
                    type="number"
                    value={config.database.queryTimeout}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("database", "queryTimeout", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableReadReplicas">Enable Read Replicas</Label>
                  <p className="text-foreground text-sm">Use read replicas for better performance</p>
                </div>
                <Switch
                  id="enableReadReplicas"
                  checked={config.database.enableReadReplicas}
                  onCheckedChange={(checked: boolean) => updateConfig("database", "enableReadReplicas", checked)}
                />
              </div>

              <div>
                <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                <Input
                  id="backupRetention"
                  type="number"
                  value={config.database.backupRetention}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateConfig("database", "backupRetention", parseInt(e.target.value))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Configuration */}
        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Zap} className="h-5 w-5" />
                Real-time Configuration
              </CardTitle>
              <CardDescription>Configure WebSocket and real-time messaging settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={config.realtime.maxConnections}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("realtime", "maxConnections", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="heartbeatInterval">Heartbeat Interval (ms)</Label>
                  <Input
                    id="heartbeatInterval"
                    type="number"
                    value={config.realtime.heartbeatInterval}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("realtime", "heartbeatInterval", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reconnectAttempts">Reconnect Attempts</Label>
                  <Input
                    id="reconnectAttempts"
                    type="number"
                    value={config.realtime.reconnectAttempts}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("realtime", "reconnectAttempts", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="messageQueueSize">Message Queue Size</Label>
                  <Input
                    id="messageQueueSize"
                    type="number"
                    value={config.realtime.messageQueueSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("realtime", "messageQueueSize", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Bot} className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure AI model settings and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="aiProvider">AI Provider</Label>
                  <Select value={config.ai.provider} onValueChange={(value) => updateConfig("ai", "provider", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="azure">Azure OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="aiModel">AI Model</Label>
                  <Input
                    id="aiModel"
                    value={config.ai.model}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig("ai", "model", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={config.ai.maxTokens}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("ai", "maxTokens", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={config.ai.temperature}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("ai", "temperature", parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableRAG">Enable RAG (Retrieval Augmented Generation)</Label>
                  <p className="text-foreground text-sm">Use knowledge base for AI responses</p>
                </div>
                <Switch
                  id="enableRAG"
                  checked={config.ai.enableRAG}
                  onCheckedChange={(checked: boolean) => updateConfig("ai", "enableRAG", checked)}
                />
              </div>

              <div>
                <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                <Input
                  id="confidenceThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.ai.confidenceThreshold}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateConfig("ai", "confidenceThreshold", parseFloat(e.target.value))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would continue here... */}
      </Tabs>

      {/* Save Warning */}
      {hasChanges && (
        <Alert>
          <Icon icon={Info} className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Make sure to save your configuration before leaving this page.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
