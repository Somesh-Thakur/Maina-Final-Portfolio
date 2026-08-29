'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Sparkles, Clock, ArrowRight, Wand2 } from 'lucide-react';
import { searchSongs } from '@/lib/api/jiosaavn';
import { TrackCard } from './TrackCard';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { Track, ThemeMode } from '@/types';

interface SearchViewProps {
  theme: ThemeMode;
  onClose?: () => void;
}

const AI_VIBE_CHIPS = [
  'Rainy day indie acoustic',
  'Late night cyberpunk synth drive',
  '2000s Bollywood nostalgic road trip',
  'High-energy phonk workout boost',
  'Deep focus study lo-fi chill',
  'Sunset rooftop chillhouse',
];

const TRENDING_TAGS = [
  'Bollywood 2026',
  'Global Top Hits',
  'Lo-Fi Chill Beats',
  'Phonk Wave',
  'Punjabi Hits',
  'Acoustic Serenade',
  'Midnight Ambient',
  'Electronic Vibes',
  'Synthwave',
];

export function SearchView({ theme, onClose }: SearchViewProps) {
  const isDark = theme === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentTrack,
    isPlaying,
    playTrack,
    addToQueue,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = usePlayerStore();

  const [query, setQuery] = useState('');
  const [aiVibePrompt, setAiVibePrompt] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [aiResults, setAiResults] = useState<Track[]>([]);
  const [aiInterpretedVibe, setAiInterpretedVibe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Standard Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      if (!aiResults.length) setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const timer = setTimeout(async () => {
      try {
        const tracks = await searchSongs(query);
        setResults(tracks);
        addRecentSearch(query);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, addRecentSearch, aiResults.length]);

  // AI Semantic Natural Language Vibe Search
  const handleAiVibeSearch = async (promptText: string) => {
    if (!promptText.trim() || isAiLoading) return;
    setIsAiLoading(true);
    setHasSearched(true);
    setAiInterpretedVibe(null);

    try {
      const res = await fetch(`/api/ai/search?q=${encodeURIComponent(promptText)}`);
      const json = await res.json();
      if (json.status === 'SUCCESS' && json.data) {
        setAiInterpretedVibe(json.data.interpretedVibe);
        setAiResults(json.data.tracks || []);
        addRecentSearch(promptText);
      }
    } catch (err) {
      console.error('AI search failed', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTrackSelect = (track: Track) => {
    playTrack(track);
    const activeList = aiResults.length > 0 ? aiResults : results;
    const idx = activeList.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      const remaining = activeList.slice(idx + 1);
      remaining.forEach((t) => addToQueue(t));
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Search Header & Inputs */}
      <div className="flex flex-col gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="editorial-badge text-[10px] py-0.5 px-2.5">Catalog Navigation</span>
            <span className="editorial-meta opacity-60 text-xs tracking-widest uppercase">
              Semantic Search &amp; AI Vibe Radio
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-full border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900 text-white hover:border-white'
                  : 'border-neutral-300 bg-white text-black hover:border-black'
              }`}
            >
              <X size={14} />
              <span>Close</span>
            </button>
          )}
        </div>

        {/* 1. AI Vibe Radio Natural Language Bar */}
        <div className="w-full p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-r from-black/5 via-black/10 to-black/5 dark:from-white/5 dark:via-white/10 dark:to-white/5 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FF2D55] font-bold">
            <Sparkles size={14} />
            <span>AI Mood &amp; Vibe Radio Prompt</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={aiVibePrompt}
              onChange={(e) => setAiVibePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAiVibeSearch(aiVibePrompt);
              }}
              placeholder="e.g., 'Acoustic evening rain with warm guitars' or 'Cyberpunk night drive'..."
              className={`flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono rounded-lg border outline-none transition-all ${
                isDark
                  ? 'bg-neutral-900/80 border-neutral-700 text-white placeholder-neutral-500 focus:border-white'
                  : 'bg-white border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
              }`}
            />

            <button
              onClick={() => handleAiVibeSearch(aiVibePrompt)}
              disabled={!aiVibePrompt.trim() || isAiLoading}
              className={`px-5 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                !aiVibePrompt.trim() || isAiLoading
                  ? 'opacity-50 cursor-not-allowed bg-neutral-700 text-neutral-400'
                  : 'bg-white text-black hover:bg-neutral-200 shadow-md'
              }`}
            >
              {isAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              <span>{isAiLoading ? 'Synthesizing...' : 'Generate Vibe'}</span>
            </button>
          </div>

          {/* AI Inspiration Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest shrink-0">
              Try Vibe:
            </span>
            {AI_VIBE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setAiVibePrompt(chip);
                  handleAiVibeSearch(chip);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-mono border whitespace-nowrap transition-all cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-600 hover:text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-black'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Direct Instant Search Input */}
        <div className="relative">
          <Search
            size={20}
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
              isDark ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by track name, artist, album, or keyword..."
            className={`w-full pl-12 pr-12 py-3.5 text-base font-editorial-sans border rounded-sm outline-none transition-all ${
              isDark
                ? 'bg-neutral-900/40 border-neutral-700 text-white placeholder-neutral-500 focus:border-white'
                : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-current cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── AI CURATED VIBE RESULTS ─── */}
      {aiResults.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#FF2D55]" />
              <h2 className="editorial-title text-2xl font-normal">
                {aiInterpretedVibe || 'AI Curated Matches'}
              </h2>
            </div>
            <button
              onClick={() => {
                setAiResults([]);
                setAiInterpretedVibe(null);
              }}
              className="text-xs font-mono text-neutral-500 hover:text-white cursor-pointer"
            >
              Clear AI Results
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {aiResults.map((track, idx) => (
              <TrackCard
                key={`ai-${track.id}-${idx}`}
                track={track}
                isCurrentTrack={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={() => handleTrackSelect(track)}
                theme={theme}
                index={idx}
                variant="standard"
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── STANDARD SEARCH RESULTS GRID ─── */}
      {results.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="editorial-title text-2xl font-normal">Direct Results ({results.length})</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {results.map((track, idx) => (
              <TrackCard
                key={`res-${track.id}-${idx}`}
                track={track}
                isCurrentTrack={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={() => handleTrackSelect(track)}
                theme={theme}
                index={idx}
                variant="standard"
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {(isLoading || isAiLoading) && (
        <div className="flex items-center justify-center py-20">
          <div className="editorial-meta opacity-60 tracking-widest uppercase text-xs flex items-center gap-2 animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <span>Scanning High-Fidelity Catalog...</span>
          </div>
        </div>
      )}

      {/* Discovery Tags & Recent Searches (When not searched) */}
      {!hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-6 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400">
                  <Clock size={14} />
                  <span>Recent Inquiries</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] font-mono text-neutral-500 hover:text-current cursor-pointer uppercase"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-black'
                    }`}
                  >
                    <span>{s}</span>
                    <ArrowRight size={10} className="opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Discovery Tags */}
          <div className="p-6 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4">
              <Sparkles size={14} />
              <span>Trending Concepts</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-black'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
