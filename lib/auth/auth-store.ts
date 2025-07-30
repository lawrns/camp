/**
 * Central auth store with guarded refresh logic
 * Prevents race conditions and provides single source of truth for session state
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  refreshing: boolean
  initialized: boolean
  error: string | null
}

interface AuthActions {
  setSession: (session: Session | null) => void
  refresh: () => Promise<boolean>
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

// Global refresh promise to prevent concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    session: null,
    user: null,
    refreshing: false,
    initialized: false,
    error: null,

    // Actions
    setSession: (session) => {
      set({
        session,
        user: session?.user || null,
        error: null
      })
    },

    refresh: async () => {
      // Return existing promise if refresh is already in progress
      if (refreshPromise) {
        return refreshPromise
      }

      const state = get()
      if (state.refreshing) {
        return false
      }

      set({ refreshing: true, error: null })

      refreshPromise = (async () => {
        try {
          console.log('[AuthStore] Starting session refresh...')
          
          const supabaseClient = supabase.browser()
          const { data, error } = await supabaseClient.auth.refreshSession()

          if (error) {
            console.warn('[AuthStore] Refresh failed:', error.message)
            
            // If refresh fails, try to get current session
            const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()
            
            if (sessionError || !sessionData.session) {
              console.error('[AuthStore] No valid session found, user needs to re-authenticate')
              set({ 
                session: null, 
                user: null, 
                refreshing: false,
                error: 'Session expired. Please sign in again.'
              })
              return false
            }

            // Use current session if available
            set({
              session: sessionData.session,
              user: sessionData.session.user,
              refreshing: false,
              error: null
            })
            return true
          }

          if (data.session) {
            console.log('[AuthStore] Session refreshed successfully')
            set({
              session: data.session,
              user: data.session.user,
              refreshing: false,
              error: null
            })
            return true
          }

          set({ 
            refreshing: false,
            error: 'Failed to refresh session'
          })
          return false

        } catch (error) {
          console.error('[AuthStore] Refresh error:', error)
          set({ 
            refreshing: false,
            error: error instanceof Error ? error.message : 'Unknown refresh error'
          })
          return false
        } finally {
          refreshPromise = null
        }
      })()

      return refreshPromise
    },

    initialize: async () => {
      if (get().initialized) return

      console.log('[AuthStore] Initializing auth state...')
      
      try {
        const supabaseClient = supabase.browser()
        
        // Get current session
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          console.warn('[AuthStore] Failed to get initial session:', error.message)
        }

        set({
          session,
          user: session?.user || null,
          initialized: true,
          error: error?.message || null
        })

        // Set up auth state change listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthStore] Auth state change:', event, !!session)
            
            set({
              session,
              user: session?.user || null,
              error: null
            })

            // If session was refreshed, we don't need to call refresh again
            if (event === 'TOKEN_REFRESHED') {
              set({ refreshing: false })
            }
          }
        )

        // Store subscription for cleanup (if needed)
        ;(window as any).__supabaseAuthSubscription = subscription

      } catch (error) {
        console.error('[AuthStore] Initialization error:', error)
        set({
          initialized: true,
          error: error instanceof Error ? error.message : 'Initialization failed'
        })
      }
    },

    signOut: async () => {
      try {
        const supabaseClient = supabase.browser()
        await supabaseClient.auth.signOut()
        
        set({
          session: null,
          user: null,
          refreshing: false,
          error: null
        })
      } catch (error) {
        console.error('[AuthStore] Sign out error:', error)
        set({
          error: error instanceof Error ? error.message : 'Sign out failed'
        })
      }
    },

    clearError: () => {
      set({ error: null })
    }
  }))
)

// Helper to check if current token is expired or about to expire
export const isTokenExpired = (session: Session | null): boolean => {
  if (!session?.expires_at) return true
  
  const now = Math.floor(Date.now() / 1000)
  const buffer = 60 // 1 minute buffer
  
  return session.expires_at - buffer <= now
}

// Helper to get valid token (with automatic refresh if needed)
export const getValidToken = async (): Promise<string | null> => {
  const { session, refresh } = useAuthStore.getState()
  
  if (!session) return null
  
  if (isTokenExpired(session)) {
    console.log('[AuthStore] Token expired, refreshing...')
    const refreshed = await refresh()
    if (!refreshed) return null
    
    return useAuthStore.getState().session?.access_token || null
  }
  
  return session.access_token
}
