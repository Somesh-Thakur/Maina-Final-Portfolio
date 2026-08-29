'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Disc,
  Mic2,
  Share2,
  Sparkles,
  Download,
  Moon,
  Info,
  BookOpen,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { fetchSyncedLyrics } from '@/lib/api/lyrics';
import { hasDevanagari, transliterateLyricLines } from '@/lib/transliterate';
import { audioFX } from '@/lib/audioFX';
import { offlineStorage } from '@/lib/offlineStorage';
import { Visualizer } from './Visualizer';
import { SyncedLyrics } from './SyncedLyrics';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { SocialShareModal } from './SocialShareModal';
import { ScreensaverView } from './ScreensaverView';
import { LikeButton } from './LikeButton';
import type { LyricLine, SongLore, ThemeMode } from '@/types';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export function FullscreenPlayer({ isOpen, onClose, theme }: FullscreenPlayerProps) {
  const {
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    playTrackFromQueue,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [scriptMode, setScriptMode] = useState<'HI' | 'HINGLISH'>('HI');
  const [rightView, setRightView] = useState<'lyrics' | 'queue' | 'story'>('lyrics');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isScreensaverOpen, setIsScreensaverOpen] = useState(false);
  const [isKaraokeActive, setIsKaraokeActive] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  const [songLore, setSongLore] = useState<SongLore | null>(null);
  const [loadingLore, setLoadingLore] = useState(false);

  // Load lyrics on song change
  useEffect(() => {
    if (currentTrack && isOpen) {
      setLyrics([]);
      const loadLyrics = async () => {
        setLoadingLyrics(true);
        try {
          const fetchedLyrics = await fetchSyncedLyrics(
            currentTrack.title,
            currentTrack.artist,
            currentTrack.duration
          );
          setLyrics(fetchedLyrics);
        } catch (error) {
          console.error('Failed to load lyrics', error);
          setLyrics([]);
        } finally {
          setLoadingLyrics(false);
        }
      };
      loadLyrics();
    }
  }, [currentTrack?.id, currentTrack?.title, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check offline status
  useEffect(() => {
    if (currentTrack) {
      offlineStorage.isTrackOffline(currentTrack.id).then(setIsCached);
    }
  }, [currentTrack?.id]);

  // Load song lore when story tab is active
  useEffect(() => {
    if (currentTrack && isOpen && rightView === 'story') {
      const loadLore = async () => {
        setLoadingLore(true);
        try {
          const res = await fetch(
            `/api/ai/lore?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(
              currentTrack.artist
            )}&album=${encodeURIComponent(currentTrack.album || '')}`
          );
          const json = await res.json();
          if (json.status === 'SUCCESS' && json.data) {
            setSongLore(json.data);
          }
        } catch (err) {
          console.error('Failed to load song lore', err);
        } finally {
          setLoadingLore(false);
        }
      };
      loadLore();
    }
  }, [currentTrack?.id, rightView, isOpen]);

  const isHindi = useMemo(() => hasDevanagari(lyrics), [lyrics]);

  const displayedLyrics = useMemo(() => {
    if (isHindi && scriptMode === 'HINGLISH') {
      return transliterateLyricLines(lyrics);
    }
    return lyrics;
  }, [lyrics, scriptMode, isHindi]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleKaraoke = () => {
    const next = !isKaraokeActive;
    setIsKaraokeActive(next);
    audioFX.setKaraoke(next);
  };

  const handleOfflineCache = async () => {
    if (!currentTrack || isCaching) return;
    setIsCaching(true);
    try {
      if (isCached) {
        await offlineStorage.deleteOfflineTrack(currentTrack.id);
        setIsCached(false);
      } else {
        const success = await offlineStorage.saveTrackOffline(currentTrack);
        if (success) setIsCached(true);
      }
    } finally {
      setIsCaching(false);
    }
  };

  // Find active lyric line text for social share preview
  const activeLyricText = useMemo(() => {
    const active = lyrics.find((line, idx) => {
      const nextLine = lyrics[idx + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
    return active?.text;
  }, [lyrics, currentTime]);

  if (!isOpen || !currentTrack) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Solid Opaque Dark Backdrop */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-[#fafafa]'
          }`}
        />

        {/* Ambient Mesh Glows */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at 20% 30%, var(--ambient-primary, #2563eb) 0%, transparent 55%),
                         radial-gradient(circle at 80% 70%, var(--ambient-secondary, #7c3aed) 0%, transparent 55%)`,
          }}
        />

        {/* Main Fullscreen Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 select-none ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}
        >
          {/* Top Control Bar */}
          <header className="flex items-center justify-between border-b pb-4 transition-colors duration-500 border-neutral-200/40 dark:border-neutral-800/80">
            <div className="flex items-center gap-3">
              <span className="editorial-badge text-xs uppercase tracking-widest px-2.5 py-1">
                Studio Fidelity
              </span>
              <span className="editorial-meta opacity-60 text-xs hidden sm:inline-block">
                Master 320 KBPS AAC // AudioFX Engine
              </span>
            </div>

            {/* Quick Actions Header: Screensaver, Karaoke, Share, Offline, Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScreensaverOpen(true)}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-neutral-800 hover:border-neutral-500 bg-neutral-900/50 text-neutral-300'
                    : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-700'
                }`}
                title="Ambient Screensaver Mode"
              >
                <Moon size={15} />
              </button>

              <button
                onClick={handleToggleKaraoke}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isKaraokeActive
                    ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-lg'
                    : theme === 'dark'
                    ? 'border-neutral-800 hover:border-neutral-500 bg-neutral-900/50 text-neutral-300'
                    : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-700'
                }`}
                title={isKaraokeActive ? 'Karaoke Vocal Reducer Active' : 'Enable Karaoke Vocal Reducer'}
              >
                <Mic2 size={15} />
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-neutral-800 hover:border-neutral-500 bg-neutral-900/50 text-neutral-300'
                    : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-700'
                }`}
                title="Export Instagram Story Card"
              >
                <Share2 size={15} />
              </button>

              <button
                onClick={handleOfflineCache}
                disabled={isCaching}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isCached
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : theme === 'dark'
                    ? 'border-neutral-800 hover:border-neutral-500 bg-neutral-900/50 text-neutral-300'
                    : 'border-neutral-200 hover:border-neutral-400 bg-neutral-100/50 text-neutral-700'
                }`}
                title={isCached ? 'Saved in Offline Storage' : 'Download for Offline Listening'}
              >
                <Download size={15} className={isCaching ? 'animate-bounce' : ''} />
              </button>

              <button
                onClick={onClose}
                className={`p-2 rounded-full border transition-all cursor-pointer ml-2 ${
                  theme === 'dark'
                    ? 'border-neutral-800 hover:border-white bg-neutral-900/80 text-white'
                    : 'border-neutral-200 hover:border-black bg-neutral-100/80 text-black'
                }`}
                title="Exit Fullscreen (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Two-Column Studio Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 my-6 min-h-0 items-center">
            {/* ─── LEFT COLUMN: VINYL SLEEVE & CONTROLS (5 Cols) ─── */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
              {/* Vinyl Sleeve with Dynamic Rotational Inertia */}
              <div className="relative mb-6 flex items-center justify-center group">
                {/* Vinyl Record */}
                <div
                  className={`absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border-4 border-neutral-900 shadow-2xl transition-transform duration-700 ease-out z-0 ${
                    isPlaying ? 'translate-x-14 sm:translate-x-20 animate-spin' : 'translate-x-0'
                  }`}
                  style={{
                    animationDuration: '10s',
                    background: 'radial-gradient(circle, #222 20%, #111 50%, #050505 100%)',
                  }}
                >
                  <div className="absolute inset-0 m-auto w-20 h-20 rounded-full border-2 border-white/20 bg-neutral-800 flex items-center justify-center">
                    <Disc size={28} className="text-white/40" />
                  </div>
                </div>

                {/* Album Art Front Sleeve */}
                <div className="relative z-10 w-60 h-60 sm:w-72 sm:h-72 rounded-sm border shadow-2xl overflow-hidden border-neutral-700/80 bg-neutral-900">
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover grayscale contrast-125"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
                    <span className="font-mono text-[9px] bg-black/80 text-white px-2 py-0.5 border border-white/20 uppercase tracking-widest backdrop-blur-sm">
                      320 KBPS
                    </span>
                    {isCached && (
                      <span className="font-mono text-[9px] bg-emerald-600/90 text-white px-2 py-0.5 border border-emerald-400 uppercase tracking-widest backdrop-blur-sm">
                        OFFLINE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4-Mode Dynamic Visualizer */}
              <div className="mb-4 w-full max-w-sm flex justify-center">
                <Visualizer isPlaying={isPlaying} variant="bars" theme={theme} showModeToggle={true} />
              </div>

              {/* Track Info Header + Like & Playlist Buttons */}
              <div className="w-full max-w-md flex items-center justify-between mb-4 px-2">
                <div className="min-w-0 flex-1 text-left">
                  <h1 className="font-editorial-title text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight mb-1 truncate">
                    {currentTrack.title}
                  </h1>
                  <p className="font-mono text-neutral-500 dark:text-neutral-400 text-xs tracking-widest uppercase truncate">
                    {currentTrack.artist} • {currentTrack.album || 'Single'}
                  </p>
                </div>

                <div className="ml-3 shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={() => setIsPlaylistModalOpen(true)}
                    className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-neutral-800 hover:border-white bg-neutral-900/60 text-neutral-400 hover:text-white'
                        : 'border-neutral-200 hover:border-black bg-neutral-100/60 text-neutral-600 hover:text-black'
                    }`}
                    title="Add to Playlist"
                  >
                    <Plus size={16} />
                  </button>
                  <LikeButton track={currentTrack} size={16} />
                </div>
              </div>

              {/* Scrub Bar Slider */}
              <div className="w-full max-w-md mb-4 px-2">
                <div className="relative flex items-center group">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-1.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Transport Controls Row */}
              <div className="flex items-center justify-center gap-5 sm:gap-7 mb-4">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-all cursor-pointer ${
                    isShuffle
                      ? 'text-[#2563eb]'
                      : 'text-neutral-400 hover:text-current'
                  }`}
                  title="Fair Shuffle"
                >
                  <Shuffle size={18} />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-2 text-neutral-400 hover:text-current transition-all cursor-pointer"
                  title="Previous Song"
                >
                  <SkipBack size={22} />
                </button>

                <button
                  onClick={togglePlay}
                  className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-2xl ${
                    theme === 'dark'
                      ? 'bg-white text-black border-white hover:scale-105'
                      : 'bg-black text-white border-black hover:scale-105'
                  }`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-2 text-neutral-400 hover:text-current transition-all cursor-pointer"
                  title="Next Song"
                >
                  <SkipForward size={22} />
                </button>

                <button
                  onClick={cycleRepeatMode}
                  className={`p-2 transition-all relative cursor-pointer ${
                    repeatMode !== 'off'
                      ? 'text-[#2563eb]'
                      : 'text-neutral-400 hover:text-current'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <Repeat size={18} />
                  {repeatMode === 'one' && (
                    <span className="absolute top-1 right-1 text-[9px] font-mono font-bold">1</span>
                  )}
                </button>
              </div>

              {/* Volume Rocker Slider */}
              <div className="w-full max-w-xs flex items-center gap-3 px-4 py-2 border rounded-full border-neutral-200/40 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                <button
                  onClick={toggleMute}
                  className="text-neutral-400 hover:text-current cursor-pointer shrink-0"
                >
                  {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="text-[10px] font-mono text-neutral-400 w-7 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: DYNAMIC 3-SEGMENT PANEL (7 Cols) ─── */}
            <div
              className={`lg:col-span-7 h-full flex flex-col p-6 sm:p-8 rounded-2xl border backdrop-blur-xl relative overflow-hidden ${
                theme === 'dark' ? 'border-neutral-800/80 bg-black/40' : 'border-neutral-200/80 bg-white/60'
              }`}
            >
              {/* Header: 3-Segment Switcher [ Lyrics | Queue | Story ] */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200/40 dark:border-neutral-800/80">
                <div className="flex items-center gap-1 p-1 rounded-full border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                  {(['lyrics', 'queue', 'story'] as const).map((viewKey) => {
                    const isActive = rightView === viewKey;
                    return (
                      <button
                        key={viewKey}
                        onClick={() => setRightView(viewKey)}
                        className={`relative px-4 py-1.5 text-xs font-mono uppercase tracking-widest transition-all cursor-pointer rounded-full ${
                          isActive
                            ? theme === 'dark'
                              ? 'text-white font-bold'
                              : 'text-black font-bold'
                            : 'text-neutral-500 hover:text-current'
                        }`}
                      >
                        {viewKey === 'lyrics' && 'Lyrics'}
                        {viewKey === 'queue' && `Queue (${queue.length})`}
                        {viewKey === 'story' && 'Story / Lore'}

                        {isActive && (
                          <motion.div
                            layoutId="fullscreen-view-pill"
                            className={`absolute inset-0 rounded-full -z-10 ${
                              theme === 'dark'
                                ? 'bg-white/15 border border-white/20'
                                : 'bg-black/10 border border-black/15'
                            }`}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Script Mode Pill for Hindi Songs */}
                {rightView === 'lyrics' && isHindi && (
                  <div className="flex items-center gap-1 p-0.5 rounded-full border border-neutral-200/60 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5">
                    <button
                      onClick={() => setScriptMode('HI')}
                      className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full transition-all cursor-pointer ${
                        scriptMode === 'HI'
                          ? 'bg-neutral-800 text-white font-bold'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                    >
                      HI
                    </button>
                    <button
                      onClick={() => setScriptMode('HINGLISH')}
                      className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full transition-all cursor-pointer ${
                        scriptMode === 'HINGLISH'
                          ? 'bg-neutral-800 text-white font-bold'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                    >
                      HINGLISH
                    </button>
                  </div>
                )}

                {/* Clear Queue button */}
                {rightView === 'queue' && queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Clear Queue</span>
                  </button>
                )}
              </div>

              {/* Dynamic View Body */}
              <div className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                  {/* ─── TAB 1: SYNCHRONIZED LYRICS ─── */}
                  {rightView === 'lyrics' && (
                    <motion.div
                      key="lyrics-panel"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full"
                    >
                      {loadingLyrics ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-xs text-neutral-500 tracking-widest gap-2">
                          <span className="animate-pulse">FETCHING SYNCHRONIZED TRANSMISSION...</span>
                        </div>
                      ) : (
                        <SyncedLyrics
                          lyrics={displayedLyrics}
                          currentTime={currentTime}
                          onSeek={seekTo}
                          theme={theme}
                          isLoading={false}
                        />
                      )}
                    </motion.div>
                  )}

                  {/* ─── TAB 2: UP NEXT QUEUE ─── */}
                  {rightView === 'queue' && (
                    <motion.div
                      key="queue-panel"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full flex flex-col overflow-hidden"
                    >
                      {/* Now Playing Banner */}
                      <div
                        className={`p-3.5 mb-4 border rounded-xl flex items-center justify-between gap-3 ${
                          theme === 'dark' ? 'border-neutral-800 bg-[#111114]' : 'border-neutral-200 bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={currentTrack.coverUrl}
                            alt=""
                            className="w-11 h-11 object-cover grayscale contrast-125 rounded-md shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[9px] font-mono uppercase text-[#2563eb] font-bold tracking-widest flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-ping" />
                              <span>NOW PLAYING</span>
                            </div>
                            <div className="text-xs font-semibold uppercase truncate">{currentTrack.title}</div>
                            <div className="text-[10px] font-mono text-neutral-500 truncate">{currentTrack.artist}</div>
                          </div>
                        </div>
                        <div className="h-5 w-10 flex items-center justify-center shrink-0">
                          <Visualizer isPlaying={isPlaying} variant="mini" theme={theme} />
                        </div>
                      </div>

                      {/* Upcoming Queue List */}
                      <div className="flex-1 overflow-y-auto custom-lyrics-scrollbar flex flex-col gap-1.5 pr-1">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1 px-1">
                          Up Next ({queue.length})
                        </div>

                        {queue.length > 0 ? (
                          queue.map((track, idx) => (
                            <div
                              key={`${track.id}-${idx}`}
                              onClick={() => playTrackFromQueue(idx)}
                              className={`group flex items-center justify-between p-2.5 border transition-all rounded-lg cursor-pointer ${
                                theme === 'dark'
                                  ? 'border-neutral-800/60 hover:border-neutral-600 bg-black/20 hover:bg-white/5'
                                  : 'border-neutral-200/60 hover:border-neutral-400 bg-white hover:bg-black/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono text-[10px] text-neutral-500 w-4 text-right shrink-0">
                                  {idx + 1}
                                </span>
                                <img
                                  src={track.coverUrl}
                                  alt=""
                                  className="w-9 h-9 object-cover grayscale contrast-125 rounded shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold uppercase truncate group-hover:text-[#2563eb] transition-colors">
                                    {track.title}
                                  </div>
                                  <div className="text-[10px] font-mono text-neutral-500 truncate">
                                    {track.artist}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono text-neutral-500">
                                  {formatTime(track.duration)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromQueue(idx);
                                  }}
                                  className="p-1 rounded text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Remove from queue"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                            <Disc size={28} className="mb-2 opacity-30" />
                            <p className="font-editorial-title text-lg opacity-70">Queue is empty</p>
                            <p className="font-mono text-[10px] uppercase tracking-wider mt-1 opacity-50">
                              Search or click songs to add to queue
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ─── TAB 3: SONG STORY & AI LORE ─── */}
                  {rightView === 'story' && (
                    <motion.div
                      key="story-panel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full flex flex-col overflow-y-auto custom-lyrics-scrollbar pr-2 space-y-5"
                    >
                      {loadingLore ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-xs text-neutral-500 tracking-widest gap-2">
                          <Sparkles size={18} className="animate-spin text-[#FF2D55]" />
                          <span className="animate-pulse">UNCOVERING PRODUCTION LORE...</span>
                        </div>
                      ) : songLore ? (
                        <>
                          {/* 1-Sentence Vibe Summary */}
                          <div className="p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5">
                            <div className="font-mono text-[10px] uppercase text-[#FF2D55] font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                              <Sparkles size={12} />
                              <span>Sonic Essence</span>
                            </div>
                            <p className="font-editorial-title text-lg text-neutral-200 font-light leading-relaxed">
                              &ldquo;{songLore.vibeSummary}&rdquo;
                            </p>
                          </div>

                          {/* Production & Lyrical Trivia */}
                          <div>
                            <div className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-2.5 flex items-center gap-1.5">
                              <BookOpen size={14} className="text-[#2563eb]" />
                              <span>Studio &amp; Composition Trivia</span>
                            </div>
                            <div className="space-y-2.5">
                              {songLore.trivia.map((fact, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 bg-black/5 dark:bg-white/5 text-xs font-mono text-neutral-300 leading-relaxed"
                                >
                                  • {fact}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Musical Metadata Badges: Mood Tags, BPM, Key */}
                          <div className="pt-2 border-t border-neutral-200/40 dark:border-neutral-800/60">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {songLore.moodTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 rounded-full text-[10px] font-mono border border-neutral-700 bg-neutral-900/60 text-neutral-300"
                                >
                                  {tag}
                                </span>
                              ))}
                              {songLore.bpm && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono border border-amber-800 bg-amber-950/40 text-amber-300">
                                  {songLore.bpm} BPM
                                </span>
                              )}
                              {songLore.key && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono border border-indigo-800 bg-indigo-950/40 text-indigo-300">
                                  Key: {songLore.key}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Child Modals */}
        <AddToPlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          track={currentTrack}
          theme={theme}
        />

        <SocialShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          track={currentTrack}
          currentLyric={activeLyricText}
          theme={theme}
        />

        <ScreensaverView
          isOpen={isScreensaverOpen}
          onClose={() => setIsScreensaverOpen(false)}
          lyrics={displayedLyrics}
        />
      </div>
    </AnimatePresence>
  );
}
