'use client';

import React from 'react';
import {
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Keyboard,
  Sparkles,
  PictureInPicture2,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { openDocumentPiP } from '@/lib/pipPlayer';
import type { NavTab, ThemeMode } from '@/types';

interface TopNavbarProps {
  currentView: NavTab;
  onViewChange: (view: NavTab) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenHelp?: () => void;
  onOpenCapsule?: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'flow', label: 'Flow' },
  { id: 'search', label: 'Search' },
  { id: 'library', label: 'Library' },
];

export function TopNavbar({
  currentView,
  onViewChange,
  theme,
  onToggleTheme,
  onOpenHelp,
  onOpenCapsule,
}: TopNavbarProps) {
  const { likedSongs, isMuted, toggleMute } = usePlayerStore();
  const isDark = theme === 'dark';

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md h-20 transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0c]/90 border-neutral-800' : 'bg-white/90 border-neutral-200'
      }`}
    >
      <div className="w-full max-w-[1720px] px-4 sm:px-8 md:px-12 mx-auto h-full flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div
          onClick={() => onViewChange('home')}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`font-editorial-sans font-black text-lg tracking-[0.25em] uppercase transition-colors ${
                  isDark ? 'text-white group-hover:text-neutral-300' : 'text-black group-hover:text-neutral-700'
                }`}
              >
                MAINA
              </span>
              <span className="editorial-badge text-[9px] py-0.5 px-2">Edition 2026</span>
            </div>
            <span
              className={`text-[9px] font-mono uppercase tracking-widest mt-0.5 ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              Master Audio Catalog
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs [ Home | Flow | Search | Library ] */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-full border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative px-3.5 sm:px-5 py-2 text-xs font-mono uppercase tracking-[0.15em] transition-all cursor-pointer select-none rounded-full flex items-center gap-1.5 ${
                  isActive
                    ? isDark
                      ? 'text-white font-bold'
                      : 'text-black font-bold'
                    : isDark
                    ? 'text-neutral-400 hover:text-white'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                {item.id === 'flow' && <Sparkles size={11} className="text-[#FF2D55]" />}
                <span>{item.label}</span>

                {/* Liked songs count indicator on Library tab */}
                {item.id === 'library' && likedSongs.length > 0 && (
                  <span className="inline-flex items-center justify-center text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#FF2D55] text-white">
                    {likedSongs.length}
                  </span>
                )}

                {/* Animated Floating Underline / Capsule */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${
                      isDark ? 'bg-white/10 border border-white/20' : 'bg-black/5 border border-black/15'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Sound Capsule, PiP, Shortcuts, Audio & Theme Toggles */}
        <div className="flex items-center gap-2">
          {onOpenCapsule && (
            <button
              onClick={onOpenCapsule}
              className={`flex items-center justify-center w-10 h-10 border transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-[#FF2D55]'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-[#FF2D55]'
              }`}
              title="Sound Capsule Recap"
            >
              <Sparkles size={15} />
            </button>
          )}

          <button
            onClick={() => openDocumentPiP()}
            className={`flex items-center justify-center w-10 h-10 border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-neutral-400 hover:text-white'
                : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-600 hover:text-black'
            }`}
            title="Picture-in-Picture Floating Player"
          >
            <PictureInPicture2 size={15} />
          </button>

          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className={`flex items-center justify-center w-10 h-10 border transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-neutral-400 hover:text-white'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-600 hover:text-black'
              }`}
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard size={15} />
            </button>
          )}

          <button
            onClick={toggleMute}
            className={`flex items-center justify-center w-10 h-10 border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-white'
                : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-black'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={onToggleTheme}
            className={`flex items-center justify-center w-10 h-10 border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-white'
                : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-black'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
