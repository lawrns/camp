import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();

    // Simple test query
    const { data, error } = await supabase
      .from('typing_indicators')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}