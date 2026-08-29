import { NextResponse } from 'next/server';
import { generateStructuredAIJson } from '@/lib/ai/client';
import { searchJioSaavn } from '@/lib/saavnEngine';
import type { Track } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const seedTracks: Track[] = body.seedTracks || [];

    const seedDescriptions = seedTracks.map((t) => `${t.title} by ${t.artist}`).join(', ');

    const fallbackRecommendations = [
      'Pee Loon Mohit Chauhan Pritam',
      'I Was Never There The Weeknd',
      'Tum Se Hi Pritam Mohit Chauhan',
      'Starboy The Weeknd Daft Punk',
      'Agar Tum Saath Ho Arijit Singh Alka Yagnik',
    ];

    const aiResult = await generateStructuredAIJson<{ recommendations: string[] }>({
      systemPrompt:
        'You are an intelligent AI DJ for continuous autoplay radio. Based on the recent seed songs, recommend 5 seamlessly blending song queries with matched sonic energy, key feeling, and artist synergy. Return JSON: { "recommendations": ["Artist - Song Title", ...] }',
      userPrompt: `Recent seed tracks: ${seedDescriptions || 'Top modern chill and acoustic hits'}`,
      fallbackData: { recommendations: fallbackRecommendations },
    });

    const queries = aiResult?.recommendations?.length ? aiResult.recommendations : fallbackRecommendations;

    // Search and resolve tracks in parallel
    const resolvedTracks = await Promise.all(
      queries.map(async (q) => {
        try {
          const res = await searchJioSaavn(q, 1);
          return res?.[0] || null;
        } catch {
          return null;
        }
      })
    );

    const validTracks = resolvedTracks.filter((t): t is Track => t !== null && !!t.audioUrl);

    return NextResponse.json({
      status: 'SUCCESS',
      data: validTracks,
    });
  } catch (error: any) {
    console.error('AI radio error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
