"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/lib/ui/Icon";
import { useAuthUser, useOrganization } from "@/store/selectors";
import {
  CaretDown as ChevronDown,
  CreditCard,
  Question as HelpCircle,
  Spinner as Loader2,
  SignOut as LogOut,
  Gear as Settings,
  Shield,
  User,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  avatar_url: string | null;
  two_factor_enabled: boolean;
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
}

export function ProfileDropdown() {
  const user = useAuthUser();
  const organization = useOrganization();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const supabaseClient = supabase.browser();
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch profile if user is authenticated
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    // Double-check authentication before making request
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/users/profile");

      if (response.status === 401) {
        // Handle unauthorized - redirect to login
        toast({
          title: "Session expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data.profile);
      setRole(data.role);
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;

      // Clear any local storage
      localStorage.removeItem("campfire-session");

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });

      router.push("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word: unknown) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Icon icon={Loader2} className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-ds-2 px-2" data-testid="user-menu">
          <Avatar className="user-avatar h-8 w-8">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url!} />}
            <AvatarFallback className="bg-primary/10">{getInitials(profile.fullName || profile.email)}</AvatarFallback>
          </Avatar>
          <div className="flex max-w-[150px] flex-col items-start text-left">
            <span className="w-full truncate text-sm font-medium">{profile.fullName || "User"}</span>
            {organization && (
              <span
                className="organization-name w-full truncate text-tiny text-muted-foreground"
                data-testid="org-name"
              >
                {organization.name}
              </span>
            )}
          </div>
          <Icon icon={ChevronDown} className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[250px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.fullName || "User"}</p>
            <p className="text-tiny leading-none text-muted-foreground">{profile.email}</p>
            {role && (
              <Badge variant="secondary" className="mt-1 w-fit">
                {role}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <Icon icon={User} className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Icon icon={Settings} className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings/security")}>
          <Icon icon={Shield} className="mr-2 h-4 w-4" />
          <span>Security</span>
          {profile.two_factor_enabled && (
            <Badge variant="outline" className="ml-auto">
              2FA
            </Badge>
          )}
        </DropdownMenuItem>

        {organization && (
          <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
            <Icon icon={CreditCard} className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/help")}>
          <Icon icon={HelpCircle} className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-red-600" data-testid="logout-button">
          <Icon icon={LogOut} className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
