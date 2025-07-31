"use client";

import React, { useState } from "react";
import {
  ChartLine as Activity,
  Warning as AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Funnel as Filter,
  Envelope as Mail,
  DotsThree as MoreHorizontal,
  Pencil,
  Phone,
  Prohibit,
  MagnifyingGlass as Search,
  Gear as Settings,
  Shield,
  Trash as Trash2,
  Upload,
  UserPlus,
  Users,
} from "@phosphor-icons/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { ImprovedInput } from "@/components/unified-ui/components/improved-input";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  department: string;
  joinedAt: Date;
  lastActive: Date;
  permissions: string[];
  stats: {
    conversationsHandled: number;
    avgResponseTime: number;
    customerRating: number;
    resolutionRate: number;
  };
}

interface UserManagementProps {
  users?: User[];
  onUserCreate?: (user: Partial<User>) => void;
  onUserUpdate?: (id: string, updates: Partial<User>) => void;
  onUserDelete?: (id: string) => void;
  onUserSuspend?: (id: string) => void;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Alex Rivera",
    email: "alex@campfire.dev",
    avatar: "/avatars/alex.jpg",
    role: "admin",
    status: "active",
    department: "Customer Success",
    joinedAt: new Date("2024-01-15"),
    lastActive: new Date(),
    permissions: ["all"],
    stats: {
      conversationsHandled: 234,
      avgResponseTime: 2.3,
      customerRating: 4.8,
      resolutionRate: 94,
    },
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@campfire.dev",
    avatar: "/avatars/sarah.jpg",
    role: "agent",
    status: "active",
    department: "Technical Support",
    joinedAt: new Date("2024-02-01"),
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
    permissions: ["conversations", "knowledge_view"],
    stats: {
      conversationsHandled: 189,
      avgResponseTime: 1.8,
      customerRating: 4.9,
      resolutionRate: 96,
    },
  },
  {
    id: "3",
    name: "Mike Chen",
    email: "mike@campfire.dev",
    avatar: "/avatars/mike.jpg",
    role: "manager",
    status: "active",
    department: "Sales Support",
    joinedAt: new Date("2023-12-10"),
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
    permissions: ["team_management", "analytics", "conversations"],
    stats: {
      conversationsHandled: 156,
      avgResponseTime: 3.1,
      customerRating: 4.6,
      resolutionRate: 89,
    },
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@campfire.dev",
    avatar: "/avatars/emily.jpg",
    role: "agent",
    status: "suspended",
    department: "Customer Success",
    joinedAt: new Date("2024-03-05"),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    permissions: ["conversations", "knowledge_view"],
    stats: {
      conversationsHandled: 98,
      avgResponseTime: 2.7,
      customerRating: 4.7,
      resolutionRate: 91,
    },
  },
];

export default function UserManagement({
  users = mockUsers,
  onUserCreate,
  onUserUpdate,
  onUserDelete,
  onUserSuspend,
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    permissions: [] as string[],
  });

  const departments = ["Customer Success", "Technical Support", "Sales Support", "Management"];
  const roles = ["admin", "manager", "agent", "viewer"];
  const statuses = ["active", "inactive", "suspended"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "agent":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment;
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    onUserCreate?.(newUser);
    setIsCreateDialogOpen(false);
    setNewUser({ name: "", email: "", role: "", department: "", permissions: [] });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      onUserUpdate?.(editingUser.id, editingUser);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const UserCard = ({ user }: { user: User }) => (
    <Card className="transition-shadow hover:shadow-card-hover">
      <CardContent className="p-spacing-md">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar || ""} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-base font-semibold">{user.name}</h3>
              <p className="text-foreground text-sm">{user.email}</p>
              <div className="mt-1 flex items-center gap-ds-2">
                <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm">
                <Icon icon={MoreHorizontal} className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Icon icon={Pencil} className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon={Mail} className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onUserSuspend?.(user.id)}>
                <Icon icon={Prohibit} className="mr-2 h-4 w-4" />
                {user.status === "suspended" ? "Unsuspend" : "Suspend"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUserDelete?.(user.id)} className="text-red-600">
                <Icon icon={Trash2} className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-foreground mb-4 text-sm">
          <p>{user.department}</p>
          <p>Joined {user.joinedAt.toLocaleDateString()}</p>
          <p>Last active {formatTimeAgo(user.lastActive)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
            <div className="text-base font-semibold">{user.stats.conversationsHandled}</div>
            <div className="text-tiny text-[var(--fl-color-text-muted)]">Conversations</div>
          </div>
          <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
            <div className="text-base font-semibold">{user.stats.avgResponseTime}m</div>
            <div className="text-tiny text-[var(--fl-color-text-muted)]">Avg Response</div>
          </div>
          <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
            <div className="text-base font-semibold">{user.stats.customerRating}</div>
            <div className="text-tiny text-[var(--fl-color-text-muted)]">Rating</div>
          </div>
          <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
            <div className="text-base font-semibold">{user.stats.resolutionRate}%</div>
            <div className="text-tiny text-[var(--fl-color-text-muted)]">Resolution</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-foreground">Manage team members and their permissions</p>
        </div>
        <div className="flex items-center gap-ds-2">
          <Button variant="outline" size="sm" leftIcon={<Icon icon={Download} className="h-4 w-4" />}>
            Export Users
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} leftIcon={<Icon icon={UserPlus} className="h-4 w-4" />}>
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="spacing-3 text-center">
            <Icon icon={Users} className="mx-auto mb-2 h-8 w-8 text-blue-600" />
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="spacing-3 text-center">
            <Icon icon={Activity} className="text-semantic-success-dark mx-auto mb-2 h-8 w-8" />
            <div className="text-3xl font-bold">{users.filter((u: any) => u.status === "active").length}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="spacing-3 text-center">
            <Icon icon={Shield} className="mx-auto mb-2 h-8 w-8 text-purple-600" />
            <div className="text-3xl font-bold">{users.filter((u: any) => u.role === "admin").length}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Administrators</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="spacing-3 text-center">
            <Icon icon={AlertTriangle} className="mx-auto mb-2 h-8 w-8 text-orange-600" />
            <div className="text-3xl font-bold">{users.filter((u: any) => u.status === "suspended").length}</div>
            <div className="text-sm text-[var(--fl-color-text-muted)]">Suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="spacing-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Icon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={(value: string) => setSelectedDepartment(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((dept: any) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={(value: string) => setSelectedRole(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {roles.map((role: any) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value: string) => setSelectedStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {statuses.map((status: any) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user: any) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewUser((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewUser((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: string) => setNewUser((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={newUser.department}
                onValueChange={(value: string) => setNewUser((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={!newUser.name || !newUser.email || !newUser.role}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={editingUser.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingUser((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email Address</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: string) => setEditingUser((prev) => (prev ? { ...prev, role: value } : null))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: any) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <Select
                  value={editingUser.department}
                  onValueChange={(value: string) =>
                    setEditingUser((prev) => (prev ? { ...prev, department: value } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, status: value as "active" | "inactive" | "suspended" } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status: any) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
