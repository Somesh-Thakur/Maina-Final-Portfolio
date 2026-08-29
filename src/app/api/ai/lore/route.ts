import { NextResponse } from 'next/server';
import { generateStructuredAIJson } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import type { SongLore } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || '';
    const artist = searchParams.get('artist') || '';
    const album = searchParams.get('album') || '';

    if (!title) {
      return NextResponse.json({ status: 'ERROR', message: 'Missing song title' }, { status: 400 });
    }

    const fallbackLore: SongLore = {
      vibeSummary: `A sonic tapestry by ${artist}, capturing emotional resonance and signature melodic arrangements.`,
      trivia: [
        `Crafted with high dynamic contrast, blending acoustic intimacy with rich studio production.`,
        `Celebrated for its timeless hook and emotive storytelling across modern charts.`,
      ],
      moodTags: ['#Atmospheric', '#HarmonicDepth', '#320kbpsMaster', '#StudioFidelity'],
      bpm: 118,
      key: 'E Minor',
    };

    const aiResult = await generateStructuredAIJson<SongLore>({
      systemPrompt:
        'You are an expert musicologist and historian for Maina. For the given song title, artist, and album, provide a concise 1-sentence poetic vibe summary, 2 captivating trivia points regarding its composition, production, or cultural impact, 3-4 mood hashtag tags, estimated BPM, and musical key. Return JSON: { "vibeSummary": "...", "trivia": ["...", "..."], "moodTags": ["#...", "#..."], "bpm": 120, "key": "A Minor" }',
      userPrompt: `Song: "${title}" by ${artist} (Album: ${album || 'Single'})`,
      fallbackData: fallbackLore,
    });

    return NextResponse.json({
      status: 'SUCCESS',
      data: aiResult || fallbackLore,
    });
  } catch (error: any) {
    console.error('AI lore error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
