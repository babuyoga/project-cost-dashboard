import { NextRequest, NextResponse } from 'next/server';
import { MOCK_FORECAST_COMPARISON } from '../../mockData';

export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/analysis/forecast-comparison] POST request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('  Request body:', body);
    
    const res = await fetch(`${BACKEND_URL}/analysis/forecast-comparison`, {
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
    const numProjects = Object.keys(data.projects || {}).length;
    console.log(`  Successfully fetched forecast comparison for ${numProjects} project(s)`);
    return NextResponse.json(data);
  } catch (error) {
    console.warn(`  Backend unreachable (${BACKEND_URL}), serving mock forecast comparison.`);
    const numMockProjects = Object.keys(MOCK_FORECAST_COMPARISON.projects || {}).length;
    console.log(`  Returning mock data for ${numMockProjects} project(s)`);
    return NextResponse.json(
      MOCK_FORECAST_COMPARISON,
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
