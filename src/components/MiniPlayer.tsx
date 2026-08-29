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

  return (
    <>
      <AnimatePresence>
        {!isFlowActive && !isFullscreenPlayer && currentTrack && (
          <motion.div
            key="mini-player-dock"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed bottom-0 left-0 w-full z-40 backdrop-blur-md border-t transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-[#0a0a0c]/95 border-neutral-800 text-white'
                : 'bg-white/95 border-neutral-200 text-black'
            }`}
          >
            <div className="w-full max-w-[1720px] px-4 sm:px-8 md:px-12 mx-auto py-3">
              {/* Progress Scrubber */}
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
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-current rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center justify-between">
                {/* Left: Track Information, Like & Playlist Buttons */}
                <div className="w-1/3 flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={onExpandPlayer}
                    className="relative w-11 h-11 shrink-0 group border border-neutral-700/50 overflow-hidden cursor-pointer rounded-sm"
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

                  <div className="min-w-0 overflow-hidden flex-1">
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
                    className={`w-10 h-10 flex items-center justify-center border transition-all cursor-pointer ${
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
                <div className="w-1/3 flex items-center justify-end gap-5 hidden sm:flex">
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
                    title="Open Studio View"
                  >
                    <Maximize2 size={16} />
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
