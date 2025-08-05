"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Buildings as Building, CheckCircle, Spinner as Loader2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Icon } from "@/lib/ui/Icon";

interface InvitationData {
  id: string;
  organizationName: string;
  organizationId: string;
  inviterName: string;
  role: string;
  email: string;
  status: "pending" | "expired" | "accepted";
  expiresAt: string;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const orgId = searchParams.get("org");

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (token && orgId) {
      loadInvitation();
    } else {
      setError("Invalid invitation link");
      setIsLoading(false);
    }
  }, [token, orgId]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/validate?token=${token}&org=${orgId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load invitation");
      }

      setInvitation(data.invitation);
    } catch (error) {
      setError(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to load invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    // Validate user info
    if (!userInfo.firstName.trim() || !userInfo.lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    if (userInfo.password !== userInfo.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (userInfo.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsAccepting(true);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          organizationId: orgId,
          userInfo: {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            email: invitation.email,
            password: userInfo.password,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      toast.success("Invitation accepted successfully!");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center spacing-8">
            <Icon icon={Loader2} className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Icon icon={XCircle} className="text-brand-mahogany-500 mx-auto mb-4 h-12 w-12" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error || "This invitation link is invalid or has expired."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Icon icon={XCircle} className="text-semantic-warning mx-auto mb-4 h-12 w-12" />
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired. Please contact {invitation.inviterName} for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Icon icon={CheckCircle} className="text-semantic-success mx-auto mb-4 h-12 w-12" />
            <CardTitle>Already Accepted</CardTitle>
            <CardDescription>
              You have already accepted this invitation. You can now log in to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)] px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Icon icon={Users} className="mx-auto mb-4 h-12 w-12 text-blue-600" />
          <CardTitle>Join {invitation.organizationName}</CardTitle>
          <CardDescription>
            {invitation.inviterName} has invited you to join {invitation.organizationName} as a {invitation.role}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-4">
            <div className="flex items-center gap-3">
              <Icon icon={Building} className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">{invitation.organizationName}</p>
                <p className="text-status-info-dark text-sm">Role: {invitation.role}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userInfo.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserInfo((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userInfo.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserInfo((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-[var(--fl-color-background-subtle)]"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={userInfo.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserInfo((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Create a secure password"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={userInfo.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserInfo((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <Button onClick={handleAcceptInvitation} disabled={isAccepting} className="w-full">
            {isAccepting ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Accepting Invitation...
              </>
            ) : (
              "Accept Invitation & Create Account"
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-medium text-blue-600 hover:text-[var(--fl-color-info)]"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
