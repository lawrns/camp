import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handoverOrchestrator } from '@/lib/ai/HandoverOrchestrator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: organizationId } = params;
    const body = await request.json();
    const { conversationId, handoverId } = body || {};

    if (!organizationId || !conversationId) {
      return NextResponse.json(
        { error: 'organizationId and conversationId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await handoverOrchestrator.stop({ conversationId, organizationId, handoverId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
