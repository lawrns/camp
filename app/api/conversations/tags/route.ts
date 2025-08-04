import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * GET /api/conversations/tags
 * 
 * Returns all unique tags from conversations
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Get all non-null tags from conversations
    const { data, error } = await supabase
      .from('conversations')
      .select('tags')
      .not('tags', 'is', null);

    if (error) {
      console.error('Failed to fetch conversation tags:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    // Extract unique tags from the results
    const allTags = data?.flatMap(row => row.tags || []) || [];
    const uniqueTags = [...new Set(allTags)].sort();

    return NextResponse.json({
      tags: uniqueTags,
      count: uniqueTags.length
    });

  } catch (error) {
    console.error('Unexpected error in tags endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
