'use client';

import React, { useRef, useEffect } from 'react';
import type { LyricLine } from '@/types';

interface SyncedLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  theme: 'dark' | 'light';
  isLoading: boolean;
}

export function SyncedLyrics({ lyrics, currentTime, onSeek, theme, isLoading }: SyncedLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const isDark = theme === 'dark';

  const activeIndex = lyrics.reduce((acc, line, idx) => {
    return line.time <= currentTime ? idx : acc;
  }, -1);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeRef.current;
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const offset =
        elementRect.top -
        containerRect.top -
        containerRect.height / 2 +
        elementRect.height / 2;

      container.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, [activeIndex]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col gap-6 justify-center items-center py-20 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-8 rounded ${
              i % 2 === 0 ? 'w-3/4' : 'w-1/2'
            } ${isDark ? 'bg-white/10' : 'bg-black/10'}`}
          />
        ))}
      </div>
    );
  }

  if (!lyrics || lyrics.length === 0) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center font-mono text-sm tracking-widest gap-2 ${
          isDark ? 'text-white/40' : 'text-black/40'
        }`}
      >
        <span>INSTRUMENTAL PASSAGE</span>
        <span className="text-[10px] tracking-wider opacity-60">OR LYRICS UNAVAILABLE</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
      }}
    >
      <div
        ref={containerRef}
        className="h-full overflow-y-auto custom-lyrics-scrollbar pb-64 pt-64 px-4 flex flex-col items-center text-center gap-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;

          let colorClass = isDark
            ? 'text-[#444444] hover:text-white/70'
            : 'text-[#bbbbbb] hover:text-black/70';

          if (isActive) {
            colorClass = isDark ? 'text-white font-medium scale-105' : 'text-black font-medium scale-105';
          } else if (isPast) {
            colorClass = isDark ? 'text-[#666666]' : 'text-[#888888]';
          }

          return (
            <button
              key={idx}
              ref={isActive ? activeRef : null}
              onClick={() => onSeek(line.time)}
              className={`group relative max-w-2xl w-full text-center transition-all duration-500 ease-out cursor-pointer ${colorClass} ${
                isActive
                  ? 'font-editorial-title text-3xl sm:text-4xl md:text-5xl leading-tight'
                  : 'font-editorial-sans text-lg sm:text-xl md:text-2xl leading-normal'
              }`}
            >
              <span
                className={`absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`}
              >
                {formatTime(line.time)}
              </span>
              {line.text || '...'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
