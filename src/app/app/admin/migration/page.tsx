"use client";

import { useEffect, useState } from "react";
import {
  Warning as AlertCircle,
  CheckCircle as CheckCircle2,
  Database,
  FileCode,
  Package,
  Radio,
  ArrowsClockwise as RefreshCw,
  XCircle,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { FLAG_GROUPS, getFlagStatus, isPhaseEnabled } from "@/lib/features/migration-flags";
import { Icon } from "@/lib/ui/Icon";

interface MigrationStats {
  totalComponents: number;
  migratedComponents: number;
  violationCount: Record<string, number>;
  lastCheck: string;
}

export default function MigrationDashboard() {
  const [stats, setStats] = useState<MigrationStats>({
    totalComponents: 0,
    migratedComponents: 0,
    violationCount: {},
    lastCheck: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  // Get feature flag status
  const flagStatus = getFlagStatus();

  // Calculate phase progress
  const calculatePhaseProgress = (phase: keyof typeof FLAG_GROUPS): number => {
    const flagGroup = FLAG_GROUPS[phase];
    if (!flagGroup || !flagGroup.flags) return 0;

    const enabledCount = flagGroup.flags.filter(
      (flag: string) => flagStatus[flag as keyof typeof flagStatus]?.enabled
    ).length;
    return (enabledCount / flagGroup.flags.length) * 100;
  };

  // Run architecture check
  const runArchitectureCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/architecture-check", {
        method: "POST",
      });
      const data = await response.json();

      setStats({
        totalComponents: data.totalFiles || 0,
        migratedComponents: data.migratedFiles || 0,
        violationCount: data.violations || {},
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall progress
  const overallProgress = stats.totalComponents > 0 ? (stats.migratedComponents / stats.totalComponents) * 100 : 0;

  return (
    <div className="container mx-auto max-w-7xl spacing-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Architecture Migration Dashboard</h1>
        <p className="text-muted-foreground">Monitor the progress of Campfire's architectural consolidation</p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Migration Progress</CardTitle>
          <CardDescription>
            {stats.migratedComponents} of {stats.totalComponents} components migrated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="mb-2" />
          <p className="text-sm text-muted-foreground">{overallProgress.toFixed(1)}% Complete</p>
        </CardContent>
      </Card>

      {/* Phase Status */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PhaseCard
          title="Phase 1: Security"
          icon={<Icon icon={Database} className="h-5 w-5" />}
          progress={calculatePhaseProgress("PHASE_1_SECURITY")}
          flags={FLAG_GROUPS.PHASE_1_SECURITY.flags}
          flagStatus={flagStatus}
        />
        <PhaseCard
          title="Phase 2: Real-time"
          icon={<Icon icon={Radio} className="h-5 w-5" />}
          progress={calculatePhaseProgress("PHASE_2_REALTIME")}
          flags={FLAG_GROUPS.PHASE_2_REALTIME.flags}
          flagStatus={flagStatus}
        />
        <PhaseCard
          title="Phase 3: State"
          icon={<Icon icon={Package} className="h-5 w-5" />}
          progress={calculatePhaseProgress("PHASE_3_STATE")}
          flags={FLAG_GROUPS.PHASE_3_STATE.flags}
          flagStatus={flagStatus}
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="violations" className="mb-6">
        <TabsList>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="violations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Architecture Violations</CardTitle>
                <CardDescription>Current violations detected in the codebase</CardDescription>
              </div>
              <Button onClick={runArchitectureCheck} disabled={loading} size="sm">
                {loading ? (
                  <Icon icon={RefreshCw} className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
                    Run Check
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {Object.entries(stats.violationCount).length === 0 ? (
                <Alert>
                  <Icon icon={CheckCircle2} className="h-4 w-4" />
                  <AlertTitle>No violations detected</AlertTitle>
                  <AlertDescription>All architecture rules are being followed.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.violationCount).map(([rule, count]: [string, number]) => (
                    <div key={rule} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon icon={XCircle} className="h-4 w-4 text-destructive" />
                        <span className="font-medium">{rule}</span>
                      </div>
                      <Badge variant="error">{count} violations</Badge>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Last checked: {new Date(stats.lastCheck).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Control the rollout of architectural changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(flagStatus).map(([flag, status]: [string, { enabled: boolean }]) => (
                  <div key={flag} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{flag}</code>
                        <Badge variant={status.enabled ? "default" : "secondary"}>
                          {status.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Component Migration Status</CardTitle>
              <CardDescription>Track which components have been migrated</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Icon icon={AlertCircle} className="h-4 w-4" />
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Detailed component migration tracking will be available in the next update.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Phase Card Component
function PhaseCard({
  title,
  icon,
  progress,
  flags,
  flagStatus,
}: {
  title: string;
  icon: React.ReactNode;
  progress: number;
  flags: readonly string[];
  flagStatus: Record<string, { enabled: boolean }>;
}) {
  const isComplete = progress === 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {isComplete ? (
            <Icon icon={CheckCircle2} className="text-semantic-success h-5 w-5" />
          ) : (
            <Badge variant="secondary">{progress.toFixed(0)}%</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-3" />
        <div className="space-y-1">
          {flags.map((flag: string) => {
            const status = flagStatus[flag as keyof typeof flagStatus];
            return (
              <div key={flag} className="flex items-center gap-2 text-sm">
                {status?.enabled ? (
                  <Icon icon={CheckCircle2} className="text-semantic-success h-3 w-3" />
                ) : (
                  <Icon icon={XCircle} className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={status?.enabled ? "" : "text-muted-foreground"}>{flag}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
