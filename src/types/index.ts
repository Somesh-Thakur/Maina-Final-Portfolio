// ──────────── Core Track & Playlist Types ────────────

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  hasLyrics?: boolean;
  isOfflineCached?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  createdAt: number;
  isAiGenerated?: boolean;
}

export interface LyricLine {
  time: number; // seconds (with ms precision)
  text: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

// ──────────── Flow Reel Item ────────────

export interface FlowReelItem {
  id: string;
  track: Track;
  vibeTag: string;
  moodDescriptor: string;
  previewStartOffset: number; // in seconds (chorus/hook)
}

// ──────────── Audio DSP & FX ────────────

export interface AudioFXSettings {
  crossfadeDuration: number; // seconds (0 to 12)
  isLoudnessNormalized: boolean;
  isKaraokeEnabled: boolean; // Center-cancel vocal reduction
  sleepTimerMinutes: number | null; // e.g. 15, 30, 45, 60 or null
}

// ──────────── Song Lore & Trivia ────────────

export interface SongLore {
  vibeSummary: string;
  trivia: string[];
  moodTags: string[];
  bpm?: number;
  key?: string;
}

// ──────────── Sound Capsule Recap ────────────

export interface SoundCapsuleData {
  totalMinutes: number;
  totalPlays: number;
  topArtists: { artist: string; count: number }[];
  topGenres: { genre: string; percentage: number }[];
  topTrack?: Track;
}

// ──────────── UI Navigation & State Types ────────────

export type ThemeMode = 'dark' | 'light';
export type NavTab = 'home' | 'flow' | 'search' | 'library';

// ──────────── Discord RPC Types ────────────

export interface DiscordRPCPayload {
  type: 'UPDATE' | 'CLEAR';
  data: {
    title: string;
    artist: string;
    album: string;
    duration: number;
    currentTime: number;
    isPlaying: boolean;
    coverUrl: string;
    startTimestamp?: number;
    endTimestamp?: number;
  };
}
