import { NextResponse } from 'next/server';
import { generateStructuredAIJson } from '@/lib/ai/client';
import { searchJioSaavn } from '@/lib/saavnEngine';
import type { FlowReelItem, Track } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const likedTracks: Track[] = body.likedTracks || [];
    const recentHistory: Track[] = body.history || [];

    const tasteProfile = [
      ...likedTracks.map((t) => `${t.title} by ${t.artist}`),
      ...recentHistory.map((t) => `${t.title} by ${t.artist}`),
    ].slice(0, 10).join(', ');

    const fallbackRecommendations = [
      { query: 'Starboy The Weeknd', vibeTag: 'Midnight Neon', mood: 'Dark Synthwave', offset: 35 },
      { query: 'Kesariya Arijit Singh', vibeTag: 'Sufi Romance', mood: 'Warm Euphoria', offset: 45 },
      { query: 'Blinding Lights The Weeknd', vibeTag: '80s Retro Drive', mood: 'High Octane', offset: 28 },
      { query: 'Pee Loon Pritam Mohit Chauhan', vibeTag: 'Nostalgic Acoustic', mood: 'Gentle Soul', offset: 50 },
      { query: 'After Hours The Weeknd', vibeTag: 'Late Night Flow', mood: 'Melancholic Drift', offset: 60 },
      { query: 'Apna Bana Le Arijit Singh', vibeTag: 'Heartfelt Melody', mood: 'Romantic Chill', offset: 40 },
      { query: 'Die For You The Weeknd', vibeTag: 'Sensual Groove', mood: 'Smooth R&B', offset: 30 },
      { query: 'Tum Se Hi Mohit Chauhan', vibeTag: 'Monsoon Serenade', mood: 'Pure Nostalgia', offset: 48 },
      { query: 'Chaleya Anirudh Arijit Singh', vibeTag: 'Upbeat Pop', mood: 'Dance Breeze', offset: 38 },
      { query: 'Raataan Lambiyan Tanishk Bagchi Jubin Nautiyal', vibeTag: 'Acoustic Love', mood: 'Serene Acoustic', offset: 42 },
    ];

    const aiResult = await generateStructuredAIJson<{
      items: { query: string; vibeTag: string; mood: string; offset: number }[];
    }>({
      systemPrompt:
        'You are an elite AI Music Curation DJ for a modern luxury music reels platform. Given user listening taste, recommend 10 distinct high-energy or deeply aesthetic tracks. For each track, provide a catchy 2-3 word vibe tag (e.g. "Midnight Drift", "Sufi Sunset"), mood descriptor, and preview hook start timestamp in seconds (20-60). Return JSON { "items": [{ "query": "Song Title Artist", "vibeTag": "...", "mood": "...", "offset": 30 }] }',
      userPrompt: `User listening history and liked songs: ${tasteProfile || 'Global top hits, lo-fi chill, Bollywood aesthetics, modern synthwave'}`,
      fallbackData: { items: fallbackRecommendations },
    });

    const itemsToResolve = aiResult?.items?.length ? aiResult.items : fallbackRecommendations;

    // Search and resolve tracks in parallel
    const resolvedPromises = itemsToResolve.map(async (rec, index) => {
      try {
        const found = await searchJioSaavn(rec.query, 1);
        if (found && found.length > 0) {
          const track = found[0];
          return {
            id: `reel_${track.id}_${index}`,
            track,
            vibeTag: rec.vibeTag || 'Curated Sound',
            moodDescriptor: rec.mood || 'High Fidelity',
            previewStartOffset: rec.offset || 30,
          } as FlowReelItem;
        }
      } catch (err) {
        console.error('Failed to resolve reel query:', rec.query, err);
      }
      return null;
    });

    const resolved = (await Promise.all(resolvedPromises)).filter(
      (item): item is FlowReelItem => item !== null && !!item.track?.audioUrl
    );

    // Fallback if search yielded few
    if (resolved.length < 3) {
      const defaultTracks = await searchJioSaavn('Trending Global Hits 2026', 10);
      const fallbackReels: FlowReelItem[] = defaultTracks.map((track, i) => ({
        id: `reel_def_${track.id}_${i}`,
        track,
        vibeTag: 'Trending Flow',
        moodDescriptor: 'Universal Hit',
        previewStartOffset: 30,
      }));
      return NextResponse.json({ status: 'SUCCESS', data: fallbackReels });
    }

    return NextResponse.json({ status: 'SUCCESS', data: resolved });
  } catch (error: any) {
    console.error('Curate feed error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
