"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Check if token is valid (simple validation)
  const isValidToken = token && token.length > 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidToken) {
      setError("Invalid or expired token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate password reset
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 spacing-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader>
              <h1 className="heading-center text-2xl font-bold">Invalid Token</h1>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-red-600">Invalid or expired token</p>
              <p className="text-sm text-gray-600">The password reset link is invalid or has expired.</p>
              <Link
                href="/forgot-password"
                className="hover:text-status-info-dark inline-block font-medium text-blue-600"
              >
                Request a new reset link
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 spacing-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader>
              <h1 className="text-semantic-success-dark heading-center text-2xl font-bold">Success!</h1>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p>Your password has been reset successfully.</p>
              <Link
                href="/login"
                className="inline-block rounded-ds-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 spacing-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <h2 className="heading-center text-xl font-semibold">New Password</h2>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="hover:text-status-info-dark text-sm text-blue-600">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
