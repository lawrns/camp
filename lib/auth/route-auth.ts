import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email: string;
}

export function withAuth(handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      let session: any = null;

      // E2E MOCK: Build session from cookies without Supabase
      if (process.env.E2E_MOCK === 'true' || process.env.NODE_ENV === 'test') {
        const cookieHeader = request.headers.get('cookie') || '';
        const cookies = cookieHeader.split(/;\s*/).map(c => c.trim());
        const authCookie = cookies.find(c => c.startsWith('sb-auth-token='));
        if (authCookie) {
          try {
            const raw = decodeURIComponent(authCookie.split('=')[1] || '');
            if (raw.startsWith('base64-')) {
              const sessionData = JSON.parse(Buffer.from(raw.substring(7), 'base64').toString());
              session = {
                user: sessionData.user || {
                  id: process.env.E2E_USER_ID || '6f9916c7-3575-4a81-b58e-624ab066bebc',
                  email: 'jam@jam.com',
                  user_metadata: { organization_id: process.env.E2E_ORG_ID || 'b5e80170-004c-4e82-a88c-3e2166b169dd' },
                },
              };
            }
          } catch {
            // ignore
          }
        }
      }

      // Try to get session from Authorization header first (skip in E2E_MOCK)
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ') && process.env.E2E_MOCK !== 'true') {
        const token = authHeader.substring(7);

        // Use centralized Supabase client
        const supabaseClient = supabase.server();

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (!userError && user) {
          session = {
            user,
            access_token: token,
            refresh_token: '',
            expiresAt: 0,
            token_type: 'bearer'
          };
        }
      }

      // If no session from Authorization header, try cookies
      if (!session) {
        try {
          const { cookies } = await import('next/headers');
          
          // Use the server client for API routes
          const cookieStore = await cookies();
          const supabaseClient = supabase.server(cookieStore);
          const { data: { session: cookieSession }, error: authError } = await supabaseClient.auth.getSession();
          
          if (!authError && cookieSession) {
            session = cookieSession;
          }
        } catch (error) {
          console.log('[Auth Wrapper] Cookie session failed:', error);
        }
      }

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
      }

      // Get user's organization context
      const organizationId = session.user.user_metadata?.organization_id || session.user.app_metadata?.organization_id;
      
      if (!organizationId) {
        return NextResponse.json({ error: 'Organization not found', code: 'ORGANIZATION_NOT_FOUND' }, { status: 400 });
      }

      const user: AuthenticatedUser = {
        userId: session.user.id,
        organizationId,
        email: session.user.email
      };

      return await handler(request, user);
    } catch (error) {
      console.error('[Auth Error]:', error);
      return NextResponse.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, { status: 500 });
    }
  };
} 