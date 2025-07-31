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
      if (typeof value === 'string' && value.startsWith('base64-')) {
        try {
          const base64Content = value.substring(7); // Remove 'base64-' prefix
          const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
          value = decoded; // Keep as string, let Supabase parse it
        } catch (error) {
          console.warn('[Onboarding API] Failed to decode base64 cookie:', name, error);
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
            console.warn('[Onboarding API] Failed to decode base64 cookie:', cookie.name, error);
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
      console.log('[Onboarding API] Starting authentication...');
      
      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = createCompatibleCookieStore();
      const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

      // Require authentication for onboarding endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
      
      if (authError || !session) {
        console.log('[Onboarding API] Authentication failed');
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
      console.error('[Onboarding API Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.userId;
    const organizationId = searchParams.get('organizationId') || user.organizationId;

    console.log('[Onboarding API] Getting progress for:', { userId, organizationId });

    // Check if onboarding is already completed
    const supabaseClient = supabase.admin();
    const { data: tracking, error } = await supabaseClient
      .from('onboarding_completion_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Onboarding API] Error checking completion:', error);
      return NextResponse.json({ error: 'Failed to check onboarding status' }, { status: 500 });
    }

    if (tracking && tracking.completed_at) {
      return NextResponse.json({
        completed: true,
        completedAt: tracking.completed_at,
        progress: null
      });
    }

    // Return progress (for now, we'll implement progress tracking later)
    return NextResponse.json({
      completed: false,
      progress: {
        currentStep: 0,
        data: {}
      }
    });

  } catch (error) {
    console.error('[Onboarding API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { userId, organizationId, currentStep, data } = body;

    console.log('[Onboarding API] Saving progress:', { userId, organizationId, currentStep });

    // For now, we'll just return success
    // In a full implementation, you'd save progress to a separate table
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Onboarding API] Save progress error:', error);
    return NextResponse.json(
      { error: 'Failed to save progress', code: 'SAVE_ERROR' },
      { status: 500 }
    );
  }
});
