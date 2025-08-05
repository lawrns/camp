"use client";

import React, { useEffect, useState } from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Bell, BellSlash as BellOff, Play, Settings as Settings, SpeakerHigh as Volume2, SpeakerSlash as VolumeX,  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Slider } from "@/components/unified-ui/components/slider";
import { Switch } from "@/components/unified-ui/components/switch";
import { Icon } from "@/lib/ui/Icon";
import { audioNotificationService } from "@/services/AudioNotificationService";

interface AudioNotificationSettings {
  enabled: boolean;
  volume: number;
  soundTheme: string;
  notificationTypes: {
    newMessage: boolean;
    visitorJoined: boolean;
    visitorLeft: boolean;
    agentAssigned: boolean;
    escalation: boolean;
  };
}

interface AudioNotificationSettingsProps {
  onSettingsChange?: (settings: AudioNotificationSettings) => void;
}

export default function AudioNotificationSettings({ onSettingsChange }: AudioNotificationSettingsProps) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [soundTheme, setSoundTheme] = useState("default");
  const [notificationTypes, setNotificationTypes] = useState({
    newMessage: true,
    visitorJoined: true,
    visitorLeft: false,
    agentAssigned: true,
    escalation: true,
  });
  const [isTesting, setIsTesting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const settings = audioNotificationService.getSettings();
    setEnabled(settings.enabled);
    setVolume(settings.volume ?? 0.7);

    // Load additional settings from localStorage
    const savedSettings = localStorage.getItem("campfire-audio-detailed-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSoundTheme(parsed.soundTheme || "default");
        setNotificationTypes(parsed.notificationTypes || notificationTypes);
      } catch (e) {}
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    const settings = {
      enabled,
      volume,
      soundTheme,
      notificationTypes,
    };

    localStorage.setItem("campfire-audio-detailed-settings", JSON.stringify(settings));

    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [enabled, volume, soundTheme, notificationTypes]);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    audioNotificationService.setEnabled(checked);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] ?? 0.7;
    setVolume(newVolume);
    audioNotificationService.setVolume(newVolume);
  };

  const handleNotificationTypeChange = (type: keyof typeof notificationTypes, checked: boolean) => {
    setNotificationTypes((prev) => ({
      ...prev,
      [type]: checked,
    }));
  };

  const testSound = async () => {
    setIsTesting(true);

    // Map sound themes to different audio files
    const soundFiles: Record<string, string> = {
      default: "/notification.mp3",
      soft: "/notification-soft.mp3",
      alert: "/notification-alert.mp3",
      chime: "/notification-chime.mp3",
    };

    const soundFile = soundFiles[soundTheme] || soundFiles.default;

    try {
      await audioNotificationService.testSound(soundFile);
    } catch (error) {
    } finally {
      setTimeout(() => setIsTesting(false), 1000);
    }
  };

  const getVolumeIcon = () => {
    if (!enabled || volume === 0) return <Icon icon={VolumeX} className="h-5 w-5" />;
    return <Icon icon={Volume2} className="h-5 w-5" />;
  };

  const getVolumePercentage = () => Math.round(volume * 100);

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Bell} className="h-5 w-5" />
            Audio Notifications
          </CardTitle>
          <CardDescription>Configure how you receive audio alerts for incoming messages and events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="audio-enabled" className="text-sm font-medium">
                Enable Audio Notifications
              </label>
              <p className="text-tiny text-[var(--fl-color-text-muted)]">
                Play sounds for incoming messages and events
              </p>
            </div>
            <Switch id="audio-enabled" checked={enabled} onCheckedChange={handleEnabledChange} />
          </div>

          {/* Volume Control */}
          <OptimizedMotion.div animate={{ opacity: enabled ? 1 : 0.5 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-ds-2 text-sm font-medium">
                {getVolumeIcon()}
                Volume
              </label>
              <span className="text-sm text-[var(--fl-color-text-muted)]">{getVolumePercentage()}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(value: number[]) => handleVolumeChange(value)}
              max={1}
              step={0.1}
              disabled={!enabled}
              className="w-full"
            />
          </OptimizedMotion.div>

          {/* Sound Theme */}
          <OptimizedMotion.div animate={{ opacity: enabled ? 1 : 0.5 }} className="space-y-spacing-sm">
            <label className="text-sm font-medium">Notification Sound</label>
            <div className="flex items-center gap-ds-2">
              <Select value={soundTheme} onValueChange={(value) => setSoundTheme(value)} disabled={!enabled}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="soft">Soft Chime</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="chime">Bell Chime</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={testSound} disabled={!enabled || isTesting}>
                {isTesting ? (
                  <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-[var(--fl-color-brand)] border-t-transparent" />
                ) : (
                  <Icon icon={Play} className="h-4 w-4" />
                )}
              </Button>
            </div>
          </OptimizedMotion.div>
        </CardContent>
      </Card>

      {/* Notification Types Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Settings} className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>Choose which events trigger audio notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries({
            newMessage: {
              label: "New Messages",
              description: "When visitors send new messages",
            },
            visitorJoined: {
              label: "Visitor Joined",
              description: "When a new visitor starts a conversation",
            },
            visitorLeft: {
              label: "Visitor Left",
              description: "When a visitor leaves the conversation",
            },
            agentAssigned: {
              label: "Agent Assigned",
              description: "When you are assigned to a conversation",
            },
            escalation: {
              label: "Escalations",
              description: "When a conversation is escalated to you",
            },
          }).map(([type, config]) => (
            <OptimizedMotion.div
              key={type}
              animate={{ opacity: enabled ? 1 : 0.5 }}
              className="flex items-center justify-between py-2"
            >
              <div className="space-y-0.5">
                <label htmlFor={`notification-${type}`} className="text-sm font-medium">
                  {config.label}
                </label>
                <p className="text-tiny text-[var(--fl-color-text-muted)]">{config.description}</p>
              </div>
              <Switch
                id={`notification-${type}`}
                checked={notificationTypes[type as keyof typeof notificationTypes]}
                onCheckedChange={(checked: boolean) =>
                  handleNotificationTypeChange(type as keyof typeof notificationTypes, checked)
                }
                disabled={!enabled}
              />
            </OptimizedMotion.div>
          ))}
        </CardContent>
      </Card>

      {/* Browser Permissions Notice */}
      <Card className="border-status-info-light bg-[var(--fl-color-info-subtle)]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Icon icon={Bell} className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Browser Permissions Required</p>
              <p className="text-status-info-dark text-tiny">
                Audio notifications require user interaction with the page. Make sure your browser allows audio playback
                and you've interacted with the dashboard at least once.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
