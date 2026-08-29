import { NextResponse } from 'next/server';
import { generateStructuredAIJson } from '@/lib/ai/client';
import { searchJioSaavn } from '@/lib/saavnEngine';
import type { Track } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userTime = body.localTime || new Date().toLocaleTimeString();
    const dayOfWeek = body.dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const topGenres = body.topGenres || ['Acoustic', 'Lo-Fi', 'Pop', 'Bollywood'];

    const fallbackSections = [
      {
        title: 'Late Night Flow & Deep Resonance',
        subtitle: 'Introspective beats and atmospheric textures',
        query: 'The Weeknd Lo-Fi Synthwave Midnight',
      },
      {
        title: 'Acoustic Warmth & Soulful Melodies',
        subtitle: 'Unplugged emotions and gentle strings',
        query: 'Mohit Chauhan Arijit Singh Acoustic Unplugged',
      },
      {
        title: 'High-Octane Kinetic Drive',
        subtitle: 'Dynamic rhythms and upbeat chart toppers',
        query: 'Dua Lipa Diljit Dosanjh Karan Aujla Hits',
      },
    ];

    const aiResult = await generateStructuredAIJson<{
      sections: { title: string; subtitle: string; query: string }[];
    }>({
      systemPrompt:
        'You are an elite music programmer for Maina. Based on the user local time, day of week, and genre profile, generate 3 highly evocative, editorial contextual playlist section titles, poetic subtitles, and 1 search query for each section to fetch songs. Return JSON: { "sections": [{ "title": "...", "subtitle": "...", "query": "..." }] }',
      userPrompt: `Time: ${userTime}, Day: ${dayOfWeek}, Favorite Genres: ${topGenres.join(', ')}`,
      fallbackData: { sections: fallbackSections },
    });

    const sections = aiResult?.sections?.length ? aiResult.sections : fallbackSections;

    // Resolve tracks for each section
    const resolvedSections = await Promise.all(
      sections.map(async (sec) => {
        const tracks = await searchJioSaavn(sec.query, 6);
        return {
          title: sec.title,
          subtitle: sec.subtitle,
          tracks,
        };
      })
    );

    return NextResponse.json({
      status: 'SUCCESS',
      data: resolvedSections.filter((s) => s.tracks.length > 0),
    });
  } catch (error: any) {
    console.error('AI trending error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
