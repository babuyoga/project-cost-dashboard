import { NextResponse } from 'next/server';
import { MOCK_PERIODS } from '../../mockData';

export async function GET() {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/projects/periods] GET request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const res = await fetch(`${BACKEND_URL}/projects/periods`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}, falling back to mock data`);
      throw new Error('Backend failed');
    }
    const data = await res.json();
    console.log(`  Successfully fetched ${data.periods?.length || 0} periods from backend`);
    return NextResponse.json(data);
  } catch (error) {
    console.warn(`  Backend unreachable (${BACKEND_URL}), serving mock periods.`);
    console.log(`  Returning ${MOCK_PERIODS.length} mock periods`);
    return NextResponse.json(
      { periods: MOCK_PERIODS },
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
