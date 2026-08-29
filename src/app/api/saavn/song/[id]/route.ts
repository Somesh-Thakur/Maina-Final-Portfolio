import { NextResponse } from 'next/server';
import { getSongDetailsJioSaavn } from '@/lib/saavnEngine';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const track = await getSongDetailsJioSaavn(id);
    if (!track) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'SUCCESS', data: track });
  } catch (error: any) {
    console.error('Song Details API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
