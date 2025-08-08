import { createServerClient } from '@supabase/ssr'
// Note: middleware must use @supabase/ssr directly; app code uses the consolidated factory.
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/api/widget',
  '/api/health',
  '/api/status',
  '/widget',
  '/api/webhooks',
  '/api/inngest',
  '/_next',
  '/static',
  '/favicon.ico',
  '/favicon.svg',
  '/icon.svg',
  '/auth',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/dashboard',
  '/api/conversations',
  '/api/messages',
  '/api/users',
  '/api/organizations',
];

// Widget-specific routes
const WIDGET_ROUTES = [
  '/widget',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isWidgetRoute(pathname: string): boolean {
  return WIDGET_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Performance optimization: Skip middleware for static assets
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico' ||
      pathname === '/favicon.svg' ||
      pathname === '/icon.svg') {
    return NextResponse.next();
  }

  // Skip middleware for API routes (they have their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Create Supabase client for session refresh
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Performance optimization: Only refresh session for protected routes
  let user = null;
  let authError = null;
  
  try {
    const {
      data: { user: authUser },
      error
    } = await supabase.auth.getUser()
    
    user = authUser;
    authError = error;
  } catch (err) {
    authError = err;
  }

  // Prevent redirect loops - don't redirect if already on auth pages
  const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/login');
  
  // Enhanced route handling
  const isProtectedRouteCheck = isProtectedRoute(pathname)
  const isWidgetRouteCheck = isWidgetRoute(pathname)

  // Handle widget routes with special validation
  if (isWidgetRouteCheck) {
    const orgId = request.nextUrl.searchParams.get('org')

    if (!orgId || !isValidUUID(orgId)) {
      console.log('[Middleware] Invalid widget organization ID:', orgId)
      const errorUrl = new URL('/widget-error', request.url)
      errorUrl.searchParams.set('error', 'invalid-organization')
      return NextResponse.redirect(errorUrl)
    }

    // Add widget-specific headers
    supabaseResponse.headers.set('x-widget-org-id', orgId)
    supabaseResponse.headers.set('X-Frame-Options', 'ALLOWALL') // Allow embedding

    return supabaseResponse
  }

  // Redirect unauthenticated users to login for protected routes
  if (!user && isProtectedRouteCheck && !isAuthPage) {
    console.log('[Middleware] Redirecting unauthenticated user to login')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // If there's an auth error and we're on a protected route, redirect to login
  if (authError && isProtectedRouteCheck && !isAuthPage) {
    console.log('[Middleware] Auth error, redirecting to login:', authError instanceof Error ? authError.message : 'Unknown error')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('error', 'auth-error')
    return NextResponse.redirect(url)
  }

  // Add user context headers for authenticated requests
  if (user && isProtectedRouteCheck) {
    supabaseResponse.headers.set('x-user-id', user.id)
    supabaseResponse.headers.set('x-user-role', user.user_metadata?.role || 'user')
    supabaseResponse.headers.set('x-organization-id', user.user_metadata?.organization_id || '')
  }

  // Add security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add CSP header to allow Supabase connections
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://yvntokkncxbhapqjesti.supabase.co wss://yvntokkncxbhapqjesti.supabase.co https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  supabaseResponse.headers.set('Content-Security-Policy', csp);

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};