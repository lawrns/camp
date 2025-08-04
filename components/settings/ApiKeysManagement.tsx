"use client";

import { useState } from "react";
import {
  Warning as AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Key,
  Spinner as Loader2,
  DotsThree as MoreHorizontal,
  Plus,
  Shield,
  Trash as Trash2,
  XCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/unified-ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Switch } from "@/components/unified-ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/unified-ui/components/table";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
// Import tRPC API
import { api } from "@/trpc/react";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  description?: string;
  scopes: string[];
  status: "active" | "inactive" | "revoked";
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface CreateApiKeyFormData {
  name: string;
  description: string;
  scopes: string[];
  expires_in_days?: number;
}

interface ApiKeysManagementProps {
  organizationId: string;
}

const availableScopes = [
  { value: "conversations:read", label: "Read Conversations", description: "View conversations and messages" },
  { value: "conversations:write", label: "Write Conversations", description: "Create and update conversations" },
  { value: "widget:embed", label: "Widget Embed", description: "Embed chat widget on websites" },
  { value: "analytics:read", label: "Read Analytics", description: "View analytics and reports" },
  { value: "users:read", label: "Read Users", description: "View user information" },
  { value: "webhooks:manage", label: "Manage Webhooks", description: "Create and manage webhooks" },
];

export function ApiKeysManagement({ organizationId }: ApiKeysManagementProps) {
  // Use tRPC hooks instead of manual state management
  const { data: apiKeysData, isLoading: loading, error, refetch } = api.apiKeys.list.useQuery();
  const createApiKeyMutation = api.apiKeys.create.useMutation();
  const updateApiKeyMutation = api.apiKeys.update.useMutation();
  const deleteApiKeyMutation = api.apiKeys.delete.useMutation();

  const apiKeys = apiKeysData?.data?.apiKeys || [];
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateApiKeyFormData>({
    name: "",
    description: "",
    scopes: [],
  });

  // tRPC automatically handles loading and error states
  // No need for manual fetchApiKeys function

  // Create API key using tRPC
  const handleCreateApiKey = async () => {
    if (!formData.name.trim()) {
      toast.error("API key name is required");
      return;
    }

    try {
      const result = await createApiKeyMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        permissions: formData.scopes,
      });

      if (result.success) {
        setNewApiKey(result.data.apiKey.full_key);
        setShowCreateDialog(false);
        setShowKeyDialog(true);
        setFormData({ name: "", description: "", scopes: [] });
        toast.success("API key created successfully");
        refetch(); // Refresh the list
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
    }
  };

  // Update API key status
  const handleUpdateStatus = async (keyId: string, status: "active" | "inactive") => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`API key ${status === "active" ? "activated" : "deactivated"} successfully`);
        fetchApiKeys();
      } else {
        throw new Error(data.message || "Failed to update API key");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update API key");
    }
  };

  // Revoke API key
  const handleRevokeKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("API key revoked successfully");
        fetchApiKeys();
      } else {
        throw new Error(data.message || "Failed to revoke API key");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "inactive":
        return { color: "bg-gray-100 text-gray-800", icon: XCircle };
      case "revoked":
        return { color: "bg-red-100 text-red-800", icon: AlertTriangle };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: Clock };
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if key is expired
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <ApiKeysSkeletonLoader />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load API keys: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-foreground text-sm">Manage API keys for accessing your organization's data</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger>
            <Button>
              <Icon icon={Plus} className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access your organization's data programmatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label htmlFor="keyName">Name *</Label>
                <Input
                  id="keyName"
                  placeholder="My API Key"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-spacing-sm">
                <Label htmlFor="keyDescription">Description</Label>
                <Textarea
                  id="keyDescription"
                  placeholder="Optional description of what this key is used for"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-spacing-sm">
                <Label>Scopes</Label>
                <div className="max-h-48 space-y-spacing-sm overflow-y-auto">
                  {availableScopes.map((scope) => (
                    <div key={scope.value} className="flex items-start space-x-spacing-sm">
                      <Switch
                        id={scope.value}
                        checked={formData.scopes.includes(scope.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              scopes: [...formData.scopes, scope.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              scopes: formData.scopes.filter((s) => s !== scope.value),
                            });
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={scope.value} className="cursor-pointer text-sm font-medium">
                          {scope.label}
                        </label>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">{scope.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-spacing-sm">
                <Label htmlFor="expiresIn">Expires In</Label>
                <Select
                  value={formData.expires_in_days?.toString() || "never"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      expires_in_days: value === "never" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateApiKey} disabled={creating}>
                  {creating ? (
                    <>
                      <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Icon icon={Key} className="mr-2 h-4 w-4" />
                      Create API Key
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            {apiKeys.length} API key{apiKeys.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="py-8 text-center">
              <Icon icon={Key} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-base font-medium text-gray-900">No API keys</h3>
              <p className="text-foreground mb-4">Get started by creating your first API key</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Icon icon={Plus} className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => {
                  const statusConfig = getStatusConfig(key.status);
                  const StatusIcon = statusConfig.icon;
                  const expired = isExpired(key.expiresAt);

                  return (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{key.name}</div>
                          {key.description && (
                            <div className="text-sm text-[var(--fl-color-text-muted)]">{key.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-spacing-sm">
                          <code className="bg-background rounded px-2 py-1 text-sm">
                            {key.key_prefix}••••••••••••
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(key.key_prefix)}>
                            <Icon icon={Copy} className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {key.status}
                          {expired && " (Expired)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.slice(0, 2).map((scope) => (
                            <Badge key={scope} variant="outline" className="text-tiny">
                              {scope.split(":")[0]}
                            </Badge>
                          ))}
                          {key.scopes.length > 2 && (
                            <Badge variant="outline" className="text-tiny">
                              +{key.scopes.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{key.usage_count.toLocaleString()} requests</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground text-sm">{formatDate(key.last_used_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground text-sm">
                          {key.expiresAt ? formatDate(key.expiresAt) : "Never"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="secondary" size="sm">
                              <Icon icon={MoreHorizontal} className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {key.status === "active" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(key.id, "inactive")}>
                                <Icon icon={XCircle} className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {key.status === "inactive" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(key.id, "active")}>
                                <Icon icon={CheckCircle} className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {key.status !== "revoked" && (
                              <DropdownMenuItem onClick={() => handleRevokeKey(key.id)} className="text-red-600">
                                <Icon icon={Trash2} className="mr-2 h-4 w-4" />
                                Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New API Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your new API key has been created. Copy it now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-spacing-sm">
              <Label>Your API Key</Label>
              <div className="flex items-center space-x-spacing-sm">
                <Input value={newApiKey || ""} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={() => newApiKey && handleCopy(newApiKey)}>
                  <Icon icon={Copy} className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Alert>
              <Icon icon={Shield} className="h-4 w-4" />
              <AlertDescription>
                Store this key securely. It won't be displayed again and cannot be recovered.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setShowKeyDialog(false);
                  setNewApiKey(null);
                }}
              >
                I've saved the key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApiKeysSkeletonLoader() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-spacing-md">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
