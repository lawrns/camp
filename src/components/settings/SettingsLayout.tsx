"use client";

import React, { useState } from "react";
import { AlertTriangle as AlertTriangle, MessageCircle as MessageSquare, Palette, Settings as Settings, Shield, Users,  } from "lucide-react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isLoading?: boolean;
  error?: string;
}

const settingsTabs = [
  {
    id: "general",
    label: "General",
    icon: Settings,
    description: "Organization and account settings",
  },
  {
    id: "widget",
    label: "Widget",
    icon: MessageSquare,
    description: "Chat widget configuration",
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    description: "Team members and permissions",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Branding and visual customization",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Security and privacy settings",
  },
];

export function SettingsLayout({
  children,
  activeTab = "general",
  onTabChange,
  isLoading = false,
  error,
}: SettingsLayoutProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleTabChange = (tabId: string) => {
    if (hasUnsavedChanges) {
      const confirmChange = window.confirm("You have unsaved changes. Are you sure you want to switch tabs?");
      if (!confirmChange) return;
    }
    onTabChange?.(tabId);
  };

  if (error) {
    return (
      <div className="container mx-auto p-spacing-md">
        <Alert variant="error">
          <Icon icon={AlertTriangle} className="h-4 w-4" />
          <AlertDescription>Error loading settings: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-spacing-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-foreground mt-1">Manage your organization, team, and preferences</p>
        </div>

        {hasUnsavedChanges && (
          <Badge variant="outline" className="border-orange-600 text-orange-600">
            Unsaved Changes
          </Badge>
        )}
      </div>

      {isLoading ? (
        <SettingsLoadingSkeleton />
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value)} className="space-y-6">
          {/* Navigation Tabs */}
          <div className="border-b border-[var(--fl-color-border)]">
            <TabsList className="grid w-full grid-cols-5 lg:flex lg:w-auto lg:grid-cols-none lg:space-x-spacing-sm">
              {settingsTabs.map((tab: unknown) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-ds-2 px-4 py-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:block">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">{children}</div>
        </Tabs>
      )}
    </div>
  );
}

export function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab Navigation Skeleton */}
      <div className="flex space-x-spacing-md border-b border-[var(--fl-color-border)] pb-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-spacing-sm">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function SettingsTabContent({
  title,
  description,
  icon: Icon,
  children,
  actions,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="text-foreground h-6 w-6" />}
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">{title}</h2>
            {description && <p className="text-foreground mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-ds-2">{actions}</div>}
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
  actions,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base text-gray-900">{title}</CardTitle>
          {description && <p className="text-foreground mt-1 text-sm">{description}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
