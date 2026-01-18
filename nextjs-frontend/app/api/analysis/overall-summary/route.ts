import { NextRequest, NextResponse } from 'next/server';
import { MOCK_OVERALL_SUMMARY } from '../../mockData';

export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/analysis/overall-summary] POST request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('  Request body:', body);
    
    const res = await fetch(`${BACKEND_URL}/analysis/overall-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}, falling back to mock data`);
      throw new Error('Backend failed');
    }
    const data = await res.json();
    console.log(`  Successfully fetched overall summary: ${data.length} projects`);
    return NextResponse.json(data);
  } catch (error) {
    console.warn(`  Backend unreachable (${BACKEND_URL}), serving mock overall summary.`);
    console.log(`  Returning ${MOCK_OVERALL_SUMMARY.length} mock projects`);
    return NextResponse.json(
      MOCK_OVERALL_SUMMARY,
      { 
        status: 200, 
        headers: { 
          'x-mock-data': 'true', 
          'x-api-url': BACKEND_URL 
        } 
      }
    );
  }
}
