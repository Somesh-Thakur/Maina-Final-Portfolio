'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Plus,
  Play,
  Share2,
  Mic2,
  Sparkles,
  Volume2,
  VolumeX,
  Disc,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { audioFX } from '@/lib/audioFX';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { SocialShareModal } from './SocialShareModal';
import type { FlowReelItem, Track, ThemeMode } from '@/types';

interface FlowFeedProps {
  theme?: ThemeMode;
}

export function FlowFeed({ theme = 'dark' }: FlowFeedProps) {
  const [reels, setReels] = useState<FlowReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModalTrack, setActiveModalTrack] = useState<Track | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isKaraokeActive, setIsKaraokeActive] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const {
    likedSongs,
    history,
    toggleLike,
    isLiked,
    playTrack,
    addToQueue,
  } = usePlayerStore();

  const isDark = theme === 'dark';

  // Load AI Curated Reels
  const loadReels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/curate-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likedTracks: likedSongs.slice(0, 5),
          history: history.slice(0, 5),
        }),
      });

      const json = await res.json();
      if (json.status === 'SUCCESS' && Array.isArray(json.data)) {
        setReels(json.data);
      }
    } catch (err) {
      console.error('Failed to load Flow reels:', err);
    } finally {
      setIsLoading(false);
    }
  }, [likedSongs, history]);

  useEffect(() => {
    loadReels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play preview when active index changes
  useEffect(() => {
    const currentReel = reels[activeIndex];
    const audio = audioPreviewRef.current;

    if (currentReel && audio) {
      audio.src = currentReel.track.audioUrl;
      audio.currentTime = currentReel.previewStartOffset || 30;
      audio.play().catch(() => {});
    }

    return () => {
      if (audio) audio.pause();
    };
  }, [activeIndex, reels]);

  // Handle intersection observer on scroll snap
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
      setActiveIndex(newIndex);
    }
  };

  const handlePlayFullSong = (track: Track) => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    playTrack(track);
    // Add remaining reels to queue
    reels.slice(activeIndex + 1).forEach((r) => addToQueue(r.track));
  };

  const handleToggleKaraoke = () => {
    const next = !isKaraokeActive;
    setIsKaraokeActive(next);
    audioFX.setKaraoke(next);
  };

  return (
    <div className="relative w-full h-[calc(100vh-90px)] max-h-[920px] flex items-center justify-center overflow-hidden">
      {/* Hidden audio element for instant reel snippet preview */}
      <audio ref={audioPreviewRef} crossOrigin="anonymous" loop preload="auto" />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin border-white/60" />
          <p className="editorial-meta text-xs tracking-widest uppercase animate-pulse">
            AI Curating Your Visual Flow...
          </p>
        </div>
      )}

      {/* Vertical Snapping Container */}
      {!isLoading && reels.length > 0 && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full max-w-md sm:max-w-lg h-full snap-y snap-mandatory overflow-y-scroll scrollbar-none rounded-xl border border-neutral-800 shadow-2xl relative bg-black"
        >
          {reels.map((reel, idx) => {
            const isPlayingThis = idx === activeIndex;
            const liked = isLiked(reel.track.id);

            return (
              <div
                key={reel.id}
                className="w-full h-full snap-start snap-always relative flex flex-col justify-between p-6 overflow-hidden select-none"
              >
                {/* Background Dynamic Artwork Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-125 opacity-40 -z-10"
                  style={{ backgroundImage: `url(${reel.track.coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent -z-10" />

                {/* Top Badge: AI Vibe Tag */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
                    <Sparkles size={12} className="text-[#FF2D55]" />
                    <span className="font-mono text-[10px] text-white uppercase tracking-widest font-bold">
                      {reel.vibeTag}
                    </span>
                  </div>

                  <button
                    onClick={loadReels}
                    className="p-2 rounded-full bg-black/50 border border-white/15 text-white/70 hover:text-white cursor-pointer"
                    title="Refresh AI Flow"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {/* Center Visual Element: Large Cover Art with Spinning Vinyl Peek */}
                <div className="my-auto flex items-center justify-center relative">
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                    {/* Vinyl Record behind */}
                    <div
                      className={`absolute inset-0 rounded-full border-4 border-neutral-900 bg-neutral-950 shadow-2xl transition-transform duration-700 ${
                        isPlayingThis ? 'translate-x-12 animate-spin' : 'translate-x-0'
                      }`}
                      style={{
                        animationDuration: '10s',
                        background: 'radial-gradient(circle, #222 20%, #111 50%, #050505 100%)',
                      }}
                    >
                      <div className="absolute inset-0 m-auto w-16 h-16 rounded-full border-2 border-white/20 bg-neutral-800 flex items-center justify-center">
                        <Disc size={20} className="text-white/40" />
                      </div>
                    </div>

                    {/* Album Art Front Sleeve */}
                    <img
                      src={reel.track.coverUrl}
                      alt={reel.track.title}
                      className="w-full h-full object-cover rounded-md border border-white/20 shadow-2xl relative z-10"
                    />
                  </div>
                </div>

                {/* Bottom Overlay & Right Action Rail */}
                <div className="flex items-end justify-between gap-4 pb-4">
                  {/* Left Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 uppercase">
                        {reel.moodDescriptor}
                      </span>
                    </div>
                    <h2 className="font-editorial-title text-2xl sm:text-3xl text-white font-normal truncate">
                      {reel.track.title}
                    </h2>
                    <p className="font-mono text-xs text-white/70 tracking-widest uppercase truncate mt-0.5">
                      {reel.track.artist}
                    </p>

                    {/* Play Full Song CTA */}
                    <button
                      onClick={() => handlePlayFullSong(reel.track)}
                      className="mt-3.5 px-4 py-2 bg-white text-black font-mono text-xs uppercase tracking-widest font-bold rounded-full flex items-center gap-2 shadow-lg hover:bg-neutral-200 transition-all cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Play Full Song</span>
                    </button>
                  </div>

                  {/* Right Floating Action Rail */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    {/* Like Button with Bouncy Spring */}
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => toggleLike(reel.track)}
                      className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-xl flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Heart
                        size={20}
                        className={liked ? 'text-[#FF2D55] fill-[#FF2D55]' : 'text-white'}
                      />
                    </motion.button>

                    {/* Add to Playlist Button */}
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => {
                        setActiveModalTrack(reel.track);
                        setIsPlaylistModalOpen(true);
                      }}
                      className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-xl cursor-pointer"
                      title="Add to Playlist"
                    >
                      <Plus size={20} />
                    </motion.button>

                    {/* Vocal Reducer (Karaoke) Switch */}
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={handleToggleKaraoke}
                      className={`p-3 rounded-full border backdrop-blur-md shadow-xl transition-colors cursor-pointer ${
                        isKaraokeActive
                          ? 'bg-[#2563eb] border-[#2563eb] text-white'
                          : 'bg-black/60 border-white/20 text-white'
                      }`}
                      title={isKaraokeActive ? 'Vocal Reducer Active' : 'Enable Vocal Reducer'}
                    >
                      <Mic2 size={20} />
                    </motion.button>

                    {/* Instagram Story / Card Share Generator */}
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => {
                        setActiveModalTrack(reel.track);
                        setIsShareModalOpen(true);
                      }}
                      className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-xl cursor-pointer"
                      title="Export Story Card"
                    >
                      <Share2 size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeModalTrack && (
        <>
          <AddToPlaylistModal
            isOpen={isPlaylistModalOpen}
            onClose={() => setIsPlaylistModalOpen(false)}
            track={activeModalTrack}
            theme={theme}
          />
          <SocialShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            track={activeModalTrack}
            theme={theme}
          />
        </>
      )}
    </div>
  );
}
