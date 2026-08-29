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
  Music2,
  ListMusic,
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
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue' | 'story'>('player');
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
    if (currentTrack && isOpen && activeTab === 'story') {
      const loadLore = async () => {
        setLoadingLore(true);
        try {
          const res = await fetch(
            `/api/ai/lore?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(
              currentTrack.artist
            )}`
          );
          const json = await res.json();
          if (json.status === 'SUCCESS' && json.data) {
            setSongLore(json.data);
          }
        } catch {
          setSongLore(null);
        } finally {
          setLoadingLore(false);
        }
      };
      loadLore();
    }
  }, [currentTrack?.id, activeTab, isOpen]);

  // Detect Devanagari Hindi text in lyrics
  const containsDevanagari = useMemo(() => {
    return lyrics.some((l) => hasDevanagari(l.text));
  }, [lyrics]);

  // Active Transliterated Lyrics
  const displayLyrics = useMemo(() => {
    if (scriptMode === 'HINGLISH' && containsDevanagari) {
      return transliterateLyricLines(lyrics);
    }
    return lyrics;
  }, [lyrics, scriptMode, containsDevanagari]);

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleKaraoke = () => {
    const nextState = !isKaraokeActive;
    setIsKaraokeActive(nextState);
    audioFX.toggleKaraoke(nextState);
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
      <div className="fixed inset-0 z-[100] overflow-hidden flex flex-col">
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
          className={`relative z-10 w-full h-full flex flex-col justify-between p-4 sm:p-8 lg:p-10 select-none max-w-[1720px] mx-auto ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}
        >
          {/* ─── TOP CONTROL BAR ─── */}
          <header className="flex items-center justify-between border-b pb-3.5 transition-colors duration-500 border-neutral-200/40 dark:border-neutral-800/80 shrink-0">
            {/* Left: Mobile Segmented Switcher & Desktop Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile View Switcher Tabs (< lg) */}
              <div className="flex lg:hidden items-center p-1 rounded-full border border-neutral-200/50 dark:border-neutral-800/80 bg-black/10 dark:bg-white/5 backdrop-blur-md">
                {[
                  { id: 'player', label: 'Play', icon: Music2 },
                  { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
                  { id: 'queue', label: `Queue (${queue.length})`, icon: ListMusic },
                  { id: 'story', label: 'Story', icon: BookOpen },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? theme === 'dark'
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'bg-black text-white font-bold shadow-md'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Brand Badge */}
              <div className="hidden lg:flex items-center gap-3">
                <span className="editorial-badge text-xs uppercase tracking-widest px-2.5 py-1">
                  Studio Fidelity
                </span>
                <span className="editorial-meta opacity-60 text-xs">
                  Master 320 KBPS AAC // AudioFX Engine
                </span>
              </div>
            </div>

            {/* Right: Quick Utility Icons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
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
                className={`p-2 rounded-full border transition-all cursor-pointer ml-1 sm:ml-2 ${
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

          {/* ─── MAIN RESPONSIVE CONTENT VIEWPORT ─── */}
          <div className="flex-1 my-4 sm:my-6 min-h-0 overflow-hidden flex flex-col justify-center">
            {/* 1. DESKTOP TWO-COLUMN STUDIO GRID (lg+) */}
            <div className="hidden lg:grid grid-cols-12 gap-10 h-full items-center">
              {/* Left Column: Vinyl Artwork & Controls */}
              <div className="col-span-5 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
                {/* Vinyl & Artwork */}
                <div className="relative mb-6 flex items-center justify-center group">
                  <div
                    className={`absolute w-72 h-72 rounded-full border-4 border-neutral-900 shadow-2xl transition-transform duration-700 ease-out z-0 ${
                      isPlaying ? 'translate-x-20 animate-spin' : 'translate-x-0'
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

                  <div className="relative z-10 w-72 h-72 rounded-sm border shadow-2xl overflow-hidden border-neutral-700/80 bg-neutral-900">
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

                {/* Track Info */}
                <div className="w-full max-w-md flex items-center justify-between mb-3 px-2">
                  <div className="min-w-0 flex-1 text-left">
                    <h1 className="font-editorial-title text-3xl font-normal tracking-tight mb-1 truncate">
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

                {/* Scrubber */}
                <div className="w-full max-w-md mb-4 px-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-1.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <button onClick={toggleShuffle} className={`p-2 transition-all ${isShuffle ? 'text-[#2563eb]' : 'text-neutral-400 hover:text-current'}`}>
                    <Shuffle size={18} />
                  </button>
                  <button onClick={prevTrack} className="p-2 text-neutral-400 hover:text-current transition-all">
                    <SkipBack size={22} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all shadow-2xl ${
                      theme === 'dark' ? 'bg-white text-black border-white hover:scale-105' : 'bg-black text-white border-black hover:scale-105'
                    }`}
                  >
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={nextTrack} className="p-2 text-neutral-400 hover:text-current transition-all">
                    <SkipForward size={22} />
                  </button>
                  <button onClick={cycleRepeatMode} className={`p-2 transition-all relative ${repeatMode !== 'off' ? 'text-[#2563eb]' : 'text-neutral-400 hover:text-current'}`}>
                    <Repeat size={18} />
                    {repeatMode === 'one' && <span className="absolute top-1 right-1 text-[9px] font-mono font-bold">1</span>}
                  </button>
                </div>

                {/* Volume Rocker */}
                <div className="w-full max-w-xs flex items-center gap-3 px-4 py-2 border rounded-full border-neutral-200/40 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                  <button onClick={toggleMute} className="text-neutral-400 hover:text-current shrink-0">
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

              {/* Right Column: Lyrics / Queue / Story Panel */}
              <div
                className={`col-span-7 h-full flex flex-col p-6 rounded-2xl border backdrop-blur-xl relative overflow-hidden ${
                  theme === 'dark' ? 'border-neutral-800/80 bg-black/40' : 'border-neutral-200/80 bg-white/60'
                }`}
              >
                {/* Header Switcher */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200/40 dark:border-neutral-800/80">
                  <div className="flex items-center gap-1 p-1 rounded-full border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                    {(['lyrics', 'queue', 'story'] as const).map((viewKey) => {
                      const isActive = activeTab === viewKey;
                      return (
                        <button
                          key={viewKey}
                          onClick={() => setActiveTab(viewKey)}
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
                              layoutId="desktop-view-pill"
                              className={`absolute inset-0 rounded-full -z-10 ${
                                theme === 'dark' ? 'bg-neutral-800 shadow' : 'bg-neutral-200 shadow'
                              }`}
                              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Transliteration Script Toggle (Only on Lyrics view) */}
                  {activeTab === 'lyrics' && containsDevanagari && (
                    <button
                      onClick={() => setScriptMode((prev) => (prev === 'HI' ? 'HINGLISH' : 'HI'))}
                      className={`px-3 py-1 text-xs font-mono border rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        scriptMode === 'HINGLISH'
                          ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-md'
                          : 'border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{scriptMode === 'HINGLISH' ? 'Hinglish (Phonetic)' : 'हिन्दी (Hindi)'}</span>
                    </button>
                  )}
                </div>

                {/* View 1: Synced Lyrics */}
                {activeTab === 'lyrics' && (
                  <div className="flex-1 min-h-0 relative">
                    <SyncedLyrics
                      lyrics={displayLyrics}
                      currentTime={currentTime}
                      onSeek={seekTo}
                      theme={theme}
                      isLoading={loadingLyrics}
                    />
                  </div>
                )}

                {/* View 2: Queue */}
                {activeTab === 'queue' && (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                        Upcoming Tracks ({queue.length})
                      </span>
                      {queue.length > 0 && (
                        <button onClick={clearQueue} className="text-[11px] font-mono text-neutral-500 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                          <Trash2 size={12} />
                          <span>Clear Queue</span>
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {queue.map((track, idx) => (
                        <div
                          key={`queue-${track.id}-${idx}`}
                          onClick={() => playTrackFromQueue(idx)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-800/60 bg-black/20 hover:bg-white/5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate group-hover:text-[#FF2D55] transition-colors">{track.title}</div>
                              <div className="text-[10px] font-mono text-neutral-500 truncate">{track.artist}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(idx);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View 3: Story & Lore */}
                {activeTab === 'story' && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    {loadingLore ? (
                      <div className="h-full flex items-center justify-center font-mono text-xs text-neutral-400 animate-pulse">
                        Synthesizing Track Lore &amp; Musical Backstory...
                      </div>
                    ) : songLore ? (
                      <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-xl border border-neutral-800 bg-black/30">
                          <span className="text-[10px] font-mono text-[#FF2D55] uppercase tracking-widest font-bold">Vibe Summary</span>
                          <p className="text-sm mt-1 leading-relaxed">{songLore.vibeSummary}</p>
                          {songLore.moodTags && songLore.moodTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {songLore.moodTags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-neutral-300">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {songLore.trivia && songLore.trivia.length > 0 && (
                          <div className="p-4 rounded-xl border border-neutral-800 bg-black/30">
                            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Studio Lore &amp; Trivia</span>
                            <ul className="text-xs text-neutral-300 mt-2 space-y-1.5 list-disc list-inside leading-relaxed">
                              {songLore.trivia.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl border border-neutral-800 bg-black/30 text-center">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">Tempo</span>
                            <div className="text-sm font-mono font-bold mt-0.5">{songLore.bpm ? `${songLore.bpm} BPM` : 'Adaptive'}</div>
                          </div>
                          <div className="p-3 rounded-xl border border-neutral-800 bg-black/30 text-center">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">Key</span>
                            <div className="text-sm font-mono font-bold mt-0.5">{songLore.key || 'Dynamic'}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center font-mono text-xs text-neutral-500">
                        No story notes found for this track.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. NATIVE MOBILE FULLSCREEN VIEWPORT (< lg) */}
            <div className="lg:hidden h-full flex flex-col justify-between overflow-hidden">
              {/* Tab 1: Mobile Player View */}
              {activeTab === 'player' && (
                <div className="h-full flex flex-col justify-between items-center text-center py-2">
                  {/* Hero Artwork with Smooth Shadow */}
                  <div className="w-full max-w-[280px] xs:max-w-[320px] aspect-square rounded-2xl overflow-hidden border border-neutral-700/80 shadow-2xl my-auto relative">
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
                      <span className="font-mono text-[9px] bg-black/80 text-white px-2 py-0.5 border border-white/20 rounded uppercase tracking-widest backdrop-blur-sm">
                        320 KBPS
                      </span>
                    </div>
                  </div>

                  {/* Track Meta & Like */}
                  <div className="w-full flex items-center justify-between px-2 mt-4 mb-2">
                    <div className="min-w-0 flex-1 text-left">
                      <h1 className="font-editorial-title text-2xl font-normal tracking-tight truncate mb-0.5">
                        {currentTrack.title}
                      </h1>
                      <p className="font-mono text-neutral-400 text-xs truncate">
                        {currentTrack.artist}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaylistModalOpen(true)}
                        className="p-2 rounded-full border border-neutral-700 bg-neutral-900/60 text-neutral-400"
                      >
                        <Plus size={16} />
                      </button>
                      <LikeButton track={currentTrack} size={18} />
                    </div>
                  </div>

                  {/* Touch Scrubber */}
                  <div className="w-full px-2 mb-2">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => seekTo(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#FF2D55]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Native Big Touch Controls */}
                  <div className="flex items-center justify-between w-full max-w-xs px-4 mb-3">
                    <button onClick={toggleShuffle} className={`p-2 ${isShuffle ? 'text-[#2563eb]' : 'text-neutral-400'}`}>
                      <Shuffle size={20} />
                    </button>
                    <button onClick={prevTrack} className="p-2 text-white active:scale-90 transition-transform">
                      <SkipBack size={26} className="fill-current" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform ${
                        theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
                      }`}
                    >
                      {isPlaying ? <Pause size={26} className="fill-current" /> : <Play size={26} className="fill-current ml-1" />}
                    </button>
                    <button onClick={nextTrack} className="p-2 text-white active:scale-90 transition-transform">
                      <SkipForward size={26} className="fill-current" />
                    </button>
                    <button onClick={cycleRepeatMode} className={`p-2 relative ${repeatMode !== 'off' ? 'text-[#2563eb]' : 'text-neutral-400'}`}>
                      <Repeat size={20} />
                      {repeatMode === 'one' && <span className="absolute top-1 right-1 text-[9px] font-bold">1</span>}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Mobile Lyrics View */}
              {activeTab === 'lyrics' && (
                <div className="h-full flex flex-col min-h-0">
                  {containsDevanagari && (
                    <div className="flex justify-end mb-2 shrink-0">
                      <button
                        onClick={() => setScriptMode((prev) => (prev === 'HI' ? 'HINGLISH' : 'HI'))}
                        className="px-3 py-1 text-[11px] font-mono border border-neutral-700 bg-neutral-900 rounded-full text-neutral-300"
                      >
                        {scriptMode === 'HINGLISH' ? 'Hinglish (Phonetic)' : 'हिन्दी (Hindi)'}
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-h-0 relative">
                    <SyncedLyrics
                      lyrics={displayLyrics}
                      currentTime={currentTime}
                      onSeek={seekTo}
                      theme={theme}
                      isLoading={loadingLyrics}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Mobile Queue View */}
              {activeTab === 'queue' && (
                <div className="h-full flex flex-col min-h-0 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">Queue ({queue.length})</span>
                    {queue.length > 0 && (
                      <button onClick={clearQueue} className="text-xs font-mono text-red-400">Clear</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {queue.map((track, idx) => (
                      <div
                        key={`m-queue-${track.id}-${idx}`}
                        onClick={() => playTrackFromQueue(idx)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 active:bg-neutral-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={track.coverUrl} alt="" className="w-11 h-11 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{track.title}</div>
                            <div className="text-[10px] font-mono text-neutral-400 truncate">{track.artist}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Mobile Story View */}
              {activeTab === 'story' && (
                <div className="h-full overflow-y-auto space-y-3 py-2">
                  {loadingLore ? (
                    <div className="h-full flex items-center justify-center font-mono text-xs text-neutral-400 animate-pulse">
                      Synthesizing Lore...
                    </div>
                  ) : songLore ? (
                    <>
                      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
                        <span className="text-[10px] font-mono text-[#FF2D55] uppercase font-bold">Vibe</span>
                        <p className="text-xs mt-1 leading-relaxed">{songLore.vibeSummary}</p>
                      </div>
                      {songLore.trivia && songLore.trivia.length > 0 && (
                        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
                          <span className="text-[10px] font-mono text-neutral-400 uppercase">Studio Trivia</span>
                          <ul className="text-xs text-neutral-300 mt-2 space-y-1 list-disc list-inside leading-relaxed">
                            {songLore.trivia.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center font-mono text-xs text-neutral-500 py-10">No notes found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Auxiliary Modals */}
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        theme={theme}
      />
      <SocialShareModal
        track={currentTrack}
        currentLyric={activeLyricText}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        theme={theme}
      />
      <ScreensaverView
        isOpen={isScreensaverOpen}
        onClose={() => setIsScreensaverOpen(false)}
        lyrics={displayLyrics}
      />
    </AnimatePresence>
  );
}
