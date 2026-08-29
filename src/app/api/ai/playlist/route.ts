import { NextResponse } from 'next/server';
import { generateStructuredAIJson } from '@/lib/ai/client';
import { searchJioSaavn } from '@/lib/saavnEngine';
import type { Track, Playlist } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userPrompt = body.prompt || '';

    if (!userPrompt.trim()) {
      return NextResponse.json({ status: 'ERROR', message: 'Missing playlist prompt' }, { status: 400 });
    }

    const fallbackPlaylist = {
      title: 'Midnight Reverie & Drift',
      description: 'A curated journey through ambient soundscapes, lush synths, and emotive vocal textures.',
      trackQueries: [
        'Starboy The Weeknd',
        'Blinding Lights The Weeknd',
        'Kesariya Arijit Singh',
        'Pee Loon Mohit Chauhan',
        'After Hours The Weeknd',
        'Tum Se Hi Mohit Chauhan',
        'Die For You The Weeknd',
        'Apna Bana Le Arijit Singh',
        'Chaleya Anirudh Arijit Singh',
        'I Was Never There The Weeknd',
        'Hawayein Arijit Singh',
        'Save Your Tears The Weeknd',
      ],
    };

    const aiResult = await generateStructuredAIJson<{
      title: string;
      description: string;
      trackQueries: string[];
    }>({
      systemPrompt:
        'You are an elite bespoke playlist creator for an ultra-luxury music streaming brand. Given a user concept/prompt, craft an evocative editorial playlist title, a poetic 2-sentence description, and 12-15 specific song queries (Title and Artist) that precisely match the theme. Return JSON: { "title": "...", "description": "...", "trackQueries": ["Title Artist", ...] }',
      userPrompt: `Playlist Concept: "${userPrompt}"`,
      fallbackData: fallbackPlaylist,
    });

    const queries = aiResult?.trackQueries?.length ? aiResult.trackQueries : fallbackPlaylist.trackQueries;

    // Search and resolve tracks in parallel
    const searchPromises = queries.map(async (q) => {
      try {
        const found = await searchJioSaavn(q, 1);
        return found?.[0] || null;
      } catch {
        return null;
      }
    });

    const resolved = (await Promise.all(searchPromises)).filter(
      (t): t is Track => t !== null && !!t.audioUrl
    );

    const newPlaylist: Playlist = {
      id: 'pl_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: aiResult.title || 'AI Curated Sanctuary',
      description: aiResult.description || `Generated from prompt: "${userPrompt}"`,
      coverUrl: resolved[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      tracks: resolved,
      createdAt: Date.now(),
      isAiGenerated: true,
    };

    return NextResponse.json({
      status: 'SUCCESS',
      data: newPlaylist,
    });
  } catch (error: any) {
    console.error('AI playlist error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
