import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/app/api/config';

export async function POST(request: NextRequest) {
  console.log('='.repeat(60));
  console.log('[Route /api/chat] POST request');
  console.log('  Backend URL:', BACKEND_URL);

  try {
    const body = await request.json();

    console.log('  user_input:', (body.user_input || '').slice(0, 100));
    console.log('  system_prompt length:', (body.system_prompt || '').length, 'chars');
    console.log('  system_prompt preview:', (body.system_prompt || '').slice(0, 200));

    if (!body.system_prompt || body.system_prompt.length < 50) {
      console.warn('  ⚠ WARNING: system_prompt is empty or very short!');
    }

    console.log(`  Forwarding to ${BACKEND_URL}/api/chat ...`);
    const startTime = Date.now();

    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const elapsed = Date.now() - startTime;
    console.log(`  Response received in ${elapsed}ms, status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ✗ Backend error (${res.status}):`, errText.slice(0, 500));
      try {
        const errData = JSON.parse(errText);
        return NextResponse.json(
          { error: errData.detail || `Backend failed with status ${res.status}` },
          { status: res.status },
        );
      } catch {
        return NextResponse.json(
          { error: `Backend failed with status ${res.status}: ${errText.slice(0, 200)}` },
          { status: res.status },
        );
      }
    }

    const data = await res.json();
    console.log(`  ✓ Chat response received (${data.answer?.length || 0} chars)`);
    console.log(`  Answer preview: ${(data.answer || '').slice(0, 200)}`);
    console.log('='.repeat(60));
    return NextResponse.json(data);
  } catch (error) {
    console.error(`  ✗ Backend unreachable or error:`, error);
    return NextResponse.json(
      { error: 'Failed to reach AI chat service' },
      { status: 500 },
    );
  }
}
