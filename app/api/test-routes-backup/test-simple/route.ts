import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Simple test API working',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
}

export async function POST() {
  return NextResponse.json({ message: 'Simple POST test API working' });
}
