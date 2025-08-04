"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.log('[Onboarding] No session, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user's organization from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, metadata')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('[Onboarding] Profile error:', profileError);
        setError('Failed to load user profile');
        setIsLoading(false);
        return;
      }

      if (!profile.organization_id) {
        console.error('[Onboarding] No organization found for user');
        setError('No organization found. Please contact support.');
        setIsLoading(false);
        return;
      }

      setOrganizationId(profile.organization_id);

      // Check if onboarding is already completed
      if (profile.metadata?.onboarding_completed) {
        console.log('[Onboarding] Already completed, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = (data: unknown) => {
    console.log('[Onboarding] Completed with data:', data);
    // The OnboardingFlow component will handle the redirect
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading onboarding...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600">Invalid session. Please log in again.</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <OnboardingFlow
      userId={user.id}
      organizationId={organizationId}
      initialData={{
        organizationId,
        organizationName: user.user_metadata?.organization_name || '',
        userRole: 'admin'
      }}
      onComplete={handleOnboardingComplete}
    />
  );
}
