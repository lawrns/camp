import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Working test API', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}
