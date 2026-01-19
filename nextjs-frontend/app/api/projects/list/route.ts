import { NextResponse } from 'next/server';
import { MOCK_PROJECTS } from '../../mockData';

export async function GET() {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  console.log('[Route /api/projects/list] GET request');
  console.log('  Backend URL:', BACKEND_URL);
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/projects/list`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}, falling back to mock data`);
      throw new Error('Backend failed');
    }
    const data = await res.json();
    console.log(`  Successfully fetched ${data.projects?.length || 0} projects from backend`);
    return NextResponse.json(data);
  } catch (error) {
    console.warn(`  Backend unreachable (${BACKEND_URL}), serving mock projects.`);
    console.log(`  Returning ${MOCK_PROJECTS.length} mock projects`);
    return NextResponse.json(
      { projects: MOCK_PROJECTS },
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
