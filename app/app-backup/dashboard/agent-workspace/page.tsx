"use client";

import dynamic from "next/dynamic";
import { LazyAgentWorkloadDashboard, LazySecurityAlertsDashboard } from "@/components/LazyComponents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useAuth } from "@/hooks/useAuth";

// Lazy load components that aren't in LazyComponents yet
const AgentPerformanceMetrics = dynamic(
  () => import("@/components/agent/AgentPerformanceMetrics").then((mod) => ({ default: mod.AgentPerformanceMetrics })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-ds-lg bg-gray-200"></div>
        <div className="h-64 rounded-ds-lg bg-gray-200"></div>
      </div>
    ),
    ssr: false,
  }
);

const AgentAvailabilityManager = dynamic(() => import("@/components/agent/AgentAvailabilityManager"), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-ds-lg bg-gray-200"></div>
      <div className="h-48 rounded-ds-lg bg-gray-200"></div>
    </div>
  ),
  ssr: false,
});

const ThreatResponseInterface = dynamic(
  () =>
    import("@/components/security/ThreatResponseInterface").then((mod) => ({ default: mod.ThreatResponseInterface })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-ds-lg bg-gray-200"></div>
        <div className="h-80 rounded-ds-lg bg-gray-200"></div>
      </div>
    ),
    ssr: false,
  }
);

function AgentWorkspaceContent() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  if (!organizationId) {
    return (
      <div className="container mx-auto flex items-center justify-center py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Workspace</h1>
        <p className="text-muted-foreground">Manage your workload, performance, and security operations</p>
      </div>

      <Tabs defaultValue="workload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="security">Security Alerts</TabsTrigger>
          <TabsTrigger value="threats">Threat Response</TabsTrigger>
        </TabsList>

        <TabsContent value="workload" className="space-y-4">
          <LazyAgentWorkloadDashboard organizationId={organizationId!} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <AgentPerformanceMetrics organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <AgentAvailabilityManager />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <LazySecurityAlertsDashboard organizationId={organizationId!} />
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <ThreatResponseInterface organizationId={organizationId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AgentWorkspacePage() {
  return <AgentWorkspaceContent />;
}
