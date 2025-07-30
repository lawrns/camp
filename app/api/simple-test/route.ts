import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Very simple test API working', 
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
}
