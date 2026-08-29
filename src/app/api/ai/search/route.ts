import { NextResponse } from 'next/server';
import { generateStructuredAIJson } from '@/lib/ai/client';
import { searchJioSaavn } from '@/lib/saavnEngine';
import type { Track } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ status: 'ERROR', message: 'Missing query parameter' }, { status: 400 });
    }

    const fallbackKeywords = [query, `${query} hits`, `${query} acoustic`, `${query} remix`];

    const aiResult = await generateStructuredAIJson<{
      interpretedVibe: string;
      candidateQueries: string[];
    }>({
      systemPrompt:
        'You are an expert music curator and semantic search engine for an ultra-luxury music platform. Analyze the natural language search prompt (which may describe a mood, scene, memory, lyric theme, or fusion) and return 5-8 exact song/artist search queries that best fulfill the prompt. Return JSON: { "interpretedVibe": "...", "candidateQueries": ["Artist - Song Title", ...] }',
      userPrompt: `Search Prompt: "${query}"`,
      fallbackData: {
        interpretedVibe: 'Curated Search Session',
        candidateQueries: fallbackKeywords,
      },
    });

    const queries = aiResult?.candidateQueries?.length ? aiResult.candidateQueries : fallbackKeywords;

    // Search queries in parallel
    const searchBatches = await Promise.all(
      queries.slice(0, 6).map((q) => searchJioSaavn(q, 3))
    );

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const matchedTracks: Track[] = [];

    for (const batch of searchBatches) {
      for (const track of batch) {
        const titleKey = track.title.toLowerCase().trim();
        if (!seenIds.has(track.id) && !seenTitles.has(titleKey)) {
          seenIds.add(track.id);
          seenTitles.add(titleKey);
          matchedTracks.push(track);
        }
      }
    }

    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        interpretedVibe: aiResult.interpretedVibe || 'AI Curated Matches',
        tracks: matchedTracks.slice(0, 18),
      },
    });
  } catch (error: any) {
    console.error('AI search error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
