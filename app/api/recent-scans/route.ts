import { NextRequest, NextResponse } from 'next/server';
import { getRecentRecordings } from '@/lib/metadata';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const recordings = getRecentRecordings(limit);

    return NextResponse.json({
      success: true,
      recordings
    });
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return NextResponse.json({ error: 'Failed to fetch recent scans' }, { status: 500 });
  }
}
