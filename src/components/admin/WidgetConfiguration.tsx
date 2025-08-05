"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Clock, Code, Copy, Eye, Globe, MessageCircle as MessageSquare, Palette, Settings as Settings, Shield,  } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/unified-ui/input";
import { Label } from "@/unified-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/unified-ui/select";
import { Switch } from "@/unified-ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/unified-ui/textarea";
import { Icon } from "@/lib/ui/Icon";
import type { BusinessHourUpdate, UpdateConfigFunction, WidgetConfig, WidgetConfigSection } from "./types";

export function WidgetConfiguration({ organizationId }: { organizationId: string }) {
  const [config, setConfig] = useState<WidgetConfig>({
    appearance: {
      primaryColor: "#2563eb",
      position: "bottom-right",
      buttonSize: "medium",
      welcomeMessage: "Hi! How can we help you today?",
      placeholderText: "Type your message...",
    },
    behavior: {
      autoOpenDelay: 0,
      soundEnabled: true,
      emailRequired: false,
      nameRequired: false,
      showTypingIndicator: true,
      enableFileUploads: true,
      maxFileSize: 10,
    },
    businessHours: {
      enabled: false,
      timezone: "UTC",
      schedule: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isOpen: i >= 1 && i <= 5, // Monday to Friday
        openTime: "09:00",
        closeTime: "17:00",
      })),
      outOfOfficeMessage: "We are currently offline. Please leave a message and we'll get back to you soon.",
    },
    security: {
      allowedDomains: [],
      enableRateLimiting: true,
      maxMessagesPerMinute: 10,
      requireAuthentication: false,
    },
  });

  const [embedCode, setEmbedCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    // Load existing configuration
    loadConfiguration();
  }, [organizationId]);

  useEffect(() => {
    // Generate embed code whenever config changes
    generateEmbedCode();
  }, [config, organizationId]);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`/api/widget/config?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {}
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/widget/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          organizationId,
          config,
        }),
      });

      if (response.ok) {
        toast.success("Configuration saved successfully");
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const generateEmbedCode = () => {
    const code = `<!-- Campfire Widget -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  '${window.location.origin}/messenger-2.0.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','CampfireWidget','${organizationId}');
</script>
<!-- End Campfire Widget -->`;
    setEmbedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Embed code copied to clipboard");
  };

  const updateConfig = <T extends WidgetConfigSection>(
    section: T,
    key: keyof WidgetConfig[T],
    value: WidgetConfig[T][keyof WidgetConfig[T]]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const updateBusinessHours: BusinessHourUpdate = (dayIndex, field, value) => {
    setConfig((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        schedule: prev.businessHours.schedule.map((day, i) => (i === dayIndex ? { ...day, [field]: value } : day)),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Widget Configuration</h2>
        <div className="flex gap-ds-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} leftIcon={<Icon icon={Eye} className="h-4 w-4" />}>
            {showPreview ? 'Hide' : 'Preview'}
          </Button>
          <Button onClick={saveConfiguration} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-3">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">
            <Icon icon={Palette} className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Icon icon={MessageSquare} className="mr-2 h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="business-hours">
            <Icon icon={Clock} className="mr-2 h-4 w-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="security">
            <Icon icon={Shield} className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="embed">
            <Icon icon={Code} className="mr-2 h-4 w-4" />
            Embed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how the widget looks on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-ds-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.appearance.primaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("appearance" as const, "primaryColor" as const, e.target.value)
                    }
                    className="w-20"
                  />
                  <Input
                    value={config.appearance.primaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("appearance" as const, "primaryColor" as const, e.target.value)
                    }
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="position">Widget Position</Label>
                <Select
                  value={config.appearance.position}
                  onValueChange={(value) => updateConfig("appearance" as const, "position" as const, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="buttonSize">Button Size</Label>
                <Select
                  value={config.appearance.buttonSize}
                  onValueChange={(value) => updateConfig("appearance" as const, "buttonSize" as const, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.appearance.welcomeMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateConfig("appearance" as const, "welcomeMessage" as const, e.target.value)
                  }
                  placeholder="Hi! How can we help you today?"
                />
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="placeholderText">Input Placeholder</Label>
                <Input
                  id="placeholderText"
                  value={config.appearance.placeholderText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateConfig("appearance" as const, "placeholderText" as const, e.target.value)
                  }
                  placeholder="Type your message..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Settings</CardTitle>
              <CardDescription>Configure how the widget behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label htmlFor="autoOpenDelay">Auto-open Delay (seconds)</Label>
                <Input
                  id="autoOpenDelay"
                  type="number"
                  min="0"
                  value={config.behavior.autoOpenDelay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateConfig("behavior" as const, "autoOpenDelay" as const, parseInt(e.target.value))
                  }
                />
                <p className="text-sm text-muted-foreground">Set to 0 to disable auto-open</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Notifications</Label>
                  <p className="text-sm text-muted-foreground">Play sound for new messages</p>
                </div>
                <Switch
                  checked={config.behavior.soundEnabled}
                  onChange={(e) => updateConfig("behavior" as const, "soundEnabled" as const, e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email</Label>
                  <p className="text-sm text-muted-foreground">Users must provide email to start chat</p>
                </div>
                <Switch
                  checked={config.behavior.emailRequired}
                  onChange={(e) => updateConfig("behavior" as const, "emailRequired" as const, e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Typing Indicator</Label>
                  <p className="text-sm text-muted-foreground">Show when agents are typing</p>
                </div>
                <Switch
                  checked={config.behavior.showTypingIndicator}
                  onChange={(e) => updateConfig("behavior" as const, "showTypingIndicator" as const, e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable File Uploads</Label>
                  <p className="text-sm text-muted-foreground">Allow users to upload files</p>
                </div>
                <Switch
                  checked={config.behavior.enableFileUploads}
                  onChange={(e) => updateConfig("behavior" as const, "enableFileUploads" as const, e.target.checked)}
                />
              </div>

              {config.behavior.enableFileUploads && (
                <div className="space-y-spacing-sm">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="50"
                    value={config.behavior.maxFileSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("behavior" as const, "maxFileSize" as const, parseInt(e.target.value))
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-hours">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Set your availability schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Business Hours</Label>
                  <p className="text-sm text-muted-foreground">Show as offline outside business hours</p>
                </div>
                <Switch
                  checked={config.businessHours.enabled}
                  onChange={(e) => updateConfig("businessHours" as const, "enabled" as const, e.target.checked)}
                />
              </div>

              {config.businessHours.enabled && (
                <>
                  <div className="space-y-spacing-sm">
                    <Label>Timezone</Label>
                    <Select
                      value={config.businessHours.timezone}
                      onValueChange={(value) => updateConfig("businessHours" as const, "timezone" as const, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-spacing-sm">
                    <Label>Weekly Schedule</Label>
                    {config.businessHours.schedule.map((day, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-24">
                          <Label>{dayNames[index]}</Label>
                        </div>
                        <Switch
                          checked={day.isOpen}
                          onChange={(e) => updateBusinessHours(index, "isOpen", e.target.checked)}
                        />
                        {day.isOpen && (
                          <>
                            <Input
                              type="time"
                              value={day.openTime}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateBusinessHours(index, "openTime", e.target.value)
                              }
                              className="w-32"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={day.closeTime}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateBusinessHours(index, "closeTime", e.target.value)
                              }
                              className="w-32"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-spacing-sm">
                    <Label htmlFor="outOfOfficeMessage">Out of Office Message</Label>
                    <Textarea
                      id="outOfOfficeMessage"
                      value={config.businessHours.outOfOfficeMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateConfig("businessHours", "outOfOfficeMessage", e.target.value)
                      }
                      placeholder="We are currently offline..."
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label>Allowed Domains</Label>
                <p className="text-sm text-muted-foreground">Only allow widget on these domains (one per line)</p>
                <Textarea
                  value={config.security.allowedDomains.join("\n")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateConfig("security", "allowedDomains", e.target.value.split("\n").filter(Boolean))
                  }
                  placeholder="example.com&#10;app.example.com"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Prevent spam and abuse</p>
                </div>
                <Switch
                  checked={config.security.enableRateLimiting}
                  onChange={(e) => updateConfig("security", "enableRateLimiting", e.target.checked)}
                />
              </div>

              {config.security.enableRateLimiting && (
                <div className="space-y-spacing-sm">
                  <Label htmlFor="maxMessages">Max Messages per Minute</Label>
                  <Input
                    id="maxMessages"
                    type="number"
                    min="1"
                    max="60"
                    value={config.security.maxMessagesPerMinute}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("security", "maxMessagesPerMinute", parseInt(e.target.value))
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Authentication</Label>
                  <p className="text-sm text-muted-foreground">Users must be logged in to use widget</p>
                </div>
                <Switch
                  checked={config.security.requireAuthentication}
                  onChange={(e) => updateConfig("security", "requireAuthentication", e.target.checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Copy this code and paste it before the closing &lt;/body&gt; tag on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <pre className="overflow-x-auto rounded-ds-lg bg-muted spacing-3">
                  <code className="text-sm">{embedCode}</code>
                </pre>
                <Button size="sm" variant="outline" className="absolute right-2 top-2" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Icon icon={CheckCircle} className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Icon icon={Copy} className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-spacing-sm">
                <h4 className="font-medium">Integration Instructions:</h4>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Copy the embed code above</li>
                  <li>Open your website's HTML file or template</li>
                  <li>Paste the code just before the closing &lt;/body&gt; tag</li>
                  <li>Save and deploy your changes</li>
                  <li>The widget will appear on your website automatically</li>
                </ol>
              </div>

              <div className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3 dark:bg-blue-950">
                <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">Testing Your Integration</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  After adding the embed code, visit your website in an incognito/private browser window to test the
                  widget as a new visitor would see it.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>This is how your widget will appear on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background relative h-96 overflow-hidden rounded-ds-lg dark:bg-neutral-900">
              <div className="absolute bottom-4 right-4">
                <div
                  className="flex cursor-pointer items-center justify-center rounded-ds-full shadow-card-deep"
                  style={{
                    backgroundColor: config.appearance.primaryColor,
                    width:
                      config.appearance.buttonSize === "small"
                        ? "48px"
                        : config.appearance.buttonSize === "medium"
                          ? "56px"
                          : "64px",
                    height:
                      config.appearance.buttonSize === "small"
                        ? "48px"
                        : config.appearance.buttonSize === "medium"
                          ? "56px"
                          : "64px",
                  }}
                >
                  <Icon icon={MessageSquare} className="text-white" size={24} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
