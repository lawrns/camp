"use client";

import React from "react";
import {
  Clock,
  ChatCircle as MessageSquare,
  Palette,
  Plus,
  Shield,
  Sparkle as Sparkles,
  Trash as Trash2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import { Slider } from "@/components/unified-ui/components/slider";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";

interface WidgetConfigFormProps {
  config: Record<string, any>;
  onChange: (field: string, value: unknown) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function WidgetConfigForm({ config, onChange, onSave, isSaving }: WidgetConfigFormProps) {
  const updateConfig = (path: string, value: unknown) => {
    const keys = path.split(".");
    const newConfig = { ...config };
    let current: Record<string, any> = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key && !current[key]) {
        current[key] = {};
      }
      if (key) {
        current = current[key] as Record<string, any>;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
    onChange("config", newConfig);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance" className="flex items-center gap-ds-2">
            <Icon icon={Palette} className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-ds-2">
            <Icon icon={MessageSquare} className="h-4 w-4" />
            <span className="hidden sm:inline">Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="business-hours" className="flex items-center gap-ds-2">
            <Icon icon={Clock} className="h-4 w-4" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-ds-2">
            <Icon icon={Shield} className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-ds-2">
            <Icon icon={Sparkles} className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Widget Appearance</CardTitle>
              <CardDescription>Customize how your widget looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Position */}
              <div className="space-y-spacing-sm">
                <Label>Position</Label>
                <Select
                  value={config.appearance?.position || "bottom-right"}
                  onValueChange={(value: string) => updateConfig("appearance.position", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Colors</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-spacing-sm">
                    <Label>Primary Color</Label>
                    <div className="flex gap-ds-2">
                      <Input
                        type="color"
                        value={config.appearance?.colors?.primary || "#246BFF"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateConfig("appearance.colors.primary", e.target.value)
                        }
                        className="h-10 w-16 cursor-pointer spacing-1"
                      />
                      <Input
                        type="text"
                        value={config.appearance?.colors?.primary || "#246BFF"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateConfig("appearance.colors.primary", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-spacing-sm">
                    <Label>Background Color</Label>
                    <div className="flex gap-ds-2">
                      <Input
                        type="color"
                        value={config.appearance?.colors?.background || "#FFFFFF"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateConfig("appearance.colors.background", e.target.value)
                        }
                        className="h-10 w-16 cursor-pointer spacing-1"
                      />
                      <Input
                        type="text"
                        value={config.appearance?.colors?.background || "#FFFFFF"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateConfig("appearance.colors.background", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="space-y-spacing-sm">
                <Label>Widget Size</Label>
                <Select
                  value={config.appearance?.size || "medium"}
                  onValueChange={(value: string) => updateConfig("appearance.size", value)}
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

              {/* Border Radius */}
              <div className="space-y-spacing-sm">
                <Label>Border Radius: {config.appearance?.borderRadius || 12}px</Label>
                <Slider
                  value={[config.appearance?.borderRadius || 12]}
                  onValueChange={(values: number[]) => updateConfig("appearance.borderRadius", values[0])}
                  max={24}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Widget Behavior</CardTitle>
              <CardDescription>Configure how your widget behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Welcome Message */}
              <div className="space-y-spacing-sm">
                <Label>Welcome Message</Label>
                <Textarea
                  value={config.behavior?.welcomeMessage || "Hi! How can we help you today?"}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateConfig("behavior.welcomeMessage", e.target.value)
                  }
                  rows={3}
                />
              </div>

              {/* Auto Open */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Open</Label>
                  <p className="text-sm text-muted-foreground">Automatically open the widget for new visitors</p>
                </div>
                <Switch
                  checked={config.behavior?.autoOpen || false}
                  onCheckedChange={(checked: boolean) => updateConfig("behavior.autoOpen", checked)}
                />
              </div>

              {/* Auto Open Delay */}
              {config.behavior?.autoOpen && (
                <div className="space-y-spacing-sm">
                  <Label>Auto Open Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={config.behavior?.autoOpenDelay || 3}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateConfig("behavior.autoOpenDelay", parseInt(e.target.value))
                    }
                    min={0}
                    max={60}
                  />
                </div>
              )}

              {/* Show on Mobile */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show on Mobile</Label>
                  <p className="text-sm text-muted-foreground">Display the widget on mobile devices</p>
                </div>
                <Switch
                  checked={config.behavior?.showOnMobile !== false}
                  onCheckedChange={(checked: boolean) => updateConfig("behavior.showOnMobile", checked)}
                />
              </div>

              {/* Collect Email */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Collect Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask visitors for their email before starting a conversation
                  </p>
                </div>
                <Switch
                  checked={config.behavior?.collectEmail || false}
                  onCheckedChange={(checked: boolean) => updateConfig("behavior.collectEmail", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-hours" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Set your availability schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Business Hours */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Business Hours</Label>
                  <p className="text-sm text-muted-foreground">Show different messages outside business hours</p>
                </div>
                <Switch
                  checked={config.businessHours?.enabled || false}
                  onCheckedChange={(checked: boolean) => updateConfig("businessHours.enabled", checked)}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-spacing-sm">
                <Label>Timezone</Label>
                <Select
                  value={config.businessHours?.timezone || "America/New_York"}
                  onValueChange={(value: string) => updateConfig("businessHours.timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              {config.businessHours?.enabled && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Weekly Schedule</h4>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day: string) => (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-24 text-sm">{day}</div>
                      <Input
                        type="time"
                        value={config.businessHours?.schedule?.[day.toLowerCase()]?.start || "09:00"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateConfig(`businessHours.schedule.${day.toLowerCase()}.start`, e.target.value)
                        }
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={config.businessHours?.schedule?.[day.toLowerCase()]?.end || "17:00"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateConfig(`businessHours.schedule.${day.toLowerCase()}.end`, e.target.value)
                        }
                        className="w-32"
                      />
                      <Switch
                        checked={config.businessHours?.schedule?.[day.toLowerCase()]?.enabled !== false}
                        onCheckedChange={(checked: boolean) =>
                          updateConfig(`businessHours.schedule.${day.toLowerCase()}.enabled`, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Allowed Domains */}
              <div className="space-y-spacing-sm">
                <Label>Allowed Domains</Label>
                <p className="mb-2 text-sm text-muted-foreground">
                  Only allow the widget to load on these domains (leave empty to allow all)
                </p>
                <div className="space-y-spacing-sm">
                  {(config.security?.allowedDomains || [""]).map((domain: string, index: number) => (
                    <div key={index} className="flex gap-ds-2">
                      <Input
                        value={domain}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const domains = [...(config.security?.allowedDomains || [""])];
                          domains[index] = e.target.value;
                          updateConfig("security.allowedDomains", domains);
                        }}
                        placeholder="example.com"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const domains = [...(config.security?.allowedDomains || [""])];
                          domains.splice(index, 1);
                          updateConfig("security.allowedDomains", domains);
                        }}
                      >
                        <Icon icon={Trash2} className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const domains = [...(config.security?.allowedDomains || []), ""];
                      updateConfig("security.allowedDomains", domains);
                    }}
                  >
                    <Icon icon={Plus} className="mr-2 h-4 w-4" />
                    Add Domain
                  </Button>
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Limit the number of messages per visitor</p>
                </div>
                <Switch
                  checked={config.security?.rateLimiting?.enabled || false}
                  onCheckedChange={(checked: boolean) => updateConfig("security.rateLimiting.enabled", checked)}
                />
              </div>

              {config.security?.rateLimiting?.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-spacing-sm">
                    <Label>Max Messages</Label>
                    <Input
                      type="number"
                      value={config.security?.rateLimiting?.maxMessages || 50}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateConfig("security.rateLimiting.maxMessages", parseInt(e.target.value))
                      }
                      min={1}
                      max={1000}
                    />
                  </div>
                  <div className="space-y-spacing-sm">
                    <Label>Time Window (minutes)</Label>
                    <Input
                      type="number"
                      value={config.security?.rateLimiting?.windowMinutes || 60}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateConfig("security.rateLimiting.windowMinutes", parseInt(e.target.value))
                      }
                      min={1}
                      max={1440}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure AI-powered features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable AI */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">Use AI to help answer customer questions</p>
                </div>
                <Switch
                  checked={config.ai?.enabled || false}
                  onCheckedChange={(checked: boolean) => updateConfig("ai.enabled", checked)}
                />
              </div>

              {config.ai?.enabled && (
                <>
                  {/* AI Model */}
                  <div className="space-y-spacing-sm">
                    <Label>AI Model</Label>
                    <Select
                      value={config.ai?.model || "gpt-3.5-turbo"}
                      onValueChange={(value: string) => updateConfig("ai.model", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="claude-2">Claude 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-spacing-sm">
                    <Label>AI System Prompt</Label>
                    <Textarea
                      value={config.ai?.systemPrompt || "You are a helpful customer support assistant."}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateConfig("ai.systemPrompt", e.target.value)
                      }
                      rows={4}
                      placeholder="Provide instructions for how the AI should behave..."
                    />
                  </div>

                  {/* Auto Handoff */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Handoff to Human</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically transfer to human agent when needed
                      </p>
                    </div>
                    <Switch
                      checked={config.ai?.autoHandoff || false}
                      onCheckedChange={(checked: boolean) => updateConfig("ai.autoHandoff", checked)}
                    />
                  </div>

                  {/* Confidence Threshold */}
                  <div className="space-y-spacing-sm">
                    <Label>Confidence Threshold: {((config.ai?.confidenceThreshold || 0.7) * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[(config.ai?.confidenceThreshold || 0.7) * 100]}
                      onValueChange={(values: number[]) => updateConfig("ai.confidenceThreshold", values[0]! / 100)}
                      max={100}
                      step={5}
                    />
                    <p className="text-sm text-muted-foreground">
                      AI will request human assistance below this confidence level
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving} size="lg">
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
