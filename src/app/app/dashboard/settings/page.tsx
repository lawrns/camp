"use client";

import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { SettingsTabContent } from "@/components/settings/SettingsLayout";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { WidgetSettingsForm } from "@/components/settings/WidgetSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { ChatCircle as MessageSquare, Palette, Gear as Settings, Shield, Users } from "@phosphor-icons/react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  if (!organizationId) {
    return (
      <div className="container mx-auto flex items-center justify-center spacing-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  const { settings, isLoading, error } = useOrganizationSettings({
    organizationId,
    autoLoad: true,
  });

  return (
    <OptimizedMotion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="container mx-auto space-y-6 spacing-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-600">Manage your organization, team, and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <div className="border-b border-[var(--fl-color-border)]">
            <TabsList className="grid w-full grid-cols-5 lg:flex lg:w-auto lg:grid-cols-none lg:space-x-2">
              <TabsTrigger value="general" className="flex items-center gap-2 px-4 py-2">
                <Icon icon={Settings} className="h-4 w-4" />
                <span className="hidden sm:block">General</span>
              </TabsTrigger>
              <TabsTrigger value="widget" className="flex items-center gap-2 px-4 py-2">
                <Icon icon={MessageSquare} className="h-4 w-4" />
                <span className="hidden sm:block">Widget</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2 px-4 py-2">
                <Icon icon={Users} className="h-4 w-4" />
                <span className="hidden sm:block">Team</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 px-4 py-2">
                <Icon icon={Palette} className="h-4 w-4" />
                <span className="hidden sm:block">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 px-4 py-2">
                <Icon icon={Shield} className="h-4 w-4" />
                <span className="hidden sm:block">Security</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            <TabsContent value="general" className="space-y-0">
              <SettingsTabContent
                title="General Settings"
                description="Organization information and basic preferences"
                icon={Settings}
              >
                <GeneralSettingsForm
                  settings={settings}
                  isLoading={isLoading}
                  error={error}
                  organizationId={organizationId}
                />
              </SettingsTabContent>
            </TabsContent>

            <TabsContent value="widget" className="space-y-0">
              <SettingsTabContent
                title="Widget Configuration"
                description="Customize your chat widget appearance and behavior"
                icon={MessageSquare}
              >
                <WidgetSettingsForm
                  settings={settings ? { widget: {} } : null}
                  isLoading={isLoading}
                  error={error}
                  organizationId={organizationId}
                />
              </SettingsTabContent>
            </TabsContent>

            <TabsContent value="team" className="space-y-0">
              <SettingsTabContent
                title="Team Management"
                description="Manage team members, roles, and permissions"
                icon={Users}
              >
                <TeamManagement organizationId={organizationId} isLoading={isLoading} error={error} />
              </SettingsTabContent>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-0">
              <SettingsTabContent
                title="Appearance"
                description="Customize branding, colors, and visual elements"
                icon={Palette}
              >
                <AppearanceSettings
                  settings={settings}
                  isLoading={isLoading}
                  error={error}
                  organizationId={organizationId}
                />
              </SettingsTabContent>
            </TabsContent>

            <TabsContent value="security" className="space-y-0">
              <SettingsTabContent
                title="Security & Privacy"
                description="Security settings, access control, and privacy preferences"
                icon={Shield}
              >
                <SecuritySettings
                  settings={settings}
                  isLoading={isLoading}
                  error={error}
                  organizationId={organizationId}
                />
              </SettingsTabContent>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </OptimizedMotion.div>
  );
}
