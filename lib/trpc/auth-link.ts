/**
 * tRPC Auth Link with automatic token refresh and retry logic
 * Handles 401 errors by refreshing tokens and retrying requests
 */

import { TRPCLink, TRPCClientError } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import type { AppRouter } from '@/trpc/root'
import { useAuthStore, getValidToken } from '@/lib/auth/auth-store'

// Helper to check if error is unauthorized
const isUnauthorizedError = (error: unknown): boolean => {
  if (error instanceof TRPCClientError) {
    return error.data?.httpStatus === 401 || error.data?.code === 'UNAUTHORIZED'
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as any).message?.toLowerCase() || ''
    return message.includes('unauthorized') || message.includes('401')
  }
  
  return false
}

export const authLink: TRPCLink<AppRouter> = () => {
  console.log('[AuthLink] AuthLink factory called')
  return ({ next, op }) => {
    console.log('[AuthLink] AuthLink middleware called for operation:', op.type, op.path)
    return observable((observer) => {
      let retryCount = 0
      const maxRetries = 1

      const executeRequest = async () => {
        try {
          console.log('[AuthLink] Starting request execution...')

          // Get auth store state
          const { session, refreshing, initialized } = useAuthStore.getState()
          console.log('[AuthLink] Auth store state:', {
            hasSession: !!session,
            hasAccessToken: !!session?.access_token,
            refreshing,
            initialized,
            tokenPreview: session?.access_token ? `${session.access_token.substring(0, 30)}...` : 'none'
          })

          // Get valid token (with automatic refresh if needed)
          const token = await getValidToken()
          console.log('[AuthLink] getValidToken result:', token ? `${token.substring(0, 30)}...` : 'none')

          // Add authorization header if we have a token
          if (token) {
            op.context = {
              ...op.context,
              headers: {
                ...op.context.headers,
                authorization: `Bearer ${token}`
              }
            }
            console.log('[AuthLink] Added authorization header')
          } else {
            // Remove authorization header if no token
            const { authorization, ...headers } = (op.context.headers || {}) as any
            op.context = {
              ...op.context,
              headers
            }
            console.log('[AuthLink] No token available, removed authorization header')
          }

          console.log('[AuthLink] Final headers:', op.context.headers)

          // Execute the request
          const subscription = next(op).subscribe({
            next: (result) => {
              observer.next(result)
            },
            error: async (error) => {
              console.log('[AuthLink] Request error:', {
                error: error.message,
                isUnauthorized: isUnauthorizedError(error),
                retryCount,
                maxRetries
              })

              // Check if it's an unauthorized error and we haven't exceeded retry limit
              if (isUnauthorizedError(error) && retryCount < maxRetries) {
                retryCount++
                console.log('[AuthLink] 401 error detected, attempting token refresh and retry...')

                try {
                  // Force refresh the session
                  const { refresh } = useAuthStore.getState()
                  const refreshed = await refresh()

                  if (refreshed) {
                    console.log('[AuthLink] Token refreshed successfully, retrying request...')
                    // Retry the request after a short delay
                    setTimeout(() => executeRequest(), 500)
                    return
                  } else {
                    console.warn('[AuthLink] Token refresh failed, cannot retry')
                  }
                } catch (refreshError) {
                  console.error('[AuthLink] Token refresh error:', refreshError)
                }
              }

              // If we can't retry or refresh failed, pass through the error
              observer.error(error)
            },
            complete: () => {
              observer.complete()
            }
          })

          return subscription
        } catch (error) {
          console.error('[AuthLink] Unexpected error:', error)
          observer.error(error)
        }
      }

      executeRequest()
    })
  }
}

// Alternative simpler version for testing
export const simpleAuthLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const executeWithAuth = async () => {
        // Get current session from store
        const { session } = useAuthStore.getState()
        
        if (session?.access_token) {
          op.context = {
            ...op.context,
            headers: {
              ...op.context.headers,
              authorization: `Bearer ${session.access_token}`
            }
          }
        }

        return next(op).subscribe(observer)
      }

      executeWithAuth()
    })
  }
}
