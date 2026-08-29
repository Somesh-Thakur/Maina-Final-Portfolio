'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, Music2, Disc, Award } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { ThemeMode } from '@/types';

interface SoundCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
}

export function SoundCapsuleModal({ isOpen, onClose, theme = 'dark' }: SoundCapsuleModalProps) {
  const { history, likedSongs, currentTrack } = usePlayerStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  // Calculate stats from history and liked songs
  const allSessionTracks = [...history, ...likedSongs];
  const totalMinutes = Math.max(12, Math.round(allSessionTracks.length * 3.6));
  const totalPlays = allSessionTracks.length || 8;

  // Calculate artist frequencies
  const artistCounts: { [key: string]: number } = {};
  allSessionTracks.forEach((t) => {
    const mainArtist = t.artist.split(',')[0].trim();
    artistCounts[mainArtist] = (artistCounts[mainArtist] || 0) + 1;
  });

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topArtists.length === 0) {
    topArtists.push(['The Weeknd', 5], ['Arijit Singh', 4], ['Mohit Chauhan', 3]);
  }

  const topGenres = [
    { genre: 'Atmospheric Pop / Synthwave', pct: 45 },
    { genre: 'Acoustic & Bollywood Melodies', pct: 30 },
    { genre: 'Lo-Fi Chill & Ambient', pct: 25 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`w-full max-w-xl p-6 sm:p-8 rounded-2xl border shadow-2xl relative ${
            isDark ? 'bg-[#0e0e12] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-[#FF2D55]" />
              <div>
                <h2 className="editorial-title text-2xl">Sound Capsule 2026</h2>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  Your Personal Audio Footprint
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-current cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#2563eb]/20 text-[#2563eb]">
                <Clock size={20} />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold">{totalMinutes}</div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Minutes Streamed</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#FF2D55]/20 text-[#FF2D55]">
                <Music2 size={20} />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold">{totalPlays}</div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Tracks Explored</div>
              </div>
            </div>
          </div>

          {/* Top Artists Ranking */}
          <div className="mb-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
              <Award size={14} className="text-amber-400" />
              <span>Top Resonating Artists</span>
            </h3>
            <div className="space-y-2">
              {topArtists.map(([artist, count], idx) => (
                <div
                  key={artist}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold opacity-60">0{idx + 1}</span>
                    <span className="text-sm font-semibold truncate">{artist}</span>
                  </div>
                  <span className="font-mono text-xs text-neutral-500">{count} spins</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dominant Genres Distribution */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
              <Disc size={14} className="text-indigo-400" />
              <span>Sonic Spectrum Breakdown</span>
            </h3>
            <div className="space-y-2">
              {topGenres.map((g) => (
                <div key={g.genre}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span>{g.genre}</span>
                    <span>{g.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2563eb] to-[#FF2D55] rounded-full"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
