'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, MoreVertical, ListPlus, Radio, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LikeButton } from './LikeButton';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { Track, ThemeMode } from '@/types';

interface TrackCardProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  theme: ThemeMode;
  index: number;
  variant?: 'featured' | 'standard';
}

export function TrackCard({
  track,
  isCurrentTrack,
  isPlaying,
  onPlay,
  theme,
  index,
  variant = 'standard',
}: TrackCardProps) {
  const isDark = theme === 'dark';
  const isFeatured = variant === 'featured';
  const num = `NO.${(index + 1).toString().padStart(2, '0')}`;
  const showPause = isCurrentTrack && isPlaying;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { addToQueue, addToQueueNext, customPlaylists, addToPlaylist } = usePlayerStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setMenuOpen(false);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onPlay}
      className={`group cursor-pointer flex flex-col justify-between p-3.5 sm:p-4 border transition-all duration-300 relative ${
        isFeatured ? 'col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2' : 'col-span-1'
      } ${
        isDark
          ? 'border-neutral-800/80 hover:border-neutral-600 bg-[#0e0e10]/80'
          : 'border-neutral-200/80 hover:border-neutral-400 bg-white/90'
      } ${isCurrentTrack ? (isDark ? 'border-white/80 ring-1 ring-white/40' : 'border-black/80 ring-1 ring-black/30') : ''}`}
    >
      {/* Media Box */}
      <div>
        <div
          className={`relative overflow-hidden mb-3.5 bg-neutral-900 border ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          } ${isFeatured ? 'aspect-[16/10]' : 'aspect-square'}`}
        >
          <img
            src={track.coverUrl}
            alt={track.title}
            loading="lazy"
            className="w-full h-full object-cover grayscale contrast-125 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
          />

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border backdrop-blur-md cursor-pointer transition-transform hover:scale-110 ${
                isDark
                  ? 'border-white bg-white text-black'
                  : 'border-black bg-black text-white'
              }`}
            >
              {showPause ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Like Heart Button (Always accessible top right) */}
          <div className="absolute top-2 right-2 z-20">
            <LikeButton track={track} theme="dark" size={16} className="bg-black/60 backdrop-blur-md rounded-full" />
          </div>

          {/* Top-left Index / Tag Badge */}
          <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <span className="font-mono text-[9px] bg-black/70 text-white px-1.5 py-0.5 border border-white/20 uppercase tracking-widest backdrop-blur-sm">
              320K
            </span>
          </div>
        </div>

        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-[10px] font-mono tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {num}
          </span>
          <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 border ${
            isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-500'
          }`}>
            AUDIO
          </span>
        </div>

        {/* Title */}
        <h3
          className={`font-editorial-title tracking-tight line-clamp-1 mb-1 transition-colors ${
            isFeatured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
          } ${isDark ? 'text-white group-hover:text-neutral-200' : 'text-black group-hover:text-neutral-800'}`}
          title={track.title}
        >
          {track.title}
        </h3>

        {/* Artist */}
        <p
          className={`text-xs font-mono line-clamp-1 ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}
          title={track.artist}
        >
          {track.artist}
        </p>
      </div>

      {/* Footer / Context Menu */}
      <div
        className={`mt-3 pt-3 border-t flex items-center justify-between relative ${
          isDark ? 'border-neutral-800/80' : 'border-neutral-200/80'
        }`}
      >
        <span
          className={`text-[9px] font-mono tracking-wider uppercase truncate max-w-[140px] ${
            isDark ? 'text-neutral-500' : 'text-neutral-400'
          }`}
          title={track.album}
        >
          {track.album || 'Single'}
        </span>

        {/* Actions Group */}
        <div className="flex items-center gap-1">
          {/* Quick Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-neutral-500 hover:text-black hover:bg-black/5'
              }`}
              title="More Options"
            >
              <MoreVertical size={14} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 bottom-full mb-2 w-48 py-1.5 border rounded-sm shadow-2xl z-50 backdrop-blur-md ${
                    isDark ? 'bg-[#141416]/95 border-neutral-700 text-white' : 'bg-white/95 border-neutral-200 text-black'
                  }`}
                >
                  <button
                    onClick={(e) => handleMenuAction(e, () => addToQueueNext(track))}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-2 transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                    }`}
                  >
                    <Radio size={13} />
                    <span>Play Next</span>
                  </button>

                  <button
                    onClick={(e) => handleMenuAction(e, () => addToQueue(track))}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-2 transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                    }`}
                  >
                    <ListPlus size={13} />
                    <span>Add to Queue</span>
                  </button>

                  {customPlaylists.length > 0 && (
                    <div className={`mt-1 pt-1 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                      <div className="px-3 py-1 text-[9px] font-mono uppercase text-neutral-500 tracking-wider">
                        Add to Playlist
                      </div>
                      {customPlaylists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={(e) => handleMenuAction(e, () => addToPlaylist(pl.id, track))}
                          className={`w-full text-left px-3 py-1 text-xs font-mono truncate flex items-center gap-1.5 transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                        >
                          <Plus size={11} />
                          <span className="truncate">{pl.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mini Play/Pause Indicator Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className={`w-7 h-7 flex items-center justify-center border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 hover:border-white bg-neutral-900/60 text-white'
                : 'border-neutral-200 hover:border-black bg-neutral-100/60 text-black'
            }`}
          >
            {showPause ? <Pause size={11} className="fill-current" /> : <Play size={11} className="fill-current ml-0.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
