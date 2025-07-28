"use client";

import { getBrowserClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AuthTest() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getBrowserClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError((error instanceof Error ? error.message : String(error)));
        } else {
          setUser(session?.user || null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignIn = async () => {
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/dashboard`
        }
      });

      if (error) {
        setError((error instanceof Error ? error.message : String(error)));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTestSignIn = async () => {
    try {
      const supabase = getBrowserClient();
      // For testing, we can also try email/password auth
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });

      if (error) {
        setError(`Test login failed: ${(error instanceof Error ? error.message : String(error))}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError((error instanceof Error ? error.message : String(error)));
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" data-testid="error-message">
          Error: {error}
        </div>
      )}

      {user ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="font-semibold">Authenticated!</h2>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <h2 className="font-semibold" data-testid="user-status">Not authenticated</h2>
          <div className="mt-2 space-x-2">
            <button
              onClick={handleSignIn}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Sign In
            </button>
            <button
              onClick={handleTestSignIn}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Test Sign In
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
        <p className="text-sm text-gray-600">
          This page tests the Supabase authentication connection.
        </p>
      </div>
    </div>
  );
}
