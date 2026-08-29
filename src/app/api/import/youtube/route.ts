import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExtractedTrackQuery {
  title: string;
  artist: string;
  query: string;
}

function extractPlaylistId(inputUrl: string): string | null {
  try {
    const url = new URL(inputUrl);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;

    // Handle path formats like /playlist/PL...
    const pathMatch = url.pathname.match(/\/playlist\/(PL[\w-]+)/);
    if (pathMatch) return pathMatch[1];
  } catch {
    // If not a valid URL, check if input is directly a playlist ID
    const match = inputUrl.match(/^(?:PL|OLAK5uy_)[a-zA-Z0-9_-]+/);
    if (match) return match[0];
  }
  return null;
}

function cleanTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\|.*$/g, '')
    .replace(/official\s*(music)?\s*video/gi, '')
    .replace(/official\s*audio/gi, '')
    .replace(/lyric\s*video/gi, '')
    .replace(/audio\s*track/gi, '')
    .replace(/4k\s*60fps/gi, '')
    .replace(/hd/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strategy 1: Fetch and parse direct YouTube / YouTube Music HTML (handles initial data + metadata)
 */
async function fetchYouTubeHtml(playlistId: string) {
  const targetUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`YouTube HTML returned status ${res.status}`);
  const html = await res.text();

  // 1. Extract Real Playlist Title from OpenGraph meta or <title>
  let playlistTitle = 'YouTube Playlist';
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    playlistTitle = ogTitleMatch[1].replace(' - YouTube', '').replace(' - YouTube Music', '').trim();
  } else {
    const docTitleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (docTitleMatch && docTitleMatch[1]) {
      playlistTitle = docTitleMatch[1].replace(' - YouTube', '').replace(' - YouTube Music', '').trim();
    }
  }

  // 2. Extract Description
  let playlistDescription = `Imported YouTube playlist (${playlistId})`;
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    playlistDescription = ogDescMatch[1].trim();
  }

  // 3. Extract ytInitialData
  const initialDataMatch = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/);
  if (!initialDataMatch) {
    return { title: playlistTitle, description: playlistDescription, tracks: [] as ExtractedTrackQuery[], continuationToken: null as string | null };
  }

  const initialData = JSON.parse(initialDataMatch[1]);
  const tracks: ExtractedTrackQuery[] = [];
  let continuationToken: string | null = null;

  try {
    const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
    const tabRenderer = tabs?.[0]?.tabRenderer;
    const sectionList = tabRenderer?.content?.sectionListRenderer?.contents;
    const itemSection = sectionList?.[0]?.itemSectionRenderer?.contents;
    const playlistVideoList = itemSection?.[0]?.playlistVideoListRenderer;

    const contents = playlistVideoList?.contents || [];

    for (const item of contents) {
      if (item.playlistVideoRenderer) {
        const r = item.playlistVideoRenderer;
        const rawTitle = r.title?.runs?.[0]?.text || r.title?.simpleText || '';
        const author = r.shortBylineText?.runs?.[0]?.text || '';
        const cleaned = cleanTitle(rawTitle);
        if (cleaned) {
          tracks.push({
            title: cleaned,
            artist: author,
            query: author ? `${cleaned} ${author}` : cleaned,
          });
        }
      } else if (item.continuationItemRenderer) {
        continuationToken =
          item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
      }
    }
  } catch (err) {
    console.warn('[YouTube Importer] Parse initial data contents warning:', err);
  }

  return { title: playlistTitle, description: playlistDescription, tracks, continuationToken };
}

/**
 * Strategy 2: Fetch continuation pages using innertube browse API
 */
async function fetchContinuations(continuationToken: string, maxPages = 5): Promise<ExtractedTrackQuery[]> {
  const extraTracks: ExtractedTrackQuery[] = [];
  let currentToken: string | null = continuationToken;
  let page = 0;

  while (currentToken && page < maxPages) {
    page++;
    try {
      const fetchUrl = 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false';
      const res: Response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240101.00.00',
              hl: 'en',
              gl: 'US',
            },
          },
          continuation: currentToken,
        }),
      });

      if (!res.ok) break;
      const data = await res.json();

      const continuationItems =
        data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];

      let nextToken: string | null = null;

      for (const item of continuationItems) {
        if (item.playlistVideoRenderer) {
          const r = item.playlistVideoRenderer;
          const rawTitle = r.title?.runs?.[0]?.text || r.title?.simpleText || '';
          const author = r.shortBylineText?.runs?.[0]?.text || '';
          const cleaned = cleanTitle(rawTitle);
          if (cleaned) {
            extraTracks.push({
              title: cleaned,
              artist: author,
              query: author ? `${cleaned} ${author}` : cleaned,
            });
          }
        } else if (item.continuationItemRenderer) {
          nextToken =
            item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
        }
      }

      currentToken = nextToken;
    } catch {
      break;
    }
  }

  return extraTracks;
}

/**
 * Strategy 3: Piped / Invidious Fallback Instances
 */
async function fetchFromPipedOrInvidious(playlistId: string) {
  const endpoints = [
    `https://pipedapi.kavin.rocks/playlists/${playlistId}`,
    `https://api.piped.privacydev.net/playlists/${playlistId}`,
    `https://invidious.nerdvpn.de/api/v1/playlists/${playlistId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const json = await res.json();
        const title = json.name || json.title || 'YouTube Playlist';
        const description = json.description || `Imported YouTube playlist (${playlistId})`;
        const streams = json.relatedStreams || json.videos || [];

        const tracks: ExtractedTrackQuery[] = streams.map((s: any) => {
          const rawTitle = s.title || '';
          const author = s.uploaderName || s.author || '';
          const cleaned = cleanTitle(rawTitle);
          return {
            title: cleaned,
            artist: author,
            query: author ? `${cleaned} ${author}` : cleaned,
          };
        });

        if (tracks.length > 0) {
          return { title, description, tracks };
        }
      }
    } catch {}
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get('url') || searchParams.get('id');

  if (!urlParam) {
    return NextResponse.json({ status: 'ERROR', message: 'Parameter "url" or "id" is required' }, { status: 400 });
  }

  const playlistId = extractPlaylistId(urlParam);
  if (!playlistId) {
    return NextResponse.json({ status: 'ERROR', message: 'Invalid YouTube playlist URL or ID' }, { status: 400 });
  }

  try {
    // 1. Try Direct YouTube HTML + Continuations first
    let resultTitle = 'YouTube Playlist';
    let resultDescription = `Imported YouTube playlist (${playlistId})`;
    let allTracks: ExtractedTrackQuery[] = [];

    try {
      const htmlResult = await fetchYouTubeHtml(playlistId);
      resultTitle = htmlResult.title;
      resultDescription = htmlResult.description;
      allTracks = [...htmlResult.tracks];

      // If continuation token present, fetch remaining 60+ tracks
      if (htmlResult.continuationToken) {
        const pagedTracks = await fetchContinuations(htmlResult.continuationToken);
        allTracks.push(...pagedTracks);
      }
    } catch (err) {
      console.warn('[YouTube API Route] HTML scraping attempt failed:', err);
    }

    // 2. If HTML returned 0 or few tracks, fallback to Invidious/Piped API
    if (allTracks.length === 0) {
      const fallbackResult = await fetchFromPipedOrInvidious(playlistId);
      if (fallbackResult) {
        resultTitle = fallbackResult.title;
        resultDescription = fallbackResult.description;
        allTracks = fallbackResult.tracks;
      }
    }

    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        id: playlistId,
        title: resultTitle,
        description: resultDescription,
        trackCount: allTracks.length,
        tracks: allTracks,
      },
    });
  } catch (error: any) {
    console.error('[YouTube API Route] Error:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'Failed to extract playlist', details: error.message },
      { status: 500 }
    );
  }
}
