import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * GET /api/users/agents
 * 
 * Returns all users with agent role
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Get all users with agent role
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .eq('role', 'agent')
      .order('name');

    if (error) {
      console.error('Failed to fetch agents:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      agents: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in agents endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
