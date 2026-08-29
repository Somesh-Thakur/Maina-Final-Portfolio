import { NextResponse } from 'next/server';
import { getTrendingJioSaavn } from '@/lib/saavnEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const tracks = await getTrendingJioSaavn(category);
    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        trending: {
          songs: tracks,
        },
      },
    });
  } catch (error: any) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
