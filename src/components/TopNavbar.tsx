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
  Radio,
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
  onOpenRPC?: () => void;
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
  onOpenRPC,
}: TopNavbarProps) {
  const { isMuted, toggleMute } = usePlayerStore();
  const isDark = theme === 'dark';

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl h-16 sm:h-20 transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0c]/90 border-neutral-800/80' : 'bg-white/90 border-neutral-200/80'
      }`}
    >
      <div className="w-full max-w-[1720px] px-4 sm:px-8 md:px-12 mx-auto h-full flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div
          onClick={() => onViewChange('home')}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none active:opacity-80"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`font-editorial-sans font-black text-base sm:text-lg tracking-[0.25em] uppercase transition-colors ${
                  isDark ? 'text-white group-hover:text-neutral-300' : 'text-black group-hover:text-neutral-700'
                }`}
              >
                MAINA
              </span>
              <span className="editorial-badge text-[9px] py-0.5 px-2 hidden xs:inline-block">2026</span>
            </div>
            <span
              className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-widest ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              Master Audio
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Hidden on Mobile, handled by MobileNav) */}
        <div className="hidden md:flex items-center p-1 rounded-full border border-neutral-200/80 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative px-5 py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200 cursor-pointer rounded-full ${
                  isActive
                    ? isDark
                      ? 'text-black font-bold'
                      : 'text-white font-bold'
                    : isDark
                    ? 'text-neutral-400 hover:text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className={`absolute inset-0 rounded-full -z-10 shadow-md ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.id === 'flow' && <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55] animate-pulse" />}
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Capsule Recap */}
          {onOpenCapsule && (
            <button
              onClick={onOpenCapsule}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8 sm:h-9 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all cursor-pointer select-none active:scale-95 ${
                isDark
                  ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-neutral-300 hover:text-white'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-700 hover:text-black'
              }`}
              title="Personal Sound Capsule Recap"
            >
              <Sparkles size={13} className="text-[#FF2D55] shrink-0" />
              <span className="hidden sm:inline">Capsule</span>
            </button>
          )}

          {/* Picture-in-Picture Floating Player (Desktop only) */}
          <button
            onClick={() => openDocumentPiP()}
            className={`hidden sm:flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-lg border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-neutral-400 hover:text-white'
                : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-600 hover:text-black'
            }`}
            title="Picture-in-Picture Floating Player"
          >
            <PictureInPicture2 size={14} />
          </button>

          {/* Discord RPC & Extension */}
          {onOpenRPC && (
            <button
              onClick={onOpenRPC}
              className={`flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'border-neutral-800 hover:border-[#5865F2] bg-neutral-900/50 text-[#5865F2]'
                  : 'border-neutral-200 hover:border-[#5865F2] bg-neutral-100/50 text-[#5865F2]'
              }`}
              title="Discord Rich Presence & Chrome Extension"
            >
              <Radio size={14} />
            </button>
          )}

          {/* Keyboard Shortcuts Help (Desktop only) */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className={`hidden md:flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-neutral-400 hover:text-white'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-600 hover:text-black'
              }`}
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard size={14} />
            </button>
          )}

          {/* Mute Toggle (Desktop only) */}
          <button
            onClick={toggleMute}
            className={`hidden sm:flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-lg border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-white'
                : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-black'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Theme Toggle Switch */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-lg border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-white'
                : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-black'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
