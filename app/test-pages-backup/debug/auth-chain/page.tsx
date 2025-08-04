'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/auth/auth-store'

export default function AuthChainDebugPage() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  
  const authStore = useAuthStore()

  const runDiagnostics = async () => {
    setLoading(true)
    const diagnostics: Record<string, any> = {}

    try {
      // 1. Check Supabase session directly
      console.log('[Debug] Step 1: Checking Supabase session...')
      const { data: { session }, error } = await supabase.browser().auth.getSession()
      diagnostics.supabaseSession = {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        expiresAt: session?.expiresAt,
        currentTime: Math.floor(Date.now() / 1000),
        isExpired: session?.expiresAt ? session.expiresAt < Math.floor(Date.now() / 1000) : 'unknown',
        tokenPreview: session?.access_token ? `${session.access_token.substring(0, 30)}...` : 'none',
        error: error?.message
      }

      // 2. Check auth store state
      console.log('[Debug] Step 2: Checking auth store state...')
      diagnostics.authStore = {
        hasSession: !!authStore.session,
        hasAccessToken: !!authStore.session?.access_token,
        refreshing: authStore.refreshing,
        initialized: authStore.initialized,
        error: authStore.error,
        tokenPreview: authStore.session?.access_token ? `${authStore.session.access_token.substring(0, 30)}...` : 'none'
      }

      // 3. Check localStorage
      console.log('[Debug] Step 3: Checking localStorage...')
      const storageKey = `sb-yvntokkncxbhapqjesti-auth-token`
      const authData = localStorage.getItem(storageKey)
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          diagnostics.localStorage = {
            hasData: true,
            hasAccessToken: !!parsed.access_token,
            expiresAt: parsed.expiresAt,
            isExpired: parsed.expiresAt ? parsed.expiresAt < Math.floor(Date.now() / 1000) : 'unknown',
            tokenPreview: parsed.access_token ? `${parsed.access_token.substring(0, 30)}...` : 'none'
          }
        } catch (e) {
          diagnostics.localStorage = { hasData: true, parseError: e.message }
        }
      } else {
        diagnostics.localStorage = { hasData: false }
      }

      // 4. Test manual fetch to tRPC endpoint
      console.log('[Debug] Step 4: Testing manual fetch to tRPC...')
      try {
        const token = authStore.session?.access_token
        const response = await fetch('/api/trpc/mailbox.members.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        diagnostics.manualFetch = {
          status: response.status,
          statusText: response.statusText,
          hasAuthHeader: !!token,
          tokenPreview: token ? `${token.substring(0, 30)}...` : 'none'
        }
      } catch (error: unknown) {
        diagnostics.manualFetch = {
          error: error.message
        }
      }

      // 5. Test auth store refresh manually
      console.log('[Debug] Step 5: Testing auth store refresh...')
      try {
        const refreshResult = await authStore.refresh()
        diagnostics.authStoreRefresh = {
          success: refreshResult,
          newTokenPreview: authStore.session?.access_token ? `${authStore.session.access_token.substring(0, 30)}...` : 'none'
        }
      } catch (error: unknown) {
        diagnostics.authStoreRefresh = {
          success: false,
          error: error.message
        }
      }

      setResults(diagnostics)
    } catch (error: unknown) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-run diagnostics on mount
    runDiagnostics()
  }, [])

  const decodeJWT = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        exp: payload.exp,
        iat: payload.iat,
        sub: payload.sub,
        email: payload.email,
        isExpired: payload.exp < Math.floor(Date.now() / 1000)
      }
    } catch (e) {
      return { error: 'Invalid JWT' }
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Auth Chain Diagnostics</h1>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-6"
      >
        {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-lg mb-2">{key}</h3>
              <pre className="text-sm overflow-auto bg-white p-2 rounded">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-yellow-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Manual JWT Decoder</h3>
        <p className="text-sm mb-2">Paste a JWT token to decode it:</p>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Paste JWT token here..."
          onChange={(e) => {
            if (e.target.value) {
              const decoded = decodeJWT(e.target.value)
              console.log('Decoded JWT:', decoded)
            }
          }}
        />
      </div>

      <div className="mt-6 bg-blue-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Network Tab Instructions</h3>
        <ol className="text-sm space-y-1">
          <li>1. Open DevTools → Network tab</li>
          <li>2. Click &quot;Run Diagnostics&quot; above</li>
          <li>3. Look for the tRPC batch request</li>
          <li>4. Check Request Headers for &quot;Authorization&quot;</li>
          <li>5. Copy the JWT and paste in the decoder above</li>
        </ol>
      </div>
    </div>
  )
}
