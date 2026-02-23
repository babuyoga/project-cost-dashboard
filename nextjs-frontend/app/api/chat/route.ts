import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/app/api/config';

export async function POST(request: NextRequest) {
  console.log('[Route /api/chat] POST request');

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}`);
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || `Backend failed with status ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    console.log(`  Chat response received (${data.answer?.length || 0} chars)`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`  Backend unreachable or error:`, error);
    return NextResponse.json(
      { error: 'Failed to reach AI chat service' },
      { status: 500 },
    );
  }
}
