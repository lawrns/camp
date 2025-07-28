'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/core/auth-provider';
import { supabaseClient } from '@/lib/supabase/client';

export default function AuthTestPage() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleSignIn = () => {
    // Redirect to actual login page
    window.location.href = '/login';
  };

  const handleTestSignIn = async () => {
    setIsTestLoading(true);
    setError(null);
    
    try {
      // This is intentionally a test that should fail
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: 'test@invalid.com',
        password: 'invalid'
      });
      
      if (error) {
        setError('Test login failed: ' + error.message);
      }
    } catch (err) {
      setError('Test login failed');
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Authentication Test
        </h1>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* User Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User Status:
              </label>
              <div 
                data-testid="user-status" 
                className="mt-1 text-sm text-gray-900"
              >
                {loading ? 'Loading...' : user ? `Authenticated as ${user.email}` : 'Not authenticated'}
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </button>

            {/* Test Sign In Button */}
            <button
              onClick={handleTestSignIn}
              disabled={isTestLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isTestLoading ? 'Testing...' : 'Test Sign In'}
            </button>

            {/* Error Message */}
            {error && (
              <div 
                data-testid="error-message"
                className="rounded-md bg-red-50 p-4"
              >
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}