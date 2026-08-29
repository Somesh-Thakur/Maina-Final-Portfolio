import { Track } from '@/types';

function normalizeTrack(song: any): Track | null {
  if (!song) return null;

  // Already formatted Track
  if (song.audioUrl && song.title && song.artist) {
    return {
      id: song.id || String(Math.random()),
      title: song.title,
      artist: song.artist,
      album: song.album || 'Single',
      coverUrl: song.coverUrl || '',
      audioUrl: song.audioUrl,
      duration: song.duration || 210,
      hasLyrics: !!song.hasLyrics,
    };
  }

  const downloadUrl =
    song.downloadUrl?.find((u: any) => u.quality === '320kbps')?.url ||
    song.downloadUrl?.find((u: any) => u.quality === '160kbps')?.url ||
    song.downloadUrl?.[0]?.url ||
    song.url ||
    '';

  const imageUrl =
    song.image?.find((i: any) => i.quality === '500x500')?.url ||
    song.image?.[song.image?.length - 1]?.url ||
    song.image?.[0]?.url ||
    song.coverUrl ||
    '';

  const artistName = Array.isArray(song.artists?.primary)
    ? song.artists.primary.map((a: any) => a.name).join(', ')
    : song.artists?.primary?.[0]?.name || song.artist || 'Unknown Artist';

  if (!downloadUrl) return null;

  return {
    id: song.id || String(Math.random()),
    title: song.name || song.title || 'Untitled',
    artist: artistName,
    album: song.album?.name || song.album || 'Single',
    coverUrl: imageUrl,
    audioUrl: downloadUrl,
    duration: parseInt(song.duration || '0', 10) || 210,
    hasLyrics: song.hasLyrics === 'true' || song.hasLyrics === true,
  };
}

export async function searchSongs(query: string): Promise<Track[]> {
  try {
    const res = await fetch(`/api/saavn/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data?.data?.results || [])
      .map(normalizeTrack)
      .filter((t: Track | null): t is Track => t !== null && !!t.audioUrl);
    return results;
  } catch (error) {
    console.error('Failed to search songs:', error);
    return [];
  }
}

export async function getSongDetails(id: string): Promise<Track | null> {
  try {
    const res = await fetch(`/api/saavn/song/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const songData = Array.isArray(data?.data) ? data.data[0] : data?.data;
    if (!songData) return null;
    return normalizeTrack(songData);
  } catch (error) {
    console.error('Failed to get song details:', error);
    return null;
  }
}

export async function getTrending(category?: string): Promise<Track[]> {
  try {
    const url = category
      ? `/api/saavn/trending?category=${encodeURIComponent(category)}&_t=${Date.now()}`
      : `/api/saavn/trending?_t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const songs = data?.data?.trending?.songs;
    if (Array.isArray(songs) && songs.length > 0) {
      const formatted = songs
        .map(normalizeTrack)
        .filter((t: Track | null): t is Track => t !== null && !!t.audioUrl);
      if (formatted.length > 0) return formatted;
    }

    return [];
  } catch (error) {
    console.error('Failed to get trending songs:', error);
    return [];
  }
}
