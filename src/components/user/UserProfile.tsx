"use client";

import { useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Bell, Buildings as Building, CheckCircle, Crown, FloppyDisk as Save, Shield, User, WifiHigh, WifiSlash as WifiHighOff,  } from "lucide-react";
import { Alert, AlertDescription } from "@/unified-ui/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/unified-ui/Avatar";
import { Badge } from "@/unified-ui/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/unified-ui/Card";
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
import { Textarea } from "@/unified-ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";

interface Organization {
  id: string;
  name: string;
  memberCount: number;
  plan: string;
}

interface UserProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  status?: "online" | "away" | "busy" | "offline";
  teamRole?: string;
  bio?: string;
  lastActive?: string;
  notifications?: {
    desktop?: boolean;
  };
  preferences?: {
    theme?: string;
    language?: string;
    autoResponse?: boolean;
  };
}

interface Session {
  lastLogin: string;
  loginCount: number;
}

export function UserProfile() {
  const { user, loading } = useAuth() as { user: UserProfileData | null; loading: boolean };
  const isAuthenticated = !!user;
  const session: Session | null = user ? { lastLogin: new Date().toISOString(), loginCount: 1 } : null;

  // TODO: Implement these methods in the unified auth system
  const updateProfile = async (data: unknown) => {
    return true;
  };
  const updateStatus = async (status: unknown) => {};
  const refreshSession = async (orgId?: string) => {};
  const isOnline = true; // TODO: Implement online status
  // TODO: Implement organization fetching
  const auth = useAuth();
  const currentOrg: Organization | null = auth.user?.organizationId
    ? {
        id: auth.user.organizationId,
        name: "Current Organization",
        memberCount: 1,
        plan: "Free",
      }
    : null;

  const organizations: Organization[] = currentOrg ? [currentOrg] : []; // TODO: Implement organizations fetching

  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "organization" | "security">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    company: "", // TODO: Implement company field
    bio: "", // TODO: Implement bio field
    timezone: "America/New_York", // TODO: Implement timezone field
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true, // TODO: Implement email notifications setting
    push: true, // TODO: Implement push notifications setting
    desktop: user?.notifications?.desktop ?? false,
  });

  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || "light",
    language: user?.preferences?.language || "en",
    autoResponse: user?.preferences?.autoResponse ?? false,
  });

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-ds-full border-b-2 border-brand-500"></div>
          <p className="text-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const success = await updateProfile({
        ...formData,
        bio: formData.bio,
        timezone: formData.timezone,
        notifications: notificationSettings,
        preferences,
      });

      if (success) {
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: "online" | "away" | "busy" | "offline") => {
    await updateStatus(newStatus);
  };

  const handleOrgSwitch = async (orgId: string) => {
    await refreshSession(orgId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-[var(--fl-color-success-subtle)]0";
      case "away":
        return "bg-orange-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "organization", label: "Organization", icon: Building },
    { id: "security", label: "Security", icon: Shield },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-spacing-md">
      {/* Profile Header */}
      <Card className="glass-bg-orange-100">
        <CardContent className="p-spacing-md">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                {user.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="bg-brand-50 text-3xl text-brand-700">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-ds-full border-2 border-white ${getStatusColor(user.status)}`}
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {user.firstName} {user.lastName}
                </h1>
                <Badge variant="secondary" className="text-tiny">
                  {user.teamRole || "Agent"}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {isOnline ? (
                    <>
                      <Icon icon={WifiHigh} className="text-semantic-success h-4 w-4" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={WifiHighOff} className="text-brand-mahogany-500 h-4 w-4" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-foreground mb-2">{user.email}</p>

              {(user as unknown).bio && <p className="mb-3 text-sm text-muted-foreground">{(user as unknown).bio}</p>}

              {/* Status Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={user.status || "online"}
                  onValueChange={(value) => handleStatusChange(value as "online" | "away" | "busy" | "offline")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">
                      <div className="flex items-center gap-ds-2">
                        <div className="bg-semantic-success h-2 w-2 rounded-ds-full" />
                        Online
                      </div>
                    </SelectItem>
                    <SelectItem value="away">
                      <div className="flex items-center gap-ds-2">
                        <div className="bg-semantic-warning h-2 w-2 rounded-ds-full" />
                        Away
                      </div>
                    </SelectItem>
                    <SelectItem value="busy">
                      <div className="flex items-center gap-ds-2">
                        <div className="bg-brand-mahogany-500 h-2 w-2 rounded-ds-full" />
                        Busy
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-ds-2">
                        <div className="h-2 w-2 rounded-ds-full bg-neutral-400" />
                        Offline
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Session Info */}
            {session && (
              <div className="text-right text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p>Last login: {new Date(session.lastLogin).toLocaleDateString()}</p>
                  <p>Login count: {session.loginCount}</p>
                  {user.lastActive && <p>Last active: {new Date(user.lastActive).toLocaleTimeString()}</p>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Alert */}
      <OptimizedAnimatePresence>
        {saveSuccess && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className="border-status-success-light bg-[var(--fl-color-success-subtle)]">
              <Icon icon={CheckCircle} className="text-semantic-success-dark h-4 w-4" />
              <AlertDescription className="text-green-800">Profile updated successfully!</AlertDescription>
            </Alert>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-ds-lg bg-muted/30 spacing-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "profile" | "notifications" | "organization" | "security")}
              className={`flex items-center gap-2 rounded-ds-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <OptimizedAnimatePresence mode="wait">
        <OptimizedMotion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and preferences</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-spacing-sm">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-spacing-sm">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-spacing-sm">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-spacing-sm">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-spacing-sm">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                </div>

                <div className="space-y-spacing-sm">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                    disabled={!isEditing}
                  />
                </div>

                {isEditing && (
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-ds-full border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Icon icon={Save} className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications from Comrad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({ ...notificationSettings, email: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({ ...notificationSettings, push: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show notifications on your desktop</p>
                    </div>
                    <Switch
                      checked={notificationSettings.desktop}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({ ...notificationSettings, desktop: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto Response</Label>
                      <p className="text-sm text-muted-foreground">Automatically suggest responses</p>
                    </div>
                    <Switch
                      checked={preferences.autoResponse}
                      onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, autoResponse: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Notification Settings"}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "organization" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={Building} className="h-5 w-5" />
                  Organization Management
                </CardTitle>
                <CardDescription>Manage your organization settings and team access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Organization */}
                {currentOrg && (
                  <div className="rounded-ds-lg bg-muted/30 spacing-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-ds-lg bg-brand-500 font-bold text-white">
                          {currentOrg?.name?.[0] || "O"}
                        </div>
                        <div>
                          <h3 className="font-semibold">{currentOrg?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {currentOrg?.memberCount} members • {currentOrg?.plan} plan
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-brand-50 text-brand-700">
                        Current
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Organization Switcher */}
                {organizations.length > 1 && (
                  <div className="space-y-3">
                    <Label>Switch Organization</Label>
                    <div className="space-y-spacing-sm">
                      {organizations.map((org) => (
                        <div
                          key={org.id}
                          className={`cursor-pointer rounded-ds-lg border spacing-3 transition-colors ${
                            org.id === currentOrg?.id ? "border-brand-500 bg-brand-50" : "hover:border-slate-300"
                          }`}
                          onClick={() => handleOrgSwitch(org.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-ds-md bg-brand-500 text-sm font-bold text-white">
                              {org.name?.[0] || "O"}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{org.name}</p>
                              <p className="text-sm text-muted-foreground">{org.memberCount} members</p>
                            </div>
                            {org.id === currentOrg?.id && (
                              <Icon icon={CheckCircle} className="h-5 w-5 text-brand-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Role */}
                <div className="flex items-center justify-between rounded-ds-lg border spacing-3">
                  <div className="flex items-center gap-3">
                    <Icon icon={Crown} className="text-semantic-warning h-5 w-5" />
                    <div>
                      <p className="font-medium">Your Role</p>
                      <p className="text-sm text-muted-foreground">{user.teamRole || "Agent"} access level</p>
                    </div>
                  </div>
                  <Badge variant="outline">{user.teamRole || "Agent"}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={Shield} className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <div className="rounded-ds-lg border spacing-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">Last updated 30 days ago</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-ds-lg border spacing-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-ds-lg border spacing-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Active Sessions</p>
                        <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </OptimizedMotion.div>
      </OptimizedAnimatePresence>
    </div>
  );
}
