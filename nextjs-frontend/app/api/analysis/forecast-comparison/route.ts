import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/analysis/forecast-comparison] POST request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('  Request body:', body);
    
    const res = await fetch(`${BACKEND_URL}/api/analysis/forecast-comparison`, {
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
    const numProjects = Object.keys(data.projects || {}).length;
    console.log(`  Successfully fetched forecast comparison for ${numProjects} project(s)`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`  Backend unreachable (${BACKEND_URL}) or other error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch forecast comparison from backend' },
      { status: 500 }
    );
  }
}
