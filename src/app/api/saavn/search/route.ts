import { NextResponse } from 'next/server';
import { searchJioSaavn } from '@/lib/saavnEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const tracks = await searchJioSaavn(q, 24);
    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        results: tracks,
        total: tracks.length,
      },
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
