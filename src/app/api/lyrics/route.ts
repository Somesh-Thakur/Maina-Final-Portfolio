import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function cleanTrackName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\{.*?\}/g, '')
    .replace(/-.*$/, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .trim();
}

function cleanArtistName(name: string): string {
  return name.split(',')[0].split('&')[0].trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const duration = searchParams.get('duration');

  if (!title || !artist) {
    return NextResponse.json(
      { error: 'Missing required parameters: title, artist' },
      { status: 400 }
    );
  }

  const userAgent = 'Maina Music Streaming App (https://github.com)';

  try {
    // 1. Try exact match if duration is provided
    if (duration && duration !== '0') {
      const exactUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
        artist
      )}&track_name=${encodeURIComponent(title)}&duration=${encodeURIComponent(duration)}`;

      const exactRes = await fetch(exactUrl, { headers: { 'User-Agent': userAgent } });
      if (exactRes.ok) {
        const data = await exactRes.json();
        if (data && (data.syncedLyrics || data.plainLyrics)) {
          return NextResponse.json(data);
        }
      }
    }

    // 2. Try cleaned title + artist exact query
    const cleanedTitle = cleanTrackName(title);
    const cleanedArtist = cleanArtistName(artist);

    const cleanExactUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
      cleanedArtist
    )}&track_name=${encodeURIComponent(cleanedTitle)}`;

    const cleanRes = await fetch(cleanExactUrl, { headers: { 'User-Agent': userAgent } });
    if (cleanRes.ok) {
      const data = await cleanRes.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        return NextResponse.json(data);
      }
    }

    // 3. Try LRCLIB search query fallback
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
      `${cleanedTitle} ${cleanedArtist}`
    )}`;

    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': userAgent } });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (Array.isArray(searchData) && searchData.length > 0) {
        // Prioritize synced lyrics
        const best =
          searchData.find((item: any) => item.syncedLyrics) ||
          searchData.find((item: any) => item.plainLyrics) ||
          searchData[0];

        if (best && (best.syncedLyrics || best.plainLyrics)) {
          return NextResponse.json(best);
        }
      }
    }

    return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Lyrics API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
