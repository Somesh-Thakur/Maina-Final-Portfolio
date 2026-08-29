import { LyricLine } from '@/types';

const TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const lyrics: LyricLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matches = [...trimmed.matchAll(TIMESTAMP_REGEX)];
    if (matches.length > 0) {
      // Remove all timestamp tags to extract lyric text
      const text = trimmed.replace(TIMESTAMP_REGEX, '').trim();

      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        let ms = 0;
        if (match[3]) {
          // Normalize 2-digit ms (e.g. 50 -> 500ms) vs 3-digit ms (e.g. 500 -> 500ms)
          ms = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
        }

        const time = minutes * 60 + seconds + ms / 1000;
        lyrics.push({ time, text });
      }
    }
  }

  // Sort chronologically in case lines had multi-timestamp annotations
  return lyrics.sort((a, b) => a.time - b.time);
}

export async function fetchSyncedLyrics(
  title: string,
  artist: string,
  duration: number
): Promise<LyricLine[]> {
  try {
    const res = await fetch(
      `/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(
        artist
      )}&duration=${Math.floor(duration)}`
    );
    if (!res.ok) return [];

    const data = await res.json();

    if (data.syncedLyrics) {
      return parseLRC(data.syncedLyrics);
    } else if (data.plainLyrics) {
      const lines = data.plainLyrics.split('\n');
      return lines.map((text: string) => ({ time: 0, text: text.trim() }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch lyrics:', error);
    return [];
  }
}
