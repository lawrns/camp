"use client";

import React, { useEffect, useState } from "react";
import {
  Warning as AlertTriangle,
  ArrowRight,
  ChartBar as BarChart3,
  Robot as Bot,
  CheckCircle,
  Clock,
  CurrencyDollar,
  Gauge,
  Lightbulb,
  ArrowsClockwise as RefreshCw,
  Gear as Settings,
  Target,
  TrendDown as TrendingDown,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Slider } from "@/components/unified-ui/components/slider";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  type: "model_switch" | "prompt_optimization" | "caching" | "batch_processing" | "fallback_strategy";
  enabled: boolean;
  aggressiveness: number; // 1-10 scale
  potentialSavingsPercentage: number;
  riskLevel: "low" | "medium" | "high";
  conditions: {
    minCostCents?: number;
    maxLatencyMs?: number;
    minSuccessRate?: number;
    contextTypes?: string[];
  };
  actions: {
    switchToModel?: string;
    cacheResponses?: boolean;
    batchSize?: number;
    fallbackModel?: string;
  };
}

interface AutoOptimizationSettings {
  enabled: boolean;
  maxCostPerHour: number;
  approvalRequired: boolean;
  allowedOptimizations: string[];
  notificationChannels: string[];
}

export default function CostOptimizationEngine() {
  const [rules, setRules] = useState<OptimizationRule[]>([]);
  const [autoSettings, setAutoSettings] = useState<AutoOptimizationSettings>({
    enabled: false,
    maxCostPerHour: 100,
    approvalRequired: true,
    allowedOptimizations: [],
    notificationChannels: ["email"],
  });
  const [activeOptimizations, setActiveOptimizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingsProjection, setSavingsProjection] = useState<any>(null);

  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = async () => {
    try {
      setLoading(true);

      // Load optimization rules and active optimizations
      const [rulesRes, optimizationsRes, projectionRes] = await Promise.all([
        fetch("/api/ai/optimization/rules"),
        fetch("/api/ai/optimization/active"),
        fetch("/api/ai/optimization/projection"),
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || getDefaultRules());
      }

      if (optimizationsRes.ok) {
        const optimizationsData = await optimizationsRes.json();
        setActiveOptimizations(optimizationsData.optimizations || []);
      }

      if (projectionRes.ok) {
        const projectionData = await projectionRes.json();
        setSavingsProjection(projectionData.projection);
      }
    } catch (error) {
      // Initialize with default rules if API fails
      setRules(getDefaultRules());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRules = (): OptimizationRule[] => [
    {
      id: "model-downgrade-simple",
      name: "Smart Model Downgrade",
      description: "Automatically switch to cheaper models for simple tasks with high confidence",
      type: "model_switch",
      enabled: false,
      aggressiveness: 5,
      potentialSavingsPercentage: 40,
      riskLevel: "low",
      conditions: {
        minCostCents: 1000, // Only for requests > $10
        maxLatencyMs: 5000,
        minSuccessRate: 0.95,
      },
      actions: {
        switchToModel: "gpt-3.5-turbo",
        fallbackModel: "claude-3-haiku",
      },
    },
    {
      id: "prompt-compression",
      name: "Prompt Compression",
      description: "Automatically compress long prompts while maintaining context",
      type: "prompt_optimization",
      enabled: false,
      aggressiveness: 3,
      potentialSavingsPercentage: 25,
      riskLevel: "medium",
      conditions: {
        minCostCents: 500,
      },
      actions: {},
    },
    {
      id: "response-caching",
      name: "Intelligent Response Caching",
      description: "Cache similar requests to reduce API calls",
      type: "caching",
      enabled: false,
      aggressiveness: 7,
      potentialSavingsPercentage: 60,
      riskLevel: "low",
      conditions: {
        contextTypes: ["knowledge_search", "faq"],
      },
      actions: {
        cacheResponses: true,
      },
    },
    {
      id: "batch-processing",
      name: "Request Batching",
      description: "Combine small requests into batches for better efficiency",
      type: "batch_processing",
      enabled: false,
      aggressiveness: 4,
      potentialSavingsPercentage: 15,
      riskLevel: "medium",
      conditions: {
        maxLatencyMs: 2000,
      },
      actions: {
        batchSize: 5,
      },
    },
    {
      id: "error-reduction",
      name: "Error Reduction Strategy",
      description: "Implement retry logic and fallbacks to reduce wasted spend on errors",
      type: "fallback_strategy",
      enabled: false,
      aggressiveness: 6,
      potentialSavingsPercentage: 20,
      riskLevel: "low",
      conditions: {
        minSuccessRate: 0.9,
      },
      actions: {
        fallbackModel: "claude-3-haiku",
      },
    },
  ];

  const updateRule = async (ruleId: string, updates: Partial<OptimizationRule>) => {
    const updatedRules = rules.map((rule: unknown) => (rule.id === ruleId ? { ...rule, ...updates } : rule));
    setRules(updatedRules);

    // Save to backend
    try {
      await fetch("/api/ai/optimization/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules }),
      });
    } catch (error) {}
  };

  const toggleRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, { enabled: !rule.enabled });
    }
  };

  const updateAggressiveness = (ruleId: string, aggressiveness: number) => {
    updateRule(ruleId, { aggressiveness });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-emerald-700 bg-emerald-100";
      case "medium":
        return "text-gray-700 bg-gray-100";
      case "high":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "model_switch":
        return <Icon icon={Bot} className="h-4 w-4" />;
      case "prompt_optimization":
        return <Icon icon={Zap} className="h-4 w-4" />;
      case "caching":
        return <Icon icon={Clock} className="h-4 w-4" />;
      case "batch_processing":
        return <Icon icon={BarChart3} className="h-4 w-4" />;
      case "fallback_strategy":
        return <Icon icon={Target} className="h-4 w-4" />;
      default:
        return <Icon icon={Settings} className="h-4 w-4" />;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const calculateTotalSavings = () => {
    const enabledRules = rules.filter((rule: unknown) => rule.enabled);
    const averageSavings =
      enabledRules.reduce((sum: unknown, rule: unknown) => sum + rule.potentialSavingsPercentage, 0) /
      Math.max(enabledRules.length, 1);

    return {
      enabled_rules: enabledRules.length,
      potential_savings_percentage: Math.round(averageSavings),
      estimated_monthly_savings: Math.round(averageSavings * 10), // Rough estimate
    };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Icon icon={RefreshCw} className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2">Loading optimization engine...</span>
      </div>
    );
  }

  const totalSavings = calculateTotalSavings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Cost Optimization Engine</h2>
          <p className="text-foreground">Automated AI cost reduction and efficiency improvements</p>
        </div>
        <Button onClick={loadOptimizationData} className="bg-primary text-white hover:bg-blue-700" leftIcon={<Icon icon={RefreshCw} className="h-4 w-4" />}>
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Icon icon={Gauge} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSavings.enabled_rules}</div>
            <p className="text-tiny text-muted-foreground">out of {rules.length} total rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <Icon icon={TrendingDown} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSavings.potential_savings_percentage}%</div>
            <p className="text-tiny text-muted-foreground">average reduction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Monthly Savings</CardTitle>
            <Icon icon={CurrencyDollar} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalSavings.estimated_monthly_savings * 100)}</div>
            <p className="text-tiny text-muted-foreground">based on current usage</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-3">
        <TabsList>
          <TabsTrigger value="rules">Optimization Rules</TabsTrigger>
          <TabsTrigger value="auto">Auto-Optimization</TabsTrigger>
          <TabsTrigger value="active">Active Optimizations</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-3">
          {/* Optimization Rules */}
          <div className="space-y-3">
            {rules.map((rule: unknown) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(rule.type)}
                      <div>
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRiskColor(rule.riskLevel)}>{rule.riskLevel} risk</Badge>
                      <Switch checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 font-medium">Configuration</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Aggressiveness: {rule.aggressiveness}/10</label>
                          <Slider
                            value={rule.aggressiveness}
                            onChange={(e) => updateAggressiveness(rule.id, parseInt(e.target.value) || 1)}
                            max={10}
                            min={1}
                            step={1}
                            className="mt-2"
                            disabled={!rule.enabled}
                          />
                        </div>
                        <div className="text-foreground text-sm">
                          <strong>Potential Savings:</strong> {rule.potentialSavingsPercentage}%
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium">Conditions</h4>
                      <div className="text-foreground space-y-1 text-sm">
                        {rule.conditions.minCostCents && (
                          <div>Min cost: {formatCurrency(rule.conditions.minCostCents)}</div>
                        )}
                        {rule.conditions.maxLatencyMs && <div>Max latency: {rule.conditions.maxLatencyMs}ms</div>}
                        {rule.conditions.minSuccessRate && (
                          <div>Min success rate: {(rule.conditions.minSuccessRate * 100).toFixed(1)}%</div>
                        )}
                        {rule.conditions.contextTypes && (
                          <div>Context types: {rule.conditions.contextTypes.join(", ")}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto" className="space-y-3">
          {/* Auto-Optimization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Lightbulb} className="h-5 w-5" />
                Auto-Optimization Settings
              </CardTitle>
              <CardDescription>Configure automatic cost optimization behaviors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Auto-Optimization</h4>
                  <p className="text-foreground text-sm">
                    Automatically apply optimization rules when conditions are met
                  </p>
                </div>
                <Switch
                  checked={autoSettings.enabled}
                  onChange={(e) => setAutoSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
              </div>

              <div>
                <label className="font-medium">
                  Max Cost Per Hour: {formatCurrency(autoSettings.maxCostPerHour * 100)}
                </label>
                <Slider
                  value={autoSettings.maxCostPerHour}
                  onChange={(e) =>
                    setAutoSettings((prev) => ({ ...prev, maxCostPerHour: parseFloat(e.target.value) || 10 }))
                  }
                  max={1000}
                  min={10}
                  step={10}
                  className="mt-2"
                />
                <p className="text-foreground mt-1 text-sm">
                  Trigger optimizations when hourly spend exceeds this threshold
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Require Approval</h4>
                  <p className="text-foreground text-sm">Request manual approval before applying optimizations</p>
                </div>
                <Switch
                  checked={autoSettings.approvalRequired}
                  onChange={(e) => setAutoSettings((prev) => ({ ...prev, approvalRequired: e.target.checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-3">
          {/* Active Optimizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={CheckCircle} className="h-5 w-5" />
                Active Optimizations
              </CardTitle>
              <CardDescription>Currently running optimization processes</CardDescription>
            </CardHeader>
            <CardContent>
              {activeOptimizations.length > 0 ? (
                <div className="space-y-3">
                  {activeOptimizations.map((optimization, index) => (
                    <div key={index} className="flex items-center justify-between rounded-ds-lg border spacing-3">
                      <div className="flex items-center gap-3">
                        <Icon icon={CheckCircle} className="text-semantic-success h-5 w-5" />
                        <div>
                          <h4 className="font-medium">{optimization.name}</h4>
                          <p className="text-foreground text-sm">{optimization.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-semantic-success-dark font-medium">
                          -{optimization.savings_percentage}%
                        </div>
                        <div className="text-foreground text-sm">Saved: {formatCurrency(optimization.saved_cents)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
                  <Icon icon={Clock} className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
                  <p>No active optimizations</p>
                  <p className="mt-1 text-sm">Enable optimization rules to start saving costs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Savings Projection */}
      {savingsProjection && (
        <Alert>
          <Icon icon={TrendingDown} className="h-4 w-4" />
          <AlertDescription>
            Based on your current usage patterns, enabling all optimization rules could save approximately{" "}
            <strong>{formatCurrency(savingsProjection.monthly_savings_cents)}</strong> per month (
            {savingsProjection.savings_percentage}% reduction).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
