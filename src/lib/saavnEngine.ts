import CryptoJS from 'crypto-js';
import type { Track } from '@/types';

const DES_KEY = CryptoJS.enc.Utf8.parse('38346591');

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&copy;/g, '©');
}

export function decryptMediaUrl(encryptedMediaUrl: string): string {
  if (!encryptedMediaUrl) return '';
  try {
    const decrypted = CryptoJS.DES.decrypt(
      encryptedMediaUrl,
      DES_KEY,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    ).toString(CryptoJS.enc.Utf8);

    if (!decrypted) return '';
    // Upgrade to 320kbps high-fidelity stream
    return decrypted
      .replace('_96.mp4', '_320.mp4')
      .replace('_160.mp4', '_320.mp4')
      .replace('_48.mp4', '_320.mp4');
  } catch (err) {
    console.error('Error decrypting JioSaavn media url:', err);
    return '';
  }
}

export function formatRawJioSaavnSong(song: any): Track | null {
  if (!song) return null;

  const encUrl =
    song.more_info?.encrypted_media_url ||
    song.encrypted_media_url ||
    '';

  const audioUrl = decryptMediaUrl(encUrl);
  if (!audioUrl) return null;

  let coverUrl = song.image || '';
  if (coverUrl) {
    coverUrl = coverUrl
      .replace('150x150', '500x500')
      .replace('50x50', '500x500')
      .replace('http:', 'https:');
  }

  let artistName =
    song.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') ||
    song.more_info?.music ||
    song.subtitle ||
    song.header_desc ||
    'Unknown Artist';

  const title = decodeHtmlEntities(song.title || song.song || song.name || 'Untitled');
  const album = decodeHtmlEntities(song.more_info?.album || song.album || 'Single');
  const duration = parseInt(song.more_info?.duration || song.duration || '210', 10);
  const hasLyrics = song.more_info?.has_lyrics === 'true' || song.has_lyrics === 'true';

  return {
    id: song.id || String(Math.random()),
    title,
    artist: decodeHtmlEntities(artistName),
    album,
    coverUrl,
    audioUrl,
    duration,
    hasLyrics,
  };
}

export async function searchJioSaavn(query: string, limit = 24): Promise<Track[]> {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(
      query
    )}&p=1&n=${limit}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    const tracks: Track[] = [];
    const seenTitles = new Set<string>();

    for (const item of results) {
      const formatted = formatRawJioSaavnSong(item);
      if (formatted && formatted.audioUrl) {
        const key = formatted.title.toLowerCase().trim();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          tracks.push(formatted);
        }
      }
    }
    return tracks;
  } catch (err) {
    console.error('searchJioSaavn error:', err);
    return [];
  }
}

export async function getSongDetailsJioSaavn(id: string): Promise<Track | null> {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${encodeURIComponent(
      id
    )}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawSong = data[id] || (Array.isArray(data) ? data[0] : null);
    if (!rawSong) return null;

    return formatRawJioSaavnSong(rawSong);
  } catch (err) {
    console.error('getSongDetailsJioSaavn error:', err);
    return null;
  }
}

const TRENDING_POOLS = [
  'Trending Global 2026',
  'Weekly Top 50 Hindi',
  'Top International Hits',
  'Global Viral 50',
  'Bollywood Chartbusters 2026',
  'Lo-Fi Drift Chill Beats',
  'Punjabi Pop Hits',
  'Acoustic Serenade',
  'Electronic Phonk Wave',
];

/**
 * Dynamically aggregates fresh trending tracks from a rotating multi-chart pool.
 */
export async function getTrendingJioSaavn(category?: string): Promise<Track[]> {
  try {
    if (category && category !== 'All') {
      return await searchJioSaavn(category, 24);
    }

    // Pick 2 random rotating categories for rich variety
    const shuffledPool = [...TRENDING_POOLS].sort(() => 0.5 - Math.random());
    const primaryQuery = shuffledPool[0];
    const secondaryQuery = shuffledPool[1];

    const [batch1, batch2] = await Promise.all([
      searchJioSaavn(primaryQuery, 16),
      searchJioSaavn(secondaryQuery, 16),
    ]);

    const combined = [...batch1, ...batch2];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const uniqueTracks: Track[] = [];

    for (const track of combined) {
      const titleKey = track.title.toLowerCase().trim();
      if (!seenIds.has(track.id) && !seenTitles.has(titleKey)) {
        seenIds.add(track.id);
        seenTitles.add(titleKey);
        uniqueTracks.push(track);
      }
    }

    // Interleave / shuffle slightly to create a fresh feel
    return uniqueTracks.sort(() => 0.5 - Math.random());
  } catch (err) {
    console.error('getTrendingJioSaavn error:', err);
    return await searchJioSaavn('Top Hits', 24);
  }
}
