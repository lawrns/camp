'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AuthExtensionBoundary } from '@/components/auth/auth-extension-boundary';
import { createIsolatedFormSubmission, initializeExtensionIsolation } from '@/lib/auth/extension-isolation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Initialize extension isolation on component mount
  useEffect(() => {
    const cleanup = initializeExtensionIsolation({
      suppressErrors: true,
      isolateFormSubmission: true,
      enableFallbackHandling: true,
    });

    return cleanup;
  }, []);

  // Create isolated registration handler that handles extension interference
  const performRegistration = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: organizationName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  // Wrap the registration handler with extension isolation
  const isolatedRegistration = createIsolatedFormSubmission(performRegistration, {
    suppressErrors: true,
    isolateFormSubmission: true,
    enableFallbackHandling: true,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await isolatedRegistration();
    } catch (err) {
      console.error('[Register] Error during registration:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthExtensionBoundary>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BrandLogo className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a confirmation link. Please check your email to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
      </AuthExtensionBoundary>
    );
  }

  return (
    <AuthExtensionBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Join Campfire</CardTitle>
          <CardDescription>
            Create your account and start providing AI-powered customer support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Enter your organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
    </AuthExtensionBoundary>
  );
}