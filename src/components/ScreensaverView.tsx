'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, X, Disc } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { Visualizer } from './Visualizer';
import type { LyricLine } from '@/types';

interface ScreensaverViewProps {
  isOpen: boolean;
  onClose: () => void;
  lyrics?: LyricLine[];
}

export function ScreensaverView({ isOpen, onClose, lyrics = [] }: ScreensaverViewProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const { currentTrack, isPlaying, currentTime } = usePlayerStore();

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Exit screensaver on any keyboard or click interaction
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = () => onClose();
    const handleClick = () => onClose();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active lyric detection
  const activeLyric = lyrics.find((line, idx) => {
    const nextLine = lyrics[idx + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[300] bg-[#050508] text-white flex flex-col items-center justify-between p-8 sm:p-14 overflow-hidden cursor-none"
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-150 -z-10"
          style={{ backgroundImage: currentTrack?.coverUrl ? `url(${currentTrack.coverUrl})` : 'none' }}
        />

        {/* Top Bar */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <Moon size={13} className="text-indigo-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              Maina // Ambient Backdrop Mode
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full border border-white/10 bg-white/5 text-neutral-400 hover:text-white cursor-pointer"
            title="Exit Screensaver"
          >
            <X size={16} />
          </button>
        </div>

        {/* Center: Glowing Clock & Floating Active Lyric */}
        <div className="flex flex-col items-center text-center my-auto z-10 max-w-4xl px-4">
          <h1 className="font-mono text-7xl sm:text-8xl md:text-9xl font-extralight tracking-tighter bg-gradient-to-b from-white via-white/80 to-white/30 bg-clip-text text-transparent mb-2">
            {timeStr}
          </h1>
          <p className="font-mono text-xs sm:text-sm text-neutral-500 uppercase tracking-widest mb-12">
            {dateStr}
          </p>

          {/* Active Synced Lyric Snippet */}
          {activeLyric && (
            <motion.div
              key={activeLyric.time}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <p className="font-editorial-title text-2xl sm:text-4xl text-neutral-200 font-light italic leading-relaxed">
                &ldquo;{activeLyric.text}&rdquo;
              </p>
            </motion.div>
          )}

          {!activeLyric && currentTrack && (
            <div className="flex items-center gap-3">
              <Disc size={18} className="text-[#FF2D55] animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-editorial-title text-2xl text-neutral-300">
                {currentTrack.title} — {currentTrack.artist}
              </span>
            </div>
          )}
        </div>

        {/* Bottom: Minimal Visualizer & Exit hint */}
        <div className="w-full max-w-lg flex flex-col items-center gap-4 z-10">
          <div className="w-full h-8 opacity-75">
            <Visualizer isPlaying={isPlaying} variant="bars" theme="dark" />
          </div>
          <p className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">
            Move mouse or press any key to resume
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
