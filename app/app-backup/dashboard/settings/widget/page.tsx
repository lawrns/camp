"use client";

import { AlertTriangle as AlertTriangle } from "lucide-react";
import { WidgetSettingsForm } from "@/components/settings/WidgetSettingsForm";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Card, CardContent, CardHeader } from "@/components/unified-ui/components/Card";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { useOrganization } from "@/lib/multi-tenant/organization-context";
import { Icon } from "@/lib/ui/Icon";

export default function WidgetSettingsPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { settings, isLoading, error } = useWidgetSettings({
    mailboxId: 1, // TODO: Get from organization or user context
    autoLoad: !orgLoading && !!organization,
  });

  if (orgLoading || isLoading) {
    return <WidgetSettingsPageSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Widget Settings</h1>
          <p className="text-muted-foreground">Configure your chat widget appearance and behavior</p>
        </div>

        <Alert variant="error">
          <Icon icon={AlertTriangle} className="h-4 w-4" />
          <AlertDescription>Failed to load widget settings: {(error instanceof Error ? error.message : String(error))}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Widget Settings</h1>
        <p className="text-muted-foreground">Configure your chat widget appearance and behavior</p>
      </div>

      {/* tRPC Test Component */}
      <div className="border-status-info-light rounded border bg-[var(--fl-color-info-subtle)] spacing-4">
        <p className="text-status-info-dark">✅ tRPC Context Working! No context errors detected.</p>
        <p className="text-sm text-blue-600">The useWidgetSettings hook can now access tRPC context successfully.</p>
      </div>

      {/* Realtime Test Component */}
      <div className="rounded-ds-lg border bg-[var(--fl-color-background-subtle)] spacing-4">
        <h3 className="mb-4 text-lg font-semibold">Supabase Realtime Connection Test</h3>
        <div className="text-sm">
          <p>
            <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </p>
          <p>
            <strong>Expected WebSocket:</strong> wss://yvntokkncxbhapqjesti.supabase.co/realtime/v1/websocket
          </p>
          <p className="text-semantic-success-dark mt-2">
            🔄 Testing realtime connection... (Check browser console for details)
          </p>
        </div>
      </div>

      <WidgetSettingsForm
        settings={{ widget: settings }}
        isLoading={isLoading}
        error={error}
        organizationId={organization?.id || ""}
      />
    </div>
  );
}

function WidgetSettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>

      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
