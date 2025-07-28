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

      // Try to get session from Authorization header first
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Create a Supabase client with the token
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (!userError && user) {
          session = {
            user,
            access_token: token,
            refresh_token: '',
            expires_at: 0,
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
      const organizationId = session.user.user_metadata?.organization_id;
      
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