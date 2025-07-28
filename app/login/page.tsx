'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCampfireClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AuthExtensionBoundary } from '@/components/auth/auth-extension-boundary';
import { createIsolatedFormSubmission, initializeExtensionIsolation } from '@/lib/auth/extension-isolation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabaseClient = createCampfireClient();

  // Initialize extension isolation on component mount
  useEffect(() => {
    const cleanup = initializeExtensionIsolation({
      suppressErrors: true,
      isolateFormSubmission: true,
      enableFallbackHandling: true,
    });

    return cleanup;
  }, []);

  // Create isolated login handler that handles extension interference
  const performLogin = async () => {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  // Wrap the login handler with extension isolation
  const isolatedLogin = createIsolatedFormSubmission(performLogin, {
    suppressErrors: true,
    isolateFormSubmission: true,
    enableFallbackHandling: true,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await isolatedLogin();
    } catch (err) {
      console.error('[Login] Error during authentication:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthExtensionBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Campfire</CardTitle>
          <CardDescription>
            Sign in to your account to access the AI-powered support platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <a href="/register" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
    </AuthExtensionBoundary>
  );
}