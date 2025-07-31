import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Custom cookie parser that handles both base64 and JSON formats
function createCompatibleCookieStore() {
  const cookieStore = cookies();
  
  return {
    get: (name: string) => {
      const cookie = cookieStore.get(name);
      if (!cookie) return undefined;
      
      let value = cookie.value;
      
      // Handle base64-encoded cookies
      if (typeof value === 'string' && value.startsWith('base64-') ) {
        try {
          const base64Content = value.substring(7); // Remove 'base64-' prefix
          const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
          value = decoded; // Keep as string, let Supabase parse it
        } catch (error) {
          console.warn('[Onboarding Complete API] Failed to decode base64 cookie:', name, error);
          return undefined;
        }
      }
      
      return { name: cookie.name, value };
    },
    getAll: () => {
      return cookieStore.getAll().map(cookie => {
        let value = cookie.value;
        
        // Handle base64-encoded cookies
        if (typeof value === 'string' && value.startsWith('base64-')) {
          try {
            const base64Content = value.substring(7);
            const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
            value = decoded; // Keep as string, let Supabase parse it
          } catch (error) {
            console.warn('[Onboarding Complete API] Failed to decode base64 cookie:', cookie.name, error);
          }
        }
        
        return { ...cookie, value };
      });
    },
    set: cookieStore.set?.bind(cookieStore),
    delete: cookieStore.delete?.bind(cookieStore)
  };
}

// Authentication wrapper for onboarding endpoints
function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      console.log('[Onboarding Complete API] Starting authentication...');
      
      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = createCompatibleCookieStore();
      const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

      // Require authentication for onboarding endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
      
      if (authError || !session) {
        console.log('[Onboarding Complete API] Authentication failed');
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization
      const organizationId = session.user.user_metadata?.organization_id;
      
      const user = {
        userId: session.user.id,
        organizationId,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email
      };

      const result = await handler(request, user);
      return result;
    } catch (error) {
      console.error('[Onboarding Complete API Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { userId, organizationId, data } = body;

    console.log('[Onboarding Complete API] Completing onboarding for:', { userId, organizationId });

    const supabaseClient = supabase.admin();

    // Update the onboarding completion tracking
    const { error: updateError } = await supabaseClient
      .from('onboarding_completion_tracking')
      .update({ 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('[Onboarding Complete API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete onboarding', details: updateError },
        { status: 500 }
      );
    }

    // Update user profile to mark onboarding as complete
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        metadata: { onboarding_completed: true },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.warn('[Onboarding Complete API] Profile update warning:', profileError);
      // Don't fail the request for profile update issues
    }

    console.log('[Onboarding Complete API] Onboarding completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Onboarding Complete API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
