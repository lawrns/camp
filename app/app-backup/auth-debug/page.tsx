"use client";

import { useAuth } from "@/hooks/useAuth";
import { getBrowserClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";

export default function AuthDebugPage() {
  const { user, loading, isAuthenticated, error } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const supabase = getBrowserClient();
        
        // Check user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        setSupabaseUser(user);
        addLog(`Supabase getUser(): ${user ? 'User found' : 'No user'} ${userError ? `Error: ${userError.message}` : ''}`);
        
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        setSupabaseSession(session);
        addLog(`Supabase getSession(): ${session ? 'Session found' : 'No session'} ${sessionError ? `Error: ${sessionError.message}` : ''}`);
        
      } catch (error) {
        addLog(`Supabase check error: ${error}`);
      }
    };

    const checkApiAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await response.json();
        setApiResponse(data);
        addLog(`API /auth/user: ${response.status} ${response.ok ? 'Success' : 'Failed'}`);
      } catch (error) {
        addLog(`API check error: ${error}`);
      }
    };

    checkSupabaseAuth();
    checkApiAuth();
  }, []);

  const handleLogin = async () => {
    try {
      addLog("Starting login...");
      const supabase = getBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // Replace with actual test credentials
        password: 'password123'
      });
      
      if (error) {
        addLog(`Login error: ${error.message}`);
      } else {
        addLog("Login successful");
      }
    } catch (error) {
      addLog(`Login exception: ${error}`);
    }
  };

  const handleLogout = async () => {
    try {
      addLog("Starting logout...");
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        addLog(`Logout error: ${error.message}`);
      } else {
        addLog("Logout successful");
      }
    } catch (error) {
      addLog(`Logout exception: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Provider State */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Auth Provider State</h2>
          <div className="space-y-2 text-sm">
            <div>Loading: <span className={loading ? "text-yellow-600" : "text-green-600"}>{loading.toString()}</span></div>
            <div>Authenticated: <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>{isAuthenticated.toString()}</span></div>
            <div>User ID: <span className="font-mono">{user?.id || 'null'}</span></div>
            <div>User Email: <span className="font-mono">{user?.email || 'null'}</span></div>
            <div>Organization ID: <span className="font-mono">{user?.organizationId || 'null'}</span></div>
            <div>Error: <span className="text-red-600">{error?.message || 'null'}</span></div>
          </div>
        </div>

        {/* Supabase Direct State */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Supabase Direct State</h2>
          <div className="space-y-2 text-sm">
            <div>User ID: <span className="font-mono">{supabaseUser?.id || 'null'}</span></div>
            <div>User Email: <span className="font-mono">{supabaseUser?.email || 'null'}</span></div>
            <div>Session: <span className={supabaseSession ? "text-green-600" : "text-red-600"}>{supabaseSession ? 'Active' : 'None'}</span></div>
            <div>Access Token: <span className="font-mono text-xs">{supabaseSession?.access_token ? `${supabaseSession.access_token.substring(0, 20)}...` : 'null'}</span></div>
          </div>
        </div>

        {/* API Response */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">API Response</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Controls</h2>
          <div className="space-y-2">
            <button 
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Login
            </button>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Test Logout
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Debug Logs</h2>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-60 overflow-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
        <button 
          onClick={() => setLogs([])}
          className="mt-2 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
