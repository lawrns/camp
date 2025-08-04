'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function TestAuthPage() {
  const { user, isLoading, isAuthenticated, error, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('jam@jam.com');
  const [password, setPassword] = useState('password123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setLoginError(result.error || 'Login failed');
      }
    } catch (err) {
      setLoginError('Login error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const testSessionPersistence = () => {
    window.location.reload();
  };

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Authentication Test Page
        </h1>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-32">Loading:</span>
              <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                {isLoading ? '⏳ Yes' : '✅ No'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-32">Authenticated:</span>
              <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-32">Error:</span>
              <span className={error ? 'text-red-600' : 'text-green-600'}>
                {error ? `❌ ${error.message}` : '✅ None'}
              </span>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <div><span className="font-medium">ID:</span> {user.id}</div>
              <div><span className="font-medium">Email:</span> {user.email}</div>
              <div><span className="font-medium">Organization ID:</span> {user.organizationId || 'None'}</div>
              <div><span className="font-medium">Role:</span> {user.organizationRole || 'None'}</div>
              <div><span className="font-medium">Created:</span> {user.createdAt}</div>
              <div><span className="font-medium">Last Sign In:</span> {user.lastSignInAt}</div>
            </div>
          </div>
        )}

        {/* Login Form */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {loginError && (
                <div className="text-red-600 text-sm">{loginError}</div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loginLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        )}

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-3">
            <button
              onClick={testSessionPersistence}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              🔄 Test Session Persistence (Reload Page)
            </button>
            
            <button
              onClick={clearStorage}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700"
            >
              🗑️ Clear Storage & Reload
            </button>
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                🚪 Logout
              </button>
            )}
            
            <button
              onClick={() => window.open('/dashboard', '_blank')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
            >
              🆕 Open Dashboard in New Tab
            </button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Storage Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">localStorage keys:</span>
              <div className="ml-4 text-gray-600">
                {typeof window !== 'undefined' 
                  ? Object.keys(localStorage).filter(key => 
                      key.includes('auth') || key.includes('supabase') || key.includes('campfire')
                    ).join(', ') || 'None'
                  : 'Loading...'
                }
              </div>
            </div>
            <div>
              <span className="font-medium">sessionStorage keys:</span>
              <div className="ml-4 text-gray-600">
                {typeof window !== 'undefined' 
                  ? Object.keys(sessionStorage).filter(key => 
                      key.includes('auth') || key.includes('supabase') || key.includes('campfire')
                    ).join(', ') || 'None'
                  : 'Loading...'
                }
              </div>
            </div>
            <div>
              <span className="font-medium">Cookies:</span>
              <div className="ml-4 text-gray-600 break-all">
                {typeof window !== 'undefined' 
                  ? document.cookie || 'None'
                  : 'Loading...'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
