import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track, Playlist, RepeatMode, NavTab } from '@/types';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[]; // Recent track history (max 20)
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isFullscreenPlayer: boolean;
  activeTab: NavTab;
  searchQuery: string;
  recentSearches: string[];
  likedSongs: Track[];
  customPlaylists: Playlist[];
}

interface PlayerActions {
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  addToQueueNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playTrackFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleFullscreenPlayer: () => void;
  setActiveTab: (tab: NavTab) => void;
  setSearchQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  toggleLike: (track: Track) => boolean;
  isLiked: (trackId: string) => boolean;
  createPlaylist: (name: string, description?: string) => string;
  updatePlaylist: (playlistId: string, name: string, description?: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  playPlaylist: (playlist: Playlist) => void;
  playLikedSongs: () => void;
}

type PlayerStore = PlayerState & PlayerActions;

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      history: [],
      isPlaying: false,
      volume: 0.8,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      repeatMode: 'off',
      isShuffle: false,
      isFullscreenPlayer: false,
      activeTab: 'home',
      searchQuery: '',
      recentSearches: ['Top Hits 2026', 'Lo-Fi Chill', 'Acoustic Ambient', 'Bollywood Hits'],
      likedSongs: [],
      customPlaylists: [],

      playTrack: (track) =>
        set((state) => {
          const current = state.currentTrack;
          let newHistory = state.history;
          if (current && current.id !== track.id) {
            newHistory = [current, ...state.history.filter((t) => t.id !== current.id)].slice(0, 20);
          }
          return {
            currentTrack: track,
            history: newHistory,
            isPlaying: true,
            currentTime: 0,
          };
        }),

      togglePlay: () =>
        set((state) => ({
          isPlaying: state.currentTrack !== null ? !state.isPlaying : false,
        })),

      nextTrack: () =>
        set((state) => {
          const { currentTrack, queue, history, repeatMode, isShuffle } = state;

          // 1. Repeat One: Loop the current track without modifying queue
          if (repeatMode === 'one' && currentTrack) {
            return { currentTime: 0, isPlaying: true };
          }

          // 2. If queue is empty
          if (queue.length === 0) {
            if (repeatMode === 'all' && (history.length > 0 || currentTrack)) {
              // Wrap around from history without duplicating
              const allTracks = [...history.slice().reverse(), currentTrack].filter(Boolean) as Track[];
              if (allTracks.length > 0) {
                const [first, ...rest] = allTracks;
                return {
                  currentTrack: first,
                  queue: rest,
                  history: [],
                  currentTime: 0,
                  isPlaying: true,
                };
              }
            }
            return { currentTrack: null, isPlaying: false, currentTime: 0 };
          }

          // 3. Fair Shuffle Selection (Sample from tracks not in recent 20 history)
          let nextIndex = 0;
          if (isShuffle) {
            const recentIds = new Set(history.slice(0, 20).map((t) => t.id));
            if (currentTrack) recentIds.add(currentTrack.id);

            const candidates = queue
              .map((track, idx) => ({ track, idx }))
              .filter(({ track }) => !recentIds.has(track.id));

            if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)];
              nextIndex = pick.idx;
            } else {
              // All candidates have been played in recent history — pick random from queue
              nextIndex = Math.floor(Math.random() * queue.length);
            }
          }

          const nextTrack = queue[nextIndex];
          const newQueue = queue.filter((_, i) => i !== nextIndex);
          const newHistory = currentTrack
            ? [currentTrack, ...history.filter((t) => t.id !== currentTrack.id)].slice(0, 20)
            : history;

          // If repeat all is enabled and queue is now empty, wrap history back cleanly
          if (repeatMode === 'all' && newQueue.length === 0 && newHistory.length > 0) {
            return {
              currentTrack: nextTrack,
              queue: [...newHistory].reverse(),
              history: [nextTrack],
              currentTime: 0,
              isPlaying: true,
            };
          }

          return {
            currentTrack: nextTrack,
            queue: newQueue,
            history: newHistory,
            currentTime: 0,
            isPlaying: true,
          };
        }),

      prevTrack: () =>
        set((state) => {
          const { currentTime, history, currentTrack, queue } = state;

          if (currentTime > 3 || history.length === 0) {
            return { currentTime: 0, isPlaying: true };
          }

          const previousTrack = history[0];
          const newHistory = history.slice(1);
          const newQueue = currentTrack ? [currentTrack, ...queue] : queue;

          return {
            currentTrack: previousTrack,
            history: newHistory,
            queue: newQueue,
            currentTime: 0,
            isPlaying: true,
          };
        }),

      seekTo: (time) => set({ currentTime: time }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (val) => set({ volume: Math.max(0, Math.min(1, val)) }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
      addToQueueNext: (track) => set((state) => ({ queue: [track, ...state.queue] })),

      removeFromQueue: (index) =>
        set((state) => ({
          queue: state.queue.filter((_, i) => i !== index),
        })),

      playTrackFromQueue: (index) =>
        set((state) => {
          const track = state.queue[index];
          if (!track) return state;
          const newQueue = state.queue.filter((_, i) => i !== index);
          const newHistory = state.currentTrack
            ? [state.currentTrack, ...state.history.filter((t) => t.id !== state.currentTrack?.id)].slice(0, 20)
            : state.history;
          return {
            currentTrack: track,
            queue: newQueue,
            history: newHistory,
            currentTime: 0,
            isPlaying: true,
          };
        }),

      clearQueue: () => set({ queue: [] }),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

      cycleRepeatMode: () =>
        set((state) => {
          const modes: RepeatMode[] = ['off', 'all', 'one'];
          const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
          return { repeatMode: modes[nextIndex] };
        }),

      toggleFullscreenPlayer: () =>
        set((state) => ({
          isFullscreenPlayer: !state.isFullscreenPlayer,
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;
          const filtered = state.recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
          return { recentSearches: [trimmed, ...filtered].slice(0, 8) };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      toggleLike: (track) => {
        let isNowLiked = false;
        set((state) => {
          const exists = state.likedSongs.some((t) => t.id === track.id);
          if (exists) {
            isNowLiked = false;
            return { likedSongs: state.likedSongs.filter((t) => t.id !== track.id) };
          } else {
            isNowLiked = true;
            return { likedSongs: [track, ...state.likedSongs] };
          }
        });
        return isNowLiked;
      },

      isLiked: (trackId) => {
        return get().likedSongs.some((t) => t.id === trackId);
      },

      createPlaylist: (name, description = '') => {
        const id = 'pl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newPlaylist: Playlist = {
          id,
          name: name.trim() || 'My Playlist',
          description,
          tracks: [],
          createdAt: Date.now(),
        };
        set((state) => ({
          customPlaylists: [newPlaylist, ...state.customPlaylists],
        }));
        return id;
      },

      updatePlaylist: (playlistId, name, description = '') => {
        set((state) => ({
          customPlaylists: state.customPlaylists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  name: name.trim() || p.name,
                  description: description !== undefined ? description.trim() : p.description,
                }
              : p
          ),
        }));
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          customPlaylists: state.customPlaylists.filter((p) => p.id !== playlistId),
        }));
      },

      addToPlaylist: (playlistId, track) => {
        set((state) => ({
          customPlaylists: state.customPlaylists.map((p) => {
            if (p.id === playlistId) {
              const alreadyExists = p.tracks.some((t) => t.id === track.id);
              if (alreadyExists) return p;
              return {
                ...p,
                coverUrl: p.coverUrl || track.coverUrl,
                tracks: [...p.tracks, track],
              };
            }
            return p;
          }),
        }));
      },

      removeFromPlaylist: (playlistId, trackId) => {
        set((state) => ({
          customPlaylists: state.customPlaylists.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                tracks: p.tracks.filter((t) => t.id !== trackId),
              };
            }
            return p;
          }),
        }));
      },

      playPlaylist: (playlist) => {
        if (playlist.tracks.length === 0) return;
        const [first, ...rest] = playlist.tracks;
        set({
          currentTrack: first,
          queue: rest,
          isPlaying: true,
          currentTime: 0,
        });
      },

      playLikedSongs: () => {
        const { likedSongs } = get();
        if (likedSongs.length === 0) return;
        const [first, ...rest] = likedSongs;
        set({
          currentTrack: first,
          queue: rest,
          isPlaying: true,
          currentTime: 0,
        });
      },
    }),
    {
      name: 'maina-player-settings-v2',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        history: state.history,
        currentTime: state.currentTime,
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        likedSongs: state.likedSongs,
        customPlaylists: state.customPlaylists,
        recentSearches: state.recentSearches,
        activeTab: state.activeTab,
      }),
    }
  )
);
