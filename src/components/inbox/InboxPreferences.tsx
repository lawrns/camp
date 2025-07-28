"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Eye,
  ChatCircle as MessageSquare,
  FloppyDisk as Save,
  SpeakerHigh as Volume2,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Label } from "@/components/unified-ui/components/label";
import { Switch } from "@/components/unified-ui/components/switch";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";

interface InboxPreferencesProps {
  organizationId: string;
  userId: string;
}

interface PreferenceState {
  showReadConversations: boolean;
  autoAssignNewConversations: boolean;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  typingPreviewEnabled: boolean;
  autoExpandMessages: boolean;
}

export function InboxPreferences({ organizationId, userId }: InboxPreferencesProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceState>({
    showReadConversations: true,
    autoAssignNewConversations: false,
    soundNotifications: true,
    desktopNotifications: false,
    typingPreviewEnabled: true,
    autoExpandMessages: false,
  });

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [organizationId, userId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/preferences/inbox?userId=${userId}&organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      }
    } catch (error) {}
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/preferences/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          organizationId,
          preferences,
        }),
      });

      if (response.ok) {
        toast({
          title: "Preferences saved",
          description: "Your inbox preferences have been updated successfully.",
        });
      } else {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPreferences((prev) => ({ ...prev, desktopNotifications: true }));
        toast({
          title: "Notifications enabled",
          description: "You will now receive desktop notifications.",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Desktop notifications require permission.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Display Preferences */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-ds-2 text-sm font-medium text-gray-900">
          <Icon icon={Eye} className="h-4 w-4 text-blue-600" />
          Display Settings
        </h3>

        <div className="space-y-3 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-read" className="text-foreground text-sm">
              Show read conversations
            </Label>
            <Switch
              id="show-read"
              checked={preferences.showReadConversations}
              onChange={(e) => setPreferences((prev) => ({ ...prev, showReadConversations: e.target.checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-expand" className="text-foreground text-sm">
              Auto-expand long messages
            </Label>
            <Switch
              id="auto-expand"
              checked={preferences.autoExpandMessages}
              onChange={(e) => setPreferences((prev) => ({ ...prev, autoExpandMessages: e.target.checked }))}
            />
          </div>
        </div>
      </div>

      {/* Assignment Preferences */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-ds-2 text-sm font-medium text-gray-900">
          <Icon icon={Zap} className="h-4 w-4 text-blue-600" />
          Assignment Settings
        </h3>

        <div className="space-y-3 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-assign" className="text-foreground text-sm">
              Auto-assign new conversations to me
            </Label>
            <Switch
              id="auto-assign"
              checked={preferences.autoAssignNewConversations}
              onChange={(e) => setPreferences((prev) => ({ ...prev, autoAssignNewConversations: e.target.checked }))}
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-ds-2 text-sm font-medium text-gray-900">
          <Icon icon={Bell} className="h-4 w-4 text-blue-600" />
          Notifications
        </h3>

        <div className="space-y-3 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-notifications" className="text-foreground text-sm">
              Sound notifications
            </Label>
            <Switch
              id="sound-notifications"
              checked={preferences.soundNotifications}
              onChange={(e) => setPreferences((prev) => ({ ...prev, soundNotifications: e.target.checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="desktop-notifications" className="text-foreground text-sm">
              Desktop notifications
            </Label>
            <Switch
              id="desktop-notifications"
              checked={preferences.desktopNotifications}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked && "Notification" in window && Notification.permission !== "granted") {
                  requestNotificationPermission();
                } else {
                  setPreferences((prev) => ({ ...prev, desktopNotifications: checked }));
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Features */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-ds-2 text-sm font-medium text-gray-900">
          <Icon icon={MessageSquare} className="h-4 w-4 text-blue-600" />
          Real-time Features
        </h3>

        <div className="space-y-3 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="typing-preview" className="text-foreground text-sm">
              Show typing preview
            </Label>
            <Switch
              id="typing-preview"
              checked={preferences.typingPreviewEnabled}
              onChange={(e) => setPreferences((prev) => ({ ...prev, typingPreviewEnabled: e.target.checked }))}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-[var(--fl-color-border)] pt-4">
        <Button
          onClick={savePreferences}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isSaving ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-ds-full border-b-2 border-current" />
          ) : (
            <Icon icon={Save} className="mr-2 h-4 w-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
