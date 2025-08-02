"use client";

import React from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<{
    email?: string;
  }>({});

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const validateForm = () => {
    const errors: { email?: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await resetPassword(email);
      if (success) {
        setIsSubmitted(true);
      }
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - show confirmation
  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-ds-full bg-[var(--fl-color-success-subtle)]">
            <svg className="text-semantic-success-dark h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900">Email sent!</h3>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-600">Click the link in the email to reset your password.</p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => setIsSubmitted(false)} variant="outline" className="w-full">
              Try another email
            </Button>
            <Link
              href="/login"
              className="block w-full text-center text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <>
      {/* Error Display */}
      {error && (
        <Alert variant="error" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-medium text-gray-700">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="border-[var(--fl-color-border)] bg-white text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-brand-500"
            placeholder="you@company.com"
            required
            disabled={isLoading}
          />
          {validationErrors.email && <p className="text-sm text-red-600">{validationErrors.email}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-brand-500 to-brand-600 font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-600 hover:to-brand-700 hover:shadow-xl"
          disabled={isLoading}
        >
          {isLoading ? "Sending reset link..." : "Send reset link"}
        </Button>
      </form>
    </>
  );
}
