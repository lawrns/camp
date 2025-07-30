'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForceReauthPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleForceReauth = async () => {
    setLoading(true)
    setStatus('Starting forced re-authentication...')

    try {
      // Step 1: Sign out completely
      setStatus('Step 1: Signing out...')
      const { error: signOutError } = await supabase.browser().auth.signOut()
      if (signOutError) {
        throw new Error(`Sign out failed: ${signOutError.message}`)
      }

      // Step 2: Clear all localStorage
      setStatus('Step 2: Clearing localStorage...')
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('sb-') || key.includes('auth') || key.includes('supabase'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Step 3: Sign in with test credentials
      setStatus('Step 3: Signing in with fresh credentials...')
      const { data, error: signInError } = await supabase.browser().auth.signInWithPassword({
        email: 'jam@jam.com',
        password: 'password123'
      })

      if (signInError) {
        throw new Error(`Sign in failed: ${signInError.message}`)
      }

      if (data.session) {
        setStatus('✅ SUCCESS: Fresh session created!')
        
        // Step 4: Verify tokens
        const storageKey = `sb-yvntokkncxbhapqjesti-auth-token`
        const authData = localStorage.getItem(storageKey)
        if (authData) {
          const parsed = JSON.parse(authData)
          const now = Math.floor(Date.now() / 1000)
          const expiresAt = parsed.expires_at
          const timeUntilExpiry = expiresAt - now
          
          setStatus(`✅ SUCCESS: Fresh tokens created! Expires in ${Math.floor(timeUntilExpiry / 60)} minutes`)
        }

        // Redirect to team page after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard/team'
        }, 2000)
      } else {
        throw new Error('No session returned after sign in')
      }

    } catch (error) {
      setStatus(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Force Re-Authentication</h1>
      <p className="mb-4 text-gray-600">
        This will sign out completely, clear all tokens, and sign back in with fresh credentials.
        This should resolve the expired refresh token issue.
      </p>
      
      <button
        onClick={handleForceReauth}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Processing...' : 'Force Re-Authentication'}
      </button>

      {status && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Status:</h3>
          <p className="whitespace-pre-line">{status}</p>
        </div>
      )}
    </div>
  )
}
