import { NextResponse } from 'next/server';


export async function GET() {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/projects/periods] GET request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/projects/periods`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}`);
      return NextResponse.json(
        { error: `Backend failed with status ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    console.log(`  Successfully fetched ${data.periods?.length || 0} periods from backend`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`  Backend unreachable (${BACKEND_URL}) or other error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch periods from backend' },
      { status: 500 }
    );
  }
}
