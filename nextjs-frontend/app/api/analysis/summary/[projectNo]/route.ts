import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectNo: string }> }
) {
  const BACKEND_URL = process.env.API_URL || 'http://backend:8000';
  const { projectNo } = await params;
  const searchParams = request.nextUrl.searchParams;
  const from_period = searchParams.get('from_period');
  const to_period = searchParams.get('to_period');
  const metric = searchParams.get('metric');

  console.log(`[Route /api/analysis/summary/${projectNo}] GET request`);
  console.log('  Backend URL:', BACKEND_URL);
  console.log('  Params:', { from_period, to_period, metric });

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/analysis/summary/${projectNo}?from_period=${from_period}&to_period=${to_period}&metric=${metric}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.warn(`  Backend returned status ${res.status}`);
      return NextResponse.json(
        { error: `Backend failed with status ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    console.log(`  Successfully fetched summary (${data.summary?.length || 0} chars)`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`  Backend unreachable (${BACKEND_URL}) or other error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch project summary from backend' },
      { status: 500 }
    );
  }
}
