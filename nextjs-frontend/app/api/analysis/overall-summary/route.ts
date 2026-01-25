import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/analysis/overall-summary] POST request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('  Request body:', body);
    
    const res = await fetch(`${BACKEND_URL}/api/analysis/overall-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}`);
      return NextResponse.json(
        { error: `Backend failed with status ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    console.log(`  Successfully fetched overall summary: ${data.length} projects`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`  Backend unreachable (${BACKEND_URL}) or other error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch overall summary from backend' },
      { status: 500 }
    );
  }
}
