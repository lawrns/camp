import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/api/widget',
  '/api/health',
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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
  
  // Redirect unauthenticated users to login for protected routes
  if (!user && pathname.startsWith('/dashboard') && !isAuthPage) {
    console.log('[Middleware] Redirecting unauthenticated user to login')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  
  // If there's an auth error and we're on a protected route, redirect to login
  if (authError && pathname.startsWith('/dashboard') && !isAuthPage) {
    console.log('[Middleware] Auth error, redirecting to login:', authError.message)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
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