'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { searchSongs, getTrending } from '@/lib/api/jiosaavn';
import { AudioController } from '@/components/AudioController';
import { TopNavbar } from '@/components/TopNavbar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FullscreenPlayer } from '@/components/FullscreenPlayer';
import { ShaderBackground } from '@/components/ShaderBackground';
import { TrackCard } from '@/components/TrackCard';
import { SearchView } from '@/components/SearchView';
import { LibraryView } from '@/components/LibraryView';
import { FlowFeed } from '@/components/FlowFeed';
import { HotkeyHelpModal } from '@/components/HotkeyHelpModal';
import { SoundCapsuleModal } from '@/components/SoundCapsuleModal';
import { DiscordRPCModal } from '@/components/DiscordRPCModal';
import { MobileNav } from '@/components/MobileNav';
import { RefreshCw, Search, Sparkles, Wand2 } from 'lucide-react';
import type { Track, ThemeMode, NavTab } from '@/types';

const GENRE_FILTERS = [
  'All',
  'Global Viral',
  'Top Hindi',
  'International',
  'Lo-Fi Chill',
  'Phonk Wave',
  'Bollywood 2026',
  'Punjabi Hits',
  'Acoustic',
];

interface ContextualSection {
  title: string;
  subtitle: string;
  tracks: Track[];
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [contextualSections, setContextualSections] = useState<ContextualSection[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCapsuleOpen, setIsCapsuleOpen] = useState<boolean>(false);
  const [isRPCOpen, setIsRPCOpen] = useState<boolean>(false);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    isFullscreenPlayer,
    activeTab,
    setActiveTab,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleFullscreenPlayer,
    toggleLike,
    playTrack,
    addToQueue,
  } = usePlayerStore();

  const loadTracks = useCallback(async (filter: string, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      let results: Track[] = [];
      if (filter === 'All') {
        results = await getTrending();
      } else {
        results = await searchSongs(filter);
      }
      setTracks(results);

      // Do NOT overwrite restored currentTrack from localStorage on mount
      const existingTrack = usePlayerStore.getState().currentTrack;
      if (results.length > 0 && !existingTrack) {
        usePlayerStore.setState({ currentTrack: results[0] });
      }

      // Fetch dynamic context-aware AI trending sections
      if (filter === 'All') {
        fetch('/api/ai/trending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localTime: new Date().toLocaleTimeString(),
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          }),
        })
          .then((r) => r.json())
          .then((json) => {
            if (json.status === 'SUCCESS' && Array.isArray(json.data)) {
              setContextualSections(json.data);
            }
          })
          .catch(() => {});
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTracks('All');
  }, [loadTracks]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekTo(currentTime + 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 5));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreenPlayer();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (currentTrack) {
          toggleLike(currentTrack);
        }
      } else if ((e.shiftKey && e.key.toLowerCase() === 's') || e.key === 's') {
        e.preventDefault();
        toggleShuffle();
      } else if ((e.shiftKey && e.key.toLowerCase() === 'r') || e.key === 'r') {
        e.preventDefault();
        cycleRepeatMode();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isHelpOpen) {
          setIsHelpOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    volume,
    currentTrack,
    isHelpOpen,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    toggleFullscreenPlayer,
    toggleLike,
    toggleShuffle,
    cycleRepeatMode,
  ]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    loadTracks(filter);
  };

  const handleRefreshTrending = () => {
    loadTracks(selectedFilter, true);
  };

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  }, []);

  const handleTrackSelect = useCallback(
    (track: Track, sourceArray: Track[] = tracks) => {
      playTrack(track);
      const trackIndex = sourceArray.findIndex((t) => t.id === track.id);
      if (trackIndex !== -1) {
        const remainingTracks = sourceArray.slice(trackIndex + 1);
        remainingTracks.forEach((t) => addToQueue(t));
      }
    },
    [playTrack, addToQueue, tracks]
  );

  const themeClasses = theme === 'dark' ? 'bg-[#0a0a0c] text-[#f0f0f0]' : 'bg-white text-[#111111]';
  const borderColor = theme === 'dark' ? '#222222' : '#eeeeee';
  const mutedTextColor = theme === 'dark' ? 'text-[#888888]' : 'text-[#666666]';

  return (
    <div className={`min-h-screen w-full relative font-editorial-sans transition-colors duration-500 ${themeClasses}`}>
      {/* 1. Ambient Background Shader */}
      <ShaderBackground theme={theme} isPlaying={isPlaying} />

      {/* 2. Hidden Audio Controller */}
      <AudioController />

      {/* 3. Top Navigation */}
      <TopNavbar
        theme={theme}
        onToggleTheme={toggleTheme}
        currentView={activeTab}
        onViewChange={(tab) => setActiveTab(tab as NavTab)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenCapsule={() => setIsCapsuleOpen(true)}
        onOpenRPC={() => setIsRPCOpen(true)}
      />

      {/* 4. Main Edge-to-Edge Container */}
      <main className="relative z-10 w-full min-h-[calc(100vh-80px)] pb-44">
        <div className="w-full max-w-[1720px] px-4 sm:px-8 md:px-12 mx-auto py-8 sm:py-10">
          <AnimatePresence mode="wait">
            {/* ─── VIEW 1: HOME (DISCOVERY FEED) ─── */}
            {activeTab === 'home' && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-12"
              >
                {/* Editorial Banner */}
                <header className="border-b pb-10 transition-colors duration-500" style={{ borderColor }}>
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="editorial-badge uppercase tracking-wider text-xs font-medium px-2.5 py-1 border rounded-sm"
                          style={{ borderColor }}
                        >
                          Maina
                        </span>
                        <span className="editorial-meta opacity-60 text-xs tracking-widest uppercase">
                          Edition 2026 // Master Stream Engine
                        </span>
                      </div>

                      <h1 className="editorial-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-normal tracking-tight">
                        Maina<br />
                        <span className="italic font-light opacity-90">
                          {theme === 'dark' ? 'Dark Edition' : 'Light Edition'}
                        </span>
                      </h1>

                      <p
                        className={`text-sm sm:text-base md:text-lg leading-relaxed mt-4 sm:mt-6 max-w-2xl transition-colors duration-500 ${mutedTextColor}`}
                      >
                        A refined editorial approach to digital minimalist aesthetics. Real-time 320kbps streams,
                        dynamic rotating charts, and ambient audio reactive visuals.
                      </p>
                    </div>

                    {/* Right side: Shuffle Trending & Live Status */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                      <button
                        onClick={handleRefreshTrending}
                        disabled={isRefreshing}
                        className={`px-5 py-2.5 border text-xs font-mono uppercase tracking-widest flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                          theme === 'dark'
                            ? 'border-neutral-700 bg-neutral-900/80 text-white hover:border-white'
                            : 'border-neutral-300 bg-white/80 text-black hover:border-black'
                        }`}
                        title="Rotate Trending Charts"
                      >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{isRefreshing ? 'Rotating...' : 'Shuffle Trending'}</span>
                      </button>

                      <div className="editorial-meta text-left lg:text-right opacity-70 text-xs tracking-widest uppercase">
                        Edition 2026<br />Designed for Clarity
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills + Search Morph Trigger Row */}
                  <div
                    className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-6 border-t transition-colors duration-500"
                    style={{ borderColor }}
                  >
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                      {GENRE_FILTERS.map((pill) => {
                        const isActive = selectedFilter === pill;
                        return (
                          <button
                            key={pill}
                            onClick={() => handleFilterChange(pill)}
                            className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                              isActive
                                ? theme === 'dark'
                                  ? 'border-white bg-white text-black font-bold'
                                  : 'border-black bg-black text-white font-bold'
                                : theme === 'dark'
                                ? 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black'
                            }`}
                          >
                            {pill}
                          </button>
                        );
                      })}
                    </div>

                    {/* Fluid Search Morph Trigger */}
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`flex items-center gap-3 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all cursor-pointer text-left md:w-80 ${
                        theme === 'dark'
                          ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-600 hover:text-white'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-400 hover:text-black'
                      }`}
                    >
                      <Search size={14} className="shrink-0" />
                      <span className="truncate">Search catalog...</span>
                      <kbd className="ml-auto text-[10px] px-1.5 py-0.5 border border-neutral-700/40 rounded opacity-60">
                        /
                      </kbd>
                    </button>
                  </div>
                </header>

                {/* Edge-to-Edge Responsive Grid (Master Trending Rotation) */}
                {!isLoading && tracks.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="editorial-badge text-[10px] py-0.5 px-2">Master Rotation</span>
                      <h2 className="editorial-title text-2xl">Featured &amp; Trending Charts</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
                      {/* Featured card (first track, spans 2 cols) */}
                      {tracks[0] && (
                        <TrackCard
                          track={tracks[0]}
                          isCurrentTrack={currentTrack?.id === tracks[0].id}
                          isPlaying={isPlaying && currentTrack?.id === tracks[0].id}
                          onPlay={() => handleTrackSelect(tracks[0])}
                          theme={theme}
                          index={0}
                          variant="featured"
                        />
                      )}

                      {/* Remaining tracks */}
                      {tracks.slice(1).map((track, idx) => (
                        <TrackCard
                          key={`${track.id}-${idx}`}
                          track={track}
                          isCurrentTrack={currentTrack?.id === track.id}
                          isPlaying={isPlaying && currentTrack?.id === track.id}
                          onPlay={() => handleTrackSelect(track)}
                          theme={theme}
                          index={idx + 1}
                          variant="standard"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* ─── DYNAMIC CONTEXTUAL AI SECTIONS ─── */}
                {contextualSections.map((sec, sIdx) => (
                  <section key={sIdx} className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/80">
                    <div className="flex flex-col mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-[#FF2D55]" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF2D55] font-bold">
                          AI Context Resonance
                        </span>
                      </div>
                      <h2 className="editorial-title text-2xl sm:text-3xl">{sec.title}</h2>
                      <p className="font-mono text-xs text-neutral-500 mt-1">{sec.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                      {sec.tracks.map((track, idx) => (
                        <TrackCard
                          key={`ctx-${sIdx}-${track.id}-${idx}`}
                          track={track}
                          isCurrentTrack={currentTrack?.id === track.id}
                          isPlaying={isPlaying && currentTrack?.id === track.id}
                          onPlay={() => handleTrackSelect(track, sec.tracks)}
                          theme={theme}
                          index={idx}
                          variant="standard"
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center justify-center py-28">
                    <div className="editorial-meta opacity-60 tracking-widest uppercase text-xs animate-pulse flex items-center gap-2">
                      <Sparkles size={14} />
                      <span>Fetching live high-fidelity rotation...</span>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && tracks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <p className="editorial-title text-3xl opacity-60 font-light">No tracks found</p>
                    <p className="editorial-meta opacity-40 text-xs tracking-wide">
                      Try refreshing trending or switching genre filters above.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── VIEW 2: FLOW (VERTICAL REELS) ─── */}
            {activeTab === 'flow' && (
              <motion.div
                key="flow-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <FlowFeed theme={theme} />
              </motion.div>
            )}

            {/* ─── VIEW 3: SEARCH MODE ─── */}
            {activeTab === 'search' && (
              <motion.div
                key="search-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <SearchView theme={theme} onClose={() => setActiveTab('home')} />
              </motion.div>
            )}

            {/* ─── VIEW 4: LIBRARY SANCTUARY ─── */}
            {activeTab === 'library' && (
              <motion.div
                key="library-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <LibraryView theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 5. Persistent Mini-Player */}
      <MiniPlayer theme={theme} onExpandPlayer={toggleFullscreenPlayer} />

      {/* 5.5 Mobile Bottom Navigation Bar (< md) */}
      <MobileNav
        currentView={activeTab}
        onViewChange={(tab) => setActiveTab(tab as NavTab)}
        theme={theme}
      />

      {/* 6. Fullscreen Player Overlay */}
      <FullscreenPlayer isOpen={isFullscreenPlayer} onClose={toggleFullscreenPlayer} theme={theme} />

      {/* 7. Keyboard Shortcuts Cheat Sheet Modal */}
      <HotkeyHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        theme={theme}
      />

      {/* 8. Sound Capsule Personal Recap Modal */}
      <SoundCapsuleModal
        isOpen={isCapsuleOpen}
        onClose={() => setIsCapsuleOpen(false)}
        theme={theme}
      />

      {/* 9. Discord RPC Chrome Extension Download Modal */}
      <DiscordRPCModal
        isOpen={isRPCOpen}
        onClose={() => setIsRPCOpen(false)}
        theme={theme}
      />
    </div>
  );
}
