'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { Visualizer } from './Visualizer';
import { LikeButton } from './LikeButton';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  BookmarkPlus,
} from 'lucide-react';
import Image from 'next/image';

interface MiniPlayerProps {
  theme: 'dark' | 'light';
  onExpandPlayer: () => void;
}

export function MiniPlayer({ theme, onExpandPlayer }: MiniPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    activeTab,
    isFullscreenPlayer,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayerStore();

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const isFlowActive = activeTab === 'flow';

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <AnimatePresence>
        {!isFlowActive && !isFullscreenPlayer && currentTrack && (
          <motion.div
            key="mini-player-dock"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[64px] md:bottom-0 left-0 right-0 z-40 px-3 md:px-0 pointer-events-none"
          >
            <div
              className={`w-full max-w-[1720px] mx-auto pointer-events-auto backdrop-blur-2xl transition-colors duration-300 relative rounded-2xl md:rounded-none border md:border-b-0 md:border-x-0 overflow-hidden shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#111116]/95 border-neutral-800/90 text-white shadow-black/80'
                  : 'bg-white/95 border-neutral-200/90 text-black shadow-neutral-500/10'
              }`}
            >
              {/* Progress Line (Top-pinned on card) */}
              <div className="w-full h-[2.5px] bg-neutral-800/40 relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    theme === 'dark' ? 'bg-[#FF2D55]' : 'bg-black'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* ─── DESKTOP EXPANDED CONTROLS DOCK (md+) ─── */}
              <div className="hidden md:flex flex-col px-4 sm:px-8 md:px-12 py-3">
                {/* Desktop Scrubber */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono text-neutral-500 w-10 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 relative h-1.5 flex items-center group cursor-pointer">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className={`w-full h-0.5 rounded-full ${
                        theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          theme === 'dark' ? 'bg-white' : 'bg-black'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-current rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 w-10">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Desktop 3-Column Controls */}
                <div className="flex items-center justify-between">
                  {/* Left: Track Information */}
                  <div className="w-1/3 flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={onExpandPlayer}
                      className="relative w-11 h-11 shrink-0 group border border-neutral-700/50 overflow-hidden cursor-pointer rounded-lg"
                    >
                      <Image
                        src={currentTrack.coverUrl}
                        alt={currentTrack.album}
                        fill
                        sizes="44px"
                        unoptimized
                        className="object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 size={16} />
                      </div>
                    </button>

                    <div className="min-w-0 overflow-hidden flex-1 cursor-pointer" onClick={onExpandPlayer}>
                      <div className="uppercase font-semibold text-xs truncate tracking-wider">
                        {currentTrack.title}
                      </div>
                      <div className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">
                        {currentTrack.artist}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsPlaylistModalOpen(true)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          theme === 'dark'
                            ? 'text-neutral-500 hover:text-white'
                            : 'text-neutral-400 hover:text-black'
                        }`}
                        title="Add to Playlist"
                      >
                        <BookmarkPlus size={17} />
                      </button>
                      <LikeButton track={currentTrack} theme={theme} size={17} />
                    </div>
                  </div>

                  {/* Center: Transport Controls */}
                  <div className="w-1/3 flex items-center justify-center gap-4 sm:gap-6">
                    <button
                      onClick={toggleShuffle}
                      className={`transition-colors cursor-pointer ${
                        isShuffle ? 'text-[#2563eb] font-bold' : 'text-neutral-500 hover:text-current'
                      }`}
                      title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
                    >
                      <Shuffle size={16} />
                    </button>

                    <button
                      onClick={prevTrack}
                      className="text-neutral-500 hover:text-current transition-colors cursor-pointer"
                      title="Previous"
                    >
                      <SkipBack size={20} className="fill-current" />
                    </button>

                    <button
                      onClick={togglePlay}
                      className={`w-10 h-10 flex items-center justify-center border transition-all cursor-pointer rounded-lg ${
                        theme === 'dark'
                          ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
                          : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause size={18} className="fill-current" />
                      ) : (
                        <Play size={18} className="fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={nextTrack}
                      className="text-neutral-500 hover:text-current transition-colors cursor-pointer"
                      title="Next"
                    >
                      <SkipForward size={20} className="fill-current" />
                    </button>

                    <button
                      onClick={cycleRepeatMode}
                      className={`relative transition-colors cursor-pointer ${
                        repeatMode !== 'off'
                          ? 'text-[#2563eb] font-bold'
                          : 'text-neutral-500 hover:text-current'
                      }`}
                      title={`Repeat Mode: ${repeatMode.toUpperCase()}`}
                    >
                      <Repeat size={16} />
                      {repeatMode === 'one' && (
                        <span className="absolute -top-1.5 -right-2 text-[8px] font-bold bg-[#2563eb] text-white px-1 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          1
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Right: Visualizer, Volume & Fullscreen Trigger */}
                  <div className="w-1/3 flex items-center justify-end gap-5">
                    <div className="h-6 w-14 flex items-center justify-center">
                      <Visualizer isPlaying={isPlaying} variant="mini" theme={theme} />
                    </div>

                    <div className="flex items-center gap-2 group w-28">
                      <button
                        onClick={toggleMute}
                        className="text-neutral-500 hover:text-current transition-colors cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <div className="flex-1 h-1 relative flex items-center cursor-pointer">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div
                          className={`w-full h-0.5 ${
                            theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'
                          }`}
                        >
                          <div
                            className={`h-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onExpandPlayer}
                      className="text-neutral-500 hover:text-current transition-colors cursor-pointer p-1.5 rounded"
                      title="Open Fullscreen Studio"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── NATIVE MOBILE TOUCH CARD (< md) ─── */}
              <div className="md:hidden flex items-center justify-between p-2.5 sm:p-3 gap-3">
                {/* Left: Artwork + Title/Artist (Tapping expands to fullscreen) */}
                <div
                  onClick={onExpandPlayer}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer active:opacity-80 select-none"
                >
                  <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden border border-neutral-700/50 shadow-md">
                    <Image
                      src={currentTrack.coverUrl}
                      alt={currentTrack.album}
                      fill
                      sizes="44px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm truncate tracking-wide">
                      {currentTrack.title}
                    </div>
                    <div className="font-mono text-[10px] text-neutral-400 truncate mt-0.5">
                      {currentTrack.artist}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <LikeButton track={currentTrack} theme={theme} size={18} />

                  <button
                    onClick={nextTrack}
                    className="p-2 text-neutral-400 hover:text-white cursor-pointer active:scale-95 transition-transform"
                    title="Next Track"
                  >
                    <SkipForward size={18} className="fill-current" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md ${
                      theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                    }`}
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause size={16} className="fill-current" />
                    ) : (
                      <Play size={16} className="fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        theme={theme}
      />
    </>
  );
}
