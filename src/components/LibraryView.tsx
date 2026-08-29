'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Plus,
  Play,
  Trash2,
  Edit2,
  Music,
  Clock,
  ListMusic,
  X,
  Check,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { TrackCard } from './TrackCard';
import { AIPlaylistModal } from './AIPlaylistModal';
import { ImportPlaylistModal } from './ImportPlaylistModal';
import type { Track, Playlist, ThemeMode } from '@/types';

interface LibraryViewProps {
  theme: ThemeMode;
}

export function LibraryView({ theme }: LibraryViewProps) {
  const isDark = theme === 'dark';

  const {
    likedSongs,
    customPlaylists,
    history,
    currentTrack,
    isPlaying,
    playTrack,
    playLikedSongs,
    playPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeFromPlaylist,
  } = usePlayerStore();

  const [activeSubTab, setActiveSubTab] = useState<'liked' | 'playlists' | 'history'>('liked');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const selectedPlaylist = customPlaylists.find((p) => p.id === selectedPlaylistId);

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newId = createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreatingPlaylist(false);
    setSelectedPlaylistId(newId);
    setActiveSubTab('playlists');
  };

  const handleStartEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setEditName(playlist.name);
    setEditDesc(playlist.description || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist || !editName.trim()) return;
    updatePlaylist(editingPlaylist.id, editName.trim(), editDesc.trim());
    setEditingPlaylist(null);
  };

  return (
    <div className="w-full flex flex-col gap-10">
      {/* Library Editorial Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="editorial-badge text-[10px] py-0.5 px-2.5">User Sanctuary</span>
            <span className="editorial-meta opacity-60 text-xs tracking-widest uppercase">
              Local Vault // Offline Persistent
            </span>
          </div>
          <h1 className="editorial-title text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight">
            Library
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-3 max-w-xl">
            Your personal archive of curated sounds, heart-pinned songs, and playback history saved securely on this device.
          </p>
        </div>

        {/* Sub-tab Switcher Pills & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
            <button
              onClick={() => {
                setActiveSubTab('liked');
                setSelectedPlaylistId(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'liked'
                  ? isDark
                    ? 'bg-white text-black font-bold shadow'
                    : 'bg-black text-white font-bold shadow'
                  : 'text-neutral-500 hover:text-current'
              }`}
            >
              <Heart size={13} className={activeSubTab === 'liked' ? 'fill-current' : ''} />
              <span>Liked ({likedSongs.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('playlists')}
              className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'playlists'
                  ? isDark
                    ? 'bg-white text-black font-bold shadow'
                    : 'bg-black text-white font-bold shadow'
                  : 'text-neutral-500 hover:text-current'
              }`}
            >
              <ListMusic size={13} />
              <span>Playlists ({customPlaylists.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('history');
                setSelectedPlaylistId(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'history'
                  ? isDark
                    ? 'bg-white text-black font-bold shadow'
                    : 'bg-black text-white font-bold shadow'
                  : 'text-neutral-500 hover:text-current'
              }`}
            >
              <Clock size={13} />
              <span>History ({history.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className={`px-3.5 py-2 border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900/80 text-[#FF2D55] hover:border-white'
                  : 'border-neutral-300 bg-white/80 text-[#FF2D55] hover:border-black'
              }`}
              title="Generate Playlist with AI"
            >
              <span>✨ AI Playlist</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className={`px-3.5 py-2 border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900/80 text-white hover:border-white'
                  : 'border-neutral-300 bg-white/80 text-black hover:border-black'
              }`}
              title="Import Spotify / YouTube link"
            >
              <span>📥 Import</span>
            </button>

            <button
              onClick={() => setIsCreatingPlaylist(true)}
              className={`px-3.5 py-2 border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900 text-white hover:border-white'
                  : 'border-neutral-300 bg-white text-black hover:border-black'
              }`}
            >
              <Plus size={14} />
              <span>New Playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: LIKED SONGS ─── */}
      {activeSubTab === 'liked' && (
        <div key="library-liked-subtab" className="flex flex-col gap-8">
          {/* Liked Songs Hero Header Card */}
          <div
            className={`p-6 sm:p-8 md:p-10 border rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden ${
              isDark ? 'border-neutral-800 bg-[#0e0e12]' : 'border-neutral-200 bg-neutral-50'
            }`}
          >
            {/* Ambient Background Gradient */}
            <div
              className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full opacity-20 pointer-events-none blur-3xl"
              style={{ background: 'radial-gradient(circle, #FF2D55, transparent 70%)' }}
            />

            <div className="flex items-center gap-5 sm:gap-6 z-10">
              {/* Dynamic 4-Cover Collage or Big Heart Tile */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-gradient-to-br from-[#FF2D55] to-[#7c3aed] flex items-center justify-center border border-white/20 shadow-xl overflow-hidden relative rounded-sm">
                {likedSongs.length >= 4 ? (
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {likedSongs.slice(0, 4).map((t, idx) => (
                      <img
                        key={t.id ? `liked-hero-${t.id}-${idx}` : `liked-hero-idx-${idx}`}
                        src={t.coverUrl}
                        alt=""
                        className="w-full h-full object-cover grayscale contrast-125"
                      />
                    ))}
                  </div>
                ) : (
                  <Heart size={40} className="fill-white text-white drop-shadow-md" />
                )}
              </div>

              <div>
                <div className="editorial-meta text-[10px] uppercase text-[#FF2D55] font-bold tracking-widest mb-1">
                  FAVORITES COLLECTION
                </div>
                <h2 className="editorial-title text-3xl sm:text-4xl font-normal tracking-tight mb-2">
                  Liked Songs
                </h2>
                <p className="font-mono text-xs text-neutral-500">
                  {likedSongs.length} {likedSongs.length === 1 ? 'track' : 'tracks'} pinned to your personal rotation
                </p>
              </div>
            </div>

            {likedSongs.length > 0 && (
              <button
                onClick={playLikedSongs}
                className={`px-6 py-3.5 border text-xs font-mono uppercase tracking-widest flex items-center gap-2.5 transition-all cursor-pointer z-10 ${
                  isDark
                    ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
                    : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                }`}
              >
                <Play size={16} className="fill-current" />
                <span>Play All Liked</span>
              </button>
            )}
          </div>

          {/* Liked Songs Grid */}
          {likedSongs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
              {likedSongs.map((track, idx) => (
                <TrackCard
                  key={track.id ? `liked-song-${track.id}-${idx}` : `liked-song-fallback-${idx}`}
                  track={track}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                  onPlay={() => playTrack(track)}
                  theme={theme}
                  index={idx}
                  variant="standard"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full border border-neutral-700/40 flex items-center justify-center text-neutral-500">
                <Heart size={28} />
              </div>
              <h3 className="editorial-title text-2xl opacity-70">No Liked Songs Yet</h3>
              <p className="font-mono text-xs text-neutral-500 max-w-sm">
                Tap the heart button on any track while browsing or playing to add songs to your favorites.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: PLAYLISTS ─── */}
      {activeSubTab === 'playlists' && (
        <div key="library-playlists-subtab" className="flex flex-col gap-8">
          {/* If a playlist is selected, show its track list */}
          {selectedPlaylist ? (
            <div className="flex flex-col gap-6">
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="self-start text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-current flex items-center gap-1.5 cursor-pointer"
              >
                ← Back to All Playlists
              </button>

              <div
                className={`p-6 sm:p-8 border rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  isDark ? 'border-neutral-800 bg-[#0e0e12]' : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden rounded-sm">
                    {selectedPlaylist.coverUrl ? (
                      <img src={selectedPlaylist.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music size={32} className="text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <span className="editorial-meta text-[10px] uppercase text-[#2563eb] font-bold tracking-widest">
                      CUSTOM PLAYLIST
                    </span>
                    <h2 className="editorial-title text-3xl sm:text-4xl font-normal tracking-tight mt-1 mb-1">
                      {selectedPlaylist.name}
                    </h2>
                    {selectedPlaylist.description && (
                      <p className="text-xs text-neutral-400 mb-1 max-w-md">{selectedPlaylist.description}</p>
                    )}
                    <p className="font-mono text-xs text-neutral-500">
                      {selectedPlaylist.tracks.length} tracks • Created on {new Date(selectedPlaylist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {selectedPlaylist.tracks.length > 0 && (
                    <button
                      onClick={() => playPlaylist(selectedPlaylist)}
                      className={`px-5 py-2.5 border text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
                          : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                      }`}
                    >
                      <Play size={14} className="fill-current" />
                      <span>Play</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStartEdit(selectedPlaylist)}
                    className={`p-2.5 border transition-colors cursor-pointer ${
                      isDark
                        ? 'border-neutral-700 hover:border-white text-neutral-300 hover:text-white'
                        : 'border-neutral-300 hover:border-black text-neutral-600 hover:text-black'
                    }`}
                    title="Edit Playlist Details"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={() => {
                      deletePlaylist(selectedPlaylist.id);
                      setSelectedPlaylistId(null);
                    }}
                    className="p-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete Playlist"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Playlist Tracks Grid */}
              {selectedPlaylist.tracks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
                  {selectedPlaylist.tracks.map((track, idx) => (
                    <div
                      key={track.id ? `playlist-item-${track.id}-${idx}` : `playlist-item-fallback-${idx}`}
                      className="relative group"
                    >
                      <TrackCard
                        track={track}
                        isCurrentTrack={currentTrack?.id === track.id}
                        isPlaying={isPlaying && currentTrack?.id === track.id}
                        onPlay={() => playTrack(track)}
                        theme={theme}
                        index={idx}
                        variant="standard"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(selectedPlaylist.id, track.id);
                        }}
                        className="absolute bottom-4 right-12 z-30 p-1 rounded bg-black/80 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from playlist"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <p className="editorial-title text-xl opacity-60">Playlist is empty</p>
                  <p className="font-mono text-xs text-neutral-500">
                    Use the &quot;+&quot; or bookmark button on any song card to add tracks here.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Playlists Grid */
            <div>
              {customPlaylists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {customPlaylists.map((playlist, idx) => (
                    <div
                      key={playlist.id ? `custom-pl-${playlist.id}-${idx}` : `custom-pl-idx-${idx}`}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                      className={`group p-4 border transition-all cursor-pointer flex flex-col justify-between rounded-sm ${
                        isDark
                          ? 'border-neutral-800 hover:border-neutral-600 bg-[#0e0e10]'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <div className="aspect-square bg-neutral-900 border border-neutral-800/80 mb-3.5 flex items-center justify-center overflow-hidden relative rounded-sm">
                        {playlist.coverUrl ? (
                          <img
                            src={playlist.coverUrl}
                            alt=""
                            className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500"
                          />
                        ) : (
                          <Music size={36} className="text-neutral-600" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-xs font-mono uppercase tracking-widest text-white border px-2 py-1">
                            Open
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-editorial-title text-xl truncate mb-0.5">{playlist.name}</h3>
                          <p className="font-mono text-xs text-neutral-500">
                            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(playlist);
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'
                          }`}
                          title="Rename"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <div className="w-16 h-16 rounded-full border border-neutral-700/40 flex items-center justify-center text-neutral-500">
                    <ListMusic size={28} />
                  </div>
                  <h3 className="editorial-title text-2xl opacity-70">No Playlists Created</h3>
                  <p className="font-mono text-xs text-neutral-500 max-w-sm">
                    Create custom playlists or use AI Playlist Studio / Import URL to organize your tracks.
                  </p>
                  <button
                    onClick={() => setIsCreatingPlaylist(true)}
                    className={`mt-2 px-5 py-2.5 border text-xs font-mono uppercase tracking-widest transition-all cursor-pointer ${
                      isDark
                        ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
                        : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                    }`}
                  >
                    + Create Your First Playlist
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: PLAYBACK HISTORY ─── */}
      {activeSubTab === 'history' && (
        <div key="library-history-subtab" className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-neutral-500" />
              <h2 className="editorial-title text-2xl font-normal">Listening History ({history.length})</h2>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
              {history.map((track, idx) => (
                <TrackCard
                  key={track.id ? `history-item-${track.id}-${idx}` : `history-item-fallback-${idx}`}
                  track={track}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                  onPlay={() => playTrack(track)}
                  theme={theme}
                  index={idx}
                  variant="standard"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Clock size={32} className="text-neutral-500 opacity-60" />
              <p className="editorial-title text-xl opacity-60">No stream history yet</p>
              <p className="font-mono text-xs text-neutral-500">
                Songs you play will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE PLAYLIST MODAL ─── */}
      <AnimatePresence>
        {isCreatingPlaylist && (
          <div
            key="create-playlist-modal-backdrop"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              key="create-playlist-modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 sm:p-8 border shadow-2xl relative rounded-sm ${
                isDark ? 'bg-[#111114] border-neutral-700 text-white' : 'bg-white border-neutral-300 text-black'
              }`}
            >
              <button
                onClick={() => setIsCreatingPlaylist(false)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-current cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="editorial-badge text-[9px] py-0.5 px-2">Vault</span>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  New Playlist
                </span>
              </div>

              <h2 className="editorial-title text-2xl font-normal mb-6">Name Your Playlist</h2>

              <form onSubmit={handleCreatePlaylistSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                    Playlist Title
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Midnight Ambient, Workout Beats..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className={`w-full p-3 text-sm font-mono border outline-none ${
                      isDark
                        ? 'border-neutral-700 bg-black text-white focus:border-white'
                        : 'border-neutral-300 bg-neutral-50 text-black focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Add brief description..."
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    className={`w-full p-3 text-sm font-mono border outline-none ${
                      isDark
                        ? 'border-neutral-700 bg-black text-white focus:border-white'
                        : 'border-neutral-300 bg-neutral-50 text-black focus:border-black'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPlaylist(false)}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-current cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-xs font-mono uppercase tracking-wider border cursor-pointer ${
                      isDark
                        ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
                        : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                    }`}
                  >
                    Create Playlist
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EDIT PLAYLIST MODAL ─── */}
      <AnimatePresence>
        {editingPlaylist && (
          <div
            key="edit-playlist-modal-backdrop"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              key="edit-playlist-modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 sm:p-8 border shadow-2xl relative rounded-sm ${
                isDark ? 'bg-[#111114] border-neutral-700 text-white' : 'bg-white border-neutral-300 text-black'
              }`}
            >
              <button
                onClick={() => setEditingPlaylist(null)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-current cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="editorial-badge text-[9px] py-0.5 px-2">Vault</span>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  Edit Details
                </span>
              </div>

              <h2 className="editorial-title text-2xl font-normal mb-6">Edit Playlist</h2>

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                    Playlist Title
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full p-3 text-sm font-mono border outline-none ${
                      isDark
                        ? 'border-neutral-700 bg-black text-white focus:border-white'
                        : 'border-neutral-300 bg-neutral-50 text-black focus:border-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className={`w-full p-3 text-sm font-mono border outline-none ${
                      isDark
                        ? 'border-neutral-700 bg-black text-white focus:border-white'
                        : 'border-neutral-300 bg-neutral-50 text-black focus:border-black'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingPlaylist(null)}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-current cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-xs font-mono uppercase tracking-wider border cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
                        : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                    }`}
                  >
                    <Check size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Playlist Studio Modal */}
      <AIPlaylistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        theme={theme}
        onPlaylistCreated={(pl) => {
          setSelectedPlaylistId(pl.id);
          setActiveSubTab('playlists');
        }}
      />

      {/* Universal URL Playlist Importer Modal */}
      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        theme={theme}
        onImportSuccess={(pl) => {
          setSelectedPlaylistId(pl.id);
          setActiveSubTab('playlists');
        }}
      />
    </div>
  );
}
